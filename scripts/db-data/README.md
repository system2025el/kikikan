# DBデータ変更の管理

マスタデータなどを手でINSERT/UPDATE/DELETEしたときのSQLとロールバックSQLを置く場所です。**フォルダの意味・共通の運用ルール・適用手順は [`../README.md`](../README.md) にまとめてあります。**

- `YYYYMMDD-対象.sql` … 適用するSQL（古い2件は `<table>.sql` 形式のまま）
- 同名の `.rollback.sql` … 元の値に戻すSQL
- 各ファイルの1行目に `-- 適用状況: ステージング YYYY-MM-DD / 本番 YYYY-MM-DD`
- 本番に適用したら `git mv` で `applied/` へ移動し、1行目を更新する

## 一覧

### applied/ — 開発環境・本番とも適用済み

| テーブル                                    | 変更内容                                                                           | 開発環境   | 本番       |
| ------------------------------------------- | ---------------------------------------------------------------------------------- | ---------- | ---------- |
| `m_seikyu_sts`                              | `sts_id = 2` を `処理中`→`確認待ち`、`sts_id = 3` を `郵送済み`→`メール、配送済み` | 2026-08-26 | 2026-09-03 |
| `t_juchu_kizai_honbanbi`（`_template.sql`） | 本番日の受注ヘッダー単位テンプレートを `juchu_kizai_head_id = 0` で作成            | 2026-08-31 | 2026-09-03 |

本番での実績は `m_seikyu_sts` が `UPDATE 1` × 2件、テンプレートが **`INSERT 0 1960`**（開発環境より多いのは本番のデータ量が多いため。52,664 → 54,624行）。適用直前の本番バックアップは `~/db-backup/prod_20260903_1900/`（`prod_m_seikyu_sts.csv` に変更前の全7行も退避）。

テンプレートINSERTは適用前に**本番で `BEGIN` → INSERT → 影響計測 → `ROLLBACK` のリハーサル**を実施し、次を確認済みです。

- 在庫（`v_juchu_kizai_dat_qty` の `sum(plan_qty)` = 13,389,328）は**完全に不変**。`t_juchu_kizai_head` に `juchu_kizai_head_id = 0` の行が無く、`v_juchu_kizai_dat_qty` はヘッダー側から結合するため、テンプレート行は在庫に効かない
- `v_juchu_kizai_head_lst` の `juchu_honbanbi_calc_qty` も全2,213行で差分0
- 影響を受けるのは `v_honbanbi_calc` のみ（662 → 1,228行）。そのため**先に `db-views` の `v_honbanbi_calc` を適用してからINSERT**し、適用後も662行のままであることを確認した

### staging-only/ — 本番未適用

| SQL                               | 変更内容                                                                                                                                | 開発環境   | 本番   |
| --------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- | ---------- | ------ |
| `20261021-m-sagyo-kbn-jizen`      | 作業区分マスタに 80（事前ピッキング `事ST`）・90（事前最終確認 `事CH`）を追加。作業状態マスタ（`m_sagyo_sts`）には足さない              | 2026-10-21 | 未適用 |
| `20261021-m-honbanbi-color-jizen` | 本番日色マスタに `clolor_id = 4`（事前準備の期間の色 `#E8D5B7`）を追加。種別4は色のためだけの値で `t_juchu_kizai_honbanbi` には入れない | 2026-10-21 | 未適用 |

どちらも事前準備の改修（[`../db-tables/README.md`](../db-tables/README.md) の 20261021）の一部です。`WHERE NOT EXISTS` で冪等にしてあり、監査値（`add_user`）は入れる値が無いので空のままです。
作業状態の名前は、ビュー（`v_nyushuko_total_time_sts`）で 80→10・90→20 に読み替えてから 11/12/21/22 で引くので、81/82/91/92 の行は要りません。

`20260930-nyushuko-den-dsp-backfill`（返却・キープの入庫伝票で `dsp_ord_num` が NULL の未到着の行を親の値で埋めるデータ補正）は、流さないことにして 2026-10-19 に削除しました（ステージング・本番とも未適用のまま）。対象は 2026-10-19 時点のステージングで古い受注 90354 の1行だけでした。送信RPC側は修正済みなので、新しく作られる行には影響しません。必要になったら git の履歴から取り出してください。

関連するアプリ側の変更として `app/_lib/db/tables/m-seikyu-sts.ts` の `selectActiveSeikyuSts` に `.in('sts_id', [2, 3, 9])` を足す作業が進行中です（請求状況の選択肢を 2 / 3 / 9 に絞る）。

`t_juchu_kizai_honbanbi_template.sql` は本番日（種別10/20/30/40）の入力を明細画面から伝票画面へ移す変更に対応するものです。**このSQLは冪等ではありません**が、`t_juchu_kizai_honbanbi` の主キー `(juchu_head_id, juchu_kizai_head_id, juchu_honbanbi_shubetu_id, juchu_honbanbi_dat)` があるため、二重実行しても重複行ができるのではなく duplicate key で失敗します（黙って壊れることはない）。テンプレート行へのアクセスは `app/_lib/db/tables/t-juchu-honbanbi.ts` に閉じてあり、将来テンプレート専用テーブルへ移す場合もこのファイルの中だけで完結します。

## データ変更SQLの書き方

```sql
BEGIN;

UPDATE public.m_xxx
   SET col = '新しい値'
 WHERE key = 1
   AND col = '元の値';   -- ← 変更前の値をWHEREに入れる

COMMIT;
```

- **`BEGIN` / `COMMIT` をファイルに含める**（複数文がまとめてロールバックされるように）
- **WHERE に変更前の値を入れる**。二重実行しても何も起きない（冪等）ようにし、想定と違う値になっていたら 0 件で気づけるようにする
- 期待する更新件数をヘッダーに書いておき、`UPDATE 1` の出力と突き合わせる

## 注意点

- **Git Bash から `psql -c` に日本語リテラルを渡すと文字化けします**（`invalid byte sequence for encoding "UTF8"`）。必ずファイルに保存して `-f` で渡してください。BOM無しUTF-8であること（`od -An -tx1 -N3 file` が `ef bb bf` で始まらない）も確認します。
- `m_master_update` は `m_kizai` / `m_rfid` / `m_sagyo_sts` / `m_shozoku` / `m_tanaban` の**5件しか持ちません**。この5つのマスタを手で変更したときは `upd_dat` の更新（`updateMasterUpdates` 相当）も必要ですが、それ以外のマスタでは不要です。
- `m_rfid` のステータスに影響する変更をした場合は `REFRESH MATERIALIZED VIEW public.v_rfid;` も実行してください。
- `upd_dat` / `upd_user` は、アプリの更新処理が入るテーブルでは合わせて更新する慣習ですが、手作業の修正で `upd_user` に入れるべき値が無い場合は無理に埋めないでください（監査値の捏造になります）。変更の記録はこのフォルダのSQLファイルが担います。

## 適用手順

接続URLとPostgreSQLクライアントの用意は [`../db-migration/README.md`](../db-migration/README.md) の「準備」を参照してください。

```bash
cd scripts/db-migration
PG=./pgclient/pgsql/bin

# 適用前に現在の値を確認（ロールバックSQLの内容と一致していること）
$PG/psql.exe "$(cat .stg_url)" -c 'SELECT * FROM public.m_seikyu_sts ORDER BY sts_id;'

# 適用
$PG/psql.exe "$(cat .stg_url)" -v ON_ERROR_STOP=1 -f ../db-data/staging-only/m_seikyu_sts.sql
```

本番に適用する場合は `.stg_url` を `.prod_url` に変えます。**本番のデータ変更前には [`../db-migration/README.md`](../db-migration/README.md) の手順でバックアップを取ってください。**
