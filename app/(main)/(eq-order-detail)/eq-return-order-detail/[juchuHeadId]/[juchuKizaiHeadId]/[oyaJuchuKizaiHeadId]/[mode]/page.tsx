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
  // 受注ヘッダーデータ
  const juchuHeadData = await getDetailJuchuHead(juchuHeadId);
  // 親受注機材入出庫データ
  const oyaJuchuKizaiNyushukoData = await getJuchuKizaiNyushuko(juchuHeadId, oyaJuchuKizaiHeadId);

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

  // 入庫フラグ
  console.time();
  const nyukoFixFlag = await getNyushukoFixFlag(juchuHeadId, juchuKizaiHeadId, 70);
  console.log('-----------------------------出発フラグ--------------------------');
  console.timeEnd();

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
      headNam: '',
      oyaJuchuKizaiHeadId: oyaJuchuKizaiHeadId,
      kicsNyukoDat: null,
      yardNyukoDat: null,
    };
    // 返却受注機材明細データ(初期値)
    const newReturnJuchuKizaiMeisaiData: ReturnJuchuKizaiMeisaiValues[] = [];
    // 返却受注コンテナ明細データ(初期値)
    const newReturnJuchuContainerMeisaiData: ReturnJuchuContainerMeisaiValues[] = [];
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
        returnJuchuContainerMeisaiData={newReturnJuchuContainerMeisaiData}
        eqStockData={newEqStockData}
        oyaShukoDate={oyaShukoDate}
        oyaNyukoDate={oyaNyukoDate}
        stockTableHeaderDateRange={stockTableHeaderDateRange}
        returnNyukoDate={returnNyukoDate}
        dateRange={dateRange}
        edit={edit}
        nyukoFixFlag={nyukoFixFlag}
      />
    );

    // 既存
  } else {
    // 返却受注機材ヘッダーデータ
    console.time();
    const returnJuchuKizaiHeadData = await getReturnJuchuKizaiHead(juchuHeadId, juchuKizaiHeadId);
    console.log('---------------------受注機材ヘッダー---------------------');
    console.timeEnd();

    if (!returnJuchuKizaiHeadData) {
      return <div>受注機材情報が見つかりません。</div>;
    }
    // 返却受注機材明細データ
    console.time();
    const returnJuchuKizaiMeisaiData = await getReturnJuchuKizaiMeisai(
      juchuHeadId,
      juchuKizaiHeadId,
      oyaJuchuKizaiHeadId
    );
    console.log('----------------------------受注機材明細---------------------------------');
    console.timeEnd();

    // 返却受注コンテナ明細データ
    console.time();
    const returnJuchuContainerMeisaiData = await getReturnJuchuContainerMeisai(
      juchuHeadId,
      juchuKizaiHeadId,
      oyaJuchuKizaiHeadId
    );
    console.log('----------------------------受注コンテナ明細---------------------------------');
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
        returnJuchuContainerMeisaiData={returnJuchuContainerMeisaiData}
        eqStockData={eqStockData}
        oyaShukoDate={oyaShukoDate}
        oyaNyukoDate={oyaNyukoDate}
        stockTableHeaderDateRange={stockTableHeaderDateRange}
        returnNyukoDate={returnNyukoDate}
        dateRange={dateRange}
        edit={edit}
        nyukoFixFlag={nyukoFixFlag}
      />
    );
  }
};
export default Page;
