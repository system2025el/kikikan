import { shukeibumonsList } from './_lib/datas';
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
