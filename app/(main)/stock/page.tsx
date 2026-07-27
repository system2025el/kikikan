import { Metadata } from 'next';
import { redirect } from 'next/navigation';

import { getCurrentUser } from '../_lib/funcs';
import { getBumonsData } from './_lib/funcs';
import { Stock } from './_ui/stock';

export const metadata: Metadata = {
  title: '在庫確認',
  description: '在庫確認ページです',
};

const Page = async () => {
  const user = await getCurrentUser();
  if (!user) {
    await redirect('/login');
    return;
  }
  return <Stock />;
};

export default Page;
