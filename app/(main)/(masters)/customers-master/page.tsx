import { getFilteredCustomers } from './_lib/funcs';
import { CustomersMaster } from './_ui/customers-master';

const Page = async () => {
  const customersList = await getFilteredCustomers('');
  return <CustomersMaster customers={customersList} />;
};

export default Page;
