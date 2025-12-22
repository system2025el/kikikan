import { subDays } from 'date-fns';

import { getNyukoDate, getRange, getShukoDate } from '@/app/(main)/_lib/date-funcs';
import { StockTableValues } from '@/app/(main)/(eq-order-detail)/eq-main-order-detail/[juchuHeadId]/[juchuKizaiHeadId]/[mode]/_lib/types';

import { getDetailJuchuHead, getJuchuKizaiNyushuko, getNyushukoFixFlag, getStockList } from '../../../../../_lib/funcs';
import {
  getJuchuHonbanbiQty,
  getReturnJuchuContainerMeisai,
  getReturnJuchuKizaiHead,
  getReturnJuchuKizaiMeisai,
} from './_lib/funcs';
import {
  ReturnJuchuContainerMeisaiValues,
  ReturnJuchuKizaiHeadValues,
  ReturnJuchuKizaiMeisaiValues,
} from './_lib/types';
import { EquipmentReturnOrderDetail } from './_ui/equipment-return-order-detail';

const Page = async (props: {
  params: Promise<{
    juchuHeadId: number;
    juchuKizaiHeadId: number;
    oyaJuchuKizaiHeadId: number;
    mode: string;
  }>;
}) => {
  const params = await props.params;
  // 受注ヘッダーid
  const juchuHeadId = Number(params.juchuHeadId);
  // 受注機材ヘッダーid
  const juchuKizaiHeadId = Number(params.juchuKizaiHeadId);
  // 親受注機材ヘッダーid
  const oyaJuchuKizaiHeadId = Number(params.oyaJuchuKizaiHeadId);
  // 編集モード(edit:編集、view:閲覧)
  const edit = params.mode === 'edit' ? true : false;

  // 受注ヘッダーデータ、親受注機材入出庫データ、入庫フラグ
  const [juchuHeadData, oyaJuchuKizaiNyushukoData, nyukoFixFlag] = await Promise.all([
    getDetailJuchuHead(juchuHeadId),
    getJuchuKizaiNyushuko(juchuHeadId, oyaJuchuKizaiHeadId),
    getNyushukoFixFlag(juchuHeadId, juchuKizaiHeadId, 70),
  ]);

  if (!juchuHeadData || !oyaJuchuKizaiNyushukoData) {
    return <div>受注情報が見つかりません。</div>;
  }

  // 親出庫日
  const oyaShukoDate = getShukoDate(oyaJuchuKizaiNyushukoData.kicsShukoDat, oyaJuchuKizaiNyushukoData.yardShukoDat);
  // 親入庫日
  const oyaNyukoDate = getNyukoDate(oyaJuchuKizaiNyushukoData.kicsNyukoDat, oyaJuchuKizaiNyushukoData.yardNyukoDat);

  if (!oyaShukoDate || !oyaNyukoDate) {
    return <div>受注情報が見つかりません。</div>;
  }

  // 在庫テーブルヘッダー用日付範囲
  const stockTableHeaderDateRange = getRange(oyaShukoDate, oyaNyukoDate);

  // 新規
  if (juchuKizaiHeadId === 0) {
    // 親本番日数
    const oyaJuchuHonbanbiQty = await getJuchuHonbanbiQty(juchuHeadId, oyaJuchuKizaiHeadId);
    // 返却受注機材ヘッダーデータ(初期値)
    const newReturnJuchuKizaiHeadData: ReturnJuchuKizaiHeadValues = {
      juchuHeadId: juchuHeadId,
      juchuKizaiHeadId: juchuKizaiHeadId,
      juchuKizaiHeadKbn: 2,
      juchuHonbanbiQty: oyaJuchuHonbanbiQty ?? 0,
      //nebikiAmt: null,
      mem: null,
      headNam: juchuHeadData.koenNam,
      oyaJuchuKizaiHeadId: oyaJuchuKizaiHeadId,
      kicsNyukoDat: null,
      yardNyukoDat: null,
    };

    return (
      <EquipmentReturnOrderDetail
        juchuHeadData={juchuHeadData}
        oyaJuchuKizaiNyushukoData={oyaJuchuKizaiNyushukoData}
        returnJuchuKizaiHeadData={newReturnJuchuKizaiHeadData}
        oyaShukoDate={oyaShukoDate}
        oyaNyukoDate={oyaNyukoDate}
        stockTableHeaderDateRange={stockTableHeaderDateRange}
        edit={edit}
        nyukoFixFlag={nyukoFixFlag}
      />
    );

    // 既存
  } else {
    // 返却受注機材ヘッダーデータ
    const returnJuchuKizaiHeadData = await getReturnJuchuKizaiHead(juchuHeadId, juchuKizaiHeadId);

    if (!returnJuchuKizaiHeadData) {
      return <div>受注機材情報が見つかりません。</div>;
    }

    return (
      <EquipmentReturnOrderDetail
        juchuHeadData={juchuHeadData}
        oyaJuchuKizaiNyushukoData={oyaJuchuKizaiNyushukoData}
        returnJuchuKizaiHeadData={returnJuchuKizaiHeadData}
        oyaShukoDate={oyaShukoDate}
        oyaNyukoDate={oyaNyukoDate}
        stockTableHeaderDateRange={stockTableHeaderDateRange}
        edit={edit}
        nyukoFixFlag={nyukoFixFlag}
      />
    );
  }
};
export default Page;
