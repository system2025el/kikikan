import { getChosenCustomer } from '@/app/(main)/(masters)/customers-master/_lib/funcs';
import { getUsersSelection } from '@/app/(main)/quotation-list/_lib/func';

import { getBillingStsSelection } from '../_lib/funcs';
import { BillHeadValues } from '../_lib/types';
import { Bill } from '../_ui/bill';

const Page = async ({ searchParams }: { searchParams: Promise<{ [key: string]: string | undefined }> }) => {
  const searchParam = await searchParams;
  console.log(searchParam);
  const { kokyakuId, month, flg } = searchParam;
  const [users, sts, custs] = await Promise.all([
    getUsersSelection(),
    getBillingStsSelection(),
    getChosenCustomer(Number(kokyakuId)),
  ]);

  const bill: BillHeadValues = {
    aite: custs.kokyakuNam,
    seikyuDat: new Date(),
    adr1: custs.adrPost,
    adr2: { shozai: custs.adrShozai, tatemono: custs.adrTatemono, sonota: custs.adrSonota },
    kokyaku: custs.kokyakuNam,
  };

  return <Bill isNew={true} bill={bill} options={{ users: users, sts: sts }} />;
};

export default Page;
