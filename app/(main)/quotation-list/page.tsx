import { getCustomerSelection } from '../(masters)/_lib/funcs';
import { getFilteredQuotList, getMituStsSelection, getUsersSelection } from './_lib/funcs';
import { QuotationList } from './_ui/quotation-list';

const Page = async () => {
  const quotList = await getFilteredQuotList();
  const [sts, custs, nyuryokuUser] = await Promise.all([
    getMituStsSelection(),
    getCustomerSelection(),
    getUsersSelection(),
  ]);
  return <QuotationList quots={quotList} options={{ sts: sts, custs: custs, nyuryokuUser: nyuryokuUser }} />;
};

export default Page;
