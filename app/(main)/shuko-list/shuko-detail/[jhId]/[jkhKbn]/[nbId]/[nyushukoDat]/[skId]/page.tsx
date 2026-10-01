import { Typography } from '@mui/material';
import { Metadata } from 'next';
import { redirect } from 'next/navigation';

import { SAGYO_KBN_ID } from '@/app/_lib/constants';
import { getCurrentUser } from '@/app/(main)/_lib/funcs';
import { getNyushukoFixState } from '@/app/(main)/_lib/nyushuko-fix-state';
import { permission } from '@/app/(main)/_lib/permission';

import { getShukoDetail, getShukoDetailTable } from './_lib/funcs';
import { ShukoDetailValues } from './_lib/types';
import { ShukoDetail } from './_ui/shuko-detail';

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
  const product = await getShukoDetail(
    Number(params.jhId),
    Number(params.jkhKbn),
    Number(params.nbId),
    decodeURIComponent(params.nyushukoDat),
    Number(params.skId)
  );

  return {
    title: `出庫明細 ${product?.koenNam}`,
    description: '出庫明細ページです',
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

  const user = await getCurrentUser();
  if (!user) {
    await redirect('/login');
    return;
  }

  const hasPermission = !!(user.permission.nyushuko & permission.nyushuko_ref);

  if (!hasPermission) {
    return <Typography>このページを閲覧する権限がありません。</Typography>;
  }

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

  // 合体している全ヘッダーの出発状況（なし／一部／全部）
  const fixState = await getNyushukoFixState(
    Number(params.jhId),
    shukoDetailData.juchuKizaiHeadIds,
    SAGYO_KBN_ID.shukoConfirmed,
    shukoDetailData.nyushukoDat,
    Number(params.nbId)
  );
  return (
    <ShukoDetail
      user={user}
      shukoDetailData={shukoDetailData}
      shukoDetailTableData={shukoDetailTableData}
      fixSts={fixState.fixSts}
      fixedJuchuKizaiHeadIds={fixState.fixedJuchuKizaiHeadIds}
    />
  );
};
export default Page;
