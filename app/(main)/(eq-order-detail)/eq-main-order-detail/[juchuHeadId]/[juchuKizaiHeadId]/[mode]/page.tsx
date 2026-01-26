import { subDays } from 'date-fns';

import { getNyukoDate, getRange, getShukoDate } from '@/app/(main)/_lib/date-funcs';

import { getDetailJuchuHead, getJuchuContainerMeisai, getNyushukoFixFlag } from '../../../../_lib/funcs';
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

  // 受注ヘッダーデータ、出発フラグ
  const [juchuHeadData, fixFlag] = await Promise.all([
    getDetailJuchuHead(juchuHeadId),
    getNyushukoFixFlag(juchuHeadId, juchuKizaiHeadId, 60),
  ]);

  if (!juchuHeadData) {
    return <div>受注情報が見つかりません。</div>;
  }

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
    // 受注本番日データ
    const newJuchuHonbanbiData: JuchuKizaiHonbanbiValues[] = [];

    return (
      <EquipmentOrderDetail
        juchuHeadData={juchuHeadData}
        juchuKizaiHeadData={newJuchuKizaiHeadData}
        juchuHonbanbiData={newJuchuHonbanbiData}
        edit={edit}
        fixFlag={fixFlag}
      />
    );

    // 既存
  } else {
    // 受注機材ヘッダーデータ、受注本番日データ
    const [juchuKizaiHeadData, juchuHonbanbiData] = await Promise.all([
      getJuchuKizaiHead(juchuHeadId, juchuKizaiHeadId),
      getHonbanbi(juchuHeadId, juchuKizaiHeadId),
    ]);

    if (!juchuKizaiHeadData) {
      return <div>受注機材情報が見つかりません。</div>;
    }

    return (
      <EquipmentOrderDetail
        juchuHeadData={juchuHeadData}
        juchuKizaiHeadData={juchuKizaiHeadData}
        juchuHonbanbiData={juchuHonbanbiData}
        edit={edit}
        fixFlag={fixFlag}
      />
    );
  }
};
export default Page;
