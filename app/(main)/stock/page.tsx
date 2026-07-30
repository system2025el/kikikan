import { Metadata } from 'next';

import { getBumonsData } from './_lib/funcs';
import { Stock } from './_ui/stock';

export const metadata: Metadata = {
  title: '在庫確認',
  description: '在庫確認ページです',
};

const Page = async () => {
  return <Stock />;
};

export default Page;
