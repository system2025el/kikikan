import { Metadata } from 'next';

import { EqptSetsMaster } from './_ui/eqpt-set-master';

export const metadata: Metadata = {
  title: '機材セットマスタ',
  description: '機材セットマスタページです',
};

const Page = async () => {
  return <EqptSetsMaster />;
};

export default Page;
