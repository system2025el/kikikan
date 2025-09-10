import { subDays } from 'date-fns';

import { getNyukoDate, getRange, getShukoDate } from '@/app/(main)/_lib/date-funcs';
import { StockTableValues } from '@/app/(main)/(eq-order-detail)/eq-main-order-detail/[juchu_head_id]/[juchu_kizai_head_id]/[mode]/_lib/types';

import { getDetailJuchuHead, getJuchuKizaiNyushuko, getStockList } from '../../../../../_lib/funcs';
import { getJuchuHonbanbiQty, getReturnJuchuKizaiHead, getReturnJuchuKizaiMeisai } from './_lib/funcs';
import { ReturnJuchuKizaiHeadValues, ReturnJuchuKizaiMeisaiValues } from './_lib/types';
import { EquipmentReturnOrderDetail } from './_ui/equipment-return-order-detail';

const Page = async (props: {
  params: Promise<{
    juchu_head_id: number;
    juchu_kizai_head_id: number;
    oya_juchu_kizai_head_id: number;
    mode: string;
  }>;
}) => {
  const params = await props.params;
  // 受注機材ヘッダーid
  const juchuKizaiHeadId = Number(params.juchu_kizai_head_id);
  // 編集モード(edit:編集、view:閲覧)
  const edit = params.mode === 'edit' ? true : false;
  // 受注ヘッダーデータ
  const juchuHeadData = await getDetailJuchuHead(params.juchu_head_id);
  // 親受注機材入出庫データ
  const oyaJuchuKizaiNyushukoData = await getJuchuKizaiNyushuko(params.juchu_head_id, params.oya_juchu_kizai_head_id);

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
    const oyaJuchuHonbanbiQty = await getJuchuHonbanbiQty(params.juchu_head_id, params.oya_juchu_kizai_head_id);
    // 返却受注機材ヘッダーデータ(初期値)
    const newReturnJuchuKizaiHeadData: ReturnJuchuKizaiHeadValues = {
      juchuHeadId: Number(params.juchu_head_id),
      juchuKizaiHeadId: Number(params.juchu_kizai_head_id),
      juchuKizaiHeadKbn: 2,
      juchuHonbanbiQty: oyaJuchuHonbanbiQty,
      nebikiAmt: null,
      mem: null,
      headNam: '',
      oyaJuchuKizaiHeadId: Number(params.oya_juchu_kizai_head_id),
      kicsNyukoDat: null,
      yardNyukoDat: null,
    };
    // 返却受注機材明細キープデータ(初期値)
    const newReturnJuchuKizaiMeisaiData: ReturnJuchuKizaiMeisaiValues[] = [];
    // 機材在庫データ(初期値)
    const newEqStockData: StockTableValues[][] = [];

    // 返却入庫日(初期値)
    const returnNyukoDate = null;
    // 返却入庫日から親入庫日(初期値)
    const dateRange: string[] = [];

    return (
      <EquipmentReturnOrderDetail
        juchuHeadData={juchuHeadData}
        oyaJuchuKizaiNyushukoData={oyaJuchuKizaiNyushukoData}
        returnJuchuKizaiHeadData={newReturnJuchuKizaiHeadData}
        returnJuchuKizaiMeisaiData={newReturnJuchuKizaiMeisaiData}
        eqStockData={newEqStockData}
        oyaShukoDate={oyaShukoDate}
        oyaNyukoDate={oyaNyukoDate}
        stockTableHeaderDateRange={stockTableHeaderDateRange}
        returnNyukoDate={returnNyukoDate}
        dateRange={dateRange}
        edit={edit}
      />
    );

    // 既存
  } else {
    // 返却受注機材ヘッダーデータ
    console.time();
    const returnJuchuKizaiHeadData = await getReturnJuchuKizaiHead(params.juchu_head_id, params.juchu_kizai_head_id);
    console.log('---------------------受注機材ヘッダー---------------------');
    console.timeEnd();

    if (!returnJuchuKizaiHeadData) {
      return <div>受注機材情報が見つかりません。</div>;
    }
    // 返却受注機材明細データ
    console.time();
    const returnJuchuKizaiMeisaiData = await getReturnJuchuKizaiMeisai(
      params.juchu_head_id,
      params.juchu_kizai_head_id
    );
    console.log('----------------------------受注機材明細---------------------------------');
    console.timeEnd();

    // 返却入庫日
    const returnNyukoDate = getNyukoDate(
      returnJuchuKizaiHeadData.kicsNyukoDat && new Date(returnJuchuKizaiHeadData.kicsNyukoDat),
      returnJuchuKizaiHeadData.yardNyukoDat && new Date(returnJuchuKizaiHeadData.yardNyukoDat)
    );
    // 出庫日から入庫日
    const dateRange = getRange(returnNyukoDate, oyaNyukoDate);
    // 受注機材idリスト
    const ids = returnJuchuKizaiMeisaiData?.map((data) => data.kizaiId);
    // 機材在庫データ
    const eqStockData: StockTableValues[][] = [];
    console.time();
    if (ids) {
      if (!returnNyukoDate) return <div>データに不備があります。</div>;
      for (let i = 0; i < ids.length; i++) {
        const stock: StockTableValues[] = await getStockList(
          returnJuchuKizaiHeadData?.juchuHeadId,
          returnJuchuKizaiHeadData?.juchuKizaiHeadId,
          ids[i],
          subDays(returnNyukoDate, 1)
        );
        eqStockData.push(stock);
      }
    }
    console.log('--------------------------在庫リスト----------------------------');
    console.timeEnd();

    return (
      <EquipmentReturnOrderDetail
        juchuHeadData={juchuHeadData}
        oyaJuchuKizaiNyushukoData={oyaJuchuKizaiNyushukoData}
        returnJuchuKizaiHeadData={returnJuchuKizaiHeadData}
        returnJuchuKizaiMeisaiData={returnJuchuKizaiMeisaiData}
        eqStockData={eqStockData}
        oyaShukoDate={oyaShukoDate}
        oyaNyukoDate={oyaNyukoDate}
        stockTableHeaderDateRange={stockTableHeaderDateRange}
        returnNyukoDate={returnNyukoDate}
        dateRange={dateRange}
        edit={edit}
      />
    );
  }
};
export default Page;
