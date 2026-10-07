# DB変更の管理

手でDBに流した変更（テーブル定義・ビュー定義・関数・データ）のSQLとロールバックSQLを、対象の種類ごとに4つのフォルダに分けて残しています。**このファイルが入口**で、フォルダをまたぐ適用順序もここにまとめています。

| 対象                                 | 置き場所                                  |
| ------------------------------------ | ----------------------------------------- |
| テーブル定義（列追加・型変更・新設） | [`db-tables/`](db-tables/README.md)       |
| ビュー定義                           | [`db-views/`](db-views/README.md)         |
| 関数（RPC）                          | [`db-functions/`](db-functions/README.md) |
| データ（INSERT / UPDATE / DELETE）   | [`db-data/`](db-data/README.md)           |

[`db-migration/`](db-migration/README.md) は別物で、**本番データでステージングを洗い替える**ための手順とスクリプト（`01`〜`04` と `03-migrate.sh`）です。接続URLとPostgreSQLクライアントの用意はそちらの「準備」にあります。

## 共通の運用ルール

| フォルダ        | 意味                                         |
| --------------- | -------------------------------------------- |
| `applied/`      | ステージングと**本番の両方**に適用済み       |
| `staging-only/` | ステージングにのみ適用済み。**本番は未適用** |

- 各ファイルの1行目に `-- 適用状況: ステージング YYYY-MM-DD / 本番 YYYY-MM-DD` を書く
- 本番に適用したら `git mv` で `applied/` へ移し、1行目を更新する
- 適用SQLと同名の `.rollback.sql` をセットで置く。`.rollback.sql` は**本番の現在の定義**（＝本番から見た変更前）にする
- ファイル名は `db-tables/` `db-functions/` `db-data/` が `YYYYMMDD-対象.sql`、`db-views/` だけが `<view>.sql`（1ビュー1ファイルで変更を累積する方式。理由は [`db-views/README.md`](db-views/README.md)）

### フォルダは2つしかないので表せない状態がある

「ステージングにも本番にも未適用」のものは `staging-only/` に置いたうえで、1行目と各READMEの一覧表に `未適用 / 未適用` と明記してください。現在 [`db-data/staging-only/20260930-nyushuko-den-dsp-backfill.sql`](db-data/staging-only/20260930-nyushuko-den-dsp-backfill.sql) が該当します。

## ★ フォルダをまたぐ適用順序

**逆順で流すと壊れます。** フォルダが分かれていて気づきにくいので、ここに集約します。1つのフォルダ内で閉じる順序制約（親ビュー→子ビューなど）は各フォルダのREADMEにあります。

| 適用順序                                                                                          | ロールバック順序（逆）                     | 逆順だとどうなるか                                                                                                                                                                                             |
| ------------------------------------------------------------------------------------------------- | ------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `db-tables/20260924-ido-juchu-meisai` → `db-functions/20260924-ido-send-rpc-fix`                  | 関数 → テーブル                            | **列追加だけで既存RPC3本が壊れる。** `row(...)::t_ido_result` が11要素のままになり `cannot cast type record to t_ido_result` で送信が全部失敗する。この2本は必ず連続で、できれば同一トランザクションで流すこと |
| `db-tables/20260924-ido-juchu-meisai` → `db-views/v_ido_den3_lst` ほか2本                         | ビュー → テーブル                          | ビューが存在しない列（`juchu_head_id` 等）を参照してエラー                                                                                                                                                     |
| `db-tables/20260930-t-nyushuko-den-nyuko-fix-qty` → `db-views/v_nyushuko_den` → `v_nyushuko_den2` | 逆順                                       | 同上                                                                                                                                                                                                           |
| `db-views/v_honbanbi_calc` → `db-data/t_juchu_kizai_honbanbi_template`                            | テンプレート行のDELETE → `v_honbanbi_calc` | 先にテンプレートをINSERTすると、その間 `v_honbanbi_calc` の行数が倍近くに膨らむ（本番実測 662 → 1,228行）                                                                                                      |

2026-10-07 の本番適用はこの順（テーブル → 関数 → ビュー）で行いました。

## 適用手順

接続URL（`.stg_url` / `.prod_url`）とクライアントの用意は [`db-migration/README.md`](db-migration/README.md) の「準備」を参照してください。**ポートは5432（Session pooler）**です。

```bash
cd scripts/db-migration
PG=./pgclient/pgsql/bin

# リハーサル（無変更で確認）— 下の「リハーサルの落とし穴」を必ず読むこと
$PG/psql.exe "$(cat .stg_url)" -v ON_ERROR_STOP=1 -c '\timing on' -f ../db-tables/staging-only/<file>.sql

# 適用
$PG/psql.exe "$(cat .stg_url)" -v ON_ERROR_STOP=1 -c '\timing on' -f ../db-tables/staging-only/<file>.sql
```

本番に適用するときは `.stg_url` を `.prod_url` に変え、**事前にバックアップを取ってください**（`pg_dump`。直近の例は `~/db-backup/prod_20261007_1831/`）。

### ⚠️ リハーサルの落とし穴

各SQLファイルは**自分で `BEGIN;` / `COMMIT;` を持っています**。そのため、よくある

```bash
# これは動かない
$PG/psql.exe "$(cat .stg_url)" -c 'BEGIN;' -f ../db-views/staging-only/<file>.sql -c 'ROLLBACK;'
```

という書き方では、**ファイル内の `COMMIT;` が先に効いて変更が確定し、後ろの `ROLLBACK;` は何も戻しません**。2026-10-06 にこれで開発環境のビュー3本を誤って巻き戻しました。

リハーサルするときは、**ファイルから `BEGIN;` / `COMMIT;` の行を落としてから**自前のトランザクションで包んでください。

```bash
sed -E '/^[[:space:]]*(BEGIN|COMMIT);[[:space:]]*$/d' ../db-tables/staging-only/<file>.sql > /tmp/strip.sql
$PG/psql.exe "$(cat .stg_url)" -v ON_ERROR_STOP=1 -c 'BEGIN;' -f /tmp/strip.sql -c 'ROLLBACK;'
```

plpgsql の `BEGIN`（セミコロンなし）は消えないので、関数定義を含むファイルでも安全です。

### 適用後の型再生成

列の追加・削除・NULL可否の変更をしたら `app/_lib/db/types/types.ts` を再生成してください（手編集禁止）。桁数だけの変更なら不要です。

```bash
npx supabase gen types typescript --project-id jimqcvyaoddsxbcrsnfs --schema public > app/_lib/db/types/types.ts
npx prettier --write app/_lib/db/types/types.ts
```

> `npx supabase login`（CIなら `SUPABASE_ACCESS_TOKEN`）が必要です。`.mcp.json` のSupabase MCPはOAuth接続なので、そのトークンをCLIに流用することはできません。**再生成後に `npm run fix` を全体にかけないこと**（CRLF起因で462ファイルが書き換わる。ルートの `CLAUDE.md` 参照）。
>
> **未了の宿題**: CLIが未ログインのため、`types.ts` には生成物と同じ形式で手書きしたブロックがいくつかあります（型チェック・本番ビルドは通過済み）。CLIが使える人が再生成し、差分が出ないことを確認してもらえると確実です。冒頭の `public /*dev7*/ :` は手作業のマーカーで、素朴に再生成すると消えます。対象は `CLAUDE.md` に一覧があります。

### 「DB → 型再生成 → コードデプロイ」を必ずこの順で

コードが先だと、新しいテーブルや列を読む画面が `relation does not exist` / `column does not exist` で落ちます。型再生成前にpushするとVercelのビルドが落ちます。

**逆に、列を削るときや別名にするときはコードが先**です。2026-10-07 にビューから `juchu_meisai` を外したとき、本番のWebが旧コードのままだった数十分間、移動明細画面がエラーになりました。

### psqlが用意できない場合

`bash 03-migrate.sh client` でクライアントを取得するのが正規の手順ですが、`pg`（`node_modules` にある）で流すこともできます。

- SQLファイルの `\set ON_ERROR_STOP on` などのpsqlメタコマンド行は落とす必要があります
- **`.prod_url` / `.stg_url` の末尾にある `?sslmode=require` を外し、`ssl: { rejectUnauthorized: false }` を指定すること**。node-pg は `sslmode=require` を `verify-full` として扱うため、Supabaseの証明書チェーンで `SELF_SIGNED_CERT_IN_CHAIN` になります（psqlでは正しく動くので、URLファイル自体は変更不要）
- Node 20 には `WebSocket` が無く、`@supabase/supabase-js` の realtime 初期化で落ちます。Storageの検証スクリプトを書くときは `globalThis.WebSocket ??= class {};` を先に置いてください

## 本番とステージングの環境差

2026-08-27 に実測した差分です。**ACL文字列を本番とステージングで単純比較しないこと。**

| 項目                           | 本番                                              | ステージング                         |
| ------------------------------ | ------------------------------------------------- | ------------------------------------ |
| PostgreSQL                     | 17.6                                              | 15.8                                 |
| `public` の default privileges | **1件**（anon=SELECTのみ / authenticated=全権限） | なし                                 |
| 新テーブルのACL（GRANT適用後） | `anon=arwd`／`authenticated=arwdDxtm`             | `anon=arwd`／`authenticated=arwdDxt` |

- `m`（MAINTAIN）はPG17で追加された権限なので、**PG15のステージングには構造的に付きません**。ACLは「環境をまたいで一致させる」のではなく「その環境の既存テーブルと一致させる」で判断します
- `pg_get_viewdef` の出力もPG17とPG15で違います（PG17は曖昧でなければテーブル修飾を省く）。単純diffだと全ビューが「差分あり」に見えるので、修飾子を落としてから比較してください
- Windowsの `psql.exe` はリダイレクト出力にCRLFを付けます。`tr -d '\r'` を通さないと比較が必ず不一致になります
- Git Bash から `psql -c` に**日本語リテラルを渡すと文字化けします**（`invalid byte sequence for encoding "UTF8"`）。SQLはBOM無しUTF-8のファイルにして `-f` で渡してください
