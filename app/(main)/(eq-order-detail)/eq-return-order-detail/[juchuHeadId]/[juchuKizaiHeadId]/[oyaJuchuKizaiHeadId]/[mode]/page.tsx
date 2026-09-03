import { Typography } from '@mui/material';
import { subDays } from 'date-fns';
import { Metadata } from 'next';
import { redirect } from 'next/navigation';

import { JUCHU_KIZAI_HEAD_KBN, SAGYO_KBN_ID } from '@/app/_lib/constants';
import { getNyukoDate, getRange, getShukoDate } from '@/app/(main)/_lib/date-funcs';
import { getCurrentUser } from '@/app/(main)/_lib/funcs';
import { permission } from '@/app/(main)/_lib/permission';
import { StockTableValues } from '@/app/(main)/(eq-order-detail)/eq-main-order-detail/[juchuHeadId]/[juchuKizaiHeadId]/[mode]/_lib/types';

import { getDetailJuchuHead, getJuchuKizaiNyushuko, getNyushukoFixFlag } from '../../../../../_lib/funcs';
import { getReturnJuchuContainerMeisai, getReturnJuchuKizaiHead, getReturnJuchuKizaiMeisai } from './_lib/funcs';
import {
  ReturnJuchuContainerMeisaiValues,
  ReturnJuchuKizaiHeadValues,
  ReturnJuchuKizaiMeisaiValues,
} from './_lib/types';
import { EquipmentReturnOrderDetail } from './_ui/equipment-return-order-detail';

export const generateMetadata = async (props: {
  params: Promise<{ juchuHeadId: string; juchuKizaiHeadId: string; mode: string }>;
}): Promise<Metadata> => {
  const params = await props.params;
  const product = await getDetailJuchuHead(Number(params.juchuHeadId));

  return {
    title: `受注明細 ${product?.koenNam}`,
    description: '受注明細(返却)ページです',
  };
};

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

  const user = await getCurrentUser();
  if (!user) {
    await redirect('/login');
    return;
  }

  const required = juchuKizaiHeadId === 0 ? permission.juchu_upd : permission.juchu_ref;
  const hasPermission = !!(user.permission.juchu & required);

  if (!hasPermission) {
    return <Typography>このページを閲覧する権限がありません。</Typography>;
  }

  // 受注ヘッダーデータ、親受注機材入出庫データ、入庫フラグ
  const [juchuHeadData, oyaJuchuKizaiHeadData, nyukoFixFlag] = await Promise.all([
    getDetailJuchuHead(juchuHeadId),
    getJuchuKizaiNyushuko(juchuHeadId, oyaJuchuKizaiHeadId),
    getNyushukoFixFlag(juchuHeadId, juchuKizaiHeadId, SAGYO_KBN_ID.nyukoConfirmed),
  ]);

  if (!juchuHeadData || !oyaJuchuKizaiHeadData) {
    return <div>受注情報が見つかりません。</div>;
  }

  // 親出庫日
  const oyaShukoDate = getShukoDate(oyaJuchuKizaiHeadData.kicsShukoDat, oyaJuchuKizaiHeadData.yardShukoDat);
  // 親入庫日
  const oyaNyukoDate = getNyukoDate(oyaJuchuKizaiHeadData.kicsNyukoDat, oyaJuchuKizaiHeadData.yardNyukoDat);

  if (!oyaShukoDate || !oyaNyukoDate) {
    return <div>受注情報が見つかりません。</div>;
  }

  // 在庫テーブルヘッダー用日付範囲
  const stockTableHeaderDateRange = getRange(oyaShukoDate, oyaNyukoDate);

  // 新規
  if (juchuKizaiHeadId === 0) {
    // 返却受注機材ヘッダーデータ(初期値)
    // 本番日数は伝票画面の保存時に受注本番日テンプレートから算出されるため、ここでは0から始める
    const newReturnJuchuKizaiHeadData: ReturnJuchuKizaiHeadValues = {
      juchuHeadId: juchuHeadId,
      juchuKizaiHeadId: juchuKizaiHeadId,
      juchuKizaiHeadKbn: JUCHU_KIZAI_HEAD_KBN.return,
      juchuHonbanbiQty: 0,
      //nebikiAmt: null,
      mem: null,
      headNam: '',
      oyaJuchuKizaiHeadId: oyaJuchuKizaiHeadId,
      kicsNyukoDat: null,
      yardNyukoDat: null,
    };

    return (
      <EquipmentReturnOrderDetail
        user={user}
        juchuHeadData={juchuHeadData}
        oyaJuchuKizaiHeadData={oyaJuchuKizaiHeadData}
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
        user={user}
        juchuHeadData={juchuHeadData}
        oyaJuchuKizaiHeadData={oyaJuchuKizaiHeadData}
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
