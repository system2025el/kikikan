import { getCustomerSelection } from '../(masters)/_lib/funs';
import { getFilteredOrderList } from './_lib/funcs';
import { OrderList } from './_ui/order-list';

/**
 * 受注一覧画面
 * @returns 受注一覧画面
 */
const Page = async () => {
  const [orderList, customers] = await Promise.all([
    getFilteredOrderList({
      criteria: 1,
      selectedDate: { value: '1', range: { from: null, to: null } },
    }),
    getCustomerSelection(),
  ]);
  return <OrderList orders={orderList} customers={customers} />;
};

export default Page;
