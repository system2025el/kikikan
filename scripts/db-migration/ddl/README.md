# スキーマ変更（DDL）の管理

テーブル・Storageバケットなどを追加・変更したときの適用SQLとロールバックSQLを置く場所です。
ビューの変更は [`../../db-views/`](../../db-views/) が担当します（あちらはフォルダで適用状況を表す方式）。

- ファイル名は `YYYYMMDD-対象.sql` と `YYYYMMDD-対象.rollback.sql` の2本
- ファイル冒頭に `適用状況: ステージング YYYY-MM-DD / 本番 YYYY-MM-DD` を書き、本番に適用したら更新する
- 親フォルダの `01`〜`04` は本番データのステージング移行手順の連番で、こことは別物

## 一覧

| SQL                      | 内容                                                              | ステージング | 本番       |
| ------------------------ | ----------------------------------------------------------------- | ------------ | ---------- |
| `20260827-t-juchu-tempu` | 受注添付ファイル。`t_juchu_tempu` とStorageバケット `juchu-tempu` | 2026-08-27   | 2026-08-27 |

## 適用手順

接続URL（`.stg_url` / `.prod_url`）とPostgreSQLクライアントの用意は [`../README.md`](../README.md) の「準備」を参照してください。**ポートは5432（Session pooler）**です。

```bash
cd scripts/db-migration
./pgclient/pgsql/bin/psql.exe "$(cat .stg_url)" -v ON_ERROR_STOP=1 -f ddl/20260827-t-juchu-tempu.sql
```

ロールバックは同名の `.rollback.sql` を流します。**添付ファイルのロールバックはアップロード済みのPDFを実体ごと削除します。**

適用したら `app/_lib/db/types/types.ts` を再生成してください（手編集禁止）。

```bash
npx supabase gen types typescript --project-id jimqcvyaoddsxbcrsnfs --schema public > app/_lib/db/types/types.ts
```

> `npx supabase login`（またはCIなら `SUPABASE_ACCESS_TOKEN`）が必要です。`.mcp.json` のSupabase MCPはOAuth接続なので、
> そのトークンをCLIに流用することはできません。**再生成後は `npm run fix` を全体にかけないこと**（CRLF起因で462ファイルが書き換わる。
> ルートの `CLAUDE.md` の「コマンド」参照）。生成物の整形は `npx prettier --write app/_lib/db/types/types.ts` で個別に行います。
>
> **未了の宿題（2026-08-27）**: この環境ではCLIが未ログインだったため、`types.ts` の `t_juchu_tempu` ブロックは
> 生成物と同じ形式で手書きしてあります（型チェック・本番ビルドは通過済み）。CLIが使える人が再生成し、
> 差分が出ないことを確認してもらえると確実です。冒頭の `public /*dev7*/ :` は手作業のマーカーで、素朴に再生成すると消えます。

### psqlが用意できない場合

`bash 03-migrate.sh client` でPostgreSQLクライアントを取得するのが正規の手順ですが、
用意できない場合は `pg`（`node_modules` にある）で流すこともできます。実際に今回の適用はこの方法で行いました。

- SQLファイルの `\set ON_ERROR_STOP on` などのpsqlメタコマンド行は落とす必要があります
- **`.prod_url` / `.stg_url` の末尾にある `?sslmode=require` を外し、`ssl: { rejectUnauthorized: false }` を指定すること**。
  node-pg は `sslmode=require` を `verify-full` として扱うため、Supabaseの証明書チェーンで
  `SELF_SIGNED_CERT_IN_CHAIN` になります（psqlでは正しく動くので、URLファイル自体は変更不要）
- Node 20 には `WebSocket` が無く、`@supabase/supabase-js` の realtime 初期化で落ちます。
  Storageの検証スクリプトを書くときは `globalThis.WebSocket ??= class {};` を先に置いてください（realtimeは使わないためダミーで足ります）

## 本番とステージングの環境差（DDLを書くときに効く）

2026-08-27 に実測した差分です。**ACL文字列を本番とステージングで単純比較しないこと。**

| 項目                           | 本番                                              | ステージング                         |
| ------------------------------ | ------------------------------------------------- | ------------------------------------ |
| PostgreSQL                     | 17.6                                              | 15.8                                 |
| `public` の default privileges | **1件**（anon=SELECTのみ / authenticated=全権限） | なし                                 |
| 新テーブルのACL（GRANT適用後） | `anon=arwd`／`authenticated=arwdDxtm`             | `anon=arwd`／`authenticated=arwdDxt` |

- `m`（MAINTAIN）はPG17で追加された権限なので、**PG15のステージングには構造的に付きません**。
  ACLは「環境をまたいで一致させる」のではなく「その環境の既存テーブルと一致させる」で判断します。
- 本番だけ default privileges があるため、`CREATE TABLE` した時点で authenticated には全権限が付きます。
  それでも**anonにはSELECTしか付かない**ので、既存テーブルと同じ `anon=arwd` にするには明示的な `GRANT` が必要です。
- ステージングでは `GRANT` した以上の権限（`anon=arwdDxt`）が付くことがありました。既存テーブルの慣習は `anon=arwd` なので、
  適用後にACLを確認し、余分が付いていたら `REVOKE TRUNCATE, REFERENCES, TRIGGER ... FROM anon` で揃えてください。

### 適用順序

**「DB（テーブル・バケット）→ 型再生成 → コードデプロイ」を必ずこの順で行う**こと。コードが先だと、
`t_juchu_tempu` を読む受注画面が `relation does not exist` で500になります。型再生成前にpushするとVercelのビルドが落ちます。

## 注意

- **`GRANT` を必ず書くこと**。ステージングには `public` スキーマの default privileges が無く、本番も anon には SELECT しか付かないため、`CREATE TABLE` だけでは
  PostgRESTから `permission denied for table`（42501）になります。既存テーブルに合わせて anon / authenticated に付与します。
- **RLSは有効化しないこと**。既存テーブルはすべて `relrowsecurity = false` です（ポリシー自体は多数ありますが休眠状態）。
  新テーブルだけ有効化すると、ポリシーが無いため全アクセスが拒否されて画面が壊れます。
- **新しいテーブルを追加したら、本番データのステージング移行の除外リストに入れるかを判断すること**。
  `02-truncate-staging.sql` の `skip_tbl` と `03-migrate.sh` の `EXCLUDES` の**両方**にあります。片方だけでは機能しません。

## 受注添付ファイルの棚卸し

Storageに実体があるのに `t_juchu_tempu` に行が無いオブジェクト（孤児）は、
アップロード成功後のDB登録失敗や、削除時のStorage側の失敗で生じます。画面には出ないので実害はありませんが、
容量を食うので定期的に確認して削除してください。

```sql
SELECT o.name, o.created_at, o.metadata ->> 'size' AS size
FROM storage.objects o
LEFT JOIN public.t_juchu_tempu t
  ON t.file_pat = o.name AND t.del_flg = 0
WHERE o.bucket_id = 'juchu-tempu'
  AND t.juchu_tempu_id IS NULL
ORDER BY o.created_at;
```

削除は `DELETE FROM storage.objects WHERE bucket_id = 'juchu-tempu' AND name = '...';` で行います。
逆に「行はあるが実体が無い」場合は、本番データをステージングに移行した際に `t_juchu_tempu` を
除外し損ねた可能性があります（PDFの実体は移行されません）。

### 検証済みの挙動（2026-08-27・ステージング実測）

添付機能を触るときの前提です。ここが変わったら設計の見直しが必要になります。

| 確認したこと                                     | 結果                                                                                              |
| ------------------------------------------------ | ------------------------------------------------------------------------------------------------- |
| PDF以外のアップロード                            | バケットの `allowed_mime_types` が `mime type image/png is not supported` で拒否                  |
| 署名なしのanonからの `upload()` / `list()`       | `violates row-level security policy` で拒否（ポリシー0本のため）                                  |
| 署名付きURLのレスポンス                          | `Content-Type: application/pdf`、`Content-Disposition` は**付かない**（＝ブラウザ内でinline表示） |
| 署名付きURLのCORS                                | `access-control-allow-origin: *`（ブラウザから `fetch` できる。ダウンロードのblob化に必要）       |
| 署名付きURLに `download` を付けた場合            | ファイル名が**二重にURLエンコードされ日本語が壊れる**ため使わない                                 |
| 日本語ファイル名のアップロード・削除（ブラウザ） | `file_nam` に原本名が入り、`del_flg = 1` ＋ Storage実体の削除まで動作                             |
