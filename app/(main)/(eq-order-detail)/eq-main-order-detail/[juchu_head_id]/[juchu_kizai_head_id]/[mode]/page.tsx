import { subDays } from 'date-fns';

import { toISOStringYearMonthDay } from '@/app/(main)/_lib/date-conversion';
import { getNyukoDate, getRange, getShukoDate } from '@/app/(main)/_lib/date-funcs';

import { getDetailJuchuHead, getJuchuContainerMeisai, getStockList } from '../../../../_lib/funcs';
import { getHonbanbi, getJuchuKizaiHead, getJuchuKizaiMeisai } from './_lib/funcs';
import {
  JuchuContainerMeisaiValues,
  JuchuKizaiHeadValues,
  JuchuKizaiHonbanbiValues,
  JuchuKizaiMeisaiValues,
  StockTableValues,
} from './_lib/types';
import EquipmentOrderDetail from './_ui/equipment-order-detail';

const Page = async (props: {
  params: Promise<{ juchu_head_id: number; juchu_kizai_head_id: number; mode: string }>;
}) => {
  const params = await props.params;
  // 受注機材ヘッダーid
  const juchuKizaiHeadId = Number(params.juchu_kizai_head_id);
  // 編集モード(edit:編集、view:閲覧)
  const edit = params.mode === 'edit' ? true : false;
  // 受注ヘッダーデータ
  const juchuHeadData = await getDetailJuchuHead(params.juchu_head_id);

  if (!juchuHeadData) {
    return <div>受注情報が見つかりません。</div>;
  }

  // 新規
  if (juchuKizaiHeadId === 0) {
    // 受注機材ヘッダーデータ(初期値)
    const newJuchuKizaiHeadData: JuchuKizaiHeadValues = {
      juchuHeadId: Number(params.juchu_head_id),
      juchuKizaiHeadId: Number(params.juchu_kizai_head_id),
      juchuKizaiHeadKbn: 1,
      juchuHonbanbiQty: null,
      nebikiAmt: null,
      mem: null,
      headNam: '',
      kicsShukoDat: null,
      kicsNyukoDat: null,
      yardShukoDat: null,
      yardNyukoDat: null,
    };
    // 受注機材明細データ(初期値)
    const newJuchuKizaiMeisaiData: JuchuKizaiMeisaiValues[] = [];
    // 受注コンテナ明細データ(初期値)
    const newJuchuContainerMeisaiData: JuchuContainerMeisaiValues[] = [];
    // 機材在庫データ(初期値)
    const newEqStockData: StockTableValues[][] = [];
    // 出庫日(初期値)
    const shukoDate = null;
    // 入庫日(初期値)
    const nyukoDate = null;
    // 出庫日から入庫日(初期値)
    const dateRange: string[] = [];
    // 受注本番日データ
    const newJuchuHonbanbiData: JuchuKizaiHonbanbiValues[] = [];

    return (
      <EquipmentOrderDetail
        juchuHeadData={juchuHeadData}
        juchuKizaiHeadData={newJuchuKizaiHeadData}
        juchuKizaiMeisaiData={newJuchuKizaiMeisaiData}
        juchuContainerMeisaiData={newJuchuContainerMeisaiData}
        shukoDate={shukoDate}
        nyukoDate={nyukoDate}
        dateRange={dateRange}
        eqStockData={newEqStockData}
        juchuHonbanbiData={newJuchuHonbanbiData}
        edit={edit}
      />
    );

    // 既存
  } else {
    // 受注機材ヘッダーデータ
    console.time();
    const juchuKizaiHeadData = await getJuchuKizaiHead(params.juchu_head_id, params.juchu_kizai_head_id);
    console.log('---------------------受注機材ヘッダー---------------------');
    console.timeEnd();

    if (!juchuKizaiHeadData) {
      return <div>受注機材情報が見つかりません。</div>;
    }
    // 受注機材明細データ
    console.time();
    const juchuKizaiMeisaiData = await getJuchuKizaiMeisai(params.juchu_head_id, params.juchu_kizai_head_id);
    console.log('----------------------------受注機材明細---------------------------------');
    console.timeEnd();

    // 受注コンテナ明細データ
    console.time();
    const juchuContainerMeisaiData = await getJuchuContainerMeisai(params.juchu_head_id, params.juchu_kizai_head_id);
    console.log('----------------------------受注コンテナ明細---------------------------------');
    console.timeEnd();

    // 出庫日
    const shukoDate = getShukoDate(
      juchuKizaiHeadData.kicsShukoDat && new Date(juchuKizaiHeadData.kicsShukoDat),
      juchuKizaiHeadData.yardShukoDat && new Date(juchuKizaiHeadData.yardShukoDat)
    );
    // 入庫日
    const nyukoDate = getNyukoDate(
      juchuKizaiHeadData.kicsNyukoDat && new Date(juchuKizaiHeadData.kicsNyukoDat),
      juchuKizaiHeadData.yardNyukoDat && new Date(juchuKizaiHeadData.yardNyukoDat)
    );
    // 出庫日から入庫日
    const dateRange = getRange(shukoDate, nyukoDate);
    // 受注機材idリスト
    const ids = juchuKizaiMeisaiData?.map((data) => data.kizaiId);
    // 機材在庫データ
    const eqStockData: StockTableValues[][] = [];
    console.time();
    if (ids) {
      if (!shukoDate) return <div>データに不備があります。</div>;
      for (let i = 0; i < ids.length; i++) {
        const stock: StockTableValues[] = await getStockList(
          juchuKizaiHeadData?.juchuHeadId,
          juchuKizaiHeadData?.juchuKizaiHeadId,
          ids[i],
          subDays(shukoDate, 1)
        );
        eqStockData.push(stock);
      }
    }
    console.log('--------------------------在庫リスト----------------------------');
    console.timeEnd();

    // 受注本番日データ
    console.time();
    const juchuHonbanbiData = await getHonbanbi(params.juchu_head_id, params.juchu_kizai_head_id);
    console.log('-----------------------------受注機材本番日--------------------------');
    console.timeEnd();

    return (
      <EquipmentOrderDetail
        juchuHeadData={juchuHeadData}
        juchuKizaiHeadData={juchuKizaiHeadData}
        juchuKizaiMeisaiData={juchuKizaiMeisaiData}
        juchuContainerMeisaiData={juchuContainerMeisaiData}
        shukoDate={shukoDate}
        nyukoDate={nyukoDate}
        dateRange={dateRange}
        eqStockData={eqStockData}
        juchuHonbanbiData={juchuHonbanbiData}
        edit={edit}
      />
    );
  }
};
export default Page;
