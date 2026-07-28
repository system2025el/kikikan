import { Typography } from '@mui/material';
import { Metadata } from 'next';
import { redirect } from 'next/navigation';

import { getCurrentUser } from '../../_lib/funcs';
import { permission } from '../../_lib/permission';
import { getFilteredEqpts } from './_lib/funcs';
import { EqptMaster } from './_ui/eqpt-master';

export const metadata: Metadata = {
  title: '機材マスタ',
  description: '機材マスタページです',
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
  return <EqptMaster user={user} />;
};
export default Page;
