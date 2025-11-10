import { getNyukoFixFlag } from '@/app/(main)/nyuko-list/_lib/funcs';

import { getNyukoDetail } from './_lib/funcs';
import { NyukoDetailValues } from './_lib/types';
import { NyukoDetail } from './_ui/nyuko-detail';

const Page = async (props: {
  params: Promise<{
    juchu_head_id: string;
    juchu_kizai_head_kbn: string;
    nyushuko_basho_id: string;
    nyushuko_dat: string;
    sagyo_kbn_id: string;
  }>;
}) => {
  const params = await props.params;

  const nyukoDetailData: NyukoDetailValues = {
    juchuHeadId: Number(params.juchu_head_id),
    juchuKizaiHeadKbn: Number(params.juchu_kizai_head_kbn),
    nyushukoBashoId: Number(params.nyushuko_basho_id),
    nyushukoDat: decodeURIComponent(params.nyushuko_dat),
    sagyoKbnId: Number(params.sagyo_kbn_id),
  };

  const nyukoDetailTableData = await getNyukoDetail(
    nyukoDetailData.juchuHeadId,
    nyukoDetailData.juchuKizaiHeadKbn,
    nyukoDetailData.nyushukoBashoId,
    nyukoDetailData.nyushukoDat,
    nyukoDetailData.sagyoKbnId
  );
  if (!nyukoDetailTableData) {
    return <div>入庫明細が見つかりません。</div>;
  }

  const fixFlag = await getNyukoFixFlag(
    Number(params.juchu_head_id),
    nyukoDetailTableData[0].juchuKizaiHeadId!,
    70,
    nyukoDetailData.nyushukoDat,
    Number(params.nyushuko_basho_id)
  );
  return (
    <NyukoDetail nyukoDetailData={nyukoDetailData} nyukoDetailTableData={nyukoDetailTableData} fixFlag={fixFlag} />
  );
};
export default Page;
