import { getChosenCustomer, getChosenCustomerIdAndName } from '@/app/(main)/(masters)/customers-master/_lib/funcs';
import { getUsersSelection } from '@/app/(main)/quotation-list/_lib/funcs';

import { getBillingStsSelection } from '../_lib/funcs';
import { BillHeadValues } from '../_lib/types';
import { Bill } from '../_ui/bill';

const Page = async ({ searchParams }: { searchParams: Promise<{ [key: string]: string | undefined }> }) => {
  const searchParam = await searchParams;
  console.log(searchParam);
  const { kokyakuId, date, flg } = searchParam;
  const [users, sts] = await Promise.all([getUsersSelection(), getBillingStsSelection()]);

  const custs = await getChosenCustomerIdAndName(Number(kokyakuId));

  const bill: BillHeadValues = {
    aite: { id: custs.kokyakuId, nam: custs.kokyakuNam },
    seikyuDat: new Date(),
    adr1: custs.adrPost,
    adr2: { shozai: custs.adrShozai, tatemono: custs.adrTatemono, sonota: custs.adrSonota },
    kokyaku: custs.kokyakuNam,
    meisaiHeads: [
      {
        seikyuMeisaiHeadId: null,
        zeiFlg: false,
        seikyuMeisaiHeadNam: null,
        meisai: [{ id: null }],
      },
    ],
  };

  return <Bill isNew={true} bill={bill} options={{ users: users, sts: sts }} />;
};

export default Page;
