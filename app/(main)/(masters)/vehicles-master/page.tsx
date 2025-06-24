import { getAllVehicles } from '@/app/_lib/supabase/supabaseFuncs';

import { vehicles } from './_lib/datas';
import { VehiclesMaster } from './_ui/vehicles-master';

const Page = async () => {
  const vehList = await getAllVehicles();
  // const vehList = vehicles;
  return (
    <>
      <VehiclesMaster vehs={vehList} />
    </>
  );
};
export default Page;
