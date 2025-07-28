import { GetLock, GetOrder } from '@/app/(main)/order/[juchu_head_id]/[mode]/_lib/funcs';

import { GetEqHeader } from '../../../../_lib/funcs';
import { JuchuKizaiHeadValues } from './_lib/types';
import EquipmentOrderDetail from './_ui/equipment-order-detail';

const Page = async (props: {
  params: Promise<{ juchu_head_id: number; juchu_kizai_head_id: number; mode: string }>;
}) => {
  const params = await props.params;
  // 受注機材ヘッダーid
  const juchuKizaiHeadId = Number(params.juchu_kizai_head_id);
  // 編集モード(edit:編集、view:閲覧)
  const edit = params.mode === 'edit' ? true : false;
  // 受注ヘッダーデータ
  const juchuHeadData = await GetOrder(params.juchu_head_id);
  // ロックデータ
  const lockData = await GetLock(1, params.juchu_head_id);

  if (!juchuHeadData) {
    return <div>受注情報が見つかりません。</div>;
  }

  if (juchuKizaiHeadId !== 0) {
    // 受注機材ヘッダーデータ
    const juchuKizaiHeadData = await GetEqHeader(params.juchu_head_id, params.juchu_kizai_head_id);

    if (!juchuKizaiHeadData) {
      return <div>受注機材情報が見つかりません。</div>;
    }

    return (
      <EquipmentOrderDetail
        juchuHeadData={juchuHeadData}
        juchuKizaiHeadData={juchuKizaiHeadData}
        edit={edit}
        lockData={lockData}
      />
    );
  } else {
    const newJuchuKizaiHeadData: JuchuKizaiHeadValues = {
      juchuHeadId: Number(params.juchu_head_id),
      juchuKizaiHeadId: Number(params.juchu_kizai_head_id),
      juchuKizaiHeadKbn: 1,
      juchuHonbanbiQty: null,
      zeiKbn: 2,
      nebikiAmt: null,
      mem: null,
      headNam: null,
      kicsShukoDat: null,
      kicsNyukoDat: null,
      yardShukoDat: null,
      yardNyukoDat: null,
    };

    return (
      <EquipmentOrderDetail
        juchuHeadData={juchuHeadData}
        juchuKizaiHeadData={newJuchuKizaiHeadData}
        edit={edit}
        lockData={lockData}
      />
    );
  }
};
export default Page;
