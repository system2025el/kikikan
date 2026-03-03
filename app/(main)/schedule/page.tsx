import { Metadata } from 'next';

import { Schedule } from './_ui/schedule';

export const metadata: Metadata = {
  title: 'スケジュール',
  description: 'スケジュールページです',
};

const Page = async () => {
  return <Schedule />;
};

export default Page;
