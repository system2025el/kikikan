import { getShukoDetail, getShukoFixFlag } from './_lib/funcs';
import { ShukoDetailValues } from './_lib/types';
import { ShukoDetail } from './_ui/shuko-detail';

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

  const shukoDetailData: ShukoDetailValues = {
    juchuHeadId: Number(params.juchu_head_id),
    juchuKizaiHeadKbn: Number(params.juchu_kizai_head_kbn),
    nyushukoBashoId: Number(params.nyushuko_basho_id),
    nyushukoDat: decodeURIComponent(params.nyushuko_dat),
    sagyoKbnId: Number(params.sagyo_kbn_id),
  };

  const shukoDetailTableData = await getShukoDetail(
    shukoDetailData.juchuHeadId,
    shukoDetailData.juchuKizaiHeadKbn,
    shukoDetailData.nyushukoBashoId,
    shukoDetailData.nyushukoDat,
    shukoDetailData.sagyoKbnId
  );
  if (!shukoDetailTableData || shukoDetailTableData.length <= 0) {
    return <div>出庫明細が見つかりません。</div>;
  }

  const fixFlag = await getShukoFixFlag(
    Number(params.juchu_head_id),
    shukoDetailTableData[0].juchuKizaiHeadId!,
    60,
    shukoDetailData.nyushukoDat,
    Number(params.nyushuko_basho_id)
  );
  return (
    <ShukoDetail shukoDetailData={shukoDetailData} shukoDetailTableData={shukoDetailTableData} fixFlag={fixFlag} />
  );
};
export default Page;
