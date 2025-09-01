import { getFilteredShukeibumons } from './_lib/funcs';
import { ShukeibumonsMaster } from './_ui/shukeibumons-master';

const Page = async () => {
  const shukeibumons = await getFilteredShukeibumons();
  return (
    <>
      <ShukeibumonsMaster shukeibumons={shukeibumons} />
    </>
  );
};
export default Page;
