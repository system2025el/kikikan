import { Metadata } from 'next';

import { getFilteredDaibumons } from './_lib/funcs';
import { DaibumonsMaster } from './_ui/daibumons-master';

export const metadata: Metadata = {
  title: '大部門マスタ',
  description: '大部門マスタページです',
};

const Page = async () => {
  return <DaibumonsMaster />;
};

export default Page;
