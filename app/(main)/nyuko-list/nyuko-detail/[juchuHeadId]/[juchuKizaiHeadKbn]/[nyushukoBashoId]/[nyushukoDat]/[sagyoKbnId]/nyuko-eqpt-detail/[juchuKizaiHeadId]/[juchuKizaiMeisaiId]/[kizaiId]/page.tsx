import { getNyukoEqptDetail, getNyukoEqptDetailTable } from './_lib/funcs';
import { NyukoEqptDetailTableValues, NyukoEqptDetailValues } from './_lib/types';
import { NyukoEqptDetail } from './_ui/nyuko-eqpt-detail';

const Page = async (props: {
  params: Promise<{
    juchuHeadId: string;
    juchuKizaiHeadKbn: string;
    nyushukoBashoId: string;
    nyushukoDat: string;
    sagyoKbnId: string;
    juchuKizaiHeadId: string;
    juchuKizaiMeisaiId: string;
    kizaiId: string;
  }>;
}) => {
  const params = await props.params;

  const date = decodeURIComponent(params.nyushukoDat);

  const nyukoEqptDetailData: NyukoEqptDetailValues | null = await getNyukoEqptDetail(
    Number(params.juchuHeadId),
    Number(params.juchuKizaiHeadId),
    Number(params.juchuKizaiMeisaiId),
    Number(params.nyushukoBashoId),
    date,
    Number(params.sagyoKbnId),
    Number(params.kizaiId)
  );
  if (!nyukoEqptDetailData) {
    return <div>データが見つかりません</div>;
  }

  const nyukoEqptDetailTableData: NyukoEqptDetailTableValues[] = await getNyukoEqptDetailTable(
    Number(params.juchuHeadId),
    Number(params.juchuKizaiHeadId),
    Number(params.juchuKizaiMeisaiId),
    Number(params.nyushukoBashoId),
    date,
    Number(params.sagyoKbnId),
    Number(params.kizaiId)
  );

  return (
    <NyukoEqptDetail nyukoEqptDetailData={nyukoEqptDetailData} nyukoEqptDetailTableData={nyukoEqptDetailTableData} />
  );
};
export default Page;
