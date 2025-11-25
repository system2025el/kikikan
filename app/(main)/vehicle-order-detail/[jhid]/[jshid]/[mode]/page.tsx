import { getDetailJuchuHead } from '@/app/(main)/(eq-order-detail)/_lib/funcs';

import VehicleOrderDetail from './_ui/vehicle-order-detail';

const Page = async (props: { params: Promise<{ jhid: number; jshid: number; mode: string }> }) => {
  const params = await props.params;
  /** 受注ヘッダーデータ */
  const juchuHeadData = await getDetailJuchuHead(params.jhid);
  if (!juchuHeadData) {
    return <div>受注情報が見つかりません。</div>;
  }

  /** 入出庫 */

  return (
    <VehicleOrderDetail
      juchuHeadData={juchuHeadData}
      sharyoHeadId={params.jshid}
      idoJuchuKizaiMeisaiData={undefined}
      juchuContainerMeisaiData={[]}
      shukoDate={null}
      nyukoDate={null}
      dateRange={[]}
      eqStockData={undefined}
      juchuHonbanbiData={undefined}
      edit={false}
      fixFlag={false}
    />
  );
};
export default Page;
