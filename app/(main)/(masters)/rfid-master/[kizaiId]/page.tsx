import { Metadata } from 'next';
import { redirect } from 'next/navigation';

import { getCurrentUser } from '@/app/(main)/_lib/funcs';

import { getRfidKizaiStsSelection, getShozokuSelection } from '../../_lib/funcs';
import { getEqptNam } from './_lib/funcs';
import { RfidMaster } from './_ui/rfid-master';

export const metadata: Metadata = {
  title: 'RFIDマスタ',
  description: 'RFIDマスタページです',
};

const Page = async ({ params }: { params: Promise<{ kizaiId: string }> }) => {
  const param = await params;
  const user = await getCurrentUser();
  if (!user) {
    await redirect('/login');
    return;
  }

  // RFIDマスタは意図的にmasters権限による閲覧制御を行わない

  // 機材名と選択肢（状態・所属）はサーバー側で取って渡す
  // （画面から取ると Server Action の往復がRFID一覧の取得と順番に並ぶため。所属は登録・編集ダイアログで使う）
  const kizaiId = Number(param.kizaiId);
  const [kizaiNam, sts, shozoku] = await Promise.all([
    getEqptNam(kizaiId),
    getRfidKizaiStsSelection(),
    getShozokuSelection(),
  ]);

  return <RfidMaster user={user} kizaiId={kizaiId} kizaiNam={kizaiNam} options={{ sts, shozoku }} />;
};

export default Page;
