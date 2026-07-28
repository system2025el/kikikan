import { Typography } from '@mui/material';
import { Metadata } from 'next';
import { redirect } from 'next/navigation';

import { getCurrentUser } from '@/app/(main)/_lib/funcs';
import { permission } from '@/app/(main)/_lib/permission';

import { getRfidKizaiStsSelection, getShozokuSelection } from '../../_lib/funcs';
import { getEqptNam, getRfidsOfTheKizai } from './_lib/funcs';
import { RfidMaster } from './_ui/rfid-master';

export const metadata: Metadata = {
  title: 'RFIDマスタ',
  description: 'RFIDマスタページです',
};

const Page = async ({ params }: { params: Promise<{ kizaiId: string }> }) => {
  const param = await params;
  const user = await getCurrentUser();
  if (!user) {
    await redirect('/login');
    return;
  }

  const hasPermission = !!(user.permission.masters & permission.mst_ref);

  if (!hasPermission) {
    return <Typography>このページを閲覧する権限がありません。</Typography>;
  }
  return <RfidMaster user={user} kizaiId={Number(param.kizaiId)} />;
};

export default Page;
