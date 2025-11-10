import { getShukoDetail, getShukoFixFlag } from './_lib/funcs';
import { ShukoDetailValues } from './_lib/types';
import { ShukoDetail } from './_ui/shuko-detail';

const Page = async (props: {
  params: Promise<{
    juchuHeadId: string;
    juchuKizaiHeadKbn: string;
    nyushukoBashoId: string;
    nyushukoDat: string;
    sagyoKbnId: string;
  }>;
}) => {
  const params = await props.params;

  const shukoDetailData: ShukoDetailValues = {
    juchuHeadId: Number(params.juchuHeadId),
    juchuKizaiHeadKbn: Number(params.juchuKizaiHeadKbn),
    nyushukoBashoId: Number(params.nyushukoBashoId),
    nyushukoDat: decodeURIComponent(params.nyushukoDat),
    sagyoKbnId: Number(params.sagyoKbnId),
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
    Number(params.juchuHeadId),
    shukoDetailTableData[0].juchuKizaiHeadId!,
    60,
    shukoDetailData.nyushukoDat,
    Number(params.nyushukoBashoId)
  );
  return (
    <ShukoDetail shukoDetailData={shukoDetailData} shukoDetailTableData={shukoDetailTableData} fixFlag={fixFlag} />
  );
};
export default Page;
