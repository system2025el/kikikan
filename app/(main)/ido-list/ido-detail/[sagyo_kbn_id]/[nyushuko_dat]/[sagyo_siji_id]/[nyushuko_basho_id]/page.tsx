import { getIdoDetail } from './_lib/funcs';
import { IdoDetail } from './_ui/ido-detail';

const Page = async (props: {
  params: Promise<{
    sagyo_kbn_id: string;
    nyushuko_dat: string;
    sagyo_siji_id: string;
    nyushuko_basho_id: string;
  }>;
}) => {
  const params = await props.params;
  const sagyoKbnId = Number(params.sagyo_kbn_id);
  if (sagyoKbnId !== 40 && sagyoKbnId !== 50) {
    <div>不正な作業区分IDです</div>;
  }

  const idoDetailData = await getIdoDetail(sagyoKbnId);
  return <IdoDetail sagyoKbnId={sagyoKbnId} />;
};
export default Page;
