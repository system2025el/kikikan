import { daibumonsList } from './_lib/datas';
import { DaibumonsMaster } from './_ui/daibumons-master';

const Page = async () => {
  // const daibumon = await getAllDaibumons();
  const daibumons = daibumonsList;
  return (
    <>
      <DaibumonsMaster daibumons={daibumons} />
    </>
  );
};

export default Page;
