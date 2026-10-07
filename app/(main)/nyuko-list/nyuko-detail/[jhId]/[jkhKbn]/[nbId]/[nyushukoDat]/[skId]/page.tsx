import { Typography } from '@mui/material';
import { Metadata } from 'next';
import { redirect } from 'next/navigation';

import { SAGYO_KBN_ID } from '@/app/_lib/constants';
import { getCurrentUser } from '@/app/(main)/_lib/funcs';
import { getNyushukoFixState } from '@/app/(main)/_lib/nyushuko-fix-state';
import { permission } from '@/app/(main)/_lib/permission';

import { getNyukoDetail, getNyukoDetailTable } from './_lib/funcs';
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

  const user = await getCurrentUser();
  if (!user) {
    await redirect('/login');
    return;
  }

  const hasPermission = !!(user.permission.nyushuko & permission.nyushuko_ref);

  if (!hasPermission) {
    return <Typography>このページを閲覧する権限がありません。</Typography>;
  }

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

  // 合体している全ヘッダーの到着状況（なし／一部／全部）
  const fixState = await getNyushukoFixState(
    Number(params.jhId),
    nyukoDetailData.juchuKizaiHeadIds,
    SAGYO_KBN_ID.nyukoConfirmed,
    nyukoDetailData.nyushukoDat,
    Number(params.nbId)
  );
  return (
    <NyukoDetail
      user={user}
      nyukoDetailData={nyukoDetailData}
      nyukoDetailTableData={nyukoDetailTableData}
      fixSts={fixState.fixSts}
    />
  );
};
export default Page;
