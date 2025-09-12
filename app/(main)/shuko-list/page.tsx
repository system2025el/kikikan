import { getShukoList } from './_lib/funcs';
import { ShukoListSearchValues } from './_lib/types';
import { ShukoList } from './_ui/shuko-list';

const Page = async () => {
  const shukoSearch: ShukoListSearchValues = { juchuHeadId: null, shukoDat: new Date(), shukoBasho: 0 };
  const shukoData = await getShukoList(shukoSearch);
  return <ShukoList shukoData={shukoData} />;
};
export default Page;
