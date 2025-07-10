// import { getAllVehicles } from '@/app/_lib/supabase/funcs';

import { vehicles } from './_lib/datas';
import { VehiclesMaster } from './_ui/vehicles-master';
// import { shiori } from '@/app/_lib/postgres/funcs';

const Page = async () => {
  // const vehList = await getAllVehicles();
  // const vehList = await shiori();
  const vehList = vehicles;
  return (
    <>
      <VehiclesMaster vehs={vehList} />
    </>
  );
};
export default Page;
