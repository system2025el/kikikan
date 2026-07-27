import { Typography } from '@mui/material';
import { Metadata } from 'next';
import { redirect } from 'next/navigation';

import { getCurrentUser } from '../../_lib/funcs';
import { permission } from '../../_lib/permission';
import { getMaxHonbanbiQty, getOrderForQuotation } from '../_lib/funcs';
import { JuchuValues, QuotHeadValues } from '../_lib/types';
import { Quotation } from '../_ui/quotation';

export const metadata: Metadata = {
  title: '見積',
  description: '見積(新規)ページです',
};

const Page = async ({ searchParams }: { searchParams: Promise<{ [key: string]: string | string[] | undefined }> }) => {
  const searchParam = await searchParams;
  const juchuId = Number(searchParam.juchuId);

  const user = await getCurrentUser();
  if (!user) {
    await redirect('/login');
    return;
  }

  const hasPermission = !!(user.permission.juchu & permission.juchu_upd);

  if (!hasPermission) {
    return <Typography>このページを閲覧する権限がありません。</Typography>;
  }

  let order: JuchuValues | null = null;
  let honbanbiQty: number | null = null;

  if (juchuId) {
    // もし受注IDがあれば、DBから関連データを取得して初期値とする
    order = await getOrderForQuotation(juchuId);
    honbanbiQty = await getMaxHonbanbiQty(juchuId);
  }

  /** 見積初期値 */
  const quot: QuotHeadValues = order
    ? {
        mituHeadId: null,
        juchuHeadId: order.juchuHeadId,
        mituSts: null,
        mituDat: new Date(),
        mituHeadNam: '',
        kokyakuId: order.kokyaku.id,
        kokyaku: order.kokyaku.name ?? '',
        nyuryokuUser: null,
        mituRange: { strt: order.juchuRange.strt, end: order.juchuRange.end },
        kokyakuTantoNam: order.kokyakuTantoNam ?? '',
        koenNam: order.koenNam ?? '',
        koenbashoNam: order.koenbashoNam ?? '',
        mituHonbanbiQty: honbanbiQty,
        biko: '',
        comment: '',
        kizaiChukeiMei: '中計',
        chukeiMei: '中計',
        tokuNebikiMei: '特別値引き',
        zeiRat: 10,
        meisaiHeads: {},
      }
    : {
        mituHeadId: null,
        juchuHeadId: null,
        mituSts: null,
        mituDat: new Date(),
        mituHeadNam: '',
        kokyaku: '',
        nyuryokuUser: null,
        mituRange: { strt: null, end: null },
        kokyakuTantoNam: '',
        koenNam: '',
        koenbashoNam: '',
        mituHonbanbiQty: null,
        biko: '',
        comment: '',
        kizaiChukeiMei: '中計',
        chukeiMei: '中計',
        tokuNebikiMei: '特別値引き',
        zeiRat: 10,
        meisaiHeads: {},
      };

  return (
    <Quotation
      user={user}
      isNew={true}
      order={
        order ?? {
          juchuHeadId: null,
          juchuSts: null,
          juchuDat: null,
          juchuRange: { strt: null, end: null },
          nyuryokuUser: null,
          koenNam: null,
          koenbashoNam: null,
          kokyaku: { id: null, name: null },
          kokyakuTantoNam: null,
          mem: null,
          nebikiAmt: null,
          zeiKbn: null,
        }
      }
      quot={quot}
    />
  );
};

export default Page;
