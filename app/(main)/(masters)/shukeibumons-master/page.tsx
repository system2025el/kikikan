import { shukeibumonsList } from './_lib/type';
import { ShukeibumonsMaster } from './_ui/shukeibumons-master';

const Page = async () => {
  // DB const shukeibumons = await getAllShukeibumons();
  const shukeibumons = shukeibumonsList;
  return (
    <>
      <ShukeibumonsMaster shukeibumons={shukeibumons} />
    </>
  );
};
export default Page;
