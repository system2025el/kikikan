import { Typography } from '@mui/material';
import { Metadata } from 'next';
import { redirect } from 'next/navigation';

import { getCurrentUser } from '@/app/(main)/_lib/funcs';
import { permission } from '@/app/(main)/_lib/permission';

import { getNyukoEqptDetail, getNyukoEqptDetailTable, getNyukoFixFlag } from './_lib/funcs';
import { NyukoEqptDetailTableValues, NyukoEqptDetailValues } from './_lib/types';
import { NyukoEqptDetail } from './_ui/nyuko-eqpt-detail';

export const metadata: Metadata = {
  title: '入庫詳細',
  description: '入庫詳細ページです',
};

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

  const user = await getCurrentUser();
  if (!user) {
    await redirect('/login');
    return;
  }

  const hasPermission = !!(user.permission.nyushuko & permission.nyushuko_ref);

  if (!hasPermission) {
    return <Typography>このページを閲覧する権限がありません。</Typography>;
  }

  const date = decodeURIComponent(params.nyushukoDat);

  // 入庫機材詳細データ、入庫機材詳細テーブルデータ
  const [nyukoEqptDetailData, nyukoEqptDetailTableData] = await Promise.all([
    getNyukoEqptDetail(
      Number(params.jhId),
      Number(params.jkhId),
      Number(params.jkmId),
      Number(params.jkhKbn),
      Number(params.nbId),
      date,
      Number(params.skId),
      Number(params.kizaiId)
    ),
    getNyukoEqptDetailTable(
      Number(params.jhId),
      Number(params.jkhId),
      Number(params.jkmId),
      Number(params.nbId),
      date,
      Number(params.skId),
      Number(params.kizaiId)
    ),
  ]);
  if (!nyukoEqptDetailData) {
    return <div>データが見つかりません</div>;
  }

  const fixFlag = await getNyukoFixFlag(
    Number(params.jhId),
    nyukoEqptDetailData.juchuKizaiHeadId,
    70,
    nyukoEqptDetailData.nyushukoDat,
    Number(params.nbId)
  );

  return (
    <NyukoEqptDetail
      user={user}
      nyukoEqptDetailData={nyukoEqptDetailData}
      nyukoEqptDetailTableData={nyukoEqptDetailTableData}
      fixFlag={fixFlag}
    />
  );
};
export default Page;
