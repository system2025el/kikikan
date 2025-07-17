import { getFilteredVehs } from './_lib/funcs';
import { VehiclesMaster } from './_ui/vehicles-master';
// import { shiori } from '@/app/_lib/postgres/funcs';

const Page = async () => {
  const vehList = await getFilteredVehs('');
  // const vehList = await shiori();
  // const vehList = vehicles;
  return (
    <>
      <VehiclesMaster vehs={vehList} />
    </>
  );
};
export default Page;
