# 本番データのステージング移行手順

本番（`exekmmbmletvrzpavmzg`）のデータをステージング（`jimqcvyaoddsxbcrsnfs`）に洗い替えるための手順とスクリプトです。**スキーマ（テーブル定義）は移行しません。データのみを入れ替えます。**

最終実施: 2026-08-12

## 前提として知っておくこと

移行前に把握しておかないと詰まる点、または誤った移行をしてしまう点です。

### 1. PostgreSQLのバージョンが本番とステージングで違う

本番は **17系**、ステージングは **15系** です。そのため:

- **PostgreSQLクライアントは17以上が必要**。14系では本番に接続できず `server version mismatch` になる。`bash 03-migrate.sh client` で管理者権限なしに17系を用意できる
- PG17の `pg_dump` は先頭に `SET transaction_timeout = 0;` を出力するが、これはPG17で追加されたパラメータで**PG15では `unrecognized configuration parameter` になり投入が全部失敗する**。`03-migrate.sh dump` が自動でコメントアウトする

テーブル定義（56テーブル・670カラム）は両環境で完全一致していることを `precheck` で毎回確認してください。

### 2. 接続は Session pooler（5432）を使う

`db.<project_ref>.supabase.co`（ダイレクト接続）は**DNS解決できません**（SupabaseのIPv4廃止）。pooler経由でのみ接続できます。

さらに `.env.local` の `DATABASE_URL` はポート **6543（Transaction pooler）** ですが、これは `psql -f` での複数文実行に使えません。**ポートを 5432（Session pooler）に読み替える**必要があります。

| 環境         | ホスト                                     | ポート |
| ------------ | ------------------------------------------ | ------ |
| 本番         | `aws-1-ap-northeast-1.pooler.supabase.com` | 5432   |
| ステージング | `aws-0-ap-northeast-1.pooler.supabase.com` | 5432   |

リージョンのプレフィックスが本番 `aws-1` / ステージング `aws-0` で**異なる**点に注意。

### 3. マスタテーブルだけの移行では動かない

「マスタ（`m_*`）だけ入れれば十分」と考えがちですが**不足します**。

- RFIDタグの**所属（KICS/YARD）と機材ステータスは `t_rfid_status_result` などの実績テーブル由来**（`v_rfid_sagyo_sts` → `v_rfid_sts` → `v_rfid`）。`m_rfid` だけ入れると全タグが所属なし・ステータスなしになり、`v_kizai_qty` の所属別数量が全て0になる。保有数だけは出てしまう（`rfid_kizai_sts IS NULL` は有効扱い）ため気づきにくい
- `m_master_update` は必須。`updateMasterUpdates()` は UPDATE のみで upsert しないため、行が無いと**マスタ更新日時が黙って記録されなくなる**

そのため**除外4テーブル以外は全件移行**します。

### 4. 移行しないテーブル

| テーブル        | 理由                                                                                                                                                                    |
| --------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `m_user`        | Supabase Auth（本番とステージングで**別プロジェクト**）の `auth.users` と `mail_adr` で紐づく。本番の `m_user` を入れるとステージングのアカウントでログインできなくなる |
| `t_lock`        | 編集ロックの残骸                                                                                                                                                        |
| `t_log`         | 移行不要。含める場合は `t_log_auto_id_seq` の `setval` が必要                                                                                                           |
| `t_juchu_tempu` | 受注添付ファイル。PDFの実体はStorage（バケット `juchu-tempu`）にあり、このスクリプトでは移行されない。行だけ入れると**開けない添付**が一覧に並ぶ                        |

`02-truncate-staging.sql` と `03-migrate.sh` はテーブルを動的に列挙するため、**新しいテーブルを追加したら除外リストに入れるかどうかを必ず判断すること**。除外リストは両ファイルにあり、片方だけ直すと機能しない。

### 5. ユーザー名列は自分のアカウントに書き換わる

`m_user` を移行しない結果、本番データ中の担当者名がステージングの `m_user` に存在しなくなります。そこで `04-post-migration.sql` が以下を書き換えます。

| 列                                                                  | 扱い                                                                                                                                        |
| ------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| `add_user` / `upd_user`（全テーブル）                               | → 対象ユーザーの `user_nam`                                                                                                                 |
| `nyuryoku_user`（`t_juchu_head` / `t_mitu_head` / `t_seikyu_head`） | → 同上。**機能上必須**（受注・見積一覧の担当者絞り込みは `m_user.user_nam` を選択肢にし完全一致で絞るため、存在しない名前だと絞り込めない） |
| `kokyaku_tanto_nam`                                                 | そのまま（顧客側の担当者で自社ユーザーではない）                                                                                            |
| `t_weekly.tanto_nam`                                                | そのまま（スケジュール画面「日直」の自由入力）                                                                                              |
| `m_kokyaku.mail` / `m_koenbasho.mail`                               | そのまま（顧客・会場の連絡先）                                                                                                              |

`NULL` は `NULL` のまま残します。書き換え先は `04-post-migration.sql` 冒頭の `mail_adr = '...'` を自分のアドレスに変えてください（既定は `y.yoneyama@refact.co.jp`）。**ステージングの `m_user` に該当行が無ければ例外で中断**します。

### 6. 個人情報

本番の `m_kokyaku`（顧客名・担当者名・連絡先）がそのままステージングに入ります。ステージングは現在 `public` の全テーブルでRLSが無効なため、anonキーがあればREST経由で読める状態です。移行の可否は毎回判断してください。

## 準備

### PostgreSQLクライアント

```bash
cd scripts/db-migration
bash 03-migrate.sh client   # 約315MB。pgclient/ に展開（インストール不要、gitignore済み）
```

既に17系が入っている場合は `PGBIN=/path/to/bin` を環境変数で渡せば流用できます。

### 接続URLの準備

パスワードをコマンド履歴やプロセス一覧に残さないため、ファイル経由で渡します。`.env.local` から生成できます（本番側はコメントアウトされている行を使い、ポートを5432に置換）。

```bash
cd scripts/db-migration

# ステージング
grep -E '^DATABASE_URL=' ../../.env.local \
  | sed -e 's/^DATABASE_URL=//' -e 's/:6543/:5432/' -e 's/$/?sslmode=require/' > .stg_url

# 本番（.env.local でコメントアウトされている行）
grep -E '^# *DATABASE_URL=' ../../.env.local \
  | sed -e 's/^# *DATABASE_URL=//' -e 's/:6543/:5432/' -e 's/$/?sslmode=require/' > .prod_url

chmod 600 .stg_url .prod_url

# 中身の確認（パスワードは伏せて表示）
sed -E 's#(//[^:]+:)[^@]+@#\1***@#' .stg_url .prod_url
```

`!` などの記号はそのままでも接続できます（実測済み）が、`@` `:` `/` `?` `#` `%` がパスワードに含まれる場合はURLエンコードが必要です。`.stg_url` / `.prod_url` は `.gitignore` 済みです。

## 手順

```bash
cd scripts/db-migration

bash 03-migrate.sh precheck   # 接続先とスキーマ差分の確認（差分があれば中断される）
bash 03-migrate.sh backup     # ステージングのバックアップ（★必須。既定 ~/db-backup）
bash 03-migrate.sh dump       # 本番からダンプ（SELECTのみ。本番は無変更）
bash 03-migrate.sh restore    # TRUNCATE → 投入 → 後処理（★破壊的。yes入力で続行）
bash 03-migrate.sh verify     # 本番との COUNT(*) 突合
```

`bash 03-migrate.sh all` で一括実行もできます。所要時間は本番103万行規模で**全体5分程度**（ダンプ15秒・投入18秒・後処理50秒）。

バックアップの出力先は `BACKUP_DIR` 環境変数で変更できます。

## 検証

`restore` の最後に `04-post-migration.sql` が以下を出力します。`post.log` で確認してください。

| チェック                   | 期待値                                                      |
| -------------------------- | ----------------------------------------------------------- |
| `orphan_nyuryoku_user`     | **0件**（担当者絞り込みが機能する）                         |
| `v_rfid` の `shozoku_null` | **0に近い**。全件NULLなら `t_rfid_status_result` の投入漏れ |
| `m_master_update`          | **5行**あること                                             |
| `m_user`                   | 自分のアカウントが残っていること                            |
| `negative_zaiko`           | 本番と同数であること（本番データ由来なので0にはならない）   |

`verify` は全テーブルの `COUNT(*)` を本番と比較します。**ダンプ取得後に本番で行われた更新分だけ差が出ます**（受注・見積が動いていれば数行〜数十行）。移行の取りこぼしと区別するには、差分が出たテーブルの `max(add_dat)` / `max(upd_dat)` がダンプ時刻より後かを確認してください。

移行後は画面でも確認します（受注機材明細の在庫数表示、受注一覧・見積一覧の担当者絞り込み、RFIDマスタの所属表示）。

## ロールバック

`backup` が2種類出力しています。

```bash
# データのみ戻す（推奨）
bash 03-migrate.sh client   # クライアントが無ければ
psql "$(cat .stg_url)" -v ON_ERROR_STOP=1 -f 02-truncate-staging.sql
psql "$(cat .stg_url)" -v ON_ERROR_STOP=1 --single-transaction -f ~/db-backup/stg_public_data_<TS>.sql
psql "$(cat .stg_url)" -c 'REFRESH MATERIALIZED VIEW public.v_rfid;'
```

定義ごと戻す場合は `stg_public_full_<TS>.dump` を `pg_restore` で使います。

## トラブルシュート

| 症状                                                                      | 原因と対処                                                                                                                                |
| ------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| `could not translate host name "db.xxx.supabase.co"`                      | ダイレクト接続はDNS解決できない。pooler（`*.pooler.supabase.com:5432`）を使う                                                             |
| `unrecognized configuration parameter "transaction_timeout"`              | PG17のダンプをPG15に投入している。該当 `SET` 行をコメントアウト（`dump` が自動処理する）                                                  |
| `server version mismatch` / `aborting because of server version mismatch` | クライアントが古い。`bash 03-migrate.sh client` で17系を用意                                                                              |
| プリペアドステートメント関連のエラー、`-f` が途中で止まる                 | ポート6543（Transaction pooler）に繋いでいる。5432にする                                                                                  |
| `invalid byte sequence for encoding "UTF8"`                               | Git Bashから `psql -c` に日本語リテラルを渡すと文字化けする。SQLはファイルにしてUTF-8で保存し `-f` で渡す                                 |
| `ANALYZE` で `only superuser can analyze it` の警告が大量に出る           | Supabaseの `postgres` ロールはスーパーユーザーではないためシステムカタログをスキップしている。`public` の統計は更新されているので**無害** |
| `m_user に ... が見つかりません` で中断                                   | `04-post-migration.sql` の `mail_adr` を、ステージングの `m_user` に存在する自分のアドレスに変更する                                      |

## ファイル

| ファイル                  | 内容                                                                                   |
| ------------------------- | -------------------------------------------------------------------------------------- |
| `01-precheck.sql`         | 構成情報の出力（バージョン・テーブル・カラム・ビュー・シーケンス・FK・トリガー・行数） |
| `02-truncate-staging.sql` | ステージングのテーブルをTRUNCATE（除外4テーブルは保持）                                |
| `03-migrate.sh`           | 全工程のドライバ                                                                       |
| `04-post-migration.sql`   | ユーザー名書き換え → `v_rfid` リフレッシュ → `ANALYZE` → 検証                          |
