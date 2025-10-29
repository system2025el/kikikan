import { getCustomerSelection } from '../(masters)/_lib/funcs';
import { getLocsSelection } from '../(masters)/locations-master/_lib/funcs';
import { getFilteredOrderList } from './_lib/funcs';
import { EqptOrderList } from './_ui/eqpt-order-list';

/**
 * 受注一覧画面
 * @returns 受注一覧画面
 */
const Page = async () => {
  const [orderList, customers, locs] = await Promise.all([
    getFilteredOrderList(),
    getCustomerSelection(),
    getLocsSelection(),
  ]);
  return <EqptOrderList orders={orderList} customers={customers} locs={locs} />;
};

export default Page;
