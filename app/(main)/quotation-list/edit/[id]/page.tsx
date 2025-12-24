import { getCustomerSelection } from '@/app/(main)/(masters)/_lib/funcs';

import { getChosenQuot, getMituStsSelection, getUsersSelection } from '../../_lib/funcs';
import { QuotHeadValues } from '../../_lib/types';
import { Quotation } from '../../_ui/quotation';

const Page = async ({ params }: { params: Promise<{ id: string }> }) => {
  const param = await params;
  const quotId = Number(param.id);
  const data = await getChosenQuot(quotId);
  const quot: QuotHeadValues = {
    ...data.m,
    kizaiChukeiAmt: (data.m.meisaiHeads?.kizai ?? []).reduce((acc, item) => acc + (item.nebikiAftAmt ?? 0), 0),
    chukeiAmt:
      (data.m.meisaiHeads?.kizai ?? []).reduce((acc, item) => acc + (item.nebikiAftAmt ?? 0), 0) +
      (data.m.meisaiHeads?.labor ?? []).reduce((acc, item) => acc + (item.nebikiAftAmt ?? 0), 0) +
      (data.m.meisaiHeads?.other ?? []).reduce((acc, item) => acc + (item.nebikiAftAmt ?? 0), 0),
    preTaxGokeiAmt:
      (data.m.meisaiHeads?.kizai ?? []).reduce((acc, item) => acc + (item.nebikiAftAmt ?? 0), 0) +
      (data.m.meisaiHeads?.labor ?? []).reduce((acc, item) => acc + (item.nebikiAftAmt ?? 0), 0) +
      (data.m.meisaiHeads?.other ?? []).reduce((acc, item) => acc + (item.nebikiAftAmt ?? 0), 0) -
      (data.m.tokuNebikiAmt ?? 0),
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
  return <Quotation order={order} isNew={false} quot={quot} />;
};

export default Page;
