# DBビュー変更の管理

`public` スキーマのビュー定義を手で変更したときの、適用SQLとロールバックSQLを置く場所です。**フォルダで本番への適用状況を表します。**

| フォルダ        | 意味                                                     |
| --------------- | -------------------------------------------------------- |
| `applied/`      | ステージングと**本番の両方**に適用済み                   |
| `staging-only/` | ステージングにのみ適用済み。**本番は未適用**             |

各ビューにつき2ファイルを置きます。

- `<view>.sql` … 適用する新しい定義
- `<view>.rollback.sql` … 変更前の定義。問題が出たらこれをそのまま実行すれば戻せる

各ファイルの1行目に `-- 適用状況: ステージング YYYY-MM-DD / 本番 YYYY-MM-DD` を書いています。

## 運用ルール

1. ステージングに適用したら、`staging-only/` に `.sql` と `.rollback.sql` を置く。`.rollback.sql` は**本番の現在の定義**（＝変更前の定義）を `pg_get_viewdef` で採取したものにする
2. 本番に適用したら、`git mv` で `applied/` へ移動し、1行目の適用状況を更新する
3. `applied/` に入っているものは本番に反映済みなので、あとは触らない

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

| ビュー                   | 変更内容                                                                                          | ステージング         | 本番   | 関連コミット           |
| ------------------------ | ------------------------------------------------------------------------------------------------- | -------------------- | ------ | ---------------------- |
| `v_juchu_kizai_head_lst` | 末尾に `nyuryoku_user`（入力者）と `add_dat`（作成日）の2列を追加。既存列の値は不変                | 適用済み（08-20確認）| 未適用 | `4a335287` / `be8a69c2`|
| `v_nyushuko_den_lst`     | `mem2` を `COALESCE(t_juchu_kizai_meisai.mem2, t_juchu_ctn_meisai.mem)` に変更＋コンテナ明細をJOIN | 適用済み（08-20確認）| 未適用 | `51905975`             |

`v_nyushuko_den_lst` は**列追加ではなく既存列 `mem2` の値が変わる変更**です。コンテナ明細は同一キーに `shozoku_id` 別で複数行あり、JOIN条件を誤ると `sum(plan_qty)` 等がfanoutして二重集計になります。本番適用前に行数と `mem2` の差分検証を必ず行ってください（ファイル冒頭のコメントに詳細あり）。

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
