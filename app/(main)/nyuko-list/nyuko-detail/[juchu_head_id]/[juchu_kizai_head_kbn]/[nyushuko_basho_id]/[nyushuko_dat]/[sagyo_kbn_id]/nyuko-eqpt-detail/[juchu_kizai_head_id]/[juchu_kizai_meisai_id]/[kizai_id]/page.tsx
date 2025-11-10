import { getNyukoEqptDetail, getNyukoEqptDetailTable } from './_lib/funcs';
import { NyukoEqptDetailTableValues, NyukoEqptDetailValues } from './_lib/types';
import { NyukoEqptDetail } from './_ui/nyuko-eqpt-detail';

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

  const nyukoEqptDetailData: NyukoEqptDetailValues | null = await getNyukoEqptDetail(
    Number(params.juchu_head_id),
    Number(params.juchu_kizai_head_id),
    Number(params.juchu_kizai_meisai_id),
    Number(params.nyushuko_basho_id),
    date,
    Number(params.sagyo_kbn_id),
    Number(params.kizai_id)
  );
  if (!nyukoEqptDetailData) {
    return <div>データが見つかりません</div>;
  }

  const nyukoEqptDetailTableData: NyukoEqptDetailTableValues[] = await getNyukoEqptDetailTable(
    Number(params.juchu_head_id),
    Number(params.juchu_kizai_head_id),
    Number(params.juchu_kizai_meisai_id),
    Number(params.nyushuko_basho_id),
    date,
    Number(params.sagyo_kbn_id),
    Number(params.kizai_id)
  );

  return (
    <NyukoEqptDetail nyukoEqptDetailData={nyukoEqptDetailData} nyukoEqptDetailTableData={nyukoEqptDetailTableData} />
  );
};
export default Page;
