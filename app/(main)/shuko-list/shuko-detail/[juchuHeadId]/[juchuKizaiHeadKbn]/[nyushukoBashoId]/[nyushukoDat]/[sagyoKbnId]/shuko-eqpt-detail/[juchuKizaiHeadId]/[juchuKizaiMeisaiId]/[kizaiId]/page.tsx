import { getShukoEqptDetail, getShukoEqptDetailTable } from './_lib/funcs';
import { ShukoEqptDetailTableValues, ShukoEqptDetailValues } from './_lib/types';
import { ShukoEqptDetail } from './_ui/shuko-eqpt-detail';

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

  const shukoEqptDetailData: ShukoEqptDetailValues | null = await getShukoEqptDetail(
    Number(params.juchuHeadId),
    Number(params.juchuKizaiHeadId),
    Number(params.juchuKizaiMeisaiId),
    Number(params.nyushukoBashoId),
    date,
    Number(params.sagyoKbnId),
    Number(params.kizaiId)
  );
  if (!shukoEqptDetailData) {
    return <div>データが見つかりません</div>;
  }

  const shukoEqptDetailTableData: ShukoEqptDetailTableValues[] = await getShukoEqptDetailTable(
    Number(params.juchuHeadId),
    Number(params.juchuKizaiHeadId),
    Number(params.juchuKizaiMeisaiId),
    Number(params.nyushukoBashoId),
    date,
    Number(params.sagyoKbnId),
    Number(params.kizaiId)
  );

  return (
    <ShukoEqptDetail shukoEqptDetailData={shukoEqptDetailData} shukoEqptDetailTableData={shukoEqptDetailTableData} />
  );
};
export default Page;
