import { Typography } from '@mui/material';
import { Metadata } from 'next';
import { redirect } from 'next/navigation';

import { getCurrentUser } from '@/app/(main)/_lib/funcs';
import { permission } from '@/app/(main)/_lib/permission';

import { getBillOptions, getChosenBill } from '../_lib/funcs';
import { BillHeadValues } from '../_lib/types';
import { Bill } from '../_ui/bill';

export const metadata: Metadata = {
  title: '請求',
  description: '請求(コピー)ページです',
};

const Page = async ({ searchParams }: { searchParams: Promise<{ [key: string]: string | undefined }> }) => {
  const searchParam = await searchParams;

  const user = await getCurrentUser();
  if (!user) {
    await redirect('/login');
    return;
  }

  const hasPermission = !!(user.permission.juchu & permission.juchu_upd);

  if (!hasPermission) {
    return <Typography>このページを閲覧する権限がありません。</Typography>;
  }

  // 選択肢は請求と同時に取る
  const [data, options] = await Promise.all([getChosenBill(Number(searchParam.seikyuId)), getBillOptions()]);
  const bill: BillHeadValues = { ...data, seikyuHeadId: null };

  return <Bill user={user} isNew={true} bill={bill} options={options} />;
};

export default Page;
