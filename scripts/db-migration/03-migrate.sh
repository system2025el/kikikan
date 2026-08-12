#!/usr/bin/env bash
# ============================================================
# 本番 → ステージング データ移行スクリプト
# 手順の全体像と前提は同じフォルダの README.md を参照
#
#   bash 03-migrate.sh client     # PostgreSQLクライアント(17)を用意（管理者権限不要）
#   bash 03-migrate.sh precheck   # 両環境の構成差分をチェック
#   bash 03-migrate.sh backup     # ステージングのバックアップ取得（★必須）
#   bash 03-migrate.sh dump       # 本番からデータをダンプ（読み取りのみ）
#   bash 03-migrate.sh restore    # ステージングへ TRUNCATE→投入→後処理
#   bash 03-migrate.sh verify     # 本番との行数突合
#   bash 03-migrate.sh all        # precheck → backup → dump → restore → verify
# ============================================================
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DUMP_FILE="${SCRIPT_DIR}/prod_data.sql"
BACKUP_DIR="${BACKUP_DIR:-${HOME}/db-backup}"

# PostgreSQLクライアント。ステージングは15系・本番は17系なので 17 以上が必要
# （14系のクライアントでは "server version mismatch" でダンプできない）
PG_MAJOR=17
PG_ZIP_VER="17.6-1"
PGBIN="${PGBIN:-${SCRIPT_DIR}/pgclient/pgsql/bin}"

# 移行対象外のテーブル
#   m_user … ステージングのアカウントを維持する（Supabase Authと紐づくため置換しない）
#   t_lock … 編集ロックの残骸
#   t_log  … 移行不要
EXCLUDES=(-T public.m_user -T public.t_lock -T public.t_log)

psql_bin()    { echo "${PGBIN}/psql.exe"; }
pgdump_bin()  { echo "${PGBIN}/pg_dump.exe"; }

url() {
  local f="${SCRIPT_DIR}/.$1_url"
  if [[ ! -f "$f" ]]; then
    echo "ERROR: $f がありません。README.md の「接続URLの準備」を参照してください" >&2
    exit 1
  fi
  cat "$f"
}

need_client() {
  if [[ ! -x "$(psql_bin)" ]]; then
    echo "ERROR: PostgreSQLクライアントが見つかりません: ${PGBIN}" >&2
    echo "       bash $0 client を先に実行してください" >&2
    exit 1
  fi
}

mask() { sed -E 's#(//[^:]+:)[^@]+@#\1***@#'; }

# ------------------------------------------------------------
do_client() {
  if [[ -x "$(psql_bin)" ]]; then
    echo "==> 既に用意されています: $("$(psql_bin)" --version)"
    return
  fi
  local zip="${SCRIPT_DIR}/pg${PG_MAJOR}.zip"
  echo "==> PostgreSQL ${PG_ZIP_VER} クライアントを取得します（約315MB、インストール不要）"
  curl -sS -L -o "$zip" \
    "https://get.enterprisedb.com/postgresql/postgresql-${PG_ZIP_VER}-windows-x64-binaries.zip"
  unzip -q -o "$zip" "pgsql/bin/*" "pgsql/lib/*" "pgsql/share/*" -d "${SCRIPT_DIR}/pgclient"
  rm -f "$zip"
  echo "==> $("$(psql_bin)" --version) / $("$(pgdump_bin)" --version)"
}

# ------------------------------------------------------------
do_precheck() {
  need_client
  echo "==> 接続先の確認"
  for env in prod stg; do
    printf '    %-5s ' "$env"
    url "$env" | mask
    "$(psql_bin)" "$(url "$env")" -tAc \
      "select '      -> ' || current_database() || ' / ' || current_user || ' / port ' || inet_server_port() || ' / ' || current_setting('server_version');"
  done

  echo "==> 構成情報を取得します"
  "$(psql_bin)" "$(url prod)" -v ON_ERROR_STOP=1 -A -F '|' -t \
    -f "${SCRIPT_DIR}/01-precheck.sql" > "${SCRIPT_DIR}/precheck_prod.txt"
  "$(psql_bin)" "$(url stg)" -v ON_ERROR_STOP=1 -A -F '|' -t \
    -f "${SCRIPT_DIR}/01-precheck.sql" > "${SCRIPT_DIR}/precheck_stg.txt"

  echo "==> 構成差分"
  local ng=0
  for kind in tables columns sequences matviews fk_count trigger_count; do
    if diff <(grep "^${kind}|" "${SCRIPT_DIR}/precheck_prod.txt") \
            <(grep "^${kind}|" "${SCRIPT_DIR}/precheck_stg.txt") > /dev/null; then
      echo "    OK   ${kind}"
    else
      echo "    DIFF ${kind}  ← 移行前に解消が必要"
      diff <(grep "^${kind}|" "${SCRIPT_DIR}/precheck_prod.txt") \
           <(grep "^${kind}|" "${SCRIPT_DIR}/precheck_stg.txt") | head -40 || true
      ng=1
    fi
  done
  # views はテスト用ビューの有無で差が出やすく、データ移行には影響しないため参考表示
  if ! diff <(grep "^views|" "${SCRIPT_DIR}/precheck_prod.txt") \
            <(grep "^views|" "${SCRIPT_DIR}/precheck_stg.txt") > /dev/null; then
    echo "    (参考) views に差分あり。データ移行には影響しません"
  fi
  [[ $ng -eq 0 ]] || { echo "ERROR: tables/columns に差分があります。中断します" >&2; exit 1; }
}

# ------------------------------------------------------------
do_backup() {
  need_client
  mkdir -p "$BACKUP_DIR"
  local ts; ts="$(date +%Y%m%d_%H%M)"
  echo "==> ステージングのバックアップを取得します → ${BACKUP_DIR}"
  "$(pgdump_bin)" "$(url stg)" -Fc --schema=public --no-owner --no-privileges \
    -f "${BACKUP_DIR}/stg_public_full_${ts}.dump"
  "$(pgdump_bin)" "$(url stg)" --data-only --schema=public --no-owner --no-privileges \
    -f "${BACKUP_DIR}/stg_public_data_${ts}.sql"
  ls -lh "${BACKUP_DIR}"/stg_public_*_"${ts}".*
  echo "==> バックアップ内のテーブル数: $(grep -c '^COPY public\.' "${BACKUP_DIR}/stg_public_data_${ts}.sql")"
}

# ------------------------------------------------------------
do_dump() {
  need_client
  echo "==> 本番からデータをダンプします（SELECTのみ。本番は無変更）"
  "$(pgdump_bin)" "$(url prod)" \
    --data-only --schema=public --no-owner --no-privileges \
    "${EXCLUDES[@]}" -f "$DUMP_FILE"
  echo "==> 出力: $DUMP_FILE ($(du -h "$DUMP_FILE" | cut -f1))"

  # PG17のpg_dumpが出力する transaction_timeout はPG15では未対応でエラーになる
  if grep -qE '^SET transaction_timeout' "$DUMP_FILE"; then
    sed -i 's/^SET transaction_timeout = 0;$/-- SET transaction_timeout = 0;  -- PG17専用。投入先がPG15系のため無効化/' "$DUMP_FILE"
    echo "==> PG17専用の SET transaction_timeout を無効化しました"
  fi

  echo "==> 除外テーブルの混入チェック"
  if grep -nE '^COPY public\.(m_user|t_lock|t_log) ' "$DUMP_FILE"; then
    echo "ERROR: 除外対象のテーブルがダンプに含まれています" >&2
    exit 1
  fi
  echo "    OK（m_user / t_lock / t_log なし）"
  echo "==> ダンプ内のテーブル数: $(grep -c '^COPY public\.' "$DUMP_FILE")"
}

# ------------------------------------------------------------
do_restore() {
  need_client
  [[ -f "$DUMP_FILE" ]] || { echo "ERROR: $DUMP_FILE がありません。先に dump を実行してください" >&2; exit 1; }

  echo "==> ★ステージングのデータを削除して置き換えます"
  echo "    投入先: $(url stg | mask)"
  echo "    バックアップ: ${BACKUP_DIR}"
  ls -lh "${BACKUP_DIR}" 2>/dev/null | tail -5 || { echo "ERROR: バックアップがありません。backup を先に実行してください" >&2; exit 1; }
  if [[ -t 0 ]]; then
    read -r -p "    続行するには yes と入力: " confirm
    [[ "$confirm" == "yes" ]] || { echo "中止しました"; exit 1; }
  else
    echo "    (非対話実行のため確認をスキップします)"
  fi

  echo "==> [1/3] TRUNCATE"
  "$(psql_bin)" "$(url stg)" -v ON_ERROR_STOP=1 -f "${SCRIPT_DIR}/02-truncate-staging.sql"
  echo "==> [2/3] データ投入（単一トランザクション）"
  "$(psql_bin)" "$(url stg)" -v ON_ERROR_STOP=1 --single-transaction -f "$DUMP_FILE" \
    > "${SCRIPT_DIR}/restore.log" 2>&1
  grep -c '^COPY ' "${SCRIPT_DIR}/restore.log" | sed 's/^/    COPY成功: /'
  echo "==> [3/3] 後処理（ユーザー名書き換え・v_rfidリフレッシュ・ANALYZE・検証）"
  "$(psql_bin)" "$(url stg)" -v ON_ERROR_STOP=1 -f "${SCRIPT_DIR}/04-post-migration.sql" \
    > "${SCRIPT_DIR}/post.log" 2>&1
  grep -E 'NOTICE' "${SCRIPT_DIR}/post.log" | sed 's/.*NOTICE:  /    /' | tail -5
  echo "==> 完了。ログ: restore.log / post.log"
}

# ------------------------------------------------------------
do_verify() {
  need_client
  cat > "${SCRIPT_DIR}/.exactcount.sql" <<'EOF'
SELECT table_name || '|' ||
       (xpath('/row/cnt/text()', query_to_xml(format('select count(*) as cnt from public.%I', table_name), false, true, '')))[1]::text::bigint
FROM information_schema.tables
WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
ORDER BY table_name;
EOF
  echo "==> 全テーブルの COUNT(*) を本番と突合します"
  "$(psql_bin)" "$(url prod)" -tA -f "${SCRIPT_DIR}/.exactcount.sql" > "${SCRIPT_DIR}/cnt_prod.txt"
  "$(psql_bin)" "$(url stg)"  -tA -f "${SCRIPT_DIR}/.exactcount.sql" > "${SCRIPT_DIR}/cnt_stg.txt"
  rm -f "${SCRIPT_DIR}/.exactcount.sql"

  echo "--- 差分（移行対象テーブルのみ）---"
  join -t'|' "${SCRIPT_DIR}/cnt_prod.txt" "${SCRIPT_DIR}/cnt_stg.txt" \
    | awk -F'|' '$1!="m_user" && $1!="t_lock" && $1!="t_log" && $2!=$3 {printf "%-26s prod=%-8s stg=%-8s diff=%s\n",$1,$2,$3,$3-$2}'
  echo "    （差分はダンプ取得後の本番の稼働分。0件なら完全一致）"
  echo "--- 除外テーブル（意図的に不一致）---"
  join -t'|' "${SCRIPT_DIR}/cnt_prod.txt" "${SCRIPT_DIR}/cnt_stg.txt" \
    | awk -F'|' '$1=="m_user"||$1=="t_lock"||$1=="t_log" {printf "%-10s prod=%-8s stg=%s\n",$1,$2,$3}'
}

case "${1:-}" in
  client)   do_client ;;
  precheck) do_precheck ;;
  backup)   do_backup ;;
  dump)     do_dump ;;
  restore)  do_restore ;;
  verify)   do_verify ;;
  all)      do_precheck; do_backup; do_dump; do_restore; do_verify ;;
  *)        echo "usage: bash $0 {client|precheck|backup|dump|restore|verify|all}" >&2; exit 1 ;;
esac
