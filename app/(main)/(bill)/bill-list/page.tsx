import { Metadata } from 'next';

import { BillList } from './_ui/bill-list';

export const metadata: Metadata = {
  title: '請求一覧',
  description: '請求一覧ページです',
};

const Page = async () => {
  return <BillList />;
};

export default Page;
