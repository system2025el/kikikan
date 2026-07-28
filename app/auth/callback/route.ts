import { EmailOtpType } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

import { createClient } from '@/app/_lib/db/supabase-server';

// オープンリダイレクト対策: 同一オリジンの相対パスであることを確認する
const isSafeNextPath = (value: string) => value.startsWith('/') && !value.startsWith('//') && !value.startsWith('/\\');

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const token_hash = requestUrl.searchParams.get('token_hash');
  const type = requestUrl.searchParams.get('type') as EmailOtpType | null;
  const rawNext = requestUrl.searchParams.get('next');
  const next = rawNext && isSafeNextPath(rawNext) ? rawNext : '/signup';

  const origin = requestUrl.origin;

  if (token_hash && type) {
    try {
      const supabase = await createClient();

      const { error } = await supabase.auth.verifyOtp({
        type,
        token_hash,
      });

      if (error) {
        console.error('VerifyOtp Error:', error.message);
        return NextResponse.redirect(`${origin}/login?error=verify_fail`);
      }

      return NextResponse.redirect(`${origin}${next}`);
    } catch (err) {
      console.error('Unexpected Error:', err);
      return NextResponse.redirect(`${origin}/login?error=unexpected`);
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth_code_error`);
}
