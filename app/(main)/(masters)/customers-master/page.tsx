// import { getAllCustomers } from '@/app/_lib/supabase/supabaseFuncs';

import { customers } from './_lib/datas';
import { CustomersMaster } from './_ui/customers-master';

const Page = async () => {
  // const customersList = await getAllCustomers();
  const custmersList = customers;
  return <CustomersMaster customers={custmersList} />;
};

export default Page;
