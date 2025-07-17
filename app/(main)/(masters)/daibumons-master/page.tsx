import { getFilteredDaibumons } from './_lib/funcs';
import { DaibumonsMaster } from './_ui/daibumons-master';

const Page = async () => {
  const daibumons = await getFilteredDaibumons('');
  return (
    <>
      <DaibumonsMaster daibumons={daibumons} />
    </>
  );
};

export default Page;
