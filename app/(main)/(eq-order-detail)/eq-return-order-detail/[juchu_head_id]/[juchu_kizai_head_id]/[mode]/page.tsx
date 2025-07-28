import { GetOrder } from '@/app/(main)/order/[juchu_head_id]/[mode]/_lib/funcs';

import { GetEqHeader } from '../../../../_lib/funcs';
import { EquipmentReturnOrderDetail } from './_ui/equipment-return-order-detail';

const Page = async (props: {
  params: Promise<{ juchu_head_id: number; juchu_kizai_head_id: number; mode: string }>;
}) => {
  const params = await props.params;
  // 編集モード(edit:編集、view:閲覧)
  const edit = params.mode === 'edit' ? true : false;
  // 受注ヘッダーデータ
  const juchuHeadData = await GetOrder(params.juchu_head_id);
  // 受注機材ヘッダーデータ
  const juchuKizaiHeadData =
    params.juchu_kizai_head_id !== 0 ? await GetEqHeader(params.juchu_head_id, params.juchu_kizai_head_id) : null;

  return <EquipmentReturnOrderDetail />;
  return <div>ページが見つかりません。</div>;
};
export default Page;
