import { Typography } from '@mui/material';
import { Metadata } from 'next';
import { redirect } from 'next/navigation';

import { getCurrentUser } from '../../_lib/funcs';
import { permission } from '../../_lib/permission';
import { getCustomerSelection } from '../../(masters)/_lib/funcs';
import { getBillingStsSelection } from './_lib/funcs';
import { BillList } from './_ui/bill-list';

export const metadata: Metadata = {
  title: '請求一覧',
  description: '請求一覧ページです',
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
  const [custs, sts] = await Promise.all([getCustomerSelection(), getBillingStsSelection()]);

  return <BillList user={user} options={{ custs, sts }} />;
};

export default Page;
