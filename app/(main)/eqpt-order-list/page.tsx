import { Typography } from '@mui/material';
import { Metadata } from 'next';
import { redirect } from 'next/navigation';

import { getCurrentUser } from '../_lib/funcs';
import { permission } from '../_lib/permission';
import { EqptOrderList } from './_ui/eqpt-order-list';

export const metadata: Metadata = {
  title: '受注明細一覧',
  description: '受注明細一覧ページです',
};

/**
 * 受注一覧画面
 * @returns 受注一覧画面
 */
const Page = async () => {
  const user = await getCurrentUser();
  if (!user) {
    await redirect('/login');
    return;
  }

  const hasPermission = !!(user.permission.juchu & permission.juchu_ref);

  if (!hasPermission) {
    return <Typography>このページを閲覧する権限がありません。</Typography>;
  }
  return <EqptOrderList />;
};

export default Page;
