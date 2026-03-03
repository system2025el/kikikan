import { Metadata } from 'next';

import { ImportMaster } from './_ui/masters-import';

export const metadata: Metadata = {
  title: 'マスタインポート',
  description: 'マスタインポートページです',
};

const Page = () => {
  return <ImportMaster />;
};

export default Page;
