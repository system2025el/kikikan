import { daibumonsList } from './_lib/types';
import { DaibumonsMaster } from './_ui/daibumons-master';

const Page = async () => {
  // const daibumon = await getAllDaibumon();
  const daibumons = daibumonsList;
  return (
    <>
      <DaibumonsMaster daibumons={daibumons} />
    </>
  );
};

export default Page;
