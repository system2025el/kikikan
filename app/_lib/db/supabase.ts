import { createClient } from '@supabase/supabase-js';

import { Database } from './types';
/**
 * https://supabase.com/docs/guides/api/using-custom-schemas
 * ----------------------------Supabaseで行い済み
 * -- スキーマの使用権を付与
 * GRANT USAGE ON SCHEMA dev5 TO anon;
 * -- 未来のテーブルまでアクセス許可する
 * ALTER DEFAULT PRIVILEGES IN SCHEMA dev5
  GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO anon;
 *
 * -- テーブルへのアクセス権（読み取りのみ）を付与（例: SELECT）
 * GRANT SELECT ON ALL TABLES IN SCHEMA dev5 TO anon;
 * ---------------------------解除する場合
 * REVOKE USAGE ON SCHEMA dev5 FROM anon;
 * REVOKE SELECT ON ALL TABLES IN SCHEMA dev5 FROM anon;
 * -- 未来のテーブルに許可しない
 * ALTER DEFAULT PRIVILEGES IN SCHEMA dev5
 * REVOKE SELECT, INSERT, UPDATE, DELETE ON TABLES FROM your_user_or_role;
 */

// クライアント側で環境変数を使用する場合は、プレフィックスとして「NEXT_PUBLIC_」が必要。
// NULLの場合があると警告が出るため、末尾に！マークを付けてエラーを回避する
// Create a single supabase client for interacting with your database
export const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_ANON_KEY!, {
  db: { schema: 'dev2' }, //使うスキーマ指定
  auth: {
    autoRefreshToken: false,
    persistSession: false,
    detectSessionInUrl: false,
  },
});

export const SCHEMA = 'dev2';
