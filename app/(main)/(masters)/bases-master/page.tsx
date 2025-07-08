import { basesList } from './_lib/datas';
import { BasesMaster } from './_ui/bases-master';

const Page = async () => {
  // const bases = await getAllBases()
  const bases = basesList;
  return (
    <>
      <BasesMaster bases={bases} />
    </>
  );
};

export default Page;
