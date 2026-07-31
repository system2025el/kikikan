import { type CookieOptions, createServerClient } from '@supabase/ssr';
import { type NextRequest, NextResponse } from 'next/server';

export const middleware = async (request: NextRequest) => {
  let response = NextResponse.next({ request });

  // サーバー用クライアントの初期化
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, {
              ...options,
              httpOnly: true,
            })
          );
        },
      },
    }
  );

  // セッションの有効性を確認 (getUser はトークンの検証とリフレッシュを行います)
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // 保護されたルートへのアクセス制御
  // ログインが不要なパス
  const publicPaths = ['/', '/login', '/error'];
  const isPublicPath = publicPaths.some(
    (path) => request.nextUrl.pathname === path || request.nextUrl.pathname.startsWith(`${path}/`)
  );

  // リダイレクト用レスポンスにも、setAll でリフレッシュされた cookie を引き継ぐ
  const redirectWithCookies = (url: string | URL) => {
    const redirectResponse = NextResponse.redirect(new URL(url, request.url));
    response.cookies.getAll().forEach((cookie) => redirectResponse.cookies.set(cookie));
    return redirectResponse;
  };

  // 2. ログイン済みユーザーの「パスワード未設定」チェック
  if (user && user.user_metadata?.setup_completed === false) {
    // 招待直後のユーザー（false）は、公開ページ以外のどこへ行こうとしても /signup へ飛ばす
    return redirectWithCookies('/signup');
  }

  // ログインしておらず、かつ「公開ページではない」場合にリダイレクト
  if (!user && !isPublicPath) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    return redirectWithCookies(url);
  }

  // すでにログインしているのに、ログイン画面を開こうとしたらトップへ戻す
  if (user && request.nextUrl.pathname === '/login') {
    return redirectWithCookies('/dashboard');
  }

  return response;
};

// 5. ミドルウェアを適用する範囲の設定
export const config = {
  matcher: [
    /*
     * 下記のパス以外のすべてにマッチさせる:
     * - _next/static (静的ファイル)
     * - _next/image (画像最適化ファイル)
     * - favicon.ico (ファビコン)
     * - 公開フォルダ内の画像 (svg, png, jpg, etc)
     */
    '/((?!_next/static|_next/image|favicon.ico|signup|auth|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
