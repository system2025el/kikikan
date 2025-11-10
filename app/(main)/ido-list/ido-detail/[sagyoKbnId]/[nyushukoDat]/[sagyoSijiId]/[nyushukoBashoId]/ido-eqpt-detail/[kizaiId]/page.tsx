import { getIdoDenDetail, getIdoEqptDetail } from './_lib/funcs';
import { IdoEqptDetail } from './_ui/ido-eqpt-detail';

const Page = async (props: {
  params: Promise<{
    sagyoKbnId: string;
    nyushukoDat: string;
    sagyoSijiId: string;
    nyushukoBashoId: string;
    kizaiId: string;
  }>;
}) => {
  const params = await props.params;

  const idoDenDetailData = await getIdoDenDetail(
    Number(params.sagyoKbnId),
    Number(params.sagyoSijiId),
    params.nyushukoDat,
    Number(params.nyushukoBashoId),
    Number(params.kizaiId)
  );

  const idoEqptDetailData = await getIdoEqptDetail(
    Number(params.sagyoKbnId),
    Number(params.sagyoSijiId),
    params.nyushukoDat,
    Number(params.nyushukoBashoId),
    Number(params.kizaiId)
  );

  return <IdoEqptDetail idoDenDetailData={idoDenDetailData} idoEqptDetailData={idoEqptDetailData} />;
};
export default Page;
