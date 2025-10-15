import { FAKE_NEW_ID } from '../../(masters)/_lib/constants';
import { getCustomerSelection } from '../../(masters)/_lib/funcs';
import { getChosenQuot, getMituStsSelection, getUsersSelection } from '../_lib/funcs';
import { QuotHeadValues } from '../_lib/types';
import { Quotation } from '../_ui/quotation';

/**
 * 見積のコピーページ
 * @param param0
 * @returns
 */
const Page = async ({ searchParams }: { searchParams: Promise<{ [key: string]: string | undefined }> }) => {
  const searchParam = await searchParams;
  console.log(searchParam);

  // 選択肢取得
  const [users, mituSts, custs] = await Promise.all([
    getUsersSelection(),
    getMituStsSelection(),
    getCustomerSelection(),
  ]);
  const data = await getChosenQuot(Number(searchParam.mituId));
  const quot: QuotHeadValues = {
    ...data.m,
    mituHeadId: null,
    kizaiChukeiAmt: (data.m.meisaiHeads?.kizai ?? []).reduce((acc, item) => acc + (item.nebikiAftAmt ?? 0), 0),
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
  return (
    <Quotation
      selectOptions={{
        users: users,
        mituSts: mituSts,
        custs: custs,
      }}
      order={order}
      isNew={true}
      quot={quot}
    />
  );
};

export default Page;
