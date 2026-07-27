import { Typography } from '@mui/material';
import { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { Suspense } from 'react';

import { getCurrentUser } from '@/app/(main)/_lib/funcs';
import { permission } from '@/app/(main)/_lib/permission';
import { LoadingOverlay } from '@/app/(main)/_ui/loading';
import { getDetailJuchuHead } from '@/app/(main)/(eq-order-detail)/_lib/funcs';

import VehicleOrderDetail from './_ui/vehicle-order-detail';

export const metadata: Metadata = {
  title: '車両明細',
  description: '車両明細ページです',
};

const Page = async (props: {
  params: Promise<{
    jhid: string;
    jshid: string;
    mode: string;
  }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) => {
  const params = await props.params;
  /** 受注ヘッダーデータ */
  const juchuHeadData = await getDetailJuchuHead(Number(params.jhid));
  if (!juchuHeadData) {
    return <div>受注情報が見つかりません。</div>;
  }

  /** 編集モード(edit:編集、view:閲覧) */
  const edit = params.mode === 'edit' ? true : false;
  /**  */

  const user = await getCurrentUser();
  if (!user) {
    await redirect('/login');
    return;
  }

  const required = Number(params.jshid) === 0 ? permission.juchu_upd : permission.juchu_ref;
  const hasPermission = !!(user.permission.juchu & required);

  if (!hasPermission) {
    return <Typography>このページを閲覧する権限がありません。</Typography>;
  }

  return (
    <Suspense fallback={<LoadingOverlay />}>
      <VehicleOrderDetail
        user={user}
        juchuHeadData={juchuHeadData}
        sharyoHeadId={Number(params.jshid)}
        idoJuchuKizaiMeisaiData={undefined}
        juchuContainerMeisaiData={[]}
        shukoDate={null}
        nyukoDate={null}
        dateRange={[]}
        eqStockData={undefined}
        juchuHonbanbiData={undefined}
        edit={edit}
        fixFlag={false}
      />
    </Suspense>
  );
};
export default Page;
