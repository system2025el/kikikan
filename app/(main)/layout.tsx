//import '/globals.css';

import 'rsuite/dist/rsuite-no-reset.min.css';

import { AppRouterCacheProvider } from '@mui/material-nextjs/v15-appRouter';
import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import React from 'react';
import { CustomProvider } from 'rsuite';
import { jaJP } from 'rsuite/esm/locales';

import { notoSansJp } from '@/app/_ui/fonts';
import ThemeProvider from '@/app/_ui/theme-provider';

import { getCurrentUser } from './_lib/funcs';
import { DirtyProvider } from './_ui/dirty-context';
import Sidebar from './_ui/sidebar';
import { UserProvider } from './_ui/user-context';
import { UserStoreInitializer } from './_ui/userstoreInitializer';

// /** @type {Metadata} metadata */
// export const metadata: Metadata = {
//   //title: '機材管理',
//   title: {
//     template: '機材管理 - %s',
//     default: '機材管理',
//   },
//   description: '',
// };

/**
 * Layout
 * @param {React.ReactNode} children
 * @returns
 */
const Layout = async ({ children }: Readonly<{ children: React.ReactNode }>) => {
  // // 1. サーバーサイドでセッション確認
  // const supabase = await createClient();
  // const {
  //   data: { user },
  // } = await supabase.auth.getUser();

  // // Middlewareでもガードしていますが、念のためここでもチェック
  // if (!user) {
  //   redirect('/login');
  // }

  // // 2. DBから最新のユーザ情報を取得
  // const data = await getChosenUser(user.email!);

  // if (!data) {
  //   redirect('/login');
  // }

  // const userData: User = {
  //   id: FAKE_NEW_ID,
  //   name: data.tantouNam,
  //   email: data.mailAdr,
  //   permission: data.permission,
  // };

  const userData = await getCurrentUser().catch((e) => {
    // DB接続エラー等でユーザー情報が取得できない場合も、素のエラー画面ではなくログイン画面へ逃がす
    console.error('[Layout] getCurrentUser failed:', e);
    redirect('/login');
  });

  if (!userData) {
    redirect('/login');
  }
  /* jsx
  ---------------------------------------------------------------------------------------------------- */
  return (
    // <AuthGuard>
    <CustomProvider locale={jaJP}>
      <DirtyProvider>
        <UserStoreInitializer /*user={userData}*/ />
        <UserProvider user={userData}>
          <Sidebar user={userData}>{children}</Sidebar>
        </UserProvider>
      </DirtyProvider>
    </CustomProvider>
    // </AuthGuard>
  );
};
export default Layout;
