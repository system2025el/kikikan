import { getCustomerSelection } from '../(masters)/_lib/funcs';
import { getFilteredQuotList, getMituStsSelection, getUsersSelection } from './_lib/funcs';
import { QuotationList } from './_ui/quotation-list';

const Page = async () => {
  return <QuotationList />;
};

export default Page;
