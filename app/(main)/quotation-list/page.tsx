import { Typography } from '@mui/material';
import { Metadata } from 'next';
import { redirect } from 'next/navigation';

import { getCurrentUser } from '../_lib/funcs';
import { permission } from '../_lib/permission';
import { getQuotOptions } from './_lib/funcs';
import { QuotationList } from './_ui/quotation-list';

export const metadata: Metadata = {
  title: '見積一覧',
  description: '見積一覧ページです',
};

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
  // 検索条件の選択肢はサーバー側で取って渡す（画面から取ると Server Action の往復が一覧の取得の前に並ぶため）
  const { users, mituSts, custs } = await getQuotOptions();

  return <QuotationList user={user} options={{ sts: mituSts, custs, nyuryokuUser: users }} />;
};

export default Page;
