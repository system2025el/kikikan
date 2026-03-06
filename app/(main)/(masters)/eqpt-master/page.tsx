import { Metadata } from 'next';

import { getFilteredEqpts } from './_lib/funcs';
import { EqptMaster } from './_ui/eqpt-master';

export const metadata: Metadata = {
  title: '機材マスタ',
  description: '機材マスタページです',
};

const Page = async () => {
  return <EqptMaster />;
};
export default Page;
