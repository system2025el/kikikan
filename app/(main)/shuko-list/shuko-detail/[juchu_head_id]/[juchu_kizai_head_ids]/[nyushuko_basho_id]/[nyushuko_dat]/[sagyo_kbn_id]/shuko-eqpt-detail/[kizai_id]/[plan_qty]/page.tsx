import { getKizaiData, getShukoEqptDetail } from './_lib/funcs';
import { ShukoEqptDetail } from './_ui/shuko-eqpt-detail';

const Page = async (props: {
  params: Promise<{
    juchu_head_id: string;
    juchu_kizai_head_ids: string;
    nyushuko_basho_id: string;
    nyushuko_dat: string;
    sagyo_kbn_id: string;
    kizai_id: string;
    plan_qty: string;
  }>;
}) => {
  const params = await props.params;

  const date = decodeURIComponent(params.nyushuko_dat);

  const shukoEqptDetailData = await getShukoEqptDetail(
    Number(params.juchu_head_id),
    Number(params.nyushuko_basho_id),
    date,
    Number(params.sagyo_kbn_id),
    Number(params.kizai_id)
  );

  const kizaiData = await getKizaiData(Number(params.kizai_id));
  if (!kizaiData) {
    return <div>機材データが見つかりません</div>;
  }

  return <ShukoEqptDetail params={params} shukoEqptDetailData={shukoEqptDetailData} kizaiData={kizaiData} />;
};
export default Page;
