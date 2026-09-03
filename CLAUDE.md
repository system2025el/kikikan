# CLAUDE.md

このファイルは、このリポジトリで作業する Claude Code (claude.ai/code) 向けのガイドです。

## コマンド

```bash
npm run dev            # 開発サーバー起動 (next dev --turbopack)
npm run build           # 本番ビルド
npm run start            # 本番ビルドの起動

npm run lint            # prettier --check + next lint
npm run fix             # prettier --write + eslint --fix（コミット前に実行推奨）
```

このリポジトリにテストランナーは導入されていません（jest/vitest/playwright等なし）。存在しないテストコマンドを作り出さないこと。

**Windowsでは `npm run lint` / `npm run fix` をリポジトリ全体にかけないこと**（2026-08-27 確認）。`core.autocrlf = true` で作業ツリーがCRLFなのに対しprettierは `endOfLine: lf` を期待するため、**未変更の状態でも462ファイルがチェックに落ちる**。この状態で `npm run fix` を実行すると全ファイルが書き換わり、レビュー不能な差分になる。自分が触ったファイルだけを対象にすること。

```bash
npx prettier --check <触ったファイル...>
npx next lint --file <触ったファイル> --file ...
npx tsc --noEmit          # 型チェックは全体で問題なく通る
```

`npm run build` は**開発サーバーを止めてから**実行する（起動したままだと `.next/trace` の EPERM で失敗し、複数のビルドが `.next` を奪い合うと進行しなくなる）。

## ブランチ運用・デプロイ

- `main` → 本番環境、`v0.0.0` → ステージング環境。Vercelが実際にビルドするのはこの2つのみ：`vercel-ignored-build-step.sh` が `VERCEL_GIT_COMMIT_REF` を見て、`main` または `v#.#.#` 形式（例: v0.0.0）に一致しない場合はビルドをキャンセルする。
- 通常の作業は `v0.0.0` またはそこから切ったfeatureブランチで行い、ステージングで検証してから `main` に反映する。明示的な確認なしに `main` への直接pushやforce pushは行わない。

## アーキテクチャ

**ルーティング**: `app/` 配下の Next.js App Router。`app/(main)/` は認証済みユーザー向けのアプリ本体（`AuthGuard` でラップ）、`login`・`signup` は認証不要のトップレベルルート。`(main)` の中では、関連するページを整理目的のみでルートグループ（括弧付きフォルダ）にまとめている。例：`(masters)` は `*-master` 系のCRUDページ、`(bill)` は請求関連ページ、`(eq-order-detail)` は機材注文明細ページ。ルートグループはURLには影響しない。

**コロケーションの規約**: ほとんどのルートフォルダは、そのfeature専用の `_lib/`（型定義・Server Actions・ビジネスロジック）と `_ui/`（コンポーネント）サブフォルダを持つ。アプリ全体で共有するコードは `app/_lib/` と `app/_ui/`、`(main)` 配下全体で共有するコードは `app/(main)/_lib/` と `app/(main)/_ui/` に置く。

**データアクセス — 同一DBに対する2種類のクライアント**:

- `app/_lib/db/postgres.ts` — 生の `pg` `Pool`（HMRを跨いで生き残るよう `globalForPool` でシングルトン化）。手書きSQL、トランザクション（`PoolClient`）、複雑・大量データのクエリに使用。
- Supabase JSクライアント（PostgREST）はシンプルなCRUDと `supabase.auth` に使用し、実行環境で2ファイルに分かれている。どちらも `createClient()` という同名の関数をexportしているため、importするファイルを間違えないこと。
  - `app/_lib/db/supabase-server.ts` — サーバー用（`createServerClient` + `next/headers` の `cookies`）。`tables/*.ts` などサーバー側は基本これを使う。`await createClient()` と非同期。
  - `app/_lib/db/supabase-client.ts` — ブラウザ用（`createBrowserClient`）。
- `app/_lib/db/schema.ts` — `SCHEMA` 定数（現在は `'public'`）。各所で `.schema(SCHEMA)` や生SQLの `${SCHEMA}.テーブル名` として利用している。スキーマ名を直書きせずこの定数を切り替えることで、アプリ全体を別のPostgresスキーマ（例：開発用スキーマ）に向けられる。
- `app/_lib/db/supabase-admin.ts` — service-role クライアント。サーバー専用。クライアントコンポーネントに絶対にimportしないこと。
- `app/_lib/db/tables/*.ts` — テーブル/ビューごとにクエリ関数をまとめたファイル（`'use server'`）。ファイル名の接頭辞が種別を表す：`m-*` はマスタテーブル、`t-*` はトランザクションテーブル、`v-*` はビュー。
- `app/_lib/db/types/*.ts` — テーブルごとに手動管理している行の型定義、および Supabase の `Database` 型を自動生成した `types.ts`。`types.ts` は手動編集せず、スキーマ変更時は Supabase CLI で再生成すること（`npx supabase login` が必要。未ログインだと再生成できない）。
  - **`types.ts` の `t_juchu_tempu` ブロックだけは手書きで追加されている**（2026-08-27、CLI未ログインのため）。生成物と同じ形式に揃えてあり型チェック・ビルドは通るが、**次に誰かがCLIで再生成できる状況になったら、まずこのファイルを再生成して差分が出ないことを確認してほしい**。なお冒頭の `public /*dev7*/ :` も手作業で入ったマーカーなので、素朴に再生成すると消える点に注意。
- `app/_lib/db/storage/*.ts` — Supabase Storage へのアクセス層。**このファイル群には `'use server'` を付けない**（付けるとexportが外部から直接叩けるServer Actionsになり、任意のパスに対しservice_role権限の署名付きURLを発行できてしまう）。呼び出しは必ず権限チェックを行う feature 側の `_lib/*-funcs.ts` を経由させる。
- DBのカラムはsnake_case、アプリコードはcamelCase。変換は自動レイヤーがなく、クエリごと（SQLのエイリアス指定や手動マッピング）に行っている。

**Supabase Storage（受注添付ファイル）**: バケット `juchu-tempu` に受注ヘッダー単位でPDFを置く（`t_juchu_tempu`、UIは受注画面）。Storageを使っているのは現状ここだけ。

- **バケットはprivate、`storage.objects` のRLSポリシーは1本も作らない**。anon/authenticated からの直アクセスは全拒否されるのが正しい状態で、ポリシーを足すとむしろ穴になる。読み書きはどちらも service_role が発行する署名付きURL経由で行う。
- **アップロードはServer Actionで `createSignedUploadUrl()` を発行し、ブラウザから直接PUTする**（`uploadToSignedUrl`）。Server Actionにファイル本体を載せるとVercelのリクエストボディ上限4.5MBに引っかかるため。この経路のためだけに `supabase-client.ts` のブラウザクライアントを使っている（`middleware.ts` が認証cookieを `httpOnly` で書いているのでブラウザ側はanonだが、署名トークンで認可されるので問題ない）。
- **表示用の署名付きURLに `download` オプションを付けないこと**。Storage側がファイル名を二重にURLエンコードし、日本語ファイル名が壊れる。付けなければ `Content-Disposition` が付かずブラウザ内でinline表示される。ダウンロードは画面側で `fetch` → blob → `a[download]` で行う。
- オブジェクトキーは `{juchu_head_id}/{uuid}.pdf`。**Storageのオブジェクト名に日本語は使えない**ため、原本ファイル名は `t_juchu_tempu.file_nam` に持つ。
- 削除は `del_flg = 1` に更新してから実体を消す。順序を逆にすると「一覧に行があるが実体が無い」状態が残る。DB登録前の失敗で生じる孤児オブジェクトの棚卸しSQLは `scripts/db-migration/ddl/README.md` にある。
- **サイズ上限は3段構え**で、実際の天井は一番小さいもの。① プロジェクト全体の Global file size limit（Storage設定。既定50MB、Freeプランは50MBが天井、Pro以上は最大500GB）② バケットの `file_size_limit`（現在20MB。①を超える値は設定できない）③ アップロード方式（標準アップロードは5GBまでだが、**6MB超は resumable/TUS が推奨**）。上限を上げるならバケット設定と `JUCHU_TEMPU.maxSize` の両方を変える。6MB超のPDFが日常的に上がるようになったら、進捗表示とリトライのために `tus-js-client` への切り替えを検討する（標準アップロードは進捗が出せず、失敗時は最初からやり直しになる）。

**DB層のエラーハンドリング（2層構造）**: `tables/*.ts`（DB直接アクセス）と `_lib/funcs.ts`（呼び出し元のビジネスロジック）は役割が分かれている。

- `tables/*.ts` の各関数は必ずtry/catchで囲み、`throw new Error('[関数名] DBエラー:', { cause: e })` という形式で例外を投げる（角括弧内は関数自身の名前と一致させる）。この層ではSupabaseの `{data, error}` はチェックせずそのまま返す。
- エラーチェックは1つ上の `funcs.ts` 層の責務。`if (error) throw new Error('[呼び出し元の関数名] DBエラー:', { cause: error })` という形でSupabaseの `error` を手動チェックしてから `data` を使う。
- `funcs.ts` 層は共通のcatch-log-rethrowパターンを使う：`e instanceof Error` かを見て `[ERROR]` メッセージと（あれば）`[CAUSE]` を `console.error` してからrethrowする。
- 命名で層を判別できる：`tables/*.ts` は `select*`/`insert*`/`update*`/`delete*`/`check*`（get/fetchは使わない）、`funcs.ts` は逆に `get*` が使われる。
- pgでの書き込みは `BEGIN` → 処理 → `updateMasterUpdates()` → `COMMIT`（catchで`ROLLBACK`、finallyで`connection.release()`）というトランザクションパターンを使う。`updateMasterUpdates` はマスタ更新のたびに呼ぶ。

**認証・権限**: 認証は `@supabase/ssr` によるcookieベースのサーバーサイド認証。クライアント側にセッションを保持する仕組み（`localStorage` やZustandストア）は使っていない。

- **ルートの保護は `middleware.ts`**（ルート直下）。全リクエストで `supabase.auth.getUser()` を呼んでトークンを検証・リフレッシュし、未ログインなら `/login` にリダイレクトする。公開パスは `/`・`/login`・`/error` のみで、`signup`・`auth`・静的ファイルは matcher 側で除外している。招待直後（`user_metadata.setup_completed === false`）は `/signup` へ、ログイン済みで `/login` を開いたら `/dashboard` へ飛ばす。リダイレクト時もリフレッシュ済みcookieを引き継ぐ実装になっているので、この関数を触るときは `redirectWithCookies` を経由すること。
- **ユーザー情報の受け渡し**: `app/(main)/layout.tsx` が `getCurrentUser()`（`app/(main)/_lib/funcs.ts`）でユーザーを解決し、`UserProvider`（`app/(main)/_ui/user-context.tsx`）で配下に渡す。クライアントコンポーネントは `useUser()` で参照する。`getCurrentUser` は Supabase authユーザーのメールアドレスで `m_user` を引き、ビットマスク権限を含む `User` 型を返す（`react`の`cache`でリクエスト単位にメモ化）。取得できなければ `/login` へリダイレクトする。
- Server Component 側では `getCurrentUser()` を直接呼んでチェックしているページもある（受注機材明細など）。`(main)` 配下の新規ページで権限判定が必要なら、propsで受け取るか `getCurrentUser()` を呼ぶ。
- `app/(main)/_ui/userstoreInitializer.tsx` はページ遷移のたびに `router.refresh()` して最新のユーザー情報（権限変更など）を反映する。DBへの問い合わせすぎを防ぐため60秒間引きしている。
- 権限は `app/(main)/_lib/permission.ts` のビットマスクとビットAND演算で判定する。`User.permission` は `juchu`・`nyushuko`・`masters`・`loginSetting`・`ht`・`schedule` の6カテゴリに分かれた数値で、定数側は `juchu_ref: 1`／`juchu_upd: 2`／`nyushuko_*: 4,8`／`mst_*: 16,32`／`ht: 64`／`login: 128`／`sche_upd: 256`／`system: 65535`。`*_full` の定数は `*_ref` と `*_upd` のビットOR。

**排他ロック**: `app/(main)/_lib/lock.ts` は、`t-lock` テーブルを使った編集画面向けの排他制御（悲観的ロック）を実装している（受注・見積の明細画面など）。`lockCheck` は10分間有効なロックを新規作成/更新するか、他ユーザーが保持中であれば既存ロック情報を返す。`lockRelease` はロックを解除する。複数ユーザーが同時に開き得る編集画面を新規追加する際は、この仕組みを使うこと。

**API RouteではなくServer Actionsを使用**: ビジネスロジックのファイルは `'use server'` を付与し、`app/api` のRoute Handlerを経由せず、クライアントコンポーネントから直接 Server Actions として呼び出している。

**マテリアライズドビュー**: `postgres.ts` の `refreshVRfid()` は `v_rfid` マテリアライズドビューを手動でリフレッシュする。設計上、エラーは握りつぶしてログ出力のみ行う（リフレッシュ失敗を理由に呼び出し元の更新処理自体を失敗させないため）。RFIDのステータスに影響する書き込みの後に呼び出すこと。

**`t_juchu_kizai_honbanbi` は「本番日」ではなく使用日カレンダー**: 名前とカラム名（`juchu_honbanbi_dat`、`juchu_honbanbi_shubetu_id`）が「本番日」だが、実体は**受注機材ヘッダー単位の使用日を1日1行で持つカレンダー**であり、仕込み・本番といったイベント日だけのテーブルではない。種別IDは `HONBANBI_SHUBETU_ID`（`app/_lib/constants.ts`）と `m_honbanbi_color` に対応する：`1` 使用中（出庫日〜入庫日の全日）、`2` 出庫日、`3` 入庫日、`10` 仕込み、`20` RH、`30` GP、`40` 本番。

- 機材明細画面の保存時、種別 `1` は `deleteSiyouHonbanbi`（種別1のみDELETE）→ `getRange(出庫日, 入庫日)` の全日を再INSERTという作り直し方式で更新する。種別 `2`/`3` は出庫日・入庫日にupsert、種別 `10`〜`40` は本番日入力ダイアログの差分（追加・更新・削除）で更新する。返却受注機材ヘッダーには「返却日〜親の入庫日」の範囲で種別 `1` が作られる。
- 出庫日・入庫日が未設定だと `getRange` が空配列を返し、種別 `1` の行が1件も作られない（＝在庫を消費しない）点に注意。

**在庫数の算出**: 在庫数は `v_zaiko_qty.zaiko_qty = v_kizai_qty.kizai_qty − v_juchu_kizai_dat_qty.plan_qty` で求まる。機材明細画面や貸出状況の在庫テーブルはこのビューを日付でCROSS JOINして表示している（`app/_lib/db/tables/stock-table.ts`）。

- 分子の保有数 `kizai_qty` は**RFIDタグの実本数**（`v_rfid` で `del_flg = 0` かつ `rfid_kizai_sts < 100` またはNULL。100以上はNG・廃棄・紛失・無効化）。ピッキング中や出発済みなどの作業ステータスは保有数に影響しない。所属（KICS/YARD）別ではなく全体合計。
- 分母の `plan_qty` は `t_juchu_kizai_honbanbi` の日付（種別を問わず `DISTINCT`）に紐づく `plan_kizai_qty + plan_yobi_qty` の全受注合計。上記の通り種別 `1` が期間全日に入るため、**引き当ては出庫日〜入庫日の全日に効く**。同じ日に種別1と種別40があっても `DISTINCT` で1回にまとまり二重計上はされない。コンテナ明細（`t_juchu_ctn_meisai`）もUNION ALLで加算される。
- 除外条件は `t_juchu_head.del_flg = 0` のみで、`juchu_sts`（入力中・受注キャンセル等）は考慮されない。キープヘッダーの `keep_qty` は集計対象外。返却ヘッダーの明細はマイナス数量で保存され、合算により在庫が戻る。
- 該当日に行が無い場合は在庫データではなく保有数をそのまま表示する（`COALESCE(v.zaiko_qty, k.kizai_qty)`）。画面側で編集中の増減は出庫日〜入庫日の範囲だけをローカル補正しており、これはDB側の引き当て範囲と一致している。

## 本番データのステージング移行

本番のデータでステージングを洗い替える手順とスクリプトは `scripts/db-migration/` にある（`README.md` に前提・手順・トラブルシュートをまとめてある）。本番とステージングでPostgreSQLのメジャーバージョンが異なる（本番17系／ステージング15系）、接続はSession pooler（5432）でなければならない、`m_user` は移行せず担当者名を自分のアカウントに書き換える、マスタだけでは`v_rfid`の所属が復元できない、といった罠があるため、手作業で流さずこのスクリプトを使うこと。

**テーブルを追加したら、この移行の除外リストに入れるかを必ず判断すること**。`02-truncate-staging.sql` の `skip_tbl` と `03-migrate.sh` の `EXCLUDES` の**両方**にあり（どちらもテーブルを動的に列挙するため）、片方だけ直しても機能しない。

## スキーマ変更（DDL）

テーブル・Storageバケットの追加変更は `scripts/db-migration/ddl/` に適用SQLとロールバックSQLを残す（[`README.md`](scripts/db-migration/ddl/README.md) に一覧・手順・注意点）。**`GRANT` を必ず書くこと**（ステージングには `public` スキーマの default privileges が無く `CREATE TABLE` だけでは 42501 になる。本番には default privileges があるが anon には SELECT しか付かない）。**新テーブルでRLSを有効化しないこと**（既存テーブルはすべて `relrowsecurity = false`）。適用は「DB → 型再生成 → コードデプロイ」の順。

ビュー定義の変更は `scripts/db-views/` が担当で、`applied/`（本番適用済み）と `staging-only/`（本番未適用）のフォルダで適用状況を表す運用になっている（詳細はそちらの `README.md`）。

## コーディング規約

- import順序は `eslint-plugin-simple-import-sort` により強制される（`import/order` ではない）。`npm run fix` で自動修正可能。
- Prettier設定: シングルクォート、セミコロンあり、printWidth 120、ES5準拠のtrailing comma。

**フォーム・バリデーション（masters系CRUDページ）**:

- Zodスキーマは `_lib/types.ts` に `{Entity}MasterDialogSchema` として定義し、推論した型を `{Entity}MasterDialogValues` として export する。
- 共通バリデーションメッセージは `app/(main)/_lib/validation-messages.ts`（必須・文字数・数値等）を使う。業務固有のメッセージのみインラインで書く。
- フォームは `react-hook-form-mui` で `useForm({ mode: 'onChange', reValidateMode: 'onChange', resolver: zodResolver(...) })` という設定にする。単純な入力は `TextFieldElement`/`SelectElement`/`CheckboxElement` を使い、FKドロップダウン（未選択の扱いが必要）や数値変換など特殊な挙動が要る場合は `Controller` + 素のMUIコンポーネントを使う。
- フィールドのレイアウトは共通の `FormBox`（`app/(main)/_ui/form-box.tsx`）を使う。
- 新規作成・未選択を表す特殊値として `FAKE_NEW_ID`（`(masters)/_lib/constants.ts`、値は `-100`）を使い、`fakeToNull`/`nullToFake`（`(masters)/_lib/value-converters.ts`）でDBの`null`と相互変換する。
- 一覧ページ（`_ui/{entity}-master.tsx`）+単一ダイアログ（`_ui/{entity}-master-dialog.tsx`）という構成にし、作成・更新は同じフォームで扱う（渡されたIDが `FAKE_NEW_ID` かどうかで分岐）。

**日付・一覧テーブル**:

- 日付処理は必ず `app/(main)/_lib/date-conversion.ts` の `toJapan*` 系ヘルパーを経由する（タイムゾーン `Asia/Tokyo` の指定はこのファイルにのみ存在する）。表示フォーマットは日付 `YYYY/MM/DD`、日時 `YYYY/MM/DD HH:mm` で統一する。
- 一覧テーブルは `app/(main)/_ui/table.tsx`・`gridtable.tsx` ではなく（実質未使用のため使わないこと）、各featureで `<feature>-table.tsx` として MUI の `Table`/`TableContainer` を直接使って実装する。固定ヘッダーは `<TableContainer sx={{ maxHeight: '86vh' }}><Table stickyHeader size="small" padding="none">` の組み合わせ、ページングは `MuiTablePagination`（`_ui/table-pagination.tsx`）、セルのはみ出し表示は `LightTooltipWithText`（`(masters)/_ui/tables.tsx`）、ヘッダー固定時の高さ維持は末尾の空行（emptyRows）を使う。

**ファイル・コンポーネント命名**: 各featureの `_ui/` 内は `<feature>.tsx`（ルートに対応するトップレベルのクライアントコンポーネント）、`<feature>-table.tsx`（一覧テーブル）、`*-dialog.tsx`（モーダル）という命名パターンに揃える。
