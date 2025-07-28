import { useUserStore } from '@/app/_lib/stores/usestore';
import { Order } from '@/app/(main)/order/[juchu_head_id]/[mode]/_ui/order';

import { AddLock, GetEqHeaderList, GetLock, GetOrder } from './_lib/funcs';

const Page = async (props: { params: Promise<{ juchu_head_id: number; mode: string }> }) => {
  const params = await props.params;
  // 新規id
  const id = params.juchu_head_id;
  // 編集モード(edit:編集、view:閲覧)
  const edit = params.mode === 'edit' ? true : false;
  // 受注ヘッダーデータ
  const order = await GetOrder(id);
  // 受注機材ヘッダーデータ
  const eqHeader = await GetEqHeaderList(id);
  // ロックデータ
  const lockData = await GetLock(1, id);
  // ユーザーデータ
  // const userData = await GetUser();
  if (!order) {
    return <div>受注情報が見つかりません。</div>;
  }
  return <Order order={order} eqList={eqHeader} edit={edit} lockData={lockData} />;
};
export default Page;
