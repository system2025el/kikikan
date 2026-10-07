# DBテーブル定義変更の管理

テーブルの新設、列追加・型変更・制約変更など、**テーブル定義（DDL）**を手で変更したときのSQLとロールバックSQLを置く場所です。Storageバケットの追加もここに含めます。**フォルダの意味・共通の運用ルール・適用手順は [`../README.md`](../README.md) にまとめてあります。**

ファイル名は `YYYYMMDD-対象.sql` / `.rollback.sql`。1つのテーブルに複数のDDL変更が入るため、ビューのように「1テーブル＝1ファイル」にはしていません。各ファイルの1行目に `-- 適用状況: ステージング YYYY-MM-DD / 本番 YYYY-MM-DD` を書きます。

**★ テーブル変更は関数・ビューと順序が結びつくことが多いので、[`../README.md` の「フォルダをまたぐ適用順序」](../README.md) を必ず確認してください。**

## 一覧

### applied/ — ステージング・本番とも適用済み

| SQL                                     | 内容                                                                                                | ステージング | 本番       |
| --------------------------------------- | --------------------------------------------------------------------------------------------------- | ------------ | ---------- |
| `20260826-t-mitu-head-comment-200`      | `t_mitu_head.comment`（コメント）を `varchar(100)` → `varchar(200)`                                 | 2026-08-26   | 2026-09-03 |
| `20260827-t-juchu-tempu`                | 受注添付ファイル。`t_juchu_tempu` とStorageバケット `juchu-tempu`                                   | 2026-08-27   | 2026-08-27 |
| `20260924-ido-juchu-meisai`             | 移動を受注機材ヘッダー単位に。`t_ido_den` / `t_ido_result` / `t_ido_ctn_result` に受注2列を追加     | 2026-09-24   | 2026-10-07 |
| `20260930-t-nyushuko-den-nyuko-fix-qty` | `t_nyushuko_den` に `nyuko_fix_qty`（到着で親から引いた読取数）を追加し、既存の到着済みデータを同期 | 2026-09-30   | 2026-10-07 |

### staging-only/ — 本番未適用

**現在なし**。

## 20260826: 見積コメントの200文字化

本番適用は 8ms（カタログ更新のみ・テーブル書き換えなし）。適用直前の本番バックアップは `~/db-backup/prod_20260903_1900/`。

**この変更にはアプリ側の未対応が2件あります。**

1. `app/(main)/quotation-list/_lib/types.ts` の Zod が `.max(100)` のままなので、**画面からは101文字以上入力できません**。実際に200文字使うには `.max(200)` への変更が必要です。
2. `app/(main)/quotation-list/_lib/hooks/usePdf.ts` のコメント欄は `if (innerIndex < 5)` で**先頭5行しか描画せず、6行目以降を無言で捨てます**。全角はサイズ8・幅290ptで1行36文字前後なので、PDFに載るのは概算180文字程度が上限です（改行を入れるとさらに減ります）。描画行数を増やすかどうかは未判断です。

## 20260924: 移動を受注機材ヘッダー単位に

`t_ido_den` / `t_ido_result` / `t_ido_ctn_result` に `juchu_head_id` / `juchu_kizai_head_id`（`integer NOT NULL DEFAULT 0`）を追加し、`t_ido_den` の主キーを6列から8列に張り替えます。既存データは受注明細に合わせて分割します（本番実績 5,064 → 5,252行、2026-10-07）。

⚠️ **`db-functions/applied/20260924-ido-send-rpc-fix.sql` とセットで、必ず連続して適用すること。** 列追加だけだと送信RPC3本の `row(...)::t_ido_result` が壊れ、HT・ゲートからの実績送信が全部落ちます。詳細は [`../db-functions/README.md`](../db-functions/README.md)。

受注に紐づかない手動追加の行は `0 / 0` のセンチネルで表します（PostgreSQLの主キーにNULLは入れられないため）。移行時は `t_juchu_head.del_flg = 0` で削除済み受注を除外するので、削除済み受注にしか紐づかない行は `0 / 0` のまま残ります。

## 20260930: 入庫伝票の nyuko_fix_qty（差分到着・到着解除）

返却の入庫明細で到着すると親（メイン）の入庫伝票から読取数を引き、到着解除で戻します。これまでは解除時点の読取数を戻していたため、到着後に追加で読む（予定超過、HT・ゲートが親機材として読む）と親の入庫予定が増えていました。また、合体した明細の一部だけ到着済みのときに到着し直すと、到着済みの分が二重に引かれます。そこで到着で実際に引いた読取数を行ごとに `nyuko_fix_qty` に記録し、**到着は「今回 − 前回」、到着解除は「前回」だけ**を親に反映します（アプリは入庫明細の `_lib/funcs.ts`）。

- ファイル内の同期SQL（2.）は、到着済み・親と紐づいている・到着時点で存在した行に `plan_qty`、それ以外は NULL を入れる
- **本番は作業（Web の到着・到着解除、HT・ゲートの送信）を止めた状態で、この DDL を1回だけ流す**。止めておけば、DDL からデプロイまでの間に旧コードで到着・解除される分がないので、流し直しは要らない
- **新コードで到着したあとに同期SQLを流し直してはいけない**。新コードの到着は到着済みヘッダーの行の `add_dat` も上書きするため「到着後に作られた行」と誤判定され、正しい `nyuko_fix_qty` が NULL に消える（解除しても親に戻らなくなる）
- 適用順：作業を止める → この DDL → ビュー（`../db-views/applied/v_nyushuko_den*.sql`）→ コードのデプロイ → 作業を再開
- `t_nyushuko_den` の行型を使う関数・`t_nyushuko_den.*` を選ぶビューが無いことは確認済み（ステージング・本番とも）。ロールバックは列の DROP なので、先にコードを戻すこと

## DDL変更SQLの書き方

- **`BEGIN` / `COMMIT` をファイルに含める**。PostgreSQLはDDLもトランザクションに入れられるので、失敗時に確実に巻き戻せます
- 適用前に**必ずリハーサル**する。ただし、ファイル自身が `BEGIN` / `COMMIT` を持つため**外から `-c 'BEGIN;' ... -c 'ROLLBACK;'` で包んでも戻りません**。やり方は [`../README.md` の「リハーサルの落とし穴」](../README.md) を参照してください
- **ロールバックが危険な方向のときはガードを付ける**。下は `varchar` を縮小する例で、収まらないデータがあれば件数と最大長つきで中断します

```sql
DO $$
DECLARE over_cnt integer; max_len integer;
BEGIN
  SELECT count(*) FILTER (WHERE length(col) > 100), COALESCE(max(length(col)), 0)
    INTO over_cnt, max_len FROM public.t_xxx;
  IF over_cnt > 0 THEN
    RAISE EXCEPTION '100文字を超える行が % 件あります（最大 % 文字）。', over_cnt, max_len;
  END IF;
END $$;
```

- 移行や分割を伴うなら、ファイルの末尾に**検算の `DO` ブロック**を置いて合わなければ `RAISE EXCEPTION` で止めてください。`20260924-ido-juchu-meisai.sql` が例で、件数をハードコードせず「分割前後で合計が変わらない」といった相対的な条件で書くと、データが増えてもそのまま使えます

## 新しいテーブルを追加するときの必須事項

- **`GRANT` を必ず書くこと**。ステージングには `public` スキーマの default privileges が無く、本番も anon には SELECT しか付かないため、`CREATE TABLE` だけでは PostgREST から `permission denied for table`（42501）になります。既存テーブルに合わせて anon / authenticated に付与します
- **RLSは有効化しないこと**。既存テーブルはすべて `relrowsecurity = false` です（ポリシー自体は多数ありますが休眠状態）。新テーブルだけ有効化すると、ポリシーが無いため全アクセスが拒否されて画面が壊れます
- **本番データのステージング移行の除外リストに入れるかを判断すること**。`../db-migration/02-truncate-staging.sql` の `skip_tbl` と `../db-migration/03-migrate.sh` の `EXCLUDES` の**両方**にあります。片方だけでは機能しません
- ステージングでは `GRANT` した以上の権限（`anon=arwdDxt`）が付くことがありました。既存テーブルの慣習は `anon=arwd` なので、適用後にACLを確認し、余分が付いていたら `REVOKE TRUNCATE, REFERENCES, TRIGGER ... FROM anon` で揃えてください

## 列を変更するときの注意点

- **列を参照しているビューがあると型変更は失敗します**（`cannot alter type of a column used by a view or rule`）。事前に確認してください。該当があれば、依存ビューを `DROP` → 型変更 → 再 `CREATE` の順になり、作業がかなり重くなります

```sql
SELECT DISTINCT dep.relname
FROM pg_depend d
JOIN pg_rewrite r  ON r.oid = d.objid
JOIN pg_class dep  ON dep.oid = r.ev_class
JOIN pg_class src  ON src.oid = d.refobjid
JOIN pg_namespace n ON n.oid = src.relnamespace
JOIN pg_attribute a ON a.attrelid = src.oid AND a.attnum = d.refobjsubid
WHERE n.nspname = 'public' AND src.relname = 't_xxx' AND a.attname = 'col';
```

- **関数の中で `row(...)::<テーブル名>` を使っていると、列を足すだけで壊れます。** ビューだけでなく `pg_get_functiondef` の全文検索も必ず行ってください（移動の送信RPC3本がこれで壊れました）
- **`varchar` の桁数拡大はカタログ更新のみ**（PostgreSQL 9.2以降）でテーブル書き換えが起きず一瞬で終わります。逆に**縮小は全行検査とテーブル書き換えを伴う**ので、行数が多いテーブルでは長時間ロックします
- `DEFAULT` 付きの列追加もPG11以降はメタデータのみで、テーブル書き換えは起きません
- **Supabaseの自動生成型（`app/_lib/db/types/types.ts`）は `varchar` の桁数を持ちません**。桁数だけの変更なら型の再生成は不要です。列の追加・削除・NULL可否の変更をしたときは再生成が必要です

## 受注添付ファイルの棚卸し

Storageに実体があるのに `t_juchu_tempu` に行が無いオブジェクト（孤児）は、アップロード成功後のDB登録失敗や、削除時のStorage側の失敗で生じます。画面には出ないので実害はありませんが、容量を食うので定期的に確認して削除してください。

```sql
SELECT o.name, o.created_at, o.metadata ->> 'size' AS size
FROM storage.objects o
LEFT JOIN public.t_juchu_tempu t
  ON t.file_pat = o.name AND t.del_flg = 0
WHERE o.bucket_id = 'juchu-tempu'
  AND t.juchu_tempu_id IS NULL
ORDER BY o.created_at;
```

削除は `DELETE FROM storage.objects WHERE bucket_id = 'juchu-tempu' AND name = '...';` で行います。逆に「行はあるが実体が無い」場合は、本番データをステージングに移行した際に `t_juchu_tempu` を除外し損ねた可能性があります（PDFの実体は移行されません）。

**ロールバックはアップロード済みのPDFを実体ごと削除します。**

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
