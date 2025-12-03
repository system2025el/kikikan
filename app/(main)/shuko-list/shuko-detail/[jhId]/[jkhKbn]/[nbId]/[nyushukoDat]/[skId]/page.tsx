import { getShukoDetail, getShukoFixFlag } from './_lib/funcs';
import { ShukoDetailValues } from './_lib/types';
import { ShukoDetail } from './_ui/shuko-detail';

const Page = async (props: {
  params: Promise<{
    jhId: string;
    jkhKbn: string;
    nbId: string;
    nyushukoDat: string;
    skId: string;
  }>;
}) => {
  const params = await props.params;

  const shukoDetailData: ShukoDetailValues = {
    juchuHeadId: Number(params.jhId),
    juchuKizaiHeadKbn: Number(params.jkhKbn),
    nyushukoBashoId: Number(params.nbId),
    nyushukoDat: decodeURIComponent(params.nyushukoDat),
    sagyoKbnId: Number(params.skId),
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
    Number(params.jhId),
    shukoDetailTableData[0].juchuKizaiHeadId!,
    60,
    shukoDetailData.nyushukoDat,
    Number(params.nbId)
  );
  console.log('取得');
  return (
    <ShukoDetail shukoDetailData={shukoDetailData} shukoDetailTableData={shukoDetailTableData} fixFlag={fixFlag} />
  );
};
export default Page;
