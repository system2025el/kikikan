import { getCustomerSelection } from '../../(masters)/_lib/funs';
import { getMituStsSelection, getOrderForQuotation, getUsersSelection } from '../_lib/func';
import { JuchuValues } from '../_lib/types';
import { Quotation } from '../_ui/quotation';

const Page = async ({ searchParams }: { searchParams: { [key: string]: string | undefined } }) => {
  const searchParam = await searchParams;
  const juchuId = Number(searchParam.juchuId);
  // 選択肢取得
  const [users, mituSts, custs] = await Promise.all([
    getUsersSelection(),
    getMituStsSelection(),
    getCustomerSelection(),
  ]);
  const options = { users: users, mituSts: mituSts, custs: custs };

  let order: JuchuValues | null = null;

  if (juchuId) {
    // もし受注IDがあれば、DBから関連データを取得して初期値とする
    order = await getOrderForQuotation(juchuId);
  }
  return (
    <Quotation
      selectOptions={options}
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
      quot={{
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
        meisaiHeads: {
          kizai: [
            {
              mituMeisaiHeadNam: null,
              headNamDspFlg: false,
              mituMeisaiKbn: 0,
              meisai: [
                {
                  nam: null,
                  qty: null,
                  honbanbiQty: null,
                  tankaAmt: null,
                  shokeiAmt: null,
                },
              ],
            },
          ],
        },
      }}
    />
  );
};

export default Page;
