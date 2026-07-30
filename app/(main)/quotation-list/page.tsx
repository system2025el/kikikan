import { Metadata } from 'next';

import { QuotationList } from './_ui/quotation-list';

export const metadata: Metadata = {
  title: '見積一覧',
  description: '見積一覧ページです',
};

const Page = async () => {
  return <QuotationList />;
};

export default Page;
