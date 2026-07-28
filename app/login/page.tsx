import { Metadata } from 'next';
import { Suspense } from 'react';

import Login from '@/app/login/_ui/login';

export const metadata: Metadata = {
  title: 'ログイン',
  description: 'ログインページです',
};

const Page = () => {
  return (
    <Suspense fallback={null}>
      <Login />
    </Suspense>
  );
};
export default Page;
