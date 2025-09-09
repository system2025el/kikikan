import { getBumonsData } from './_lib/funcs';
import { Stock } from './_ui/stock';

const Page = async () => {
  const bumons = await getBumonsData();
  return <Stock bumons={bumons} />;
};

export default Page;
