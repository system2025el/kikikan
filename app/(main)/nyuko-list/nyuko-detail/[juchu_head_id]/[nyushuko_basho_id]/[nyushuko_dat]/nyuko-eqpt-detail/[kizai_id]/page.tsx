import { getKizaiData, getNyukoEqptDetail, getNyukoKizaiDetail } from './_lib/funcs';
import { NyukoEqptDetail } from './_ui/nyuko-eqpt-detail';

const Page = async (props: {
  params: Promise<{
    juchu_head_id: string;
    nyushuko_basho_id: string;
    nyushuko_dat: string;
    kizai_id: string;
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

  const kizaiDetailData = await getNyukoKizaiDetail(
    Number(params.juchu_head_id),
    Number(params.nyushuko_basho_id),
    date,
    Number(params.kizai_id)
  );
  if (!kizaiDetailData) {
    return <div>データが見つかりません</div>;
  }

  return (
    <NyukoEqptDetail
      params={params}
      nyukoEqptDetailData={nyukoEqptDetailData}
      kizaiData={kizaiData}
      kizaiDetailData={kizaiDetailData}
    />
  );
};
export default Page;
