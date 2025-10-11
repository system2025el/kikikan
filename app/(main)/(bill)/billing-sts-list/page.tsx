import { getCustomerSelection } from '../../(masters)/_lib/funcs';
import { BillingStsList } from './_ui/billing-sts-list';

const Page = async () => {
  const [custs] = await Promise.all([getCustomerSelection()]);
  return <BillingStsList custs={custs} />;
};

export default Page;
