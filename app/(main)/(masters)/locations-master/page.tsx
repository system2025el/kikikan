//DB import { GetAllLoc } from './_lib/funcs';
import { locationList } from './_lib/types';
import { LocationsMaster } from './_ui/locations-master';

const Page = async () => {
  //DB const locs = await GetAllLoc();
  const locs = locationList;
  return (
    <>
      <LocationsMaster locs={locs} />
    </>
  );
};

export default Page;
