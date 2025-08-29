import { getFilteredBumons } from './_lib/funcs';
import { BumonsMaster } from './_ui/bumons-master';

const Page = async () => {
  const bumons = await getFilteredBumons();
  const data = bumons?.data;
  const options = bumons?.options;
  return (
    <>
      <BumonsMaster bumons={data} options={options} />
    </>
  );
};
export default Page;
