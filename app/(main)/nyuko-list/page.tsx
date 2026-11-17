import { Typography } from '@mui/material';
import { Metadata } from 'next';
import { redirect } from 'next/navigation';

import { getCurrentUser } from '../_lib/funcs';
import { permission } from '../_lib/permission';
import { getCustomerSelection } from '../(masters)/_lib/funcs';
import { getSectionShortSelections } from '../(masters)/sections-master/_lib/funcs';
import { NyukoList } from './_ui/nyuko-list';

export const metadata: Metadata = {
  title: '入庫一覧',
  description: '入庫一覧ページです',
};

const Page = async () => {
  const user = await getCurrentUser();
  if (!user) {
    await redirect('/login');
    return;
  }

  const hasPermission = !!(user.permission.nyushuko & permission.nyushuko_ref);

  if (!hasPermission) {
    return <Typography>このページを閲覧する権限がありません。</Typography>;
  }
  // 検索条件の選択肢はサーバー側で取って渡す（画面から取ると Server Action の往復が一覧の取得の前に並ぶため）
  const [custs, sect] = await Promise.all([getCustomerSelection(), getSectionShortSelections()]);

  return <NyukoList user={user} options={{ custs, sect }} />;
};
export default Page;
