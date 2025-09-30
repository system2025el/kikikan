import { getCustomerSelection } from '../../(masters)/_lib/funs';
import { getBillingStsSelection, getFilteredBills } from './_lib/funcs';
import { BillList } from './_ui/bill-list';

const Page = async () => {
  const [bills, custs, sts] = await Promise.all([getFilteredBills(), getCustomerSelection(), getBillingStsSelection()]);

  return <BillList bills={bills} selectOptions={{ custs: custs, sts: sts }} />;
};

export default Page;
