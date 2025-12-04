import { getNyukoDetail, getNyukoDetailTable, getNyukoFixFlag } from './_lib/funcs';
import { NyukoDetailValues } from './_lib/types';
import { NyukoDetail } from './_ui/nyuko-detail';

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

  const nyukoDetailData = await getNyukoDetail(
    Number(params.jhId),
    Number(params.jkhKbn),
    Number(params.nbId),
    decodeURIComponent(params.nyushukoDat),
    Number(params.skId)
  );

  if (!nyukoDetailData) {
    return <div>エラー</div>;
  }

  const nyukoDetailTableData = await getNyukoDetailTable(
    nyukoDetailData.juchuHeadId,
    nyukoDetailData.juchuKizaiHeadKbn,
    nyukoDetailData.nyushukoBashoId,
    nyukoDetailData.nyushukoDat,
    nyukoDetailData.sagyoKbnId
  );

  if (!nyukoDetailTableData) {
    return <div>エラー</div>;
  }

  const fixFlag = await getNyukoFixFlag(
    Number(params.jhId),
    nyukoDetailData.juchuKizaiHeadIds[0],
    70,
    nyukoDetailData.nyushukoDat,
    Number(params.nbId)
  );
  return (
    <NyukoDetail nyukoDetailData={nyukoDetailData} nyukoDetailTableData={nyukoDetailTableData} fixFlag={fixFlag} />
  );
};
export default Page;
