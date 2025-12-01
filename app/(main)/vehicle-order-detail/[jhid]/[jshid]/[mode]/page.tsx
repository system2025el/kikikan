import { Suspense } from 'react';

import { LoadingOverlay } from '@/app/(main)/_ui/loading';
import { getDetailJuchuHead } from '@/app/(main)/(eq-order-detail)/_lib/funcs';

import VehicleOrderDetail from './_ui/vehicle-order-detail';

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

  return (
    <Suspense fallback={<LoadingOverlay />}>
      <VehicleOrderDetail
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
