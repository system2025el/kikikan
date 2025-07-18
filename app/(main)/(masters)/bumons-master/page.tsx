import { getDaibumonsSelection, getShukeibumonsSelection } from '../_lib/funs';
import { getFilteredBumons } from './_lib/funcs';
import { BumonsMaster } from './_ui/bumons-master';

const Page = async () => {
  const bumons = await getFilteredBumons({
    q: '',
    d: 0,
    s: 0,
  });
  const a = await getDaibumonsSelection();
  const b = await getShukeibumonsSelection();
  const options = [a, b];
  return (
    <>
      <BumonsMaster bumons={bumons} options={options} />
    </>
  );
};
export default Page;
