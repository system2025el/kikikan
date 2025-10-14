import { getNyukoDetail } from './_lib/funcs';
import { NyukoDetail } from './_ui/nyuko-detail';

const Page = async (props: {
  params: Promise<{
    juchu_head_id: string;
    nyushuko_basho_id: string;
    nyushuko_dat: string;
  }>;
}) => {
  const params = await props.params;
  const date = decodeURIComponent(params.nyushuko_dat);
  const nyukoDetailData = await getNyukoDetail(Number(params.juchu_head_id), Number(params.nyushuko_basho_id), date);
  if (!nyukoDetailData) {
    return <div>入庫明細が見つかりません。</div>;
  }
  return <NyukoDetail nyukoDetailData={nyukoDetailData} />;
};
export default Page;
