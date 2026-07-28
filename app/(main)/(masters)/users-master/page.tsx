import { Typography } from '@mui/material';
import { Metadata } from 'next';
import { redirect } from 'next/navigation';

import { getCurrentUser } from '../../_lib/funcs';
import { permission } from '../../_lib/permission';
import { getFilteredUsers } from './_lib/funcs';
import { UsersMaster } from './_ui/users-master';

export const metadata: Metadata = {
  title: '担当者マスタ',
  description: '担当者マスタページです',
};

const Page = async () => {
  const user = await getCurrentUser();
  if (!user) {
    await redirect('/login');
    return;
  }

  const hasPermission = !!(user.permission.loginSetting & permission.login);

  if (!hasPermission) {
    return <Typography>このページを閲覧する権限がありません。</Typography>;
  }
  return <UsersMaster user={user} />;
};

export default Page;
