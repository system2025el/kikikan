import { subDays } from 'date-fns';

import { getNyukoDate, getRange, getShukoDate } from '@/app/(main)/_lib/date-funcs';

import { getDetailJuchuHead, getJuchuContainerMeisai, getNyushukoFixFlag, getStockList } from '../../../../_lib/funcs';
import { getHonbanbi, getIdoJuchuKizaiMeisai, getJuchuKizaiHead, getJuchuKizaiMeisai } from './_lib/funcs';
import {
  IdoJuchuKizaiMeisaiValues,
  JuchuContainerMeisaiValues,
  JuchuKizaiHeadValues,
  JuchuKizaiHonbanbiValues,
  JuchuKizaiMeisaiValues,
  StockTableValues,
} from './_lib/types';
import EquipmentOrderDetail from './_ui/equipment-order-detail';

const Page = async (props: { params: Promise<{ juchuHeadId: string; juchuKizaiHeadId: string; mode: string }> }) => {
  const params = await props.params;
  // 受注ヘッダid
  const juchuHeadId = Number(params.juchuHeadId);
  // 受注機材ヘッダーid
  const juchuKizaiHeadId = Number(params.juchuKizaiHeadId);
  // 受注ヘッダーデータ
  const juchuHeadData = await getDetailJuchuHead(Number(params.juchuHeadId));

  if (!juchuHeadData) {
    return <div>受注情報が見つかりません。</div>;
  }

  // 出発フラグ
  const fixFlag = await getNyushukoFixFlag(juchuHeadId, juchuKizaiHeadId, 60);

  // 編集モード(edit:編集、view:閲覧)
  const edit = params.mode === 'edit' && !fixFlag ? true : false;

  // 新規
  if (juchuKizaiHeadId === 0) {
    // 受注機材ヘッダーデータ(初期値)
    const newJuchuKizaiHeadData: JuchuKizaiHeadValues = {
      juchuHeadId: juchuHeadId,
      juchuKizaiHeadId: juchuKizaiHeadId,
      juchuKizaiHeadKbn: 1,
      juchuHonbanbiQty: null,
      nebikiAmt: null,
      nebikiRat: null,
      mem: null,
      headNam: juchuHeadData.koenNam,
      kicsShukoDat: null,
      kicsNyukoDat: null,
      yardShukoDat: juchuHeadData.juchuRange ? juchuHeadData.juchuRange[0] : null,
      yardNyukoDat: juchuHeadData.juchuRange ? juchuHeadData.juchuRange[1] : null,
    };
    // // 受注機材明細データ(初期値)
    // const newJuchuKizaiMeisaiData: JuchuKizaiMeisaiValues[] = [];
    // // 移動受注機材明細データ(初期値)
    // const newIdoJuchuKizaiMeisaiData: IdoJuchuKizaiMeisaiValues[] = [];
    // // 受注コンテナ明細データ(初期値)
    // const newJuchuContainerMeisaiData: JuchuContainerMeisaiValues[] = [];
    // // 機材在庫データ(初期値)
    // const newEqStockData: StockTableValues[][] = [];
    // // 出庫日(初期値)
    // const shukoDate = null;
    // // 入庫日(初期値)
    // const nyukoDate = null;
    // // 出庫日から入庫日(初期値)
    // const dateRange: string[] = [];
    // 受注本番日データ
    const newJuchuHonbanbiData: JuchuKizaiHonbanbiValues[] = [];

    return (
      <EquipmentOrderDetail
        juchuHeadData={juchuHeadData}
        juchuKizaiHeadData={newJuchuKizaiHeadData}
        // juchuKizaiMeisaiData={newJuchuKizaiMeisaiData}
        // idoJuchuKizaiMeisaiData={newIdoJuchuKizaiMeisaiData}
        // juchuContainerMeisaiData={newJuchuContainerMeisaiData}
        // shukoDate={shukoDate}
        // nyukoDate={nyukoDate}
        // dateRange={dateRange}
        // eqStockData={newEqStockData}
        juchuHonbanbiData={newJuchuHonbanbiData}
        edit={edit}
        fixFlag={fixFlag}
      />
    );

    // 既存
  } else {
    // 受注機材ヘッダーデータ
    const juchuKizaiHeadData = await getJuchuKizaiHead(juchuHeadId, juchuKizaiHeadId);

    if (!juchuKizaiHeadData) {
      return <div>受注機材情報が見つかりません。</div>;
    }

    // 受注本番日データ
    const juchuHonbanbiData = await getHonbanbi(juchuHeadId, juchuKizaiHeadId);

    return (
      <EquipmentOrderDetail
        juchuHeadData={juchuHeadData}
        juchuKizaiHeadData={juchuKizaiHeadData}
        // juchuKizaiMeisaiData={juchuKizaiMeisaiData}
        // idoJuchuKizaiMeisaiData={idoJuchuKizaiMeisaiData}
        // juchuContainerMeisaiData={juchuContainerMeisaiData}
        // shukoDate={shukoDate}
        // nyukoDate={nyukoDate}
        // dateRange={dateRange}
        // eqStockData={eqStockData}
        juchuHonbanbiData={juchuHonbanbiData}
        edit={edit}
        fixFlag={fixFlag}
      />
    );
  }
};
export default Page;
