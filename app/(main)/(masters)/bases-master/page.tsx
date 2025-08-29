import { basesList } from './_lib/datas';
import { getFilteredBases } from './_lib/funcs';
import { BasesMaster } from './_ui/bases-master';

const Page = async () => {
  const bases = await getFilteredBases();
  return (
    <>
      <BasesMaster bases={bases} />
    </>
  );
};

export default Page;
