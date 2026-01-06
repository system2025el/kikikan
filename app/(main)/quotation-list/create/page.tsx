import { getOrderForQuotation } from '../_lib/funcs';
import { JuchuValues, QuotHeadValues } from '../_lib/types';
import { Quotation } from '../_ui/quotation';

const Page = async ({ searchParams }: { searchParams: Promise<{ [key: string]: string | string[] | undefined }> }) => {
  const searchParam = await searchParams;
  const juchuId = Number(searchParam.juchuId);

  let order: JuchuValues | null = null;

  if (juchuId) {
    // もし受注IDがあれば、DBから関連データを取得して初期値とする
    order = await getOrderForQuotation(juchuId);
  }

  /** 見積初期値 */
  const quot: QuotHeadValues = order
    ? {
        mituHeadId: null,
        juchuHeadId: order.juchuHeadId,
        mituSts: null,
        mituDat: new Date(),
        mituHeadNam: null,
        kokyakuId: order.kokyaku.id,
        kokyaku: order.kokyaku.name,
        nyuryokuUser: null,
        mituRange: { strt: order.juchuRange.strt, end: order.juchuRange.end },
        kokyakuTantoNam: order.kokyakuTantoNam,
        koenNam: order.koenNam,
        koenbashoNam: order.koenbashoNam,
        mituHonbanbiQty: null,
        biko: null,
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
        kokyaku: null,
        nyuryokuUser: null,
        mituRange: { strt: null, end: null },
        kokyakuTantoNam: null,
        koenNam: null,
        koenbashoNam: null,
        mituHonbanbiQty: null,
        biko: null,
        kizaiChukeiMei: '中計',
        chukeiMei: '中計',
        tokuNebikiMei: '特別値引き',
        zeiRat: 10,
        meisaiHeads: {},
      };

  return (
    <Quotation
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
