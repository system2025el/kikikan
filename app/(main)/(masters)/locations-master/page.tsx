import { GetFilteredLocs } from './_lib/funcs';
import { LocationsMaster } from './_ui/locations-master';

const Page = async () => {
  const locs = await GetFilteredLocs('');
  console.log('aaaaaaaa');
  return (
    <>
      <LocationsMaster locs={locs} />
    </>
  );
};

export default Page;
