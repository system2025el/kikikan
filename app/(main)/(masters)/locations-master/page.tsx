import { Metadata } from 'next';

import { getFilteredLocs } from './_lib/funcs';
import { LocationsMaster } from './_ui/locations-master';

export const metadata: Metadata = {
  title: '公演場所マスタ',
  description: '公演場所マスタページです',
};

const Page = async () => {
  return <LocationsMaster />;
};

export default Page;
