import { Typography } from '@mui/material';
import { Metadata } from 'next';
import { redirect } from 'next/navigation';

import { getCurrentUser } from '../../_lib/funcs';
import { permission } from '../../_lib/permission';
import { getFilteredDaibumons } from './_lib/funcs';
import { DaibumonsMaster } from './_ui/daibumons-master';

export const metadata: Metadata = {
  title: '大部門マスタ',
  description: '大部門マスタページです',
};

const Page = async () => {
  const user = await getCurrentUser();
  if (!user) {
    await redirect('/login');
    return;
  }

  const hasPermission = !!(user.permission.masters & permission.mst_ref);

  if (!hasPermission) {
    return <Typography>このページを閲覧する権限がありません。</Typography>;
  }
  return <DaibumonsMaster user={user} />;
};

export default Page;
