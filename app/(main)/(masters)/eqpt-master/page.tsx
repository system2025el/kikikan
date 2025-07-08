import { eqptMasterList } from './_lib/datas';
import { EqptMaster } from './_ui/eqpt-master';

const Page = async () => {
  const eqpts = eqptMasterList;
  return (
    <>
      <EqptMaster eqpts={eqpts} />
    </>
  );
};
export default Page;
