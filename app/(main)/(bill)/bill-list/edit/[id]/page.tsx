import { Metadata } from 'next';

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
  const data = await getChosenBill(billId);
  const bill: BillHeadValues = data;

  return <Bill isNew={false} bill={bill} />;
};

export default Page;
