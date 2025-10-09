import { getShukoDetail } from './_lib/funcs';
import { ShukoDetail } from './_ui/shuko-detail';

const Page = async (props: {
  params: Promise<{ juchu_head_id: string; nyushuko_basho_id: string; nyushuko_dat: string; sagyo_kbn_id: string }>;
}) => {
  const params = await props.params;
  const date = decodeURIComponent(params.nyushuko_dat);
  const shukoDetailData = await getShukoDetail(
    Number(params.juchu_head_id),
    Number(params.nyushuko_basho_id),
    date,
    Number(params.sagyo_kbn_id)
  );
  if (!shukoDetailData) {
    return <div>出庫明細が見つかりません。</div>;
  }
  return <ShukoDetail shukoDetailData={shukoDetailData} />;
};
export default Page;
