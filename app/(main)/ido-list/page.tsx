import { Typography } from '@mui/material';
import { Metadata } from 'next';
import { redirect } from 'next/navigation';

import { toJapanYMDString } from '../_lib/date-conversion';
import { getCurrentUser } from '../_lib/funcs';
import { permission } from '../_lib/permission';
import { getIdoList } from './_lib/funcs';
import { IdoTableValues } from './_lib/types';
import { IdoList } from './_ui/ido-list';

export const metadata: Metadata = {
  title: '移動一覧',
  description: '移動一覧ページです',
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
  return <IdoList />;
};
export default Page;
