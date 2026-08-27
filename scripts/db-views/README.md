# DBビュー変更の管理

`public` スキーマのビュー定義を手で変更したときの、適用SQLとロールバックSQLを置く場所です。**フォルダで本番への適用状況を表します。**

同じ構成の姉妹フォルダが2つあります。テーブル定義（DDL）の変更は [`../db-tables/`](../db-tables/README.md)、マスタデータなどのデータ変更（INSERT/UPDATE/DELETE）は [`../db-data/`](../db-data/README.md) に置いてください。

| フォルダ        | 意味                                                     |
| --------------- | -------------------------------------------------------- |
| `applied/`      | 開発環境と**本番の両方**に適用済み                       |
| `staging-only/` | 開発環境にのみ適用済み。**本番は未適用**                 |

ここでいう環境は2つだけです。

| 呼び方                       | Supabaseプロジェクト   | スキーマ | PostgreSQL |
| ---------------------------- | ---------------------- | -------- | ---------- |
| 開発環境（= preview / ステージング） | `jimqcvyaoddsxbcrsnfs` | `public` | 15系       |
| 本番                         | `exekmmbmletvrzpavmzg` | `public` | 17系       |

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

| ビュー                      | 変更内容                                                                          | ステージング       | 本番       | 関連                            |
| --------------------------- | --------------------------------------------------------------------------------- | ------------------ | ---------- | ------------------------------- |
| `v_rfid_sts`                | 5つの相関サブクエリを窓関数1回スキャンに統合（`v_rfid` のリフレッシュ高速化）      | 2026-08-18         | 2026-08-19 | `refreshVRfid()`                |
| `v_nyushuko_total_time_sts` | 4回自己JOINを `count(*) FILTER` に統合                                            | 2026-08-17         | 2026-08-19 | `shuko-list` / `nyuko-list`     |
| `v_ido_total_time_sts_union`| 4回自己JOINを `count(*) FILTER` に統合                                            | 2026-08-19         | 2026-08-19 | `ido-list`                      |
| `v_juchu_kizai_dat_qty`     | 末尾に所属別数量6列（`kics_*` / `yard_*`）を追加                                  | 日付不明（08-19前）| 2026-08-19 | `stock` ブランチ（**未マージ**）|
| `v_zaiko_qty`               | 末尾に所属別数量6列＋`kics_zaiko_qty` / `yard_zaiko_qty` の計8列を追加            | 日付不明（08-19前）| 2026-08-19 | `stock` ブランチ（**未マージ**）|
| `v_ido_den2`                | 末尾に `mem` 列（移動メモ）を追加。`t_ido_mem` を LEFT JOIN                        | 日付不明（08-19前）| 2026-08-19 | 参照コードなし・`t_ido_mem` は0行 |

適用時の検証結果は上3件が新旧で全列差分0、下3件が既存列の差分0（いずれも本番データで `EXCEPT ALL` 双方向）。適用直前の本番バックアップは `~/db-backup/prod_20260819_1804/`（全69ビューの定義を含む `prod_all_viewdefs.sql` もある）。

### staging-only/ — 本番未適用

| ビュー                   | 変更内容                                                                                          | 開発環境             | 本番   | 関連コミット           |
| ------------------------ | ------------------------------------------------------------------------------------------------- | -------------------- | ------ | ---------------------- |
| `v_juchu_kizai_head_lst` | 末尾に `nyuryoku_user`（入力者）と `add_dat`（作成日）の2列を追加。既存列の値は不変                | 適用済み（08-20確認）| 未適用 | `4a335287` / `be8a69c2`|
| `v_nyushuko_den_lst`     | **①** `mem2` を `COALESCE(t_juchu_kizai_meisai.mem2, t_juchu_ctn_meisai.mem)` に変更＋コンテナ明細をJOIN／**②** 末尾に `add_user`・`upd_user` の2列を追加（34→36列） | ① 08-20確認 ② 2026-08-21 | 未適用 | ① `51905975` ② 未コミット |
| `v_nyushuko_den2_lst`    | 末尾に `add_user`・`upd_user` の2列を追加（29→31列）。`v_nyushuko_den_lst` から素通し               | 2026-08-21           | 未適用 | 未コミット             |
| `v_nyushuko_den_head`    | 末尾に `nyuryoku_user`（入力者、`varchar(100)`）の1列を追加（17→18列）                             | 2026-08-21           | 未適用 | 未コミット             |
| `v_nyushuko_den2_head`   | 末尾に `nyuryoku_user` の1列を追加（20→21列）。`v_nyushuko_den_head` から素通し                     | 2026-08-21           | 未適用 | 未コミット             |
| `v_rfid_sts`             | ORDER BYの異なる窓関数3つを `GROUP BY` の集約1パスに置き換え（`v_rfid` のリフレッシュ高速化・第2弾）。列構成は不変 | 2026-08-25           | 未適用 | 未コミット             |

`v_rfid_sts` は `applied/` にも同名ファイルがあります（2026-08-19に本番適用済みの窓関数版）。**同じビューへの2回目の変更**なので、`applied/` 側は履歴としてそのまま残し、今回の変更は `staging-only/` に置いています。`staging-only/v_rfid_sts.rollback.sql` の中身は `applied/v_rfid_sts.sql`（＝本番の現在の定義）と同一です。本番適用時は `applied/` 側の2ファイルを削除し、`staging-only/` 側を `applied/` へ移動してください。

**適用順序**: 親→子の順に適用してください。逆順だと子が存在しない列を参照してエラーになります。

| 適用順序                                              | ロールバック順序（逆）                                 |
| ----------------------------------------------------- | ------------------------------------------------------ |
| `v_nyushuko_den_lst.sql` → `v_nyushuko_den2_lst.sql`  | `v_nyushuko_den2_lst` → `v_nyushuko_den_lst`           |
| `v_nyushuko_den_head.sql` → `v_nyushuko_den2_head.sql`| `v_nyushuko_den2_head` → `v_nyushuko_den_head`         |

`v_nyushuko_den_lst` の変更①は**列追加ではなく既存列 `mem2` の値が変わる変更**です。コンテナ明細は同一キーに `shozoku_id` 別で複数行あり、JOIN条件を誤ると `sum(plan_qty)` 等がfanoutして二重集計になります。本番適用前に行数と `mem2` の差分検証を必ず行ってください（ファイル冒頭のコメントに詳細あり）。

変更②（`add_user`/`upd_user`）は開発環境で検証済みです。両ビューの `GROUP BY` キーが `t_nyushuko_den` の主キー7列を含んでいて1グループ=1行のため、2列を `GROUP BY` に足しても行は分裂しません（`v_nyushuko_den_lst` 124,923行・`v_nyushuko_den2_lst` 123,033行のまま、既存列の差分0）。

`*_head` 系の `nyuryoku_user` も同様に検証済みです。`t_juchu_head` の主キーは `juchu_head_id` 単独で、`v_nyushuko_den_head` の `GROUP BY` にも `v_nyushuko_den2_head` の `DISTINCT` 対象列にも `juchu_head_id` が入っているため、関数従属で行は増えません（3,611行 / 3,649行のまま、既存列の差分0）。`t_juchu_head` は元々 `v_nyushuko_den_head` に `del_flg = 0` の INNER JOIN で入っているので、JOINの追加は不要でした。

`v_rfid_sts`（集約1パス版）は開発環境・本番の両方で `EXCEPT ALL` 双方向の差分0を確認済みです（開発環境103,116行／本番103,509行、本番は読み取りのみで未変更）。マテビュー `v_rfid` の実体でも全11列で差分0（102,868行）。同一 `rfid_tag_id`・同一 `upd_dat` で値が割れる「タイ」が両環境とも0件のため、`first_value` と `array_agg` のタイ時の非決定性による差異は起こりません。`REFRESH MATERIALIZED VIEW public.v_rfid` は約4.9〜6.1秒 → 約1.34〜1.37秒。**この高速化は5つのソーステーブルの `idx_*` カバリングインデックスに依存する**（Index Only Scan + Merge Append により無ソートになる）ため、それらを削除・変更すると劣化します。詳細はファイル冒頭のコメントを参照。

### 集約ビューに列を足すときの判断

`GROUP BY` や `SELECT DISTINCT` を持つビューに列を足すと**行数が変わり得ます**。追加する列が既存のグループ化キーに**関数従属している**（＝キーが決まれば値が1つに決まる）なら `GROUP BY` / `DISTINCT` に足しても行は分裂しないので、`max()` で包む必要はありません。判定は「追加元テーブルの主キーが既存のキーに含まれているか」を見るのが早いです。含まれていない場合は `max()` で包むか、そもそも行数が増える前提で影響を確認してください。

### ファイルとして管理していない差分

| 対象                     | 内容                                                            |
| ------------------------ | --------------------------------------------------------------- |
| `v_juchu_kizai_qty`      | `reloptions` の食い違い（本番=なし / ステージング=`security_invoker=on`）。定義は同一 |
| `v_seikyu_juchu_lst_test`| ステージングにのみ存在するテスト用ビュー                        |

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
