import { Metadata } from 'next';

import { getNyukoDetail, getNyukoDetailTable, getNyukoFixFlag } from './_lib/funcs';
import { NyukoDetailValues } from './_lib/types';
import { NyukoDetail } from './_ui/nyuko-detail';

export const generateMetadata = async (props: {
  params: Promise<{
    jhId: string;
    jkhKbn: string;
    nbId: string;
    nyushukoDat: string;
    skId: string;
  }>;
}): Promise<Metadata> => {
  const params = await props.params;
  const product = await getNyukoDetail(
    Number(params.jhId),
    Number(params.jkhKbn),
    Number(params.nbId),
    decodeURIComponent(params.nyushukoDat),
    Number(params.skId)
  );

  return {
    title: `入庫明細 ${product?.koenNam}`,
    description: '入庫明細ページです',
  };
};

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

  // 入庫詳細、入庫詳細テーブルデータ
  const [nyukoDetailData, nyukoDetailTableData] = await Promise.all([
    getNyukoDetail(
      Number(params.jhId),
      Number(params.jkhKbn),
      Number(params.nbId),
      decodeURIComponent(params.nyushukoDat),
      Number(params.skId)
    ),
    getNyukoDetailTable(
      Number(params.jhId),
      Number(params.jkhKbn),
      Number(params.nbId),
      decodeURIComponent(params.nyushukoDat),
      Number(params.skId)
    ),
  ]);

  if (!nyukoDetailData || !nyukoDetailTableData) {
    return <div>入庫明細が見つかりません。</div>;
  }

  const fixFlag = await getNyukoFixFlag(
    Number(params.jhId),
    nyukoDetailData.juchuKizaiHeadIds[0],
    70,
    nyukoDetailData.nyushukoDat,
    Number(params.nbId)
  );
  return (
    <NyukoDetail nyukoDetailData={nyukoDetailData} nyukoDetailTableData={nyukoDetailTableData} fixFlag={fixFlag} />
  );
};
export default Page;
