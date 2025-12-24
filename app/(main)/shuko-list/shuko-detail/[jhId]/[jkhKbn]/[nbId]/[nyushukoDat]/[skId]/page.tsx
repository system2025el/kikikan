import { getShukoDetail, getShukoDetailTable, getShukoFixFlag } from './_lib/funcs';
import { ShukoDetailValues } from './_lib/types';
import { ShukoDetail } from './_ui/shuko-detail';

const Page = async (props: {
  params: Promise<{
    jhId: string;
    jkhKbn: string;
    nbId: string;
    nyushukoDat: string;
    skId: string;
  }>;
}) => {
  const params = await props.params;

  // 出庫詳細、出庫詳細テーブルデータ
  const [shukoDetailData, shukoDetailTableData] = await Promise.all([
    getShukoDetail(
      Number(params.jhId),
      Number(params.jkhKbn),
      Number(params.nbId),
      decodeURIComponent(params.nyushukoDat),
      Number(params.skId)
    ),
    getShukoDetailTable(
      Number(params.jhId),
      Number(params.jkhKbn),
      Number(params.nbId),
      decodeURIComponent(params.nyushukoDat),
      Number(params.skId)
    ),
  ]);

  if (!shukoDetailData || !shukoDetailTableData) {
    return <div>出庫明細が見つかりません。</div>;
  }

  const fixFlag = await getShukoFixFlag(
    Number(params.jhId),
    shukoDetailData.juchuKizaiHeadIds[0],
    60,
    shukoDetailData.nyushukoDat,
    Number(params.nbId)
  );
  return (
    <ShukoDetail shukoDetailData={shukoDetailData} shukoDetailTableData={shukoDetailTableData} fixFlag={fixFlag} />
  );
};
export default Page;
