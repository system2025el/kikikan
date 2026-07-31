import { Typography } from '@mui/material';
import { Metadata } from 'next';
import { redirect } from 'next/navigation';

import { getCurrentUser } from '../../_lib/funcs';
import { permission } from '../../_lib/permission';
import { getFilteredLocs } from './_lib/funcs';
import { LocationsMaster } from './_ui/locations-master';

export const metadata: Metadata = {
  title: '公演場所マスタ',
  description: '公演場所マスタページです',
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
  return <LocationsMaster user={user} />;
};

export default Page;
