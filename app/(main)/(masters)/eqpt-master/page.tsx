import { getFilteredEqpts } from './_lib/funcs';
import { EqptMaster } from './_ui/eqpt-master';

const Page = async () => {
  const eqpts = await getFilteredEqpts();
  const data = eqpts?.data;
  const options = eqpts?.options;
  return (
    <>
      <EqptMaster eqpts={data} options={options} />
    </>
  );
};
export default Page;
