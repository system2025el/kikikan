import { getNyukoFixFlag } from '@/app/(main)/nyuko-list/_lib/funcs';

import { getNyukoDetail } from './_lib/funcs';
import { NyukoDetailValues } from './_lib/types';
import { NyukoDetail } from './_ui/nyuko-detail';

const Page = async (props: {
  params: Promise<{
    juchuHeadId: string;
    juchuKizaiHeadKbn: string;
    nyushukoBashoId: string;
    nyushukoDat: string;
    sagyoKbnId: string;
  }>;
}) => {
  const params = await props.params;

  const nyukoDetailData: NyukoDetailValues = {
    juchuHeadId: Number(params.juchuHeadId),
    juchuKizaiHeadKbn: Number(params.juchuKizaiHeadKbn),
    nyushukoBashoId: Number(params.nyushukoBashoId),
    nyushukoDat: decodeURIComponent(params.nyushukoDat),
    sagyoKbnId: Number(params.sagyoKbnId),
  };

  const nyukoDetailTableData = await getNyukoDetail(
    nyukoDetailData.juchuHeadId,
    nyukoDetailData.juchuKizaiHeadKbn,
    nyukoDetailData.nyushukoBashoId,
    nyukoDetailData.nyushukoDat,
    nyukoDetailData.sagyoKbnId
  );
  if (!nyukoDetailTableData) {
    return <div>入庫明細が見つかりません。</div>;
  }

  const fixFlag = await getNyukoFixFlag(
    Number(params.juchuHeadId),
    nyukoDetailTableData[0].juchuKizaiHeadId!,
    70,
    nyukoDetailData.nyushukoDat,
    Number(params.nyushukoBashoId)
  );
  return (
    <NyukoDetail nyukoDetailData={nyukoDetailData} nyukoDetailTableData={nyukoDetailTableData} fixFlag={fixFlag} />
  );
};
export default Page;
