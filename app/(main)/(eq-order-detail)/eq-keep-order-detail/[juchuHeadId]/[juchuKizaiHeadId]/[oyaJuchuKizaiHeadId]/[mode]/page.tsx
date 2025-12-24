import { getNyukoDate, getShukoDate } from '@/app/(main)/_lib/date-funcs';

import { getDetailJuchuHead, getJuchuKizaiNyushuko, getNyushukoFixFlag } from '../../../../../_lib/funcs';
import { getKeepJuchuContainerMeisai, getKeepJuchuKizaiHead, getKeepJuchuKizaiMeisai } from './_lib/funcs';
import { KeepJuchuContainerMeisaiValues, KeepJuchuKizaiHeadValues, KeepJuchuKizaiMeisaiValues } from './_lib/types';
import { EquipmentKeepOrderDetail } from './_ui/equipment-keep-order-detail';

const Page = async (props: {
  params: Promise<{
    juchuHeadId: string;
    juchuKizaiHeadId: string;
    oyaJuchuKizaiHeadId: string;
    mode: string;
  }>;
}) => {
  const params = await props.params;
  // 受注ヘッダid
  const juchuHeadId = Number(params.juchuHeadId);
  // 受注機材ヘッダーid
  const juchuKizaiHeadId = Number(params.juchuKizaiHeadId);
  // 親受注機材ヘッダーid
  const oyaJuchuKizaiHeadId = Number(params.oyaJuchuKizaiHeadId);

  // 受注ヘッダーデータ、親受注機材入出庫データ、出庫フラグ、入庫フラグ
  const [juchuHeadData, oyaJuchuKizaiNyushukoData, shukoFixFlag, nyukoFixFlag] = await Promise.all([
    getDetailJuchuHead(juchuHeadId),
    getJuchuKizaiNyushuko(juchuHeadId, oyaJuchuKizaiHeadId),
    getNyushukoFixFlag(juchuHeadId, juchuKizaiHeadId, 60),
    getNyushukoFixFlag(juchuHeadId, juchuKizaiHeadId, 70),
  ]);

  if (!juchuHeadData || !oyaJuchuKizaiNyushukoData) {
    return <div>受注情報が見つかりません。</div>;
  }

  // 編集モード(edit:編集、view:閲覧)
  const edit = params.mode === 'edit' && !shukoFixFlag ? true : false;

  // 出庫日
  const oyaShukoDate = getShukoDate(
    oyaJuchuKizaiNyushukoData.kicsShukoDat ? new Date(oyaJuchuKizaiNyushukoData.kicsShukoDat) : null,
    oyaJuchuKizaiNyushukoData.yardShukoDat ? new Date(oyaJuchuKizaiNyushukoData.yardShukoDat) : null
  );
  // 入庫日
  const oyaNyukoDate = getNyukoDate(
    oyaJuchuKizaiNyushukoData.kicsNyukoDat ? new Date(oyaJuchuKizaiNyushukoData.kicsNyukoDat) : null,
    oyaJuchuKizaiNyushukoData.yardNyukoDat ? new Date(oyaJuchuKizaiNyushukoData.yardNyukoDat) : null
  );

  if (!oyaShukoDate || !oyaNyukoDate) {
    return <div>受注情報が見つかりません。</div>;
  }

  // 新規
  if (juchuKizaiHeadId === 0) {
    // キープ受注機材ヘッダーデータ(初期値)
    const newKeepJuchuKizaiHeadData: KeepJuchuKizaiHeadValues = {
      juchuHeadId: juchuHeadId,
      juchuKizaiHeadId: juchuKizaiHeadId,
      juchuKizaiHeadKbn: 3,
      mem: null,
      headNam: juchuHeadData.koenNam,
      oyaJuchuKizaiHeadId: oyaJuchuKizaiHeadId,
      kicsShukoDat: null,
      kicsNyukoDat: null,
      yardShukoDat: null,
      yardNyukoDat: null,
    };

    return (
      <EquipmentKeepOrderDetail
        juchuHeadData={juchuHeadData}
        oyaJuchuKizaiHeadData={oyaJuchuKizaiNyushukoData}
        keepJuchuKizaiHeadData={newKeepJuchuKizaiHeadData}
        oyaShukoDate={oyaShukoDate}
        oyaNyukoDate={oyaNyukoDate}
        edit={edit}
        shukoFixFlag={shukoFixFlag}
        nyukoFixFlag={nyukoFixFlag}
      />
    );
    // 既存
  } else {
    // キープ受注機材ヘッダーデータ
    const keepJuchuKizaiHeadData = await getKeepJuchuKizaiHead(juchuHeadId, juchuKizaiHeadId);

    if (!keepJuchuKizaiHeadData) {
      return <div>受注機材情報が見つかりません。</div>;
    }

    return (
      <EquipmentKeepOrderDetail
        juchuHeadData={juchuHeadData}
        oyaJuchuKizaiHeadData={oyaJuchuKizaiNyushukoData}
        keepJuchuKizaiHeadData={keepJuchuKizaiHeadData}
        oyaShukoDate={oyaShukoDate}
        oyaNyukoDate={oyaNyukoDate}
        edit={edit}
        shukoFixFlag={shukoFixFlag}
        nyukoFixFlag={nyukoFixFlag}
      />
    );
  }
};
export default Page;
