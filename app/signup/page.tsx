import { Metadata } from 'next';

import { Signup } from './_ui/signup';

export const metadata: Metadata = {
  title: 'サインアップ',
  description: 'サインアップページです',
};

const Page = () => {
  return <Signup />;
};
export default Page;
