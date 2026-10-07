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

**技術スタック**: Next.js 15（App Router）/ React 19 / TypeScript / MUI v6。UIライブラリはMUIに統一しているが、**日付ピッカーだけ rsuite** を使っている（`app/(main)/_ui/date.tsx` と、そのロケール設定のための `layout.tsx` の `CustomProvider` のみ。他では使わない）。PDF生成は `pdf-lib` + `@pdf-lib/fontkit`、Excel入出力は `xlsx`。**`xlsx` は npm レジストリではなく SheetJS のCDN tarball から入れている**（`package.json` のURL指定）ので、オフライン環境やレジストリをミラーしている環境では `npm ci` が失敗する。

**ルーティング**: `app/` 配下の Next.js App Router。`app/(main)/` が認証済みユーザー向けのアプリ本体で、`login`・`signup` は認証不要のトップレベルルート。`auth/callback` は Supabase の認証コールバック用 Route Handler（後述のとおりここだけ例外的にRoute Handlerを使う）。`app/test` は動作確認用の置き場で本番導線からは辿れない。

`(main)` の中では、関連するページを整理目的のみでルートグループ（括弧付きフォルダ）にまとめている。例：`(masters)` は `*-master` 系のCRUDページ、`(bill)` は請求関連ページ、`(eq-order-detail)` は受注明細（機材）のメイン・返却・キープ3画面。ルートグループはURLには影響しない。

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
  - **`types.ts` には手書きで追加したブロックがある**（CLI未ログインのため）。いずれも生成物と同じ形式に揃えてあり型チェック・ビルドは通るが、**次に誰かがCLIで再生成できる状況になったら、まずこのファイルを再生成して差分が出ないことを確認してほしい**。なお冒頭の `public /*dev7*/ :` も手作業で入ったマーカーなので、素朴に再生成すると消える点に注意。
    - 2026-08-27: `t_juchu_tempu`
    - 2026-09-24: `t_ido_den` / `t_ido_result` / `t_ido_ctn_result` の `juchu_head_id`・`juchu_kizai_head_id`、`v_ido_den3_lst`（列の入れ替え）、`v_ido_den3_result`（4列追加）、`v_ido_den2_meisai_lst`（新規ビュー）
    - 2026-09-30: `t_nyushuko_den` の `nyuko_fix_qty`、`v_nyushuko_den` / `v_nyushuko_den2` の `nyuko_fix_sts`・`shuko_fix_sts`
- `app/_lib/db/storage/*.ts` — Supabase Storage へのアクセス層。**このファイル群には `'use server'` を付けない**（付けるとexportが外部から直接叩けるServer Actionsになり、任意のパスに対しservice_role権限の署名付きURLを発行できてしまう）。呼び出しは必ず権限チェックを行う feature 側の `_lib/*-funcs.ts` を経由させる。
- DBのカラムはsnake_case、アプリコードはcamelCase。変換は自動レイヤーがなく、クエリごと（SQLのエイリアス指定や手動マッピング）に行っている。

**Supabase Storage（受注添付ファイル）**: バケット `juchu-tempu` に受注ヘッダー単位でPDFを置く（`t_juchu_tempu`、UIは受注画面）。Storageを使っているのは現状ここだけ。

- **バケットはprivate、`storage.objects` のRLSポリシーは1本も作らない**。anon/authenticated からの直アクセスは全拒否されるのが正しい状態で、ポリシーを足すとむしろ穴になる。読み書きはどちらも service_role が発行する署名付きURL経由で行う。
- **アップロードはServer Actionで `createSignedUploadUrl()` を発行し、ブラウザから直接PUTする**（`uploadToSignedUrl`）。Server Actionにファイル本体を載せるとVercelのリクエストボディ上限4.5MBに引っかかるため。この経路のためだけに `supabase-client.ts` のブラウザクライアントを使っている（`middleware.ts` が認証cookieを `httpOnly` で書いているのでブラウザ側はanonだが、署名トークンで認可されるので問題ない）。
- **表示用の署名付きURLに `download` オプションを付けないこと**。Storage側がファイル名を二重にURLエンコードし、日本語ファイル名が壊れる。付けなければ `Content-Disposition` が付かずブラウザ内でinline表示される。ダウンロードは画面側で `fetch` → blob → `a[download]` で行う。
- オブジェクトキーは `{juchu_head_id}/{uuid}.pdf`。**Storageのオブジェクト名に日本語は使えない**ため、原本ファイル名は `t_juchu_tempu.file_nam` に持つ。
- 削除は `del_flg = 1` に更新してから実体を消す。順序を逆にすると「一覧に行があるが実体が無い」状態が残る。DB登録前の失敗で生じる孤児オブジェクトの棚卸しSQLは [`scripts/db-tables/README.md`](scripts/db-tables/README.md) にある。
- **サイズ上限は3段構え**で、実際の天井は一番小さいもの。① プロジェクト全体の Global file size limit（Storage設定。既定50MB、Freeプランは50MBが天井、Pro以上は最大500GB）② バケットの `file_size_limit`（現在20MB。①を超える値は設定できない）③ アップロード方式（標準アップロードは5GBまでだが、**6MB超は resumable/TUS が推奨**）。上限を上げるならバケット設定と `JUCHU_TEMPU.maxSize` の両方を変える。6MB超のPDFが日常的に上がるようになったら、進捗表示とリトライのために `tus-js-client` への切り替えを検討する（標準アップロードは進捗が出せず、失敗時は最初からやり直しになる）。

**DB層のエラーハンドリング（2層構造）**: `tables/*.ts`（DB直接アクセス）と `_lib/funcs.ts`（呼び出し元のビジネスロジック）は役割が分かれている。

- `tables/*.ts` の各関数は必ずtry/catchで囲み、`throw new Error('[関数名] DBエラー:', { cause: e })` という形式で例外を投げる（角括弧内は関数自身の名前と一致させる）。この層ではSupabaseの `{data, error}` はチェックせずそのまま返す。
- エラーチェックは1つ上の `funcs.ts` 層の責務。`if (error) throw new Error('[呼び出し元の関数名] DBエラー:', { cause: error })` という形でSupabaseの `error` を手動チェックしてから `data` を使う。
- `funcs.ts` 層は共通のcatch-log-rethrowパターンを使う：`e instanceof Error` かを見て `[ERROR]` メッセージと（あれば）`[CAUSE]` を `console.error` してからrethrowする。
- 命名で層を判別できる：`tables/*.ts` は `select*`/`insert*`/`update*`/`delete*`/`upsert*`/`check*`（get/fetchは使わない）、`funcs.ts` は逆に `get*` が使われる。
- pgでの書き込みは `BEGIN` → 処理 → `updateMasterUpdates()` → `COMMIT`（catchで`ROLLBACK`、finallyで`connection.release()`）というトランザクションパターンを使う。`updateMasterUpdates` はマスタ更新のたびに呼ぶ。

**認証・権限**: 認証は `@supabase/ssr` によるcookieベースのサーバーサイド認証。クライアント側にセッションを保持する仕組み（`localStorage` やZustandストア）は使っていない。

- **ルートの保護は `middleware.ts`**（ルート直下）。全リクエストで `supabase.auth.getUser()` を呼んでトークンを検証・リフレッシュし、未ログインなら `/login` にリダイレクトする。公開パスは `/`・`/login`・`/error` のみで、`signup`・`auth`・静的ファイルは matcher 側で除外している。招待直後（`user_metadata.setup_completed === false`）は `/signup` へ、ログイン済みで `/login` を開いたら `/dashboard` へ飛ばす。リダイレクト時もリフレッシュ済みcookieを引き継ぐ実装になっているので、この関数を触るときは `redirectWithCookies` を経由すること。
- **ユーザー情報の受け渡し**: `app/(main)/layout.tsx` が `getCurrentUser()`（`app/(main)/_lib/funcs.ts`）でユーザーを解決し、`UserProvider`（`app/(main)/_ui/user-context.tsx`）で配下に渡す。クライアントコンポーネントは `useUser()` で参照する。`getCurrentUser` は Supabase authユーザーのメールアドレスで `m_user` を引き、ビットマスク権限を含む `User` 型を返す（`react`の`cache`でリクエスト単位にメモ化）。**`getCurrentUser` 自身はリダイレクトせず `null` を返す**ので、`/login` へ飛ばすのは呼び出し側の責務（`layout.tsx` は `null` と例外の両方で `redirect('/login')` する）。
- Server Component 側では `getCurrentUser()` を直接呼んでチェックしているページもある（受注機材明細など）。`(main)` 配下の新規ページで権限判定が必要なら、propsで受け取るか `getCurrentUser()` を呼ぶ。
- `app/(main)/_ui/userstoreInitializer.tsx` はページ遷移のたびに `router.refresh()` して最新のユーザー情報（権限変更など）を反映する。DBへの問い合わせすぎを防ぐため60秒間引きしている。
- 権限は `app/(main)/_lib/permission.ts` のビットマスクとビットAND演算で判定する。`User.permission` は `juchu`・`nyushuko`・`masters`・`loginSetting`・`ht`・`schedule` の6カテゴリに分かれた数値で、定数側は `juchu_ref: 1`／`juchu_upd: 2`／`nyushuko_*: 4,8`／`mst_*: 16,32`／`ht: 64`／`login: 128`／`sche_upd: 256`／`system: 65535`。`*_full` の定数は `*_ref` と `*_upd` のビットOR。

**排他ロック**: `app/(main)/_lib/lock.ts` は、`t-lock` テーブルを使った編集画面向けの排他制御（悲観的ロック）を実装している（受注・見積の明細画面など）。`lockCheck` は10分間有効なロックを新規作成/更新するか、他ユーザーが保持中であれば既存ロック情報を返す。`lockRelease` はロックを解除する。複数ユーザーが同時に開き得る編集画面を新規追加する際は、この仕組みを使うこと。

**画面遷移と未保存ガード（`DirtyProvider`）**: `app/(main)/_ui/dirty-context.tsx` が `(main)` 全体を包んでいる。編集画面は `useDirty()` の `setIsDirty(true)` で「未保存あり」を立て、**遷移は `router.push` / `router.back` ではなく `requestNavigation(path)` / `requestBack()` を使う**（未保存なら「入力内容を破棄しますか？」の確認ダイアログを挟む）。20以上の画面がこの仕組みに乗っているので、新しい編集画面でも揃えること。

- **ログアウトもこのProvider経由**（`requestNavigation('/login')`）。ログアウト時は `BroadcastChannel` で他タブにも伝播し、全タブがログイン画面へ飛ぶ。
- ブラウザの「閉じる・リロード」に対する警告は別で、`app/(main)/_lib/hook.ts` の `useUnsavedChangesWarning(isDirty)` を使う。
- 同ファイルの `useStableCallback` は、`React.memo` した子に渡すコールバックの参照を固定しつつ常に最新のクロージャを実行するためのもの。行数の多い明細テーブルで使っている。

**複数タブ前提の画面構成**: 一覧から詳細へは**別タブで開く**のが基本で、`app/(main)/_lib/tab-focus.ts` の `openOrFocusTab()` を使う（28ファイルが利用）。同じURLを既に開いているタブがあれば新規に開かず、`BroadcastChannel` のping/pongでそのタブに `window.focus()` させる（ブラウザの制限で切り替わらない場合は「既に別タブで開いています」のSnackbarを出す）。`eq-*-order-detail` 系は末尾の編集/閲覧モードのsegmentを無視して同一画面と判定する。

`BroadcastChannel` は現在3チャンネル使っている。タブをまたぐ状態を新たに足すときはこの作法に合わせること。

| チャンネル     | 用途                                                                                                                                                           |
| -------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `auth-logout`  | ログアウトの全タブ伝播（`dirty-context.tsx`）                                                                                                                  |
| `tab-focus`    | 既存タブの検出とフォーカス（`tab-focus.ts`）                                                                                                                   |
| `nyushuko-fix` | 出発・出発解除を他タブの一覧に反映（`nyushuko-fix-notify.ts`。明細画面は処理後に `window.close()` するので**閉じる前に** `notifyNyushukoFixChanged()` を呼ぶ） |

**入出庫の到着・出発（確定）**: 入出庫明細画面は同じ日時・場所の受注機材ヘッダーを**複数合体して**表示するが、確定（`t_nyushuko_fix`）はヘッダー単位なので「なし／一部／全部」の3状態になる。`app/(main)/_lib/nyushuko-fix-state.ts` の `getNyushukoFixState()` で状態と確定済みヘッダーidを取り、色は `fixStsColors` を使う。失敗理由はServer Actionの戻り値 `NyushukoFixResult`（`nyushuko-fix-error.ts` の `allFixed` / `noneFixed` / `diff` / `other`）で返し、画面側で文言を出し分ける。**他の人が先に到着・出発している可能性があるので、例外ではなく理由付きの結果を返すこと。**

**検索条件の文字列エスケープ**: PostgREST の `.like()` / `.ilike()` / `.or()` にユーザー入力を渡すときは、`app/(main)/_lib/escape-string.ts` を必ず通す（17ファイルが利用）。`escapeLikeString` は `%` `_` `\` をエスケープ、`escapeOrLikeString` はさらに `.or()` のダブルクォートを閉じてしまわないよう2段階でエスケープする。素通しすると検索が壊れるだけでなく、`.or()` ではフィルタ式を注入できてしまう。

**行数の多い明細画面はクライアント取得**: 受注明細（機材）と移動明細は、ヘッダー情報だけ `page.tsx` のServer Componentで取り、**明細リスト（100行を超える）は `useEffect` でクライアントから取得している**。SSRで全部取ると一覧からの遷移が目に見えて遅くなるための意図的な選択で、SSRに寄せ直さないこと。

**API RouteではなくServer Actionsを使用**: ビジネスロジックのファイルは `'use server'` を付与し、`app/api` のRoute Handlerを経由せず、クライアントコンポーネントから直接 Server Actions として呼び出している。**例外は `app/auth/callback/route.ts` だけ**で、Supabaseの認証コールバックはURLでリダイレクトされてくるためRoute Handlerでなければ受けられない。

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

## DB変更（DDL・ビュー・関数・データ）

手でDBに流した変更は、対象の種類ごとに `scripts/` 直下の4フォルダに残す。**入口は [`scripts/README.md`](scripts/README.md)** で、共通の運用ルール・適用手順・**フォルダをまたぐ適用順序**はそこに集約してある。

| 対象                           | 置き場所                                                  |
| ------------------------------ | --------------------------------------------------------- |
| テーブル定義・Storageバケット  | [`scripts/db-tables/`](scripts/db-tables/README.md)       |
| ビュー定義                     | [`scripts/db-views/`](scripts/db-views/README.md)         |
| 関数（RPC）                    | [`scripts/db-functions/`](scripts/db-functions/README.md) |
| データ（INSERT/UPDATE/DELETE） | [`scripts/db-data/`](scripts/db-data/README.md)           |

どのフォルダも `applied/`（本番適用済み）と `staging-only/`（本番未適用）で適用状況を表し、本番に適用したら `git mv` で移して各ファイル1行目の `-- 適用状況:` を更新する。`db-views/` だけ `<view>.sql`（1ビュー1ファイルで変更を累積）、他は `YYYYMMDD-対象.sql`。

**新テーブルでは `GRANT` を必ず書くこと**（ステージングには `public` スキーマの default privileges が無く `CREATE TABLE` だけでは 42501 になる。本番には default privileges があるが anon には SELECT しか付かない）。**RLSを有効化しないこと**（既存テーブルはすべて `relrowsecurity = false`）。適用は「DB → 型再生成 → コードデプロイ」の順。ただし**列を削るときや別名にするときはコードが先**。

**関数の中の `row(...)::<テーブル名>` は列の個数と物理順に依存する**ので、テーブルに列を足すときは依存ビューだけでなく `pg_get_functiondef` の全文検索も行うこと（移動の送信RPC3本がこれで壊れた）。

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

- **表示用の日付整形は必ず `app/(main)/_lib/date-conversion.ts` の `toJapan*` 系ヘルパーを経由する。** 表示フォーマットは日付 `YYYY/MM/DD`、日時 `YYYY/MM/DD HH:mm` で統一する。
  - ただし**`Asia/Tokyo` はこのファイル専用ではない**。「今日・明日・今月」といった**検索条件の日付範囲を組み立てる側**（`app/_lib/db/tables/v-juchu-lst.ts`・`v-juchu-kizai-head-lst.ts`・`v-nyushuko-den2.ts`・`v-seikyu-date-lst.ts` など）では `dayjs().tz('Asia/Tokyo')` を直に書いている。日付の境界（`startOf('day')`）がJSTでないと一覧の絞り込みが1日ずれるため、**範囲条件を書くときはタイムゾーン指定を省略しないこと**。
- 一覧テーブルは各featureで `<feature>-table.tsx` として MUI の `Table`/`TableContainer` を直接使って実装する。固定ヘッダーは `<TableContainer sx={{ maxHeight: '86vh' }}><Table stickyHeader size="small" padding="none">` の組み合わせ、ページングは `MuiTablePagination`（`_ui/table-pagination.tsx`）、セルのはみ出し表示は `LightTooltipWithText`（`(masters)/_ui/tables.tsx`）、ヘッダー固定時の高さ維持は末尾の空行（emptyRows）を使う。
  - 共通コンポーネントの `app/(main)/_ui/gridtable.tsx` は**どこからも参照されていない**ので使わないこと。`_ui/table.tsx` も一覧用途では使わない（`SelectTable` だけが受注画面の1箇所で使われている）。
- **色はハードコードせず `app/(main)/_lib/colors.ts` から取る**（20ファイルが参照）。`statusColors`（過剰・不足・済・コンテナ・未保存）、`fixStsColors`（到着・出発の全部済／一部済）、`sagyoKbnColors`（出庫ピッキング・出庫最終確認・入庫カウント・移動。明細/詳細画面のタイトルとテーブルヘッダーの背景に使い、出庫・入庫はハンディアプリと色を合わせている）、`dispColors`、`weeklyColors`。

**ファイル・コンポーネント命名**: 各featureの `_ui/` 内は `<feature>.tsx`（ルートに対応するトップレベルのクライアントコンポーネント）、`<feature>-table.tsx`（一覧テーブル）、`*-dialog.tsx`（モーダル）という命名パターンに揃える。
