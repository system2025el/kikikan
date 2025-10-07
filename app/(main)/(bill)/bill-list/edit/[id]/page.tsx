import { getUsersSelection } from '@/app/(main)/quotation-list/_lib/funcs';

import { getBillingStsSelection, getChosenBill } from '../../_lib/funcs';
import { BillHeadValues } from '../../_lib/types';
import { Bill } from '../../_ui/bill';

const Page = async ({ params }: { params: Promise<{ id: string }> }) => {
  const param = await params;
  const billId = Number(param.id);
  const data = await getChosenBill(billId);
  const bill: BillHeadValues = data;

  // 選択肢取得
  const [users, seikyuSts] = await Promise.all([getUsersSelection(), getBillingStsSelection()]);
  const options = { users: users, sts: seikyuSts };
  return <Bill options={options} isNew={false} bill={bill} />;
};

export default Page;
