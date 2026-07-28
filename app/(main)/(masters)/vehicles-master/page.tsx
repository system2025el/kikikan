import { Typography } from '@mui/material';
import { Metadata } from 'next';
import { redirect } from 'next/navigation';

import { getCurrentUser } from '../../_lib/funcs';
import { permission } from '../../_lib/permission';
import { getFilteredVehs } from './_lib/funcs';
import { VehiclesMaster } from './_ui/vehicles-master';
// import { shiori } from '@/app/_lib/postgres/funcs';

export const metadata: Metadata = {
  title: '車両マスタ',
  description: '車両マスタページです',
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
  return <VehiclesMaster user={user} />;
};
export default Page;
