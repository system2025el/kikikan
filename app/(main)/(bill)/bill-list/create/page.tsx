import { toJapanDateString } from '@/app/(main)/_lib/date-conversion';
import { getChosenCustomer, getChosenCustomerIdAndName } from '@/app/(main)/(masters)/customers-master/_lib/funcs';
import { getUsersSelection } from '@/app/(main)/quotation-list/_lib/funcs';

import { getBillingStsSelection, getFilteredBills } from '../_lib/funcs';
import { BillHeadValues } from '../_lib/types';
import { Bill } from '../_ui/bill';
import { getJuchusForBill } from './_lib/funcs';

const Page = async ({ searchParams }: { searchParams: Promise<{ [key: string]: string | undefined }> }) => {
  const searchParam = await searchParams;
  console.log(searchParam);
  const { kokyakuId, date, flg, tantou } = searchParam;
  const [users, sts] = await Promise.all([getUsersSelection(), getBillingStsSelection()]);

  const custs = await getChosenCustomerIdAndName(Number(kokyakuId));
  const juchus = await getJuchusForBill({
    kokyakuId: Number(kokyakuId),
    date: date ?? toJapanDateString(undefined, '-'),
    flg: flg === 'true' ? true : false,
    tantouNam: tantou === 'null' ? null : (tantou ?? null),
  });

  const chukei =
    juchus && juchus.length > 0
      ? juchus.reduce((sum, j) => {
          const meisaiGokei =
            j!.meisai && j!.meisai.length > 0 ? j!.meisai.reduce((subSum, m) => subSum + (m.shokeiAmt ?? 0), 0) : 0;
          return sum + meisaiGokei;
        }, 0)
      : 0;
  const preTax =
    juchus && juchus.length > 0
      ? juchus
          .filter((j) => j?.zeiFlg)
          .reduce((sum, j) => {
            const meisaiGokei =
              j!.meisai && j!.meisai.length > 0 ? j!.meisai.reduce((subSum, m) => subSum + (m.shokeiAmt ?? 0), 0) : 0;
            return sum + meisaiGokei;
          }, 0)
      : 0;

  const bill: BillHeadValues = {
    aite: { id: custs.kokyakuId, nam: custs.kokyakuNam },
    seikyuDat: new Date(),
    adr1: custs.adrPost.trim(),
    adr2: { shozai: custs.adrShozai, tatemono: custs.adrTatemono, sonota: custs.adrSonota },
    kokyaku: custs.kokyakuNam,
    meisaiHeads: juchus
      ? juchus.map((j) => ({
          ...j!,
          nebikiAftAmt: (j?.meisai ?? []).reduce((acc, item) => acc + (item.shokeiAmt ?? 0), 0),
        }))
      : [],
    chukeiAmt: chukei,
    preTaxGokeiAmt: preTax,
    gokeiAmt: chukei,
  };
  console.log(
    '請求書新規作成：',
    bill.meisaiHeads?.map((d) => d?.seikyuRange)
  );
  return <Bill isNew={true} bill={bill} options={{ users: users, sts: sts }} />;
};

export default Page;
