import { getCustomerSelection } from '@/app/(main)/(masters)/_lib/funs';

import { getChosenQuot, getMituStsSelection, getUsersSelection } from '../../_lib/func';
import { Quotation } from '../../_ui/quotation';

const Page = async ({ params }: { params: Promise<{ id: string }> }) => {
  const param = await params;
  const quotId = Number(param.id);
  const data = await getChosenQuot(quotId);
  const quot = data.m ?? {
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
  };
  const order = data.j ?? {
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
  };
  // 選択肢取得
  const [users, mituSts, custs] = await Promise.all([
    getUsersSelection(),
    getMituStsSelection(),
    getCustomerSelection(),
  ]);
  const options = { users: users, mituSts: mituSts, custs: custs };
  return <Quotation selectOptions={options} order={order} isNew={false} quot={quot} />;
};

export default Page;
