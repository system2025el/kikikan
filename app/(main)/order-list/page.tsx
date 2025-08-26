import { getCustomerSelection } from '../(masters)/_lib/funs';
import { getFilteredOrderList } from './_lib/funcs';
import { OrderList } from './_ui/order-list';

const Page = async () => {
  const orderList = await getFilteredOrderList({
    criteria: 1,
    selectedDate: { value: '1', range: { from: null, to: null } },
  });
  const customers = await getCustomerSelection();
  return <OrderList orders={orderList} customers={customers} />;
};

export default Page;
