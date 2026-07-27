import { Metadata } from 'next';
import { redirect } from 'next/navigation';

import { LoanList } from '@/app/(main)/loan-situation/_ui/loan-list';

import { getCurrentUser } from '../_lib/funcs';

export const metadata: Metadata = {
  title: '貸出状況一覧',
  description: '貸出状況一覧ページです',
};

const Page = async () => {
  const user = await getCurrentUser();
  if (!user) {
    await redirect('/login');
    return;
  }
  return <LoanList />;
};

export default Page;
