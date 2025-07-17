import { GetFilteredCustomers } from './_lib/funcs';
import { CustomersMaster } from './_ui/customers-master';

const Page = async () => {
  const customersList = await GetFilteredCustomers('');
  return <CustomersMaster customers={customersList} />;
};

export default Page;
