import { getNyukoEqptDetail, getNyukoEqptDetailTable, getNyukoFixFlag } from './_lib/funcs';
import { NyukoEqptDetailTableValues, NyukoEqptDetailValues } from './_lib/types';
import { NyukoEqptDetail } from './_ui/nyuko-eqpt-detail';

const Page = async (props: {
  params: Promise<{
    jhId: string;
    jkhKbn: string;
    nbId: string;
    nyushukoDat: string;
    skId: string;
    jkhId: string;
    jkmId: string;
    kizaiId: string;
  }>;
}) => {
  const params = await props.params;

  const date = decodeURIComponent(params.nyushukoDat);
  console.log('a');

  const nyukoEqptDetailData: NyukoEqptDetailValues | null = await getNyukoEqptDetail(
    Number(params.jhId),
    Number(params.jkhId),
    Number(params.jkmId),
    Number(params.nbId),
    date,
    Number(params.skId),
    Number(params.kizaiId)
  );
  if (!nyukoEqptDetailData) {
    return <div>データが見つかりません</div>;
  }

  const nyukoEqptDetailTableData: NyukoEqptDetailTableValues[] = await getNyukoEqptDetailTable(
    Number(params.jhId),
    Number(params.jkhId),
    Number(params.jkmId),
    Number(params.nbId),
    date,
    Number(params.skId),
    Number(params.kizaiId)
  );

  const fixFlag = await getNyukoFixFlag(
    Number(params.jhId),
    nyukoEqptDetailData.juchuKizaiHeadId,
    70,
    nyukoEqptDetailData.nyushukoDat,
    Number(params.nbId)
  );

  return (
    <NyukoEqptDetail
      nyukoEqptDetailData={nyukoEqptDetailData}
      nyukoEqptDetailTableData={nyukoEqptDetailTableData}
      fixFlag={fixFlag}
    />
  );
};
export default Page;
