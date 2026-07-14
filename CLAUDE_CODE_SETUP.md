# Claude Code 導入ガイド（チームメンバー向け）

このリポジトリでClaude Codeを使い始めるための初期設定手順です。既に導入済みのメンバー（y.yoneyama）が整備した内容をもとにしています。

## 1. Claude Codeのインストール・ログイン

- CLIをインストール: `npm install -g @anthropic-ai/claude-code`（または VSCode拡張をインストール）
- 起動して、自分のAnthropicアカウントでログイン
  - Claude Pro / Max / Team / Enterprise の契約がある場合 → 「Claude account with subscription」
  - Anthropic Consoleで従量課金の場合 → 「Anthropic Console account」

## 2. リポジトリの取得

- `v0.0.0` ブランチをpull（`CLAUDE.md` ・ `.env.example` ・ `.mcp.json` が含まれた状態になっているはずです）
- 通常の作業は `v0.0.0` またはそこから切ったfeatureブランチで行ってください（`main` は本番環境向けのため直接pushしないこと）

## 3. 環境変数の設定

- `.env.example` を `.env.local` にコピーし、実際の値を入力してください
  ```bash
  cp .env.example .env.local
  ```
- 必要な値の入手先:
  - `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` / `SUPABASE_SERVICE_ROLE_KEY` → Supabaseダッシュボード「Project Settings > API」
  - `DATABASE_URL` → Supabaseダッシュボード「Project Settings > Database > Connection string」
  - `SITE_URL` → 任意項目。空欄のままで問題ありません
- ※値の受け渡し方法（パスワードマネージャー共有など）は別途社内ルールを確認してください

## 4. MCP接続の認証（Vercel / Supabase）

このプロジェクトの `.mcp.json` には、VercelとSupabase（ステージング環境、読み取り専用）のMCPサーバー定義が既に含まれています。認証だけ各自で行ってください。

1. **前提条件**: あらかじめVercelチーム・Supabase組織のメンバーとして招待されている必要があります。招待がまだの場合は管理者（y.yoneyama）に依頼してください
2. プロジェクトディレクトリで `claude` を起動
3. `/mcp` と入力
4. 「このプロジェクトのMCPサーバーを信頼しますか」の確認が出たら承認
5. `vercel` → Authenticate → ブラウザでVercelアカウントにログイン
6. `supabase` → Authenticate → ブラウザでSupabaseアカウントにログイン
7. 両方とも「connected」と表示されれば完了

**注意**: SupabaseのMCP接続先は本番ではなくステージング環境（project_ref: `jimqcvyaoddsxbcrsnfs`）かつ読み取り専用（`read_only=true`）に固定されています。この設定は変更しないでください。

## 5. （任意）個人のパーミッション設定

- `.claude/settings.local.json` は各自のローカル環境にのみ存在する設定ファイルで、`.gitignore` 済みのためリポジトリには影響しません
- 最初は無くても動作します。同じ許可プロンプトが繰り返し出て煩わしい場合は、各自で以下のような内容を追加していってください

  ```json
  {
    "permissions": {
      "allow": ["Bash(git status)", "Bash(npm run dev)", "Bash(npm run lint*)"]
    }
  }
  ```

## 6. 動作確認

- `npm run dev` で開発サーバーが起動すること
- `/mcp` でVercel・Supabaseの両方が「connected」と表示されること
- `CLAUDE.md` に目を通し、このリポジトリ特有の設計（DBアクセスの使い分け、権限・ロック機構、コーディング規約など）を把握しておくこと

## 困ったときは

- Claude Codeの一般的な使い方: `/help`
- このリポジトリの構成・規約: `CLAUDE.md` を参照
- MCP接続や環境変数の値についての問い合わせ: y.yoneyama
