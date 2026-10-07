# スキーマ変更（DDL）の管理

テーブル・Storageバケットなどを追加・変更したときの適用SQLとロールバックSQLを置く場所です。
ビューの変更は [`../../db-views/`](../../db-views/) が担当します（あちらはフォルダで適用状況を表す方式）。

- ファイル名は `YYYYMMDD-対象.sql` と `YYYYMMDD-対象.rollback.sql` の2本
- ファイル冒頭に `適用状況: ステージング YYYY-MM-DD / 本番 YYYY-MM-DD` を書き、本番に適用したら更新する
- 親フォルダの `01`〜`04` は本番データのステージング移行手順の連番で、こことは別物

## 一覧

| SQL                                     | 内容                                                                                                                                                    | ステージング | 本番       |
| --------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------ | ---------- |
| `20260827-t-juchu-tempu`                | 受注添付ファイル。`t_juchu_tempu` とStorageバケット `juchu-tempu`                                                                                       | 2026-08-27   | 2026-08-27 |
| `20260924-ido-juchu-meisai`             | 移動を受注機材ヘッダー単位に。`t_ido_den` / `t_ido_result` / `t_ido_ctn_result` に受注2列を追加                                                         | 2026-09-24   | 未適用     |
| `20260924-ido-send-rpc-fix`             | 上とセットで必ず適用。送信RPC3本の `row(...)::t_ido_result` を13要素に合わせる（**列追加だけでは壊れる**）                                              | 2026-09-24   | 未適用     |
| `20260925-ido-send-rpc`                 | 送信RPCを `ido_send_20260925` 1本に統合。受注2列を保存し、伝票の読取数を明細単位で数え直す                                                              | 2026-09-25   | 未適用     |
| `20260930-rf-nyushuko-send-dsp`         | ゲートの入出庫送信RPC `rf_nyushuko_send_20251225_1` を親の `dsp_ord_num` 単位で採番・集約する（入庫チェックのみ）                                       | 2026-09-30   | 不要※      |
| `20260930-ht-nyushuko-send-dsp`         | HTの入出庫送信RPC `nyushuko_send_20260626_1` をゲートと同じ形に。親機材として読んだタグの明細IDを振り直す。親伝票の照合で作業場所を見ない（2026-10-01） | 2026-09-30   | 適用済み   |
| `20260930-nyushuko-den-dsp-backfill`    | 返却・キープの入庫伝票で `dsp_ord_num` が NULL の行を親の値で埋める（未到着のみ。データ補正）                                                           | 未適用       | 未適用     |
| `20260930-t-nyushuko-den-nyuko-fix-qty` | `t_nyushuko_den` に `nyuko_fix_qty`（到着で親から引いた読取数）を追加し、既存の到着済みデータを同期                                                     | 2026-09-30   | 未適用     |

**※ `20260930-rf-nyushuko-send-dsp` は本番に流す必要がありません。** 2026-10-04 の
`ca798f9 入出庫送信RPCをHTと同じnyushuko_send_20260626_1に変更`（ゲート 1.0.4.0）で、
ゲートの入出庫送信が `nyushuko_send_20260626_1` に切り替わりました。
`rf_nyushuko_send_20251225_1` は**3リポジトリのどこからも呼ばれていません**（2026-10-07 に全文検索で確認）。
ゲートを 1.0.4.0 より前のバージョンのまま残す端末がある場合だけ、この関数が使われるので適用を検討してください。

### 20260930: 入庫伝票の nyuko_fix_qty（差分到着・到着解除）

返却の入庫明細で到着すると親（メイン）の入庫伝票から読取数を引き、到着解除で戻します。これまでは解除時点の読取数を戻していたため、
到着後に追加で読む（予定超過、HT・ゲートが親機材として読む）と親の入庫予定が増えていました。また、合体した明細の一部だけ到着済みのときに
到着し直すと、到着済みの分が二重に引かれます。そこで到着で実際に引いた読取数を行ごとに `nyuko_fix_qty` に記録し、
**到着は「今回 − 前回」、到着解除は「前回」だけ**を親に反映します（アプリは入庫明細の `_lib/funcs.ts`）。

- ファイル内の同期SQL（2.）は、到着済み・親と紐づいている・到着時点で存在した行に `plan_qty`、それ以外は NULL を入れる
- **本番は作業（Web の到着・到着解除、HT・ゲートの送信）を止めた状態で、この DDL を1回だけ流す**。止めておけば、DDL からデプロイまでの間に旧コードで到着・解除される分がないので、流し直しは要らない
- **新コードで到着したあとに同期SQLを流し直してはいけない**。新コードの到着は到着済みヘッダーの行の `add_dat` も上書きするため「到着後に作られた行」と誤判定され、正しい `nyuko_fix_qty` が NULL に消える（解除しても親に戻らなくなる）
- 適用順：作業を止める → この DDL → ビュー（`scripts/db-views/staging-only/v_nyushuko_den*.sql`）→ コードのデプロイ → 作業を再開
- `t_nyushuko_den` の行型を使う関数・`t_nyushuko_den.*` を選ぶビューが無いことは確認済み（ステージング・本番とも）。ロールバックは列の DROP なので、先にコードを戻すこと

### 20260930: ゲート入出庫送信RPCの dsp_ord_num 対応

返却・キープの入庫で「親機材として読んだタグ」（明細ID null ＋ 対応表付き）の扱いを直します。関数名・引数は変えません。

- 採番キーに親の `dsp_ord_num` を足し、同じ機材・同じ `dsp_ord_num` の伝票行があればその明細IDを再利用する
- 伝票の `dsp_ord_num` は GROUP BY に入れず `max()` で取り、`on conflict` では NULL の行だけ埋める
- 対応表との照合から作業日時を外す

**修正前のゲートとも互換**です（同じ機材なら1回の送信で親の `dsp_ord_num` が1つしかないため結果は同じ。画面を開いたまま2回目を送ると明細が分かれずまとまる点だけが変わる）。
本番は **この関数 → ゲートのアプリ** の順に更新すること。逆順だと、同じ機材を親の2行にまたがって送ったときに
`ON CONFLICT DO UPDATE command cannot affect row a second time` で送信が落ちる（2026-09-30 にステージングで再現・解消を確認）。

ロールバックファイルは**本番の適用前の定義そのもの**です。本番に流す直前に `md5(pg_get_functiondef(...))` が
ファイル冒頭の値と一致するか確認してください（ステージングの適用前の定義は `public.` 修飾の有無だけが違い、処理は同一）。

### 20260930: HT入出庫送信RPCの dsp_ord_num 対応と、既存データの補正

HT の `nyushuko_send_20260626_1` は、ゲートの修正前と「入庫チェックの伝票 UPSERT を区分で分岐していた」点だけが違いました
（返却・キープでは `dsp_ord_num` を入れていなかった）。分岐をなくしてゲートの修正後と同じ本体にし、HT 用に次を足します。
関数名・引数（`juchu_kizai_head_kbn` を含む）は変えず、**HT アプリの修正は不要**です。

- HT は親機材として読んだタグに**親の明細ID**を付けて送ってくる。区分が通常以外で対応表にあるタグは、その明細IDを使わず
  ゲートと同じ採番（同じ機材・同じ `dsp_ord_num` の行を再利用 → 無ければ max + 1）で振り直す
- 再利用の探索では、修正前に HT が作った行（`dsp_ord_num` NULL・明細ID＝親の明細ID）も対象にする（途中まで送った返却が分かれないように）
- `on conflict` で `dsp_ord_num` の NULL を埋めるのは**未到着の受注機材ヘッダー・作業場所だけ**。到着時に親から引かれていない行を
  後から紐づけると、到着解除で引いていない数量が親に戻り、親の入庫予定が増えるため

補正SQL（`20260930-nyushuko-den-dsp-backfill`）も同じ理由で**未到着の行だけ**を対象にします。2026-09-30 時点の対象は
ステージング・本番とも1行（本番の NULL は25行あるが、うち24行は到着済みで対象外）。流す前にファイル内の SELECT で対象を確認し、
UPDATE の RETURNING を保存してください（ロールバックはそのキーを使って NULL に戻します）。

適用順は **HT の RPC → 補正SQL**（補正前に RPC を入れておけば、途中の返却も既存行の再利用でまとまる）。

### 20260924 の2本は必ずセットで、この順に適用すること

`t_ido_result` / `t_ido_ctn_result` に列を足すと composite 型が 11列 → 13列になります。送信RPC
（`ido_send_20260716_1` / `rf_ido_send_20251225_1` / `el_ido_send_20251225_1`）の中の
`row(...)::t_ido_result` は列の個数と物理順に依存しているため、**列追加だけを適用すると
HT・ゲートからの実績送信が全部落ちます**。

```
ERROR:  cannot cast type record to t_ido_result
DETAIL: Input has too few columns.
```

ビュー側（`scripts/db-views/staging-only/` の3本）はこの2本の後に適用します。

⚠️ この修理は「要素数合わせ」だけで、受注2列は常に0が入ります。そのため
**複数明細にまたがる機材では、同じ機材の明細行すべてに機材合計の読取数が入ります**
（1機材2明細でタグ1本を読むと両方が read = 1）。該当はステージングで 3,832行中150行。
これを解消するのが次の `20260925-ido-send-rpc` と、HT・ゲート側の改修です。

### 20260925: 送信RPCの統合

既存3本（`ido_send_20260716_1` / `rf_ido_send_20251225_1` / `el_ido_send_20251225_1`）は
関数名と schema 修飾の有無を除いて中身が完全に同一でした（本番・ステージングとも正規化 diff で差分0）。
`el_` だけコンテナ側の `upd_user` がずれるという写経由来のバグも生じていたため、
`ido_send_20260925` 1本に統合します。

**既存3本はそのまま残します。** HT・ゲートが乗り換えるまで動き続ける必要があるためです。
両アプリの移行が完了したら `20260925-ido-send-rpc.rollback.sql` の末尾にある後片付け用 DROP を流してください。

新設するのは `ido_send_20260925` の1本だけです。処理はすべて本体に入っており、既存3本と同じ構成です
（作業指示日の最新化 → UPSERT → 伝票の読取数の更新）。違いは次の2点だけです。

1. UPSERT が受注2列を書く
2. 読取数の集計が **6キー → 8キー**（受注2列を足す）。6キーのままだと同じ機材の明細行すべてに
   機材合計が入ってしまう。あわせて「実績があったグループ」だけでなく実績が動いた機材の全明細を
   数え直す（タグが1本も割り当たらなかった明細を0に戻すため）

#### ★ どのタグがどの明細のものかは「アプリが決める」

HT・ゲートは読取時にすでに「同じ機材の行を上から埋め、予定数に達したら次の行へ」という充当を
画面上で行っています（HT: `kizai_list_grid_row_provider.dart` の `preModelList` ループ、
ゲート: `MovementListForm.cs` の `FirstOrDefault(... ResultQty < PlanQty ...)`）。
リストを明細単位（`v_ido_den2_meisai_lst`）にすれば、このループがそのまま明細への充当になります。
アプリは充当先の行が持つ `juchu_head_id` / `juchu_kizai_head_id` を実績に載せて送ります。

**RPCはその2列をそのまま保存するだけで、紐づけの判断はしません。** DB側でも判断すると、
画面に見えているものと保存されるものが食い違う余地が生まれるためです。

#### ⚠️ この関数は「受注2列を送るアプリ専用」

受注2列を送らない現行のHT・ゲートがこれを呼ぶと、タグはすべて `0/0` で保存され、
**受注明細の伝票行は読取数0のままになります**（明細単位で数えるため）。
現行アプリは既存3本を呼び続けてください。乗り換えは「ビュー差し替え＋受注2列の送信」と同時に行います。

なお、既に紐づいているタグを `0/0` で再送しても割り当ては消えません（`excluded.juchu_head_id <> 0`
のときだけ上書きする）。移行期に新旧のアプリが混在しても、既存の紐づけは壊れません。

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
