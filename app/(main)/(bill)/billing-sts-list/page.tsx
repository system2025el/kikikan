import { Metadata } from 'next';

import { BillingStsList } from './_ui/billing-sts-list';

export const metadata: Metadata = {
  title: '請求状況一覧',
  description: '請求状況一覧ページです',
};

const Page = async () => {
  return <BillingStsList />;
};

export default Page;
