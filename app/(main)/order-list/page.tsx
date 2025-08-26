import { getCustomerSelection } from '../(masters)/_lib/funs';
import { getFilteredOrderList } from './_lib/funcs';
import { OrderList } from './_ui/order-list';

const Page = async () => {
  const orderList = await getFilteredOrderList({});
  const customers = await getCustomerSelection();
  return <OrderList orders={orderList} customers={customers} />;
};

export default Page;
