import { Metadata } from 'next';

import { getFilteredUsers } from './_lib/funcs';
import { UsersMaster } from './_ui/users-master';

export const metadata: Metadata = {
  title: '担当者マスタ',
  description: '担当者マスタページです',
};

const Page = async () => {
  return <UsersMaster />;
};

export default Page;
