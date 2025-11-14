import { getCustomerSelection } from '../../(masters)/_lib/funcs';
import { getBillingStsSelection, getFilteredBills } from './_lib/funcs';
import { BillList } from './_ui/bill-list';

const Page = async () => {
  return <BillList />;
};

export default Page;
