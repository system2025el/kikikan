import { getRfidKizaiStsSelection, getShozokuSelection } from '../../_lib/funcs';
import { getEqptNam, getRfidsOfTheKizai } from './_lib/funcs';
import { RfidMaster } from './_ui/rfid-master';

const Page = async ({ params }: { params: Promise<{ kizaiId: string }> }) => {
  const param = await params;
  return <RfidMaster kizaiId={Number(param.kizaiId)} />;
};

export default Page;
