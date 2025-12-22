import { getShukoEqptDetail, getShukoEqptDetailTable, getShukoFixFlag } from './_lib/funcs';
import { ShukoEqptDetailTableValues, ShukoEqptDetailValues } from './_lib/types';
import { ShukoEqptDetail } from './_ui/shuko-eqpt-detail';

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

  // 出庫機材詳細データ、出庫機材詳細テーブルデータ
  const [shukoEqptDetailData, shukoEqptDetailTableData] = await Promise.all([
    getShukoEqptDetail(
      Number(params.jhId),
      Number(params.jkhId),
      Number(params.jkmId),
      Number(params.nbId),
      date,
      Number(params.skId),
      Number(params.kizaiId)
    ),
    getShukoEqptDetailTable(
      Number(params.jhId),
      Number(params.jkhId),
      Number(params.jkmId),
      Number(params.nbId),
      date,
      Number(params.skId),
      Number(params.kizaiId)
    ),
  ]);

  if (!shukoEqptDetailData) {
    return <div>データが見つかりません</div>;
  }

  const fixFlag = await getShukoFixFlag(
    Number(params.jhId),
    shukoEqptDetailData.juchuKizaiHeadId,
    60,
    shukoEqptDetailData.nyushukoDat,
    Number(params.nbId)
  );

  return (
    <ShukoEqptDetail
      shukoEqptDetailData={shukoEqptDetailData}
      shukoEqptDetailTableData={shukoEqptDetailTableData}
      fixFlag={fixFlag}
    />
  );
};
export default Page;
