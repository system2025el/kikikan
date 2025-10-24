import { getIdoDenDetail, getIdoEqptDetail } from './_lib/funcs';
import { IdoEqptDetail } from './_ui/ido-eqpt-detail';

const Page = async (props: {
  params: Promise<{
    sagyo_kbn_id: string;
    nyushuko_dat: string;
    sagyo_siji_id: string;
    nyushuko_basho_id: string;
    kizai_id: string;
  }>;
}) => {
  const params = await props.params;

  const idoDenDetailData = await getIdoDenDetail(
    Number(params.sagyo_kbn_id),
    Number(params.sagyo_siji_id),
    params.nyushuko_dat,
    Number(params.nyushuko_basho_id),
    Number(params.kizai_id)
  );

  const idoEqptDetailData = await getIdoEqptDetail(
    Number(params.sagyo_kbn_id),
    Number(params.sagyo_siji_id),
    params.nyushuko_dat,
    Number(params.nyushuko_basho_id),
    Number(params.kizai_id)
  );

  return <IdoEqptDetail idoDenDetailData={idoDenDetailData} idoEqptDetailData={idoEqptDetailData} />;
};
export default Page;
