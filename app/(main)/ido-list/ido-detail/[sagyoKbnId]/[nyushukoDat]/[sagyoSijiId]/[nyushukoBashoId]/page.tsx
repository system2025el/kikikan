import { getIdoDen, getIdoFix } from './_lib/funcs';
import { IdoDetailTableValues, IdoDetailValues } from './_lib/types';
import { IdoDetail } from './_ui/ido-detail';

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
  if (sagyoKbnId !== 40 && sagyoKbnId !== 50) {
    return <div>不正な作業区分IDです</div>;
  }
  if (isNaN(new Date(nyushukoDat).getTime())) {
    return <div>不正な入出庫日です</div>;
  }
  if (sagyoSijiId !== 1 && sagyoSijiId !== 2) {
    return <div>不正な作業指示IDです</div>;
  }
  if (nyushukoBashoId !== 1 && nyushukoBashoId !== 2) {
    return <div>不正な入出庫場所IDです</div>;
  }

  const idoDetailData: IdoDetailValues = {
    sagyoKbnId: sagyoKbnId,
    nyushukoDat: nyushukoDat,
    sagyoSijiId: sagyoSijiId,
    nyushukoBashoId: nyushukoBashoId,
  };

  const idoDenData = await getIdoDen(sagyoKbnId, sagyoSijiId, nyushukoDat, nyushukoBashoId);

  const fixKbn = sagyoKbnId === 40 ? 60 : 70;
  const fixFlag = await getIdoFix(fixKbn, sagyoSijiId, nyushukoDat, nyushukoBashoId);

  return <IdoDetail idoDetailData={idoDetailData} idoDetailTableData={idoDenData} fixFlag={fixFlag} />;
};
export default Page;
