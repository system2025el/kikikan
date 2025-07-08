// import { locationList } from './_lib/datas';
import { GetAllLoc } from './_lib/funcs';
import { LocationsMaster } from './_ui/locations-master';

const Page = async () => {
  const locs = await GetAllLoc();
  // const locs = locationList;
  return (
    <>
      <LocationsMaster locs={locs} />
    </>
  );
};

export default Page;
