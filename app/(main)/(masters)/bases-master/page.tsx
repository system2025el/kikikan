import { Typography } from '@mui/material';
import { redirect } from 'next/navigation';

import { getCurrentUser } from '../../_lib/funcs';
import { permission } from '../../_lib/permission';
import { BasesMaster } from './_ui/bases-master';

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
  return <BasesMaster user={user} />;
};

export default Page;
