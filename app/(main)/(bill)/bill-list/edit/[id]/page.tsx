import { Typography } from '@mui/material';
import { Metadata } from 'next';
import { redirect } from 'next/navigation';

import { getCurrentUser } from '@/app/(main)/_lib/funcs';
import { permission } from '@/app/(main)/_lib/permission';
import { getUsersSelection } from '@/app/(main)/quotation-list/_lib/funcs';

import { getChosenBill } from '../../_lib/funcs';
import { BillHeadValues } from '../../_lib/types';
import { Bill } from '../../_ui/bill';

export const metadata: Metadata = {
  title: '請求',
  description: '請求(編集)ページです',
};

const Page = async ({ params }: { params: Promise<{ id: string }> }) => {
  const param = await params;
  const billId = Number(param.id);

  const user = await getCurrentUser();
  if (!user) {
    await redirect('/login');
    return;
  }

  const hasPermission = !!(user.permission.juchu & permission.juchu_ref);

  if (!hasPermission) {
    return <Typography>このページを閲覧する権限がありません。</Typography>;
  }

  const data = await getChosenBill(billId);
  const bill: BillHeadValues = data;

  return <Bill user={user} isNew={false} bill={bill} />;
};

export default Page;
