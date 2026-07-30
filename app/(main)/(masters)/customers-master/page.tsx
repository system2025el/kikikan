import { Metadata } from 'next';

import { CustomersMaster } from './_ui/customers-master';

export const metadata: Metadata = {
  title: '顧客マスタ',
  description: '顧客マスタページです',
};

const Page = async () => {
  return <CustomersMaster />;
};

export default Page;
