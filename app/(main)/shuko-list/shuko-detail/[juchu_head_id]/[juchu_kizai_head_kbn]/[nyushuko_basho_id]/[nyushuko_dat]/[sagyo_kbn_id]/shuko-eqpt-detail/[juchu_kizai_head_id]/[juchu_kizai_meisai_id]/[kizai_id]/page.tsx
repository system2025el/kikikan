import { getShukoEqptDetail, getShukoEqptDetailTable } from './_lib/funcs';
import { ShukoEqptDetailTableValues, ShukoEqptDetailValues } from './_lib/types';
import { ShukoEqptDetail } from './_ui/shuko-eqpt-detail';

const Page = async (props: {
  params: Promise<{
    juchu_head_id: string;
    juchu_kizai_head_kbn: string;
    nyushuko_basho_id: string;
    nyushuko_dat: string;
    sagyo_kbn_id: string;
    juchu_kizai_head_id: string;
    juchu_kizai_meisai_id: string;
    kizai_id: string;
  }>;
}) => {
  const params = await props.params;

  const date = decodeURIComponent(params.nyushuko_dat);

  const shukoEqptDetailData: ShukoEqptDetailValues | null = await getShukoEqptDetail(
    Number(params.juchu_head_id),
    Number(params.juchu_kizai_head_id),
    Number(params.juchu_kizai_meisai_id),
    Number(params.nyushuko_basho_id),
    date,
    Number(params.sagyo_kbn_id),
    Number(params.kizai_id)
  );
  if (!shukoEqptDetailData) {
    return <div>データが見つかりません</div>;
  }

  const shukoEqptDetailTableData: ShukoEqptDetailTableValues[] = await getShukoEqptDetailTable(
    Number(params.juchu_head_id),
    Number(params.juchu_kizai_head_id),
    Number(params.juchu_kizai_meisai_id),
    Number(params.nyushuko_basho_id),
    date,
    Number(params.sagyo_kbn_id),
    Number(params.kizai_id)
  );

  return (
    <ShukoEqptDetail shukoEqptDetailData={shukoEqptDetailData} shukoEqptDetailTableData={shukoEqptDetailTableData} />
  );
};
export default Page;
