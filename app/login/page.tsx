import { Metadata } from 'next';

import Login from '@/app/login/_ui/login';

export const metadata: Metadata = {
  title: 'ログイン',
  description: 'ログインページです',
};

const Page = () => {
  return <Login />;
};
export default Page;
