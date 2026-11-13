import { Metadata } from 'next';
import { redirect } from 'next/navigation';

import { LoanList } from '@/app/(main)/loan-situation/_ui/loan-list';

import { getCurrentUser } from '../_lib/funcs';
import { getSectionShortSelections } from '../(masters)/sections-master/_lib/funcs';

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
  // 検索条件の選択肢（課）はサーバー側で取って渡す（画面から取ると Server Action の往復が一覧の取得と順番に並ぶため）
  const sect = await getSectionShortSelections();

  return <LoanList options={{ sect }} />;
};

export default Page;
