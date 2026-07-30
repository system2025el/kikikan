import { Metadata } from 'next';

import { getFilteredVehs } from './_lib/funcs';
import { VehiclesMaster } from './_ui/vehicles-master';
// import { shiori } from '@/app/_lib/postgres/funcs';

export const metadata: Metadata = {
  title: '車両マスタ',
  description: '車両マスタページです',
};

const Page = async () => {
  return <VehiclesMaster />;
};
export default Page;
