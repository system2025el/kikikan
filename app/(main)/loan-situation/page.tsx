import { Metadata } from 'next';

import { LoanList } from '@/app/(main)/loan-situation/_ui/loan-list';

export const metadata: Metadata = {
  title: '貸出状況一覧',
  description: '貸出状況一覧ページです',
};

const Page = async () => {
  return <LoanList />;
};

export default Page;
