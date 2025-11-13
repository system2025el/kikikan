import { FAKE_NEW_ID } from '../(masters)/_lib/constants';
import { getCustomerSelection } from '../(masters)/_lib/funcs';
import { getLocsSelection } from '../(masters)/locations-master/_lib/funcs';
import { getFilteredOrderList } from './_lib/funcs';
import { EqptOrderList } from './_ui/eqpt-order-list';

/**
 * 受注一覧画面
 * @returns 受注一覧画面
 */
const Page = async () => {
  const searchs = {
    radio: 'shuko',
    range: { from: new Date(), to: new Date() },
    kokyaku: FAKE_NEW_ID,
    listSort: { sort: 'shuko', order: 'asc' },
  };
  const [orderList, customers, locs] = await Promise.all([
    getFilteredOrderList({
      radio: 'shuko',
      range: { from: new Date(), to: new Date() },
      kokyaku: FAKE_NEW_ID,
      listSort: { sort: 'shuko', order: 'asc' },
    }),
    getCustomerSelection(),
    getLocsSelection(),
  ]);
  return (
    <>
      {JSON.stringify(searchs)}
      <EqptOrderList orders={orderList} customers={customers} locs={locs} />
    </>
  );
};

export default Page;
