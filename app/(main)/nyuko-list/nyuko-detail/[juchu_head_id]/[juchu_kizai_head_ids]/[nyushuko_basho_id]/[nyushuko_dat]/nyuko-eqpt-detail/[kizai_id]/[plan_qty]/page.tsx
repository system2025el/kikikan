import { getKizaiData, getNyukoEqptDetail } from './_lib/funcs';
import { NyukoEqptDetail } from './_ui/nyuko-eqpt-detail';

const Page = async (props: {
  params: Promise<{
    juchu_head_id: string;
    juchu_kizai_head_ids: string;
    nyushuko_basho_id: string;
    nyushuko_dat: string;
    kizai_id: string;
    plan_qty: string;
  }>;
}) => {
  const params = await props.params;

  const date = decodeURIComponent(params.nyushuko_dat);

  const nyukoEqptDetailData = await getNyukoEqptDetail(
    Number(params.juchu_head_id),
    Number(params.nyushuko_basho_id),
    date,
    Number(params.kizai_id)
  );

  const kizaiData = await getKizaiData(Number(params.kizai_id));
  if (!kizaiData) {
    return <div>機材データが見つかりません</div>;
  }

  return <NyukoEqptDetail params={params} nyukoEqptDetailData={nyukoEqptDetailData} kizaiData={kizaiData} />;
};
export default Page;
