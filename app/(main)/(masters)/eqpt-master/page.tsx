import { Metadata } from 'next';
import { redirect } from 'next/navigation';

import { getCurrentUser } from '../../_lib/funcs';
import { getFilteredEqpts } from './_lib/funcs';
import { EqptMaster } from './_ui/eqpt-master';

export const metadata: Metadata = {
  title: '機材マスタ',
  description: '機材マスタページです',
};

const Page = async () => {
  const user = await getCurrentUser();
  if (!user) {
    await redirect('/login');
    return;
  }

  // 機材マスタは意図的にmasters権限による閲覧制御を行わない
  return <EqptMaster user={user} />;
};
export default Page;
