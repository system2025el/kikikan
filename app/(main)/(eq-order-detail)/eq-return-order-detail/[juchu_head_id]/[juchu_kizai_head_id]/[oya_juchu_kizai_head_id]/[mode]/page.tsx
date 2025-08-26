import { GetLock, GetOrder } from '@/app/(main)/order/[juchu_head_id]/[mode]/_lib/funcs';

import { GetJuchuKizaiHead } from '../../../../../_lib/funcs';
import { EquipmentReturnOrderDetail } from './_ui/equipment-return-order-detail';

const Page = async (props: {
  params: Promise<{
    juchu_head_id: number;
    juchu_kizai_head_id: number;
    oya_juchu_kizai_head_id: number;
    mode: string;
  }>;
}) => {
  const params = await props.params;
  // 受注機材ヘッダーid
  const juchuKizaiHeadId = Number(params.juchu_kizai_head_id);
  // 編集モード(edit:編集、view:閲覧)
  const edit = params.mode === 'edit' ? true : false;
  // 受注ヘッダーデータ
  const juchuHeadData = await GetOrder(params.juchu_head_id);
  // 親受注機材ヘッダーデータ
  const oyaJuchuKizaiHeadData = await GetJuchuKizaiHead(params.juchu_head_id, params.oya_juchu_kizai_head_id);

  if (!juchuHeadData || !oyaJuchuKizaiHeadData) {
    return <div>受注情報が見つかりません。</div>;
  }

  // 新規
  if (juchuKizaiHeadId === 0) {
    // 既存
  } else {
  }

  return (
    <EquipmentReturnOrderDetail
      juchuHeadData={juchuHeadData}
      oyaJuchuKizaiHeadData={oyaJuchuKizaiHeadData}
      edit={edit}
    />
  );
};
export default Page;
