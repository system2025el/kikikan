# DBビュー変更の管理

`public` スキーマのビュー定義を手で変更したときの、適用SQLとロールバックSQLを置く場所です。**フォルダで本番への適用状況を表します。**

同じ構成の姉妹フォルダが3つあります。テーブル定義（DDL）の変更は [`../db-tables/`](../db-tables/README.md)、関数（RPC）の変更は [`../db-functions/`](../db-functions/README.md)、マスタデータなどのデータ変更（INSERT/UPDATE/DELETE）は [`../db-data/`](../db-data/README.md) に置いてください。**共通の運用ルール・適用手順・フォルダをまたぐ適用順序は [`../README.md`](../README.md) にまとめてあります。**

| フォルダ        | 意味                                     |
| --------------- | ---------------------------------------- |
| `applied/`      | 開発環境と**本番の両方**に適用済み       |
| `staging-only/` | 開発環境にのみ適用済み。**本番は未適用** |

ここでいう環境は2つだけです。

| 呼び方                               | Supabaseプロジェクト   | スキーマ | PostgreSQL |
| ------------------------------------ | ---------------------- | -------- | ---------- |
| 開発環境（= preview / ステージング） | `jimqcvyaoddsxbcrsnfs` | `public` | 15系       |
| 本番                                 | `exekmmbmletvrzpavmzg` | `public` | 17系       |

`dev5`〜`dev8` などのスキーマも残っていますが、2025年12月〜2026年2月で更新が止まっており使われていません。

各ビューにつき2ファイルを置きます。

- `<view>.sql` … 適用する新しい定義
- `<view>.rollback.sql` … 変更前の定義。問題が出たらこれをそのまま実行すれば戻せる

各ファイルの1行目に `-- 適用状況: ステージング YYYY-MM-DD / 本番 YYYY-MM-DD` を書いています。

## 運用ルール

1. 開発環境に適用したら、`staging-only/` に `.sql` と `.rollback.sql` を置く。`.rollback.sql` は**本番の現在の定義**（＝本番から見た変更前の定義）を `pg_get_viewdef` で採取したものにする
2. 本番に適用したら、`git mv` で `applied/` へ移動し、1行目の適用状況を更新する
3. `applied/` に入っているものは本番に反映済みなので、あとは触らない

### 同じビューを続けて変更する場合

`staging-only/` にすでにそのビューのファイルがあるときは、**新しいファイルを増やさず既存の `.sql` を上書き更新して変更を累積させます**。`.sql` は「本番に適用すべき最終形」、`.rollback.sql` は「本番の現在の定義」を表すため、この形なら本番適用は1回で済み、ロールバックも常に本番の現状に戻せます。ヘッダーに変更内容を追記していってください（例: `v_nyushuko_den_lst.sql` は `mem2` 修正と `add_user`/`upd_user` 追加の2件を累積しています）。

`.rollback.sql` を「開発環境の変更直前の定義」にしてしまうと、本番未適用の変更が混ざって本番を戻せなくなるので注意してください。

## 一覧

### applied/ — ステージング・本番とも適用済み

| ビュー                       | 変更内容                                                                                                                                                                                                                                                                                                                          | ステージング        | 本番            | 関連                              |
| ---------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------- | --------------- | --------------------------------- |
| `v_rfid_sts`                 | **第1弾** 5つの相関サブクエリを窓関数1回スキャンに統合／**第2弾** 窓関数3つを `GROUP BY` の集約1パスに統合。`v_rfid` のリフレッシュは 16.8〜25秒 → 3.8秒 → **1.43秒**                                                                                                                                                             | ① 08-18 ② 08-25     | ① 08-19 ② 09-03 | `refreshVRfid()`                  |
| `v_nyushuko_total_time_sts`  | 4回自己JOINを `count(*) FILTER` に統合                                                                                                                                                                                                                                                                                            | 2026-08-17          | 2026-08-19      | `shuko-list` / `nyuko-list`       |
| `v_ido_total_time_sts_union` | 4回自己JOINを `count(*) FILTER` に統合                                                                                                                                                                                                                                                                                            | 2026-08-19          | 2026-08-19      | `ido-list`                        |
| `v_juchu_kizai_dat_qty`      | 末尾に所属別数量6列（`kics_*` / `yard_*`）を追加                                                                                                                                                                                                                                                                                  | 日付不明（08-19前） | 2026-08-19      | `stock` ブランチ（**未マージ**）  |
| `v_zaiko_qty`                | 末尾に所属別数量6列＋`kics_zaiko_qty` / `yard_zaiko_qty` の計8列を追加                                                                                                                                                                                                                                                            | 日付不明（08-19前） | 2026-08-19      | `stock` ブランチ（**未マージ**）  |
| `v_ido_den2`                 | 末尾に `mem` 列（移動メモ）を追加。`t_ido_mem` を LEFT JOIN                                                                                                                                                                                                                                                                       | 日付不明（08-19前） | 2026-08-19      | 参照コードなし・`t_ido_mem` は0行 |
| `v_juchu_kizai_head_lst`     | 末尾に `nyuryoku_user`（入力者）と `add_dat`（作成日）の2列を追加。既存列の値は不変                                                                                                                                                                                                                                               | 2026-08-20          | 2026-09-03      | `4a335287` / `be8a69c2`           |
| `v_nyushuko_den_lst`         | **①** `mem2` を `COALESCE(機材明細.mem2, コンテナ明細.mem)` に変更＋コンテナ明細をJOIN／**②** `add_user`・`upd_user` を追加（34→36列）                                                                                                                                                                                            | ① 08-20 ② 08-21     | 2026-09-03      | `51905975`                        |
| `v_nyushuko_den2_lst`        | 末尾に `add_user`・`upd_user` の2列を追加（29→31列）。`v_nyushuko_den_lst` から素通し                                                                                                                                                                                                                                             | 2026-08-21          | 2026-09-03      | 同上                              |
| `v_nyushuko_den_head`        | 末尾に `nyuryoku_user`（`varchar(100)`）の1列を追加（17→18列）                                                                                                                                                                                                                                                                    | 2026-08-21          | 2026-09-03      | 入出庫伝票                        |
| `v_nyushuko_den2_head`       | 末尾に `nyuryoku_user` の1列を追加（20→21列）。`v_nyushuko_den_head` から素通し                                                                                                                                                                                                                                                   | 2026-08-21          | 2026-09-03      | 同上                              |
| `v_ido_den3_lst`             | **第1弾** 末尾に `juchu_meisai`（jsonb）を追加（31→32列）。`juchu_flg` の算出を相関EXISTS×2からLEFT JOINに変更／**第2弾** 機材単位 → **受注機材ヘッダー単位**に作り替え。`juchu_meisai` を廃止し `juchu_head_id` / `juchu_kizai_head_id` / `koen_nam` / `head_nam` と並び順用の `kizai_grp_cod` / `dsp_ord_num` を追加（32→37列） | ① 09-01 ② 09-24     | ① 09-03 ② 10-07 | `dc99e9a2` 移動明細（Web専用）    |
| `v_honbanbi_calc`            | 本番日テンプレート（`juchu_kizai_head_id = 0`）の行を除外。列構成は不変                                                                                                                                                                                                                                                           | 2026-09-03          | 2026-09-03      | `8c5dc552` 伝票画面               |
| `v_ido_den3_result`          | 末尾に `juchu_head_id` / `juchu_kizai_head_id` / `koen_nam` / `head_nam` の4列を追加（37→41列）。既存37列は不変                                                                                                                                                                                                                   | 2026-09-24          | 2026-10-07      | 移動機材詳細・ゲート              |
| `v_ido_den2_meisai_lst`      | **新規**。HT・ゲート向けの明細単位リスト（29列）。`v_ido_den2_lst` は機材単位のまま残す                                                                                                                                                                                                                                           | 2026-09-24          | 2026-10-07      | 段階2（HT・ゲート改修）           |
| `v_nyushuko_den`             | 末尾に `nyuko_fix_sts` / `shuko_fix_sts`（到着・出発の 0=なし / 1=一部 / 2=全部）を追加（24→26列）。`nyuko_fix_flg` / `shuko_fix_flg` を「全部確定済みのときだけ1」に変更（2026-10-01）                                                                                                                                           | 2026-09-30          | 2026-10-07      | 入出庫一覧の3段階表示             |
| `v_nyushuko_den2`            | `v_nyushuko_den` の上記2列を末尾に通す（GROUP BY にも追加。33→35列）                                                                                                                                                                                                                                                              | 2026-09-30          | 2026-10-07      | 入出庫一覧の3段階表示             |

適用時の検証結果は上3件が新旧で全列差分0、下3件が既存列の差分0（いずれも本番データで `EXCEPT ALL` 双方向）。適用直前の本番バックアップは `~/db-backup/prod_20260819_1804/`（全69ビューの定義を含む `prod_all_viewdefs.sql` もある）。

2026-09-03 に追加した8件（`v_juchu_kizai_head_lst` 以降＋`v_rfid_sts` 第2弾）も、すべて本番データで事前検証しています。バックアップは `~/db-backup/prod_20260903_1900/`。特筆すべき検証結果は次のとおりです。

- `v_nyushuko_den_lst` の `mem2` 変更は、**8,023行すべてが NULL → 値の穴埋め**で、既存の非NULL値の書き換えは0件。行数144,103も不変（コンテナ明細のfanoutは起きていない）
- `v_ido_den3_lst`・`v_rfid_sts`・`v_honbanbi_calc` は既存列・行数とも差分0
- 在庫（`v_juchu_kizai_dat_qty` の `sum(plan_qty)` = 13,389,328）は適用前後で完全に不変

### staging-only/ — 本番未適用

現在ありません（2026-10-07 に5件すべてを本番へ適用し `applied/` へ移動しました）。

### 2026-10-07 の本番適用（移動の明細単位化・入出庫の3段階表示）

上の5件を単一トランザクションで適用しました。適用直前の本番バックアップは `~/db-backup/prod_20261007_1831/`
（全69ビューの定義 `prod_all_viewdefs_20261007_1831.sql`、全16関数の定義 `prod_all_funcdefs_20261007_1831.sql`、
DB全体の `prod_alldb_20261007_1831.dump` を含む）。

適用順は親→子で `v_nyushuko_den` → `v_nyushuko_den2` → `v_ido_den3_lst` → `v_ido_den3_result` → `v_ido_den2_meisai_lst`。
`v_ido_*` の3本は「移動を受注機材ヘッダー単位にする」改修の一部で、
**テーブル変更 [`scripts/db-tables/applied/20260924-ido-juchu-meisai.sql`](../db-tables/applied/20260924-ido-juchu-meisai.sql) と RPC修理 `20260924-ido-send-rpc-fix.sql` が先に適用されていないと動きません**（同日、ビューより先に適用済み）。

検証結果:

- 防波堤ビューの行数が適用前後で不変（`v_ido_den_lst` 5,064 / `v_ido_den2_lst` 5,038 / `v_ido_den2_union_lst` 13,612 / `v_ido_total_time_sts_union` 1,154 / `v_ido_den2` 468）
- 在庫（`v_juchu_kizai_dat_qty` の `sum(plan_qty)` = 15,389,766）は適用前後で完全に不変
- 5ビューの列名・列順（計168列）と正規化した定義が本番とステージングで完全一致
- `v_ido_den3_lst` は DROP → CREATE だが、依存する子ビューは0件で、権限も適用前と同一（`anon` に `SELECT,INSERT,UPDATE,DELETE`）

#### v_nyushuko_den / v_nyushuko_den2（到着・出発の3段階）

入出庫一覧の1行（入出庫日時・場所・受注・区分）には、同じ日時・場所の受注機材ヘッダーが複数合体していることがあります。
既存の `nyuko_fix_flg` / `shuko_fix_flg` は「どれか1つでも確定済みなら1」なので、後から同じ日時のヘッダーを足すと「済」に見えてしまいます。
そこで、確定済みのヘッダー数と対象のヘッダー数から 0=なし / 1=一部 / 2=全部 を出す列を末尾に足しました。

**既存の2列は2026-10-01に「全部確定済みのときだけ1」に変えました**（列名・型・順番は同じ）。Web は一部確定済みでも到着・出発できるようにしたので、
HT・ゲートも一部確定済みなら送信できるようにそろえるためです。この2列を使っているのは次のとおりです（移動の `v_ido_den2` は別のビューで影響なし）。

- HT 入出庫検索（`v_nyushuko_den2`）：送信ボタンの無効化、済の色、「到着済」「出発済」の絞り込み
- ゲート入出庫検索（`v_nyushuko_den2`）：済の色、「出発済」の絞り込み。読取画面は開いた時点のこの値で送信不可にする（ゲート側の改修）
- Web `selectShukoStateConfirm`（受注明細の出庫作業中チェック）は「一部でも出発済み」を見たいので `shuko_fix_sts > 0` に変えた
- 依存するビューは `v_nyushuko_den2` だけ、関数からの参照なし（ステージング・本番とも確認）

- 開発環境で既存列の `EXCEPT ALL` 双方向の差分0・行数不変（3,537行）、一覧相当のクエリ時間も変わらないこと（約0.8秒）を確認済み（2026-09-30）
- 適用順は `v_nyushuko_den.sql` → `v_nyushuko_den2.sql`。ロールバックは列削除を伴うため `DROP` → `CREATE`（`v_nyushuko_den.rollback.sql` は `v_nyushuko_den2` も作り直す。GRANT の再付与も含む）
- 同じ改修のテーブル変更：[`scripts/db-tables/applied/20260930-t-nyushuko-den-nyuko-fix-qty.sql`](../db-tables/applied/20260930-t-nyushuko-den-nyuko-fix-qty.sql)（入庫明細の差分到着用。ビューとは独立）

#### v_ido_den3_lst（明細単位への作り替え）

旧定義は `v_ido_den2_union_lst` を集約する形でしたが、この中間ビュー群は DISTINCT と GROUP BY で機材単位に潰す作りなので明細単位の行を取り出せません。また `v_ido_den_lst` 以降は HT・ゲートが読む系統で粒度を変えられない（未保存の受注予定を読取アプリに流さないための防波堤）ため、**Web専用のこのビューだけ `t_ido_den` と `t_ido_den_juchu` から直接組み立てる**形に変えています。

検証（ステージング）: 機材単位に畳んで旧定義と比較し、**`plan_juchu_qty` 以外の全列で差分0・機材数不変**。行数 10,598 → 11,214。`plan_juchu_qty` だけ11機材で差が出るのは、入庫側の除外条件（`sagyo_kbn_id = 50 AND plan_qty = 0`）が機材単位から明細単位に変わり「移動数0の明細」が行ごと消えるためで、意図どおりです（該当30明細行。入庫画面はこの列を表示していない）。

★ その除外条件は **NULL セーフに書くこと**。FULL JOIN で「受注のみ（未保存）」の行を作ると `t_ido_den` 側が NULL になり、素朴に書くと `NOT (true AND NULL)` → NULL で入庫側の行が黙って消えます。

#### v_ido_den2_meisai_lst を新規追加した理由

`v_ido_den2_lst` の粒度を直接変えると HT とゲートを同時に切り替える必要が出てリリース調整が難しくなります。新ビューを足せば各アプリが自分のタイミングで乗り換えられます。

```
v_ido_den2_lst        → 機材単位のまま（現行アプリが動き続ける）
v_ido_den2_meisai_lst → 明細単位（新規。移行先）
```

新ビューも **`t_ido_den` 由来**にしてあります（要件: 移動画面で一度も保存していない受注予定を読取アプリに出さない）。ステージングで両ビューとも未保存行の漏れ0を確認済み。在庫数・最低数の列は入れていません（HT の `lib/models/ido_kizai_model.dart` とゲートの `Models/IdoDen2Lst.cs` が読む列を全列挙して確認。どちらも読んでいない）。

---

2026-09-03 に8件をすべて本番へ適用し `applied/` へ移動しました。

`v_rfid_sts` は同じビューへの2回目の変更でした。2026-09-03 の本番適用時に、予定どおり第1弾の2ファイルを削除して第2弾を `applied/` へ移動しています（**1ビュー1ファイル＝本番の現在の定義**の原則）。`applied/v_rfid_sts.rollback.sql` は第1弾の窓関数版に戻すもので、第1弾より前（相関サブクエリ版）へ戻す必要が生じた場合は git履歴から取得してください。

`v_ido_den3_lst` は移動明細画面で「どの公演のどの明細が何個の移動を予定しているか」を出すための変更です。1行（作業区分・作業指示・日付・場所・機材IDの5キー）に複数の受注明細が紐づくため、行を増やさずに済むよう jsonb 配列で返しています。開発環境・本番の両方で既存31列の `EXCEPT ALL` 双方向の差分0・行数不変を確認済み（開発環境10,593行／本番11,299行、本番は読み取りのみ）。**ロールバックは列削除を伴うため `CREATE OR REPLACE` では戻せず `DROP` → `CREATE` になります**（`.rollback.sql` にその形で書いてあります。GRANTの再付与も含む）。`v_ido_den3_lst` に依存する他のビューは無く、アプリからの参照のみです。

`v_honbanbi_calc` は本番日（種別10/20/30/40）の入力を受注ヘッダー単位へ移した変更に対応するものです。`t_juchu_kizai_honbanbi` に `juchu_kizai_head_id = 0` の「テンプレート」行を持たせたところ、このビューだけが `t_juchu_kizai_head` と結合せず honbanbi テーブルを直接 `GROUP BY` しているため、テンプレートが `juchu_kizai_head_id = 0` の行として現れていました（開発環境で501行）。参照している5本（`v_juchu_kizai_head_lst`・見積4本）はいずれも実在の受注機材ヘッダーと結合しており実害は出ていませんでしたが、このビューを直接 SELECT すると誤った行を拾うため塞いでいます。開発環境で適用前後の全行md5を比較し、**依存5ビューは行数・内容とも完全一致**、`v_honbanbi_calc` 自身は 1,096→595行（減った501行がテンプレートを持つ受注数と一致）を確認済みです。`.rollback.sql` は開発環境から採取した定義でしたが、2026-09-03 の本番適用前に**本番の `pg_get_viewdef` と一致すること、および新定義が本番データで既存662行と差分0であること**を確認済みです。本番では `v_honbanbi_calc` を先に適用してからテンプレート行をINSERTしたため、適用後も662行のまま（テンプレートが正しく除外されている）です。

★ `juchu_kizai_head_id` は単独ではユニークではありません。`t_juchu_kizai_head` の主キーは `(juchu_head_id, juchu_kizai_head_id)` の複合キーで、後者は受注内の連番でしかありません（本番実データで2,332行 / distinct 28）。このビューに限らず、明細名を引くJOINは必ず2キー両方で書いてください。

**適用順序**: 親→子の順に適用してください。逆順だと子が存在しない列を参照してエラーになります。

| 適用順序                                               | ロールバック順序（逆）                         |
| ------------------------------------------------------ | ---------------------------------------------- |
| `v_nyushuko_den_lst.sql` → `v_nyushuko_den2_lst.sql`   | `v_nyushuko_den2_lst` → `v_nyushuko_den_lst`   |
| `v_nyushuko_den_head.sql` → `v_nyushuko_den2_head.sql` | `v_nyushuko_den2_head` → `v_nyushuko_den_head` |
| `v_nyushuko_den.sql` → `v_nyushuko_den2.sql`           | `v_nyushuko_den2` → `v_nyushuko_den`           |

**フォルダをまたぐ順序制約は [`../README.md`](../README.md) に集約しています。** ビューが関わるものだけ挙げると、テーブルへの列追加（`db-tables/20260924-ido-juchu-meisai`・`20260930-t-nyushuko-den-nyuko-fix-qty`）は対応するビューより先、`v_honbanbi_calc` は `db-data` のテンプレートINSERTより先です。

`v_nyushuko_den_lst` の変更①は**列追加ではなく既存列 `mem2` の値が変わる変更**です。コンテナ明細は同一キーに `shozoku_id` 別で複数行あり、JOIN条件を誤ると `sum(plan_qty)` 等がfanoutして二重集計になります。本番適用前に行数と `mem2` の差分検証を必ず行ってください（ファイル冒頭のコメントに詳細あり）。

変更②（`add_user`/`upd_user`）は開発環境で検証済みです。両ビューの `GROUP BY` キーが `t_nyushuko_den` の主キー7列を含んでいて1グループ=1行のため、2列を `GROUP BY` に足しても行は分裂しません（`v_nyushuko_den_lst` 124,923行・`v_nyushuko_den2_lst` 123,033行のまま、既存列の差分0）。

`*_head` 系の `nyuryoku_user` も同様に検証済みです。`t_juchu_head` の主キーは `juchu_head_id` 単独で、`v_nyushuko_den_head` の `GROUP BY` にも `v_nyushuko_den2_head` の `DISTINCT` 対象列にも `juchu_head_id` が入っているため、関数従属で行は増えません（3,611行 / 3,649行のまま、既存列の差分0）。`t_juchu_head` は元々 `v_nyushuko_den_head` に `del_flg = 0` の INNER JOIN で入っているので、JOINの追加は不要でした。

`v_rfid_sts`（集約1パス版）は開発環境・本番の両方で `EXCEPT ALL` 双方向の差分0を確認済みです（開発環境103,116行／本番103,509行、本番は読み取りのみで未変更）。マテビュー `v_rfid` の実体でも全11列で差分0（102,868行）。同一 `rfid_tag_id`・同一 `upd_dat` で値が割れる「タイ」が両環境とも0件のため、`first_value` と `array_agg` のタイ時の非決定性による差異は起こりません。`REFRESH MATERIALIZED VIEW public.v_rfid` は約4.9〜6.1秒 → 約1.34〜1.37秒。**この高速化は5つのソーステーブルの `idx_*` カバリングインデックスに依存する**（Index Only Scan + Merge Append により無ソートになる）ため、それらを削除・変更すると劣化します。詳細はファイル冒頭のコメントを参照。

### 集約ビューに列を足すときの判断

`GROUP BY` や `SELECT DISTINCT` を持つビューに列を足すと**行数が変わり得ます**。追加する列が既存のグループ化キーに**関数従属している**（＝キーが決まれば値が1つに決まる）なら `GROUP BY` / `DISTINCT` に足しても行は分裂しないので、`max()` で包む必要はありません。判定は「追加元テーブルの主キーが既存のキーに含まれているか」を見るのが早いです。含まれていない場合は `max()` で包むか、そもそも行数が増える前提で影響を確認してください。

### ファイルとして管理していない差分

| 対象                      | 内容                                                                                  |
| ------------------------- | ------------------------------------------------------------------------------------- |
| `v_juchu_kizai_qty`       | `reloptions` の食い違い（本番=なし / ステージング=`security_invoker=on`）。定義は同一 |
| `v_seikyu_juchu_lst_test` | ステージングにのみ存在するテスト用ビュー                                              |

## 適用手順

接続URL（`.prod_url` / `.stg_url`）とPostgreSQLクライアントの用意は [`../db-migration/README.md`](../db-migration/README.md) の「準備」を参照してください。**ポートは5432（Session pooler）**です。

```bash
cd scripts/db-migration
PG=./pgclient/pgsql/bin

# 1. 適用前に本番のビュー定義を採取（ロールバックの保険）
$PG/psql.exe "$(cat .prod_url)" -tAc \
  "select pg_get_viewdef('public.<view>'::regclass, true)"

# 2. 単一トランザクションで適用（複数ある場合は依存順に）
$PG/psql.exe "$(cat .prod_url)" -v ON_ERROR_STOP=1 \
  -c 'BEGIN;' -f ../db-views/staging-only/<view>.sql -c 'COMMIT;'
```

依存関係がある場合は順序を守ること。例：`v_zaiko_qty` は `v_juchu_kizai_dat_qty` の列を使うので、必ず後者を先に適用します。

### 適用前の等価性チェック

本番を変更せずに新旧の結果を突合できます。ビューを直接書き換えずに、新定義をCTEに入れて既存ビューと比較します。

```sql
WITH newdef AS ( /* 新定義の SELECT 本体 */ ),
     n AS (SELECT <既存列のみ> FROM newdef),
     o AS (SELECT <既存列のみ> FROM public.<view>)
SELECT (SELECT count(*) FROM n) AS new_rows,
       (SELECT count(*) FROM o) AS old_rows,
       (SELECT count(*) FROM (TABLE n EXCEPT ALL TABLE o) a) AS only_in_new,
       (SELECT count(*) FROM (TABLE o EXCEPT ALL TABLE n) b) AS only_in_old;
```

参照先のビューも同時に変更する場合は、**CTE名を参照先ビューと同名にすると影として差し込めます**（CTE名はテーブル/ビュー名より優先される）。ただし定義側が `public.` 付きで修飾していると影になりません。

## ロールバック手順

```bash
cd scripts/db-migration
./pgclient/pgsql/bin/psql.exe "$(cat .prod_url)" -v ON_ERROR_STOP=1 \
  -f ../db-views/applied/<view>.rollback.sql
```

`v_rfid_sts` を戻した場合は `REFRESH MATERIALIZED VIEW public.v_rfid;` も実行してください。

## 本番とステージングの差分を確認する

一覧表が古くなっていないかは、実DBを突合すれば分かります。

```bash
cd scripts/db-migration
PG=./pgclient/pgsql/bin
cat > /tmp/vl.sql <<'EOF'
SELECT c.relname::text||'|'||COALESCE(array_to_string(c.reloptions,','),'-')||'|'||md5(pg_get_viewdef(c.oid, true))
FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace
WHERE n.nspname='public' AND c.relkind IN ('v','m') ORDER BY c.relname;
EOF
$PG/psql.exe "$(cat .prod_url)" -tA -f /tmp/vl.sql | tr -d '\r' > /tmp/vp.txt
$PG/psql.exe "$(cat .stg_url)"  -tA -f /tmp/vl.sql | tr -d '\r' > /tmp/vs.txt
join -t'|' <(sort -t'|' -k1,1 /tmp/vp.txt) <(sort -t'|' -k1,1 /tmp/vs.txt) \
  | awk -F'|' '$3!=$5 {print "定義差: "$1} $2!=$4 {print "reloptions差: "$1}'
```

### 比較時の落とし穴

- **本番はPG17・ステージングはPG15**で `pg_get_viewdef` の出力が違う。PG17は曖昧でなければテーブル修飾を省くため、md5や単純diffだと**実質同一のビューまで「差分あり」に見える**。上のコマンドで挙がったものは、`sed -E 's/\b[a-z_][a-z_0-9]*\.([a-z_])/\1/g'` 相当で修飾子を落としてから比較し直すこと
- Windowsの `psql.exe` はリダイレクト出力にCRLFを付ける。`tr -d '\r'` を通さないと、`git show` の内容との比較や `awk -F'|'` の末尾フィールド比較が**必ず不一致になる**
- `CREATE OR REPLACE VIEW` で `WITH` を省略すると reloptions の扱いが分かりにくいので、**常に明示する**。本番は `security_invoker = on` が基本（ステージング側が未設定でも本番の設定に合わせる）
- 列の追加は**末尾のみ**可能。既存列の並びや型が変わる場合は `CREATE OR REPLACE` が失敗するので `DROP` → `CREATE` が必要になり、依存ビューも作り直しになる
