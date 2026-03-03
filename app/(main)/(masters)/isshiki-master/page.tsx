import { Metadata } from 'next';

import { IsshikisMaster } from './_ui/isshiki-master';

export const metadata: Metadata = {
  title: '一式マスタ',
  description: '一式マスタページです',
};

const Page = async () => {
  return <IsshikisMaster />;
};

export default Page;
