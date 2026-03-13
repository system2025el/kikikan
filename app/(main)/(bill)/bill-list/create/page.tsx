import { Metadata } from 'next';

import { toJapanYMDString } from '@/app/(main)/_lib/date-conversion';
import { getChosenCustomerIdAndName } from '@/app/(main)/(masters)/customers-master/_lib/funcs';

import { BillHeadValues } from '../_lib/types';
import { Bill } from '../_ui/bill';
import { getJuchusForBill } from './_lib/funcs';

export const metadata: Metadata = {
  title: '請求',
  description: '請求(新規)ページです',
};

const Page = async ({ searchParams }: { searchParams: Promise<{ [key: string]: string | undefined }> }) => {
  const searchParam = await searchParams;
  const { kokyakuId, date, flg, tantou } = searchParam;

  const custs = await getChosenCustomerIdAndName(Number(kokyakuId));
  const juchus = await getJuchusForBill({
    kokyakuId: Number(kokyakuId),
    date: date ?? toJapanYMDString(undefined, '-'),
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
    // seikyuDat: new Date(toJapanTimeStampString()),
    seikyuDat: new Date(),
    adrPost: custs.adrPost.trim(),
    adrShozai: custs.adrShozai,
    adrTatemono: custs.adrTatemono,
    adrSonota: custs.adrSonota,
    kokyaku: custs.kokyakuNam,
    meisaiHeads: juchus
      ? juchus.map((j) => ({
          ...j!,
          nebikiAftAmt: (j?.meisai ?? []).reduce((acc, item) => acc + (item.shokeiAmt ?? 0), 0),
        }))
      : [],
    chukeiAmt: chukei,
    preTaxGokeiAmt: preTax,
    zeiRat: 10,
    gokeiAmt: chukei,
  };
  return <Bill isNew={true} bill={bill} />;
};

export default Page;
