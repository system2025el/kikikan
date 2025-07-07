import { bumonsList } from './_lib/data';
import { BumonsMaster } from './_ui/bumons-master';

const Page = async () => {
  // const bumons = await getAllBumons()
  const bumons = bumonsList;
  return (
    <>
      <BumonsMaster bumons={bumons} />
    </>
  );
};
export default Page;
