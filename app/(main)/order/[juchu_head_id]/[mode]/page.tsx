import { NewOrder } from '@/app/(main)/order/[juchu_head_id]/[mode]/_ui/order';

import { AddLock, GetLock, GetOrder } from './_lib/funcs';

const Page = async (props: { params: Promise<{ juchu_head_id: number; mode: string }> }) => {
  const params = await props.params;
  // 新規id
  const id = params.juchu_head_id;
  // モード(edit:編集、view:閲覧)
  const mode = params.mode;
  // 受注ヘッダーデータ
  const order = await GetOrder(id);
  // ロックデータ
  const lockData = await GetLock(1, id);
  // user情報
  const user = {
    id: 1,
    name: 'test_user',
  };
  if (!order) {
    return <div>受注情報が見つかりません。</div>;
  }
  if ((mode === 'edit' && lockData === null) || lockData?.addUser === user.name) {
    if (lockData === null) await AddLock(1, id);
    return <NewOrder order={order} edit={true} lockData={lockData} userName="test_user" />;
  } else {
    return <NewOrder order={order} edit={false} lockData={lockData} userName="test_user" />;
  }
};
export default Page;
