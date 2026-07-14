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

## ブランチ運用・デプロイ

- `main` → 本番環境、`v0.0.0` → ステージング環境。Vercelが実際にビルドするのはこの2つのみ：`vercel-ignored-build-step.sh` が `VERCEL_GIT_COMMIT_REF` を見て、`main` または `v#.#.#` 形式（例: v0.0.0）に一致しない場合はビルドをキャンセルする。
- 通常の作業は `v0.0.0` またはそこから切ったfeatureブランチで行い、ステージングで検証してから `main` に反映する。明示的な確認なしに `main` への直接pushやforce pushは行わない。

## アーキテクチャ

**ルーティング**: `app/` 配下の Next.js App Router。`app/(main)/` は認証済みユーザー向けのアプリ本体（`AuthGuard` でラップ）、`login`・`signup` は認証不要のトップレベルルート。`(main)` の中では、関連するページを整理目的のみでルートグループ（括弧付きフォルダ）にまとめている。例：`(masters)` は `*-master` 系のCRUDページ、`(bill)` は請求関連ページ、`(eq-order-detail)` は機材注文明細ページ。ルートグループはURLには影響しない。

**コロケーションの規約**: ほとんどのルートフォルダは、そのfeature専用の `_lib/`（型定義・Server Actions・ビジネスロジック）と `_ui/`（コンポーネント）サブフォルダを持つ。アプリ全体で共有するコードは `app/_lib/` と `app/_ui/`、`(main)` 配下全体で共有するコードは `app/(main)/_lib/` と `app/(main)/_ui/` に置く。

**データアクセス — 同一DBに対する2種類のクライアント**:

- `app/_lib/db/postgres.ts` — 生の `pg` `Pool`（HMRを跨いで生き残るよう `globalForPool` でシングルトン化）。手書きSQL、トランザクション（`PoolClient`）、複雑・大量データのクエリに使用。
- `app/_lib/db/supabase.ts` — Supabase JSクライアント（PostgREST）。シンプルなCRUDと `supabase.auth` に使用。`SCHEMA` 定数（現在は `'public'`）をエクスポートしており、各所で `.schema(SCHEMA)` として利用している。スキーマ名を直書きせずこの定数を切り替えることで、アプリ全体を別のPostgresスキーマ（例：開発用スキーマ）に向けられる。
- `app/_lib/db/supabase-admin.ts` — service-role クライアント。サーバー専用。クライアントコンポーネントに絶対にimportしないこと。
- `app/_lib/db/tables/*.ts` — テーブル/ビューごとにクエリ関数をまとめたファイル（`'use server'`）。ファイル名の接頭辞が種別を表す：`m-*` はマスタテーブル、`t-*` はトランザクションテーブル、`v-*` はビュー。
- `app/_lib/db/types/*.ts` — テーブルごとに手動管理している行の型定義、および Supabase の `Database` 型を自動生成した `types.ts`。`types.ts` は手動編集せず、スキーマ変更時は Supabase CLI で再生成すること。
- DBのカラムはsnake_case、アプリコードはcamelCase。変換は自動レイヤーがなく、クエリごと（SQLのエイリアス指定や手動マッピング）に行っている。

**DB層のエラーハンドリング（2層構造）**: `tables/*.ts`（DB直接アクセス）と `_lib/funcs.ts`（呼び出し元のビジネスロジック）は役割が分かれている。

- `tables/*.ts` の各関数は必ずtry/catchで囲み、`throw new Error('[関数名] DBエラー:', { cause: e })` という形式で例外を投げる（角括弧内は関数自身の名前と一致させる）。この層ではSupabaseの `{data, error}` はチェックせずそのまま返す。
- エラーチェックは1つ上の `funcs.ts` 層の責務。`if (error) throw new Error('[呼び出し元の関数名] DBエラー:', { cause: error })` という形でSupabaseの `error` を手動チェックしてから `data` を使う。
- `funcs.ts` 層は共通のcatch-log-rethrowパターンを使う：`e instanceof Error` かを見て `[ERROR]` メッセージと（あれば）`[CAUSE]` を `console.error` してからrethrowする。
- 命名で層を判別できる：`tables/*.ts` は `select*`/`insert*`/`update*`/`delete*`/`check*`（get/fetchは使わない）、`funcs.ts` は逆に `get*` が使われる。
- pgでの書き込みは `BEGIN` → 処理 → `updateMasterUpdates()` → `COMMIT`（catchで`ROLLBACK`、finallyで`connection.release()`）というトランザクションパターンを使う。`updateMasterUpdates` はマスタ更新のたびに呼ぶ。

**認証・権限**:

- クライアント側で Supabase Auth を使用。ログインユーザー情報と独自のビットマスク権限は Zustand ストア `app/_lib/stores/usestore.ts` にキャッシュされ、`localStorage` の `user-storage` キーに永続化される。
- `app/(main)/_ui/auth-guard.tsx` が `(main)` レイアウトをラップし、hydration完了までレンダーをブロックし、ユーザーが存在しない/Supabaseセッションが無効な場合は `/login` にリダイレクトする。また `SIGNED_OUT` イベントを監視して状態をクリアする。
- `app/(main)/_ui/permission-guard.tsx` は、`app/(main)/_lib/permission.ts` で定義されたビットマスクとのビットAND演算により、カテゴリ（`juchu`、`nyushuko`、`masters`、`loginSetting`、`ht`）単位でページの一部表示を制御する。`*_full` の定数は `*_ref` と `*_upd` のビットOR。

**排他ロック**: `app/(main)/_lib/lock.ts` は、`t-lock` テーブルを使った編集画面向けの排他制御（悲観的ロック）を実装している（受注・見積の明細画面など）。`lockCheck` は10分間有効なロックを新規作成/更新するか、他ユーザーが保持中であれば既存ロック情報を返す。`lockRelease` はロックを解除する。複数ユーザーが同時に開き得る編集画面を新規追加する際は、この仕組みを使うこと。

**API RouteではなくServer Actionsを使用**: ビジネスロジックのファイルは `'use server'` を付与し、`app/api` のRoute Handlerを経由せず、クライアントコンポーネントから直接 Server Actions として呼び出している。

**マテリアライズドビュー**: `postgres.ts` の `refreshVRfid()` は `v_rfid` マテリアライズドビューを手動でリフレッシュする。設計上、エラーは握りつぶしてログ出力のみ行う（リフレッシュ失敗を理由に呼び出し元の更新処理自体を失敗させないため）。RFIDのステータスに影響する書き込みの後に呼び出すこと。

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
