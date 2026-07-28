import { Metadata } from 'next';
import { redirect } from 'next/navigation';

import { getCurrentUser } from '../_lib/funcs';
import { Schedule } from './_ui/schedule';

export const metadata: Metadata = {
  title: 'スケジュール',
  description: 'スケジュールページです',
};

const Page = async () => {
  const user = await getCurrentUser();
  if (!user) {
    await redirect('/login');
    return;
  }
  return <Schedule user={user} />;
};

export default Page;
