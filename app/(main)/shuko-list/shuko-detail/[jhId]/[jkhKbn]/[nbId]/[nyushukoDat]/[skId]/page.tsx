import { Typography } from '@mui/material';
import { Metadata } from 'next';
import { redirect } from 'next/navigation';

import { FIX_STS, isJizenSagyoKbn, SAGYO_KBN_ID } from '@/app/_lib/constants';
import { getCurrentUser } from '@/app/(main)/_lib/funcs';
import { getNyushukoFixState } from '@/app/(main)/_lib/nyushuko-fix-state';
import { permission } from '@/app/(main)/_lib/permission';
import { NyushukoDetailNotFound } from '@/app/(main)/_ui/nyushuko-not-found';

import { getShukoDetail, getShukoDetailTable } from './_lib/funcs';
import { getHonbanShukoFixed } from './_lib/jizen-funcs';
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
  searchParams: Promise<{ jkhId?: string }>;
}): Promise<Metadata> => {
  const params = await props.params;
  const { jkhId } = await props.searchParams;
  const product = await getShukoDetail(
    Number(params.jhId),
    Number(params.jkhKbn),
    Number(params.nbId),
    decodeURIComponent(params.nyushukoDat),
    Number(params.skId),
    jkhId ? Number(jkhId) : undefined
  );

  return {
    title: `${isJizenSagyoKbn(Number(params.skId)) ? '事前明細' : '出庫明細'} ${product?.koenNam ?? ''}`,
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
  /** 事前（作業区分 80/90）のときだけ受注機材ヘッダーidを付ける（事前は機材ヘッダーごとに開くため） */
  searchParams: Promise<{ jkhId?: string }>;
}) => {
  const params = await props.params;
  const { jkhId } = await props.searchParams;
  const jizen = isJizenSagyoKbn(Number(params.skId));
  const juchuKizaiHeadId = jkhId ? Number(jkhId) : undefined;

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
      Number(params.skId),
      juchuKizaiHeadId
    ),
    getShukoDetailTable(
      Number(params.jhId),
      Number(params.jkhKbn),
      Number(params.nbId),
      decodeURIComponent(params.nyushukoDat),
      Number(params.skId),
      juchuKizaiHeadId
    ),
  ]);

  if (!shukoDetailData || !shukoDetailTableData) {
    return <NyushukoDetailNotFound message="出庫明細が見つかりません。" />;
  }

  // 事前には出発が無い。本番（同じ機材ヘッダー・場所）が出発済みなら「出発済み」として扱い、補正・実績クリアを止める
  if (jizen) {
    const honbanFixed = await getHonbanShukoFixed(
      Number(params.jhId),
      shukoDetailData.juchuKizaiHeadIds[0],
      Number(params.nbId)
    );
    return (
      <ShukoDetail
        user={user}
        shukoDetailData={shukoDetailData}
        shukoDetailTableData={shukoDetailTableData}
        fixSts={honbanFixed ? FIX_STS.all : FIX_STS.none}
        fixedJuchuKizaiHeadIds={honbanFixed ? shukoDetailData.juchuKizaiHeadIds : []}
      />
    );
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
