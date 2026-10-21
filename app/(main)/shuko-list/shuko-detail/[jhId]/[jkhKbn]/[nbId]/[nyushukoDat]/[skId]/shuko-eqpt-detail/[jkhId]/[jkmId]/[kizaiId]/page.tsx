import { Typography } from '@mui/material';
import { Metadata } from 'next';
import { redirect } from 'next/navigation';

import { isJizenSagyoKbn } from '@/app/_lib/constants';
import { getCurrentUser } from '@/app/(main)/_lib/funcs';
import { permission } from '@/app/(main)/_lib/permission';
import { NyushukoEqptDetailNotFound } from '@/app/(main)/_ui/nyushuko-not-found';

import { getHonbanShukoFixed } from '../../../../_lib/jizen-funcs';
import { getShukoEqptDetail, getShukoEqptDetailTable, getShukoFixFlag } from './_lib/funcs';
import { ShukoEqptDetailTableValues, ShukoEqptDetailValues } from './_lib/types';
import { ShukoEqptDetail } from './_ui/shuko-eqpt-detail';

export const metadata: Metadata = {
  title: '出庫詳細',
  description: '出庫詳細ページです',
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

  // 出庫機材詳細データ、出庫機材詳細テーブルデータ
  const [shukoEqptDetailData, shukoEqptDetailTableData] = await Promise.all([
    getShukoEqptDetail(
      Number(params.jhId),
      Number(params.jkhId),
      Number(params.jkmId),
      Number(params.jkhKbn),
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
    return (
      <NyushukoEqptDetailNotFound
        message="データが見つかりません"
        backLabel="出庫明細"
        backPath={
          `/shuko-list/shuko-detail/${params.jhId}/${params.jkhKbn}/${params.nbId}/${date}/${params.skId}` +
          (isJizenSagyoKbn(Number(params.skId)) ? `?jkhId=${params.jkhId}` : '')
        }
      />
    );
  }

  // 事前（80/90）には出発が無いので、本番（同じ機材ヘッダー・場所）が出発済みかを見る（補正・実績クリアを止める）
  const fixFlag = isJizenSagyoKbn(Number(params.skId))
    ? await getHonbanShukoFixed(Number(params.jhId), shukoEqptDetailData.juchuKizaiHeadId, Number(params.nbId))
    : await getShukoFixFlag(
        Number(params.jhId),
        shukoEqptDetailData.juchuKizaiHeadId,
        60,
        shukoEqptDetailData.nyushukoDat,
        Number(params.nbId)
      );

  return (
    <ShukoEqptDetail
      user={user}
      shukoEqptDetailData={shukoEqptDetailData}
      shukoEqptDetailTableData={shukoEqptDetailTableData}
      fixFlag={fixFlag}
    />
  );
};
export default Page;
