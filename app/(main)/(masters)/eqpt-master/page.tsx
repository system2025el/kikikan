// import { fetchAllEqpt } from '@/app/_lib/data';

// import { shigasan } from '@/app/_lib/postgres/funcs';

import { eqptMasterList } from './_lib/datas';
import { EqptMaster } from './_ui/eqpt-master';

const Page = async () => {
  const eqpts = eqptMasterList;
  // const eqpts = await fetchAllEqpt();
  // const eqpts = await shigasan();
  return (
    <>
      <EqptMaster eqpts={eqpts} />
    </>
  );
};
export default Page;
