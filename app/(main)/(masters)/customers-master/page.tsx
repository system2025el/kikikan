// import { getAllCustomers } from '@/app/_lib/supabase/supabaseFuncs';

import { CustomersMaster } from './_ui/customers-master';

const Page = async () => {
  // const customersList = await getAllCustomers();

  return <CustomersMaster /*customers={customersList}*/ />;
};

export default Page;
