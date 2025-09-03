import { GetNyukoDate, GetShukoDate } from '@/app/(main)/(eq-order-detail)/_lib/datefuncs';
import { GetJuchuHead } from '@/app/(main)/order/[juchu_head_id]/[mode]/_lib/funcs';

import { GetJuchuKizaiNyushuko } from '../../../../../_lib/funcs';
import { GetKeepJuchuKizaiHead, GetKeepJuchuKizaiMeisai } from './_lib/funcs';
import { KeepJuchuKizaiHeadValues, KeepJuchuKizaiMeisaiValues } from './_lib/types';
import { EquipmentKeepOrderDetail } from './_ui/equipment-keep-order-detail';

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
  const juchuHeadData = await GetJuchuHead(params.juchu_head_id);
  // 親受注機材入出庫データ
  const oyaJuchuKizaiNyushukoData = await GetJuchuKizaiNyushuko(params.juchu_head_id, params.oya_juchu_kizai_head_id);
  console.log('oyaJuchuKizaiNyushukoData', oyaJuchuKizaiNyushukoData);

  if (!juchuHeadData || !oyaJuchuKizaiNyushukoData) {
    return <div>受注情報が見つかりません。</div>;
  }

  // 出庫日
  const oyaShukoDate = GetShukoDate(
    oyaJuchuKizaiNyushukoData.kicsShukoDat ? new Date(oyaJuchuKizaiNyushukoData.kicsShukoDat) : null,
    oyaJuchuKizaiNyushukoData.yardShukoDat ? new Date(oyaJuchuKizaiNyushukoData.yardShukoDat) : null
  );
  // 入庫日
  const oyaNyukoDate = GetNyukoDate(
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
      juchuHeadId: Number(params.juchu_head_id),
      juchuKizaiHeadId: Number(params.juchu_kizai_head_id),
      juchuKizaiHeadKbn: 3,
      mem: null,
      headNam: '',
      oyaJuchuKizaiHeadId: Number(params.oya_juchu_kizai_head_id),
      kicsShukoDat: null,
      kicsNyukoDat: null,
      yardShukoDat: null,
      yardNyukoDat: null,
    };
    // キープ受注機材明細データ(初期値)
    const newKeepJuchuKizaiMeisaiData: KeepJuchuKizaiMeisaiValues[] = [];

    // キープ出庫日(初期値)
    const keepShukoDate = null;
    // キープ入庫日(初期値)
    const keepNyukoDate = null;

    return (
      <EquipmentKeepOrderDetail
        juchuHeadData={juchuHeadData}
        oyaJuchuKizaiHeadData={oyaJuchuKizaiNyushukoData}
        keepJuchuKizaiHeadData={newKeepJuchuKizaiHeadData}
        keepJuchuKizaiMeisaiData={newKeepJuchuKizaiMeisaiData}
        oyaShukoDate={oyaShukoDate}
        oyaNyukoDate={oyaNyukoDate}
        keepShukoDate={keepShukoDate}
        keepNyukoDate={keepNyukoDate}
        edit={edit}
      />
    );
    // 既存
  } else {
    // キープ受注機材ヘッダーデータ
    console.time();
    const keepJuchuKizaiHeadData = await GetKeepJuchuKizaiHead(params.juchu_head_id, params.juchu_kizai_head_id);
    console.log('---------------------受注機材ヘッダーキープ---------------------');
    console.timeEnd();

    if (!keepJuchuKizaiHeadData) {
      return <div>受注機材情報が見つかりません。</div>;
    }

    // キープ受注機材明細データ
    console.time();
    const juchuKizaiMeisaiData = await GetKeepJuchuKizaiMeisai(params.juchu_head_id, params.juchu_kizai_head_id);
    console.log('----------------------------受注機材明細---------------------------------');
    console.timeEnd();

    // キープ出庫日
    const keepShukoDate = GetShukoDate(
      keepJuchuKizaiHeadData.kicsShukoDat && new Date(keepJuchuKizaiHeadData.kicsShukoDat),
      keepJuchuKizaiHeadData.yardShukoDat && new Date(keepJuchuKizaiHeadData.yardShukoDat)
    );
    // キープ入庫日
    const keepNyukoDate = GetNyukoDate(
      keepJuchuKizaiHeadData.kicsNyukoDat && new Date(keepJuchuKizaiHeadData.kicsNyukoDat),
      keepJuchuKizaiHeadData.yardNyukoDat && new Date(keepJuchuKizaiHeadData.yardNyukoDat)
    );

    return (
      <EquipmentKeepOrderDetail
        juchuHeadData={juchuHeadData}
        oyaJuchuKizaiHeadData={oyaJuchuKizaiNyushukoData}
        keepJuchuKizaiHeadData={keepJuchuKizaiHeadData}
        keepJuchuKizaiMeisaiData={juchuKizaiMeisaiData}
        oyaShukoDate={oyaShukoDate}
        oyaNyukoDate={oyaNyukoDate}
        keepShukoDate={keepShukoDate}
        keepNyukoDate={keepNyukoDate}
        edit={edit}
      />
    );
  }
};
export default Page;
