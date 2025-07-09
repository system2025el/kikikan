import NewOrder from '@/app/(main)/new-order/[juchu_head_id]/_ui/new-order';

import { GetOrder } from './_lib/funcs';

const Page = async (props: { params: Promise<{ juchu_head_id: number }> }) => {
  const params = await props.params;
  console.log('params : ', params);
  const id = params.juchu_head_id;
  console.log('id : ', id);
  const order = await GetOrder(id);
  console.log('order : ', order);

  return <NewOrder />;
};
export default Page;
