import { useUserStore } from '@/app/_lib/stores/usestore';
import { Order } from '@/app/(main)/order/[juchu_head_id]/[mode]/_ui/order';

import { AddLock, GetLock, GetOrder } from './_lib/funcs';

const Page = async (props: { params: Promise<{ juchu_head_id: number; mode: string }> }) => {
  const params = await props.params;
  // 新規id
  const id = params.juchu_head_id;
  // 編集モード(edit:編集、view:閲覧)
  const edit = params.mode === 'edit' ? true : false;
  // 受注ヘッダーデータ
  const order = await GetOrder(id);
  // ロックデータ
  const lockData = await GetLock(1, id);
  if (!order) {
    return <div>受注情報が見つかりません。</div>;
  }
  return <Order order={order} edit={edit} lockData={lockData} />;
};
export default Page;
