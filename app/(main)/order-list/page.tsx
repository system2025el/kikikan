import { getFilteredOrderList } from './_lib/funcs';
import { OrderList } from './_ui/order-list';

const Page = async () => {
  const orderList = await getFilteredOrderList('');
  return <OrderList orderList={orderList} />;
};

export default Page;
