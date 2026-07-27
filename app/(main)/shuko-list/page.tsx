import { Typography } from '@mui/material';
import { Metadata } from 'next';
import { redirect } from 'next/navigation';

import { toJapanTimeStampString } from '../_lib/date-conversion';
import { getCurrentUser } from '../_lib/funcs';
import { permission } from '../_lib/permission';
import { getShukoList } from './_lib/funcs';
import { ShukoListSearchValues } from './_lib/types';
import { ShukoList } from './_ui/shuko-list';

export const metadata: Metadata = {
  title: '出庫一覧',
  description: '出庫一覧ページです',
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
  return <ShukoList user={user} />;
};
export default Page;
