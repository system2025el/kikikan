import { Metadata } from 'next';

import { toJapanTimeStampString } from '../_lib/date-conversion';
import { getShukoList } from './_lib/funcs';
import { ShukoListSearchValues } from './_lib/types';
import { ShukoList } from './_ui/shuko-list';

export const metadata: Metadata = {
  title: '出庫一覧',
  description: '出庫一覧ページです',
};

const Page = async () => {
  // const shukoSearch: ShukoListSearchValues = {
  //   juchuHeadId: null,
  //   shukoDat: new Date(),
  //   shukoBasho: 0,
  //   section: [],
  // };
  // const shukoData = await getShukoList(shukoSearch);
  return <ShukoList /*shukoData={shukoData}*/ />;
};
export default Page;
