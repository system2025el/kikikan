import { Metadata } from 'next';

import { getFilteredShukeibumons } from './_lib/funcs';
import { ShukeibumonsMaster } from './_ui/shukeibumons-master';

export const metadata: Metadata = {
  title: '集計部門マスタ',
  description: '集計部門マスタページです',
};

const Page = async () => {
  return <ShukeibumonsMaster />;
};
export default Page;
