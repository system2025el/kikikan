# DBテーブル定義変更の管理

テーブルの列追加・型変更・制約変更など、**テーブル定義（DDL）**を手で変更したときのSQLとロールバックSQLを置く場所です。**フォルダの意味・運用ルール・環境の呼び方・適用手順は [`../db-views/`](../db-views/README.md) と同じ**です。

| 置き場所                          | 対象                                       |
| --------------------------------- | ------------------------------------------ |
| `../db-views/`                    | ビュー定義の変更                           |
| **`.`（このフォルダ）**           | **テーブル定義（DDL）の変更**              |
| [`../db-data/`](../db-data/README.md) | データの変更（INSERT/UPDATE/DELETE）   |

| フォルダ        | 意味                                     |
| --------------- | ---------------------------------------- |
| `applied/`      | 開発環境と**本番の両方**に適用済み       |
| `staging-only/` | 開発環境にのみ適用済み。**本番は未適用** |

ファイル名は `<table>_<変更内容>.sql` / `.rollback.sql`。1つのテーブルに複数のDDL変更が入るため、ビューのように「1テーブル＝1ファイル」にはしていません。各ファイルの1行目に `-- 適用状況: 開発環境(preview/public) YYYY-MM-DD / 本番 YYYY-MM-DD` を書きます。

## 一覧

### applied/ — 開発環境・本番とも適用済み

| ファイル                      | 変更内容                                                            | 開発環境   | 本番       |
| ----------------------------- | -------------------------------------------------------------------- | ---------- | ---------- |
| `t_mitu_head_comment_200.sql` | `t_mitu_head.comment`（コメント）を `varchar(100)` → `varchar(200)` | 2026-08-26 | 2026-09-03 |

本番適用は 8ms（カタログ更新のみ・テーブル書き換えなし）。適用直前の本番バックアップは `~/db-backup/prod_20260903_1900/`。

### staging-only/ — 本番未適用

**現在なし**。

**この変更にはアプリ側の未対応が2件あります。**

1. `app/(main)/quotation-list/_lib/types.ts` の Zod が `.max(100)` のままなので、**画面からは101文字以上入力できません**。実際に200文字使うには `.max(200)` への変更が必要です。
2. `app/(main)/quotation-list/_lib/hooks/usePdf.ts` のコメント欄は `if (innerIndex < 5)` で**先頭5行しか描画せず、6行目以降を無言で捨てます**。全角はサイズ8・幅290ptで1行36文字前後なので、PDFに載るのは概算180文字程度が上限です（改行を入れるとさらに減ります）。描画行数を増やすかどうかは未判断です。

## DDL変更SQLの書き方

- **`BEGIN` / `COMMIT` をファイルに含める**。PostgreSQLはDDLもトランザクションに入れられるので、失敗時に確実に巻き戻せます
- 適用前に**必ずリハーサル**する。`BEGIN;` → DDL → 確認クエリ → `ROLLBACK;` を1ファイルで流せば、本当に通るか・何秒かかるかを無変更で確かめられます
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

## 注意点

- **列を参照しているビューがあると型変更は失敗します**（`cannot alter type of a column used by a view or rule`）。事前に確認してください。該当があれば、依存ビューを `DROP` → 型変更 → 再 `CREATE` の順になり、作業がかなり重くなります。

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

- **`varchar` の桁数拡大はカタログ更新のみ**（PostgreSQL 9.2以降）でテーブル書き換えが起きず一瞬で終わります。逆に**縮小は全行検査とテーブル書き換えを伴う**ので、行数が多いテーブルでは長時間ロックします。
- **Supabaseの自動生成型（`app/_lib/db/types/types.ts`）は `varchar` の桁数を持ちません**。桁数だけの変更なら型の再生成は不要です。列の追加・削除・NULL可否の変更をしたときは再生成が必要です。
- Git Bash から `psql -c` に日本語リテラルを渡すと文字化けします。SQLはBOM無しUTF-8のファイルにして `-f` で渡してください。

## 適用手順

接続URLとクライアントの用意は [`../db-migration/README.md`](../db-migration/README.md) の「準備」を参照してください。

```bash
cd scripts/db-migration
PG=./pgclient/pgsql/bin

# リハーサル（無変更で確認）
$PG/psql.exe "$(cat .stg_url)" -v ON_ERROR_STOP=1 -c '\timing on' \
  -c 'BEGIN;' -f ../db-tables/staging-only/<file>.sql -c 'ROLLBACK;'

# 適用
$PG/psql.exe "$(cat .stg_url)" -v ON_ERROR_STOP=1 -c '\timing on' \
  -f ../db-tables/staging-only/<file>.sql
```

本番に適用する場合は `.stg_url` を `.prod_url` に変え、**事前に [`../db-migration/README.md`](../db-migration/README.md) の手順でバックアップを取ってください。**
