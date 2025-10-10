import { getRfidKizaiStsSelection, getShozokuSelection } from '../../_lib/funcs';
import { getEqptNam, getRfidsOfTheKizai } from './_lib/funcs';
import { RfidMaster } from './_ui/rfid-master';

const Page = async ({ params }: { params: Promise<{ kizaiId: string }> }) => {
  const param = await params;
  const rfids = await getRfidsOfTheKizai(Number(param.kizaiId));
  const sts = await getRfidKizaiStsSelection();
  const kizaiNam = await getEqptNam(Number(param.kizaiId));
  const kizai = { id: Number(param.kizaiId), nam: kizaiNam };
  return <RfidMaster rfids={rfids} sts={sts} kizai={kizai} />;
};

export default Page;
