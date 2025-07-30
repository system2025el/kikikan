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
  const data = eqpts?.data;
  const options = eqpts?.options;
  return (
    <>
      <EqptMaster eqpts={data} options={options} />
    </>
  );
};
export default Page;
