import { Metadata } from 'next';

import { BASHO_ID, SAGYO_KBN_ID, SAGYO_SIJI_ID } from '@/app/_lib/constants';

import { getIdoDen, getIdoFix } from './_lib/funcs';
import { IdoDetailTableValues, IdoDetailValues } from './_lib/types';
import { IdoDetail } from './_ui/ido-detail';

export const metadata: Metadata = {
  title: '移動明細',
  description: '移動明細ページです',
};

const Page = async (props: {
  params: Promise<{
    sagyoKbnId: string;
    nyushukoDat: string;
    sagyoSijiId: string;
    nyushukoBashoId: string;
  }>;
}) => {
  const params = await props.params;
  const sagyoKbnId = Number(params.sagyoKbnId);
  const nyushukoDat = decodeURIComponent(params.nyushukoDat);
  const sagyoSijiId = Number(params.sagyoSijiId);
  const nyushukoBashoId = Number(params.nyushukoBashoId);
  if (sagyoKbnId !== SAGYO_KBN_ID.idoShuko && sagyoKbnId !== SAGYO_KBN_ID.idoNyuko) {
    return <div>不正な作業区分IDです</div>;
  }
  if (isNaN(new Date(nyushukoDat).getTime())) {
    return <div>不正な入出庫日です</div>;
  }
  if (sagyoSijiId !== SAGYO_SIJI_ID.ky && sagyoSijiId !== SAGYO_SIJI_ID.yk) {
    return <div>不正な作業指示IDです</div>;
  }
  if (nyushukoBashoId !== BASHO_ID.kics && nyushukoBashoId !== BASHO_ID.yard) {
    return <div>不正な入出庫場所IDです</div>;
  }

  const idoDetailData: IdoDetailValues = {
    sagyoKbnId: sagyoKbnId,
    nyushukoDat: nyushukoDat,
    sagyoSijiId: sagyoSijiId,
    nyushukoBashoId: nyushukoBashoId,
  };

  const fixKbn = sagyoKbnId === SAGYO_KBN_ID.idoShuko ? SAGYO_KBN_ID.shukoConfirmed : SAGYO_KBN_ID.nyukoConfirmed;

  // 移動伝票データ、完了フラグ
  const [idoDenData, fixFlag] = await Promise.all([
    getIdoDen(sagyoKbnId, sagyoSijiId, nyushukoDat, nyushukoBashoId),
    getIdoFix(fixKbn, sagyoSijiId, nyushukoDat, nyushukoBashoId),
  ]);

  return <IdoDetail idoDetailData={idoDetailData} idoDetailTableData={idoDenData} fixFlag={fixFlag} />;
};
export default Page;
