import { Metadata } from 'next';

import { getFilteredBumons } from './_lib/funcs';
import { BumonsMaster } from './_ui/bumons-master';

export const metadata: Metadata = {
  title: '部門マスタ',
  description: '部門マスタページです',
};

const Page = async () => {
  return <BumonsMaster />;
};
export default Page;
