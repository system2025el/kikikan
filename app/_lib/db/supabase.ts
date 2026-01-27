import { type CookieOptions, createServerClient } from '@supabase/ssr';
import { createClient } from '@supabase/supabase-js';

//import { cookies } from 'next/headers';
import { Database } from './types/types';
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
 * 
 * -- 未来のテーブルに許可しない
 * ALTER DEFAULT PRIVILEGES IN SCHEMA dev5
 * REVOKE SELECT, INSERT, UPDATE, DELETE ON TABLES FROM your_user_or_role;
 */

// クライアント側で環境変数を使用する場合は、プレフィックスとして「NEXT_PUBLIC_」が必要。
// NULLの場合があると警告が出るため、末尾に！マークを付けてエラーを回避する
// Create a single supabase client for interacting with your database
export const supabase = createClient<Database>(process.env.SUPABASE_URL!, process.env.SUPABASE_ANON_KEY!, {
  //db: { schema: 'dev2' }, //使うスキーマ指定
  auth: {
    autoRefreshToken: false,
    persistSession: false,
    detectSessionInUrl: false,
  },
});

// export const supabase = createClient<Database>(
//   process.env.NEXT_PUBLIC_SUPABASE_URL!,
//   process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
//   {
//     //db: { schema: 'dev2' }, //使うスキーマ指定
//     auth: {
//       autoRefreshToken: true,
//       persistSession: true,
//       detectSessionInUrl: true,
//     },
//   }
// );

// export const supabase = async () => {
//   const cookieStore = await cookies();

//   // 以前の get/set/remove を個別に書く形式から、
//   // 全体を関数として渡す、よりシンプルな形式へ
//   return createServerClient<Database>(process.env.SUPABASE_URL!, process.env.SUPABASE_ANON_KEY!, {
//     cookies: {
//       getAll() {
//         return cookieStore.getAll();
//       },
//       setAll(cookiesToSet) {
//         try {
//           cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
//         } catch {
//           // Server Component から呼ばれた場合は set ができないため無視してOK
//         }
//       },
//     },
//   });
// };

// お客様テストデータ用
export const SCHEMA = 'public';
export type schema = 'public';

// 開発用
// export const SCHEMA = 'dev7';
// export type schema = 'dev7';

/**
 * 絶対にクライアントで使わないでください。
 */
export const supabaseAdmin = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
// export const supabaseAdmin = createClient(
//   process.env.NEXT_PUBLIC_SUPABASE_URL!,
//   process.env.SUPABASE_SERVICE_ROLE_KEY!
// );
