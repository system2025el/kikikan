import { getNyukoFixFlag } from '@/app/(main)/nyuko-list/_lib/funcs';

import { getNyukoDetail } from './_lib/funcs';
import { NyukoDetailValues } from './_lib/types';
import { NyukoDetail } from './_ui/nyuko-detail';

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

  const nyukoDetailData: NyukoDetailValues = {
    juchuHeadId: Number(params.jhId),
    juchuKizaiHeadKbn: Number(params.jkhKbn),
    nyushukoBashoId: Number(params.nbId),
    nyushukoDat: decodeURIComponent(params.nyushukoDat),
    sagyoKbnId: Number(params.skId),
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
    Number(params.jhId),
    nyukoDetailTableData[0].juchuKizaiHeadId!,
    70,
    nyukoDetailData.nyushukoDat,
    Number(params.nbId)
  );
  return (
    <NyukoDetail nyukoDetailData={nyukoDetailData} nyukoDetailTableData={nyukoDetailTableData} fixFlag={fixFlag} />
  );
};
export default Page;
