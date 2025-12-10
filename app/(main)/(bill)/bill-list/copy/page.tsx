import { getUsersSelection } from '@/app/(main)/quotation-list/_lib/funcs';

import { getChosenBill } from '../_lib/funcs';
import { BillHeadValues } from '../_lib/types';
import { Bill } from '../_ui/bill';

const Page = async ({ searchParams }: { searchParams: Promise<{ [key: string]: string | undefined }> }) => {
  const searchParam = await searchParams;
  const data = await getChosenBill(Number(searchParam.seikyuId));
  const bill: BillHeadValues = { ...data, seikyuHeadId: null };

  return <Bill isNew={true} bill={bill} />;
};

export default Page;
