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
  // 受注ヘッダーデータ
  const juchuHeadData = await getDetailJuchuHead(juchuHeadId);
  // 親受注機材入出庫データ
  const oyaJuchuKizaiNyushukoData = await getJuchuKizaiNyushuko(juchuHeadId, oyaJuchuKizaiHeadId);
  console.log('oyaJuchuKizaiNyushukoData', oyaJuchuKizaiNyushukoData);

  if (!juchuHeadData || !oyaJuchuKizaiNyushukoData) {
    return <div>受注情報が見つかりません。</div>;
  }

  // 出庫フラグ
  console.time();
  const shukoFixFlag = await getNyushukoFixFlag(juchuHeadId, juchuKizaiHeadId, 60);
  console.log('-----------------------------出発フラグ--------------------------');
  console.timeEnd();

  // 入庫フラグ
  console.time();
  const nyukoFixFlag = await getNyushukoFixFlag(juchuHeadId, juchuKizaiHeadId, 70);
  console.log('-----------------------------出発フラグ--------------------------');
  console.timeEnd();

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
      headNam: '',
      oyaJuchuKizaiHeadId: oyaJuchuKizaiHeadId,
      kicsShukoDat: null,
      kicsNyukoDat: null,
      yardShukoDat: null,
      yardNyukoDat: null,
    };
    // // キープ受注機材明細データ(初期値)
    // const newKeepJuchuKizaiMeisaiData: KeepJuchuKizaiMeisaiValues[] = [];

    // // キープ受注コンテナ明細データ(初期値)
    // const newKeepJuchuContainerMeisaiData: KeepJuchuContainerMeisaiValues[] = [];

    // // キープ出庫日(初期値)
    // const keepShukoDate = null;
    // // キープ入庫日(初期値)
    // const keepNyukoDate = null;

    return (
      <EquipmentKeepOrderDetail
        juchuHeadData={juchuHeadData}
        oyaJuchuKizaiHeadData={oyaJuchuKizaiNyushukoData}
        keepJuchuKizaiHeadData={newKeepJuchuKizaiHeadData}
        // keepJuchuKizaiMeisaiData={newKeepJuchuKizaiMeisaiData}
        // keepJuchuContainerMeisaiData={newKeepJuchuContainerMeisaiData}
        oyaShukoDate={oyaShukoDate}
        oyaNyukoDate={oyaNyukoDate}
        // keepShukoDate={keepShukoDate}
        // keepNyukoDate={keepNyukoDate}
        edit={edit}
        shukoFixFlag={shukoFixFlag}
        nyukoFixFlag={nyukoFixFlag}
      />
    );
    // 既存
  } else {
    // キープ受注機材ヘッダーデータ
    console.time();
    const keepJuchuKizaiHeadData = await getKeepJuchuKizaiHead(juchuHeadId, juchuKizaiHeadId);
    console.log('---------------------受注機材ヘッダーキープ---------------------');
    console.timeEnd();

    if (!keepJuchuKizaiHeadData) {
      return <div>受注機材情報が見つかりません。</div>;
    }

    // // キープ受注機材明細データ
    // console.time();
    // const juchuKizaiMeisaiData = await getKeepJuchuKizaiMeisai(juchuHeadId, juchuKizaiHeadId, oyaJuchuKizaiHeadId);
    // console.log('----------------------------受注機材明細---------------------------------');
    // console.timeEnd();

    // // キープ受注コンテナ明細データ
    // console.time();
    // const keepJuchuContainerMeisaiData = await getKeepJuchuContainerMeisai(
    //   juchuHeadId,
    //   juchuKizaiHeadId,
    //   oyaJuchuKizaiHeadId
    // );
    // console.log('----------------------------受注コンテナ明細---------------------------------');
    // console.timeEnd();

    // // キープ出庫日
    // const keepShukoDate = getShukoDate(
    //   keepJuchuKizaiHeadData.kicsShukoDat && new Date(keepJuchuKizaiHeadData.kicsShukoDat),
    //   keepJuchuKizaiHeadData.yardShukoDat && new Date(keepJuchuKizaiHeadData.yardShukoDat)
    // );
    // // キープ入庫日
    // const keepNyukoDate = getNyukoDate(
    //   keepJuchuKizaiHeadData.kicsNyukoDat && new Date(keepJuchuKizaiHeadData.kicsNyukoDat),
    //   keepJuchuKizaiHeadData.yardNyukoDat && new Date(keepJuchuKizaiHeadData.yardNyukoDat)
    // );

    return (
      <EquipmentKeepOrderDetail
        juchuHeadData={juchuHeadData}
        oyaJuchuKizaiHeadData={oyaJuchuKizaiNyushukoData}
        keepJuchuKizaiHeadData={keepJuchuKizaiHeadData}
        // keepJuchuKizaiMeisaiData={juchuKizaiMeisaiData}
        // keepJuchuContainerMeisaiData={keepJuchuContainerMeisaiData}
        oyaShukoDate={oyaShukoDate}
        oyaNyukoDate={oyaNyukoDate}
        // keepShukoDate={keepShukoDate}
        // keepNyukoDate={keepNyukoDate}
        edit={edit}
        shukoFixFlag={shukoFixFlag}
        nyukoFixFlag={nyukoFixFlag}
      />
    );
  }
};
export default Page;
