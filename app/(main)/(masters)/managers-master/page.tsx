import { managers } from './_lib/data';
import { ManagersMaster } from './_ui/managers-master';

const Page = async () => {
  const managersList = managers;
  return <ManagersMaster managers={managersList} />;
};

export default Page;
