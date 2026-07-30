import { Metadata } from 'next';

import { NyukoList } from './_ui/nyuko-list';

export const metadata: Metadata = {
  title: '入庫一覧',
  description: '入庫一覧ページです',
};

const Page = async () => {
  // const nyukoSearch: NyukoListSearchValues = {
  //   juchuHeadId: null,
  //   shukoDat: new Date(),
  //   shukoBasho: 0,
  //   section: [],
  // };
  // const nyukoData = await getNyukoList(nyukoSearch);
  return <NyukoList /*shukoData={nyukoData}*/ />;
};
export default Page;
