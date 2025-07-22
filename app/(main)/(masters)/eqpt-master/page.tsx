import { getBumonsSelection, getDaibumonsSelection, getShukeibumonsSelection } from '../_lib/funs';
import { getFilteredEqpts } from './_lib/funcs';
import { EqptMaster } from './_ui/eqpt-master';

const Page = async () => {
  const eqpts = await getFilteredEqpts({
    q: '',
    b: 0,
    d: 0,
    s: 0,
  });
  const a = await getDaibumonsSelection();
  const b = await getShukeibumonsSelection();
  const c = await getBumonsSelection();
  const options = [a, b, c];
  return (
    <>
      <EqptMaster eqpts={eqpts} options={options} />
    </>
  );
};
export default Page;
