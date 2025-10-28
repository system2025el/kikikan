import { getCustomerSelection } from '../(masters)/_lib/funcs';
import { getFilteredOrderList } from './_lib/funcs';
import { EqptOrderList } from './_ui/eqpt-order-list';

/**
 * 受注一覧画面
 * @returns 受注一覧画面
 */
const Page = async () => {
  const [orderList, customers] = await Promise.all([getFilteredOrderList(), getCustomerSelection()]);
  return <EqptOrderList orders={orderList} customers={customers} />;
};

export default Page;
