import { getNyukoList } from './_lib/funcs';
import { NyukoListSearchValues } from './_lib/types';
import { NyukoList } from './_ui/nyuko-list';

const Page = async () => {
  const nyukoSearch: NyukoListSearchValues = { juchuHeadId: null, shukoDat: new Date(), shukoBasho: 0, section: [] };
  const nyukoData = await getNyukoList(nyukoSearch);
  return <NyukoList shukoData={nyukoData} />;
};
export default Page;
