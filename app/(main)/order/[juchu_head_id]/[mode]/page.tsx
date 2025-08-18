import { useUserStore } from '@/app/_lib/stores/usestore';
import { Order } from '@/app/(main)/order/[juchu_head_id]/[mode]/_ui/order';

import { AddLock, GetEqHeaderList, GetLock, GetOrder } from './_lib/funcs';
import { EqTableValues, OrderValues } from './_lib/types';

const Page = async (props: { params: Promise<{ juchu_head_id: number; mode: string }> }) => {
  const params = await props.params;
  // 受注ヘッダーid
  const juchuHeadId = Number(params.juchu_head_id);
  // 編集モード(edit:編集、view:閲覧)
  const edit = params.mode === 'edit' ? true : false;

  // 新規
  if (juchuHeadId === 0) {
    // 受注ヘッダーデータ(初期値)
    const newJuchuHeadData: OrderValues = {
      juchuHeadId: juchuHeadId,
      delFlg: 0,
      juchuSts: 0,
      juchuDat: new Date(),
      juchuRange: null,
      nyuryokuUser: '',
      koenNam: '',
      koenbashoNam: null,
      kokyaku: { kokyakuId: 0, kokyakuNam: '', kokyakuRank: 0 },
      kokyakuTantoNam: null,
      mem: null,
      nebikiAmt: null,
      zeiKbn: 2,
    };

    // 受注機材ヘッダーデータ(初期値)
    const newJuchuKizaiHeadData: EqTableValues[] = [];

    return <Order juchuHeadData={newJuchuHeadData} juchuKizaiHeadDatas={newJuchuKizaiHeadData} edit={edit} />;
    // 既存
  } else {
    // 受注ヘッダーデータ
    const juchuHeadData = await GetOrder(juchuHeadId);
    // 受注機材ヘッダーデータ
    const juchuKizaiHeadDatas = await GetEqHeaderList(juchuHeadId);

    if (!juchuHeadData) {
      return <div>受注情報が見つかりません。</div>;
    }
    return <Order juchuHeadData={juchuHeadData} juchuKizaiHeadDatas={juchuKizaiHeadDatas} edit={edit} />;
  }
};
export default Page;
