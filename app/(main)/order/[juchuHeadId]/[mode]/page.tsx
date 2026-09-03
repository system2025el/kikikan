import { Typography } from '@mui/material';
import { Metadata } from 'next';
import { redirect } from 'next/navigation';

import { getCurrentUser } from '@/app/(main)/_lib/funcs';
import { permission } from '@/app/(main)/_lib/permission';
import { getColor } from '@/app/(main)/(eq-order-detail)/_lib/funcs';
import { Order } from '@/app/(main)/order/[juchuHeadId]/[mode]/_ui/order';

import { getJuchuHead, getJuchuKizaiHeadList, getJuchuSharyoHeadList, getUsers } from './_lib/funcs';
import { getJuchuTempuList } from './_lib/tempu-funcs';
import { EqTableValues, OrderValues, VehicleTableValues } from './_lib/types';

export const metadata: Metadata = {
  title: '受注',
  description: '受注ページです',
};

const Page = async (props: { params: Promise<{ juchuHeadId: string; mode: string }> }) => {
  const params = await props.params;
  // 受注ヘッダーid
  const juchuHeadId = Number(params.juchuHeadId);
  // 編集モード(edit:編集、view:閲覧)
  const edit = params.mode === 'edit' ? true : false;

  const user = await getCurrentUser();
  if (!user) {
    await redirect('/login');
    return;
  }

  const required = juchuHeadId === 0 ? permission.juchu_upd : permission.juchu_ref;
  const hasPermission = !!(user.permission.juchu & required);

  if (!hasPermission) {
    return <Typography>このページを閲覧する権限がありません。</Typography>;
  }

  const [userList, honbanbiColor] = await Promise.all([getUsers(), getColor()]);

  // 新規
  if (juchuHeadId === 0) {
    // 受注ヘッダーデータ(初期値)
    const newJuchuHeadData: OrderValues = {
      juchuHeadId: juchuHeadId,
      delFlg: 0,
      juchuSts: 0,
      juchuDat: new Date(),
      juchuRange: null,
      nyuryokuUser: '',
      koenNam: '',
      koenbashoNam: null,
      kokyaku: { kokyakuId: 0, kokyakuNam: '' /*, kokyakuRank: 0*/ },
      kokyakuTantoNam: null,
      mem: null,
      // nebikiAmt: null,
      zeiKbn: 2,
      honbanbiList: [],
    };

    // 受注機材ヘッダーデータ(初期値)
    const newJuchuKizaiHeadData: EqTableValues[] = [];
    // 受注車両ヘッダーデータ(初期値)
    const newJuchuSharyoHeadData: VehicleTableValues[] = [];

    return (
      <Order
        user={user}
        juchuHeadData={newJuchuHeadData}
        juchuKizaiHeadDatas={newJuchuKizaiHeadData}
        juchusharyoHeadDatas={newJuchuSharyoHeadData}
        userList={userList}
        juchuTempuDatas={[]}
        honbanbiColor={honbanbiColor}
        edit={edit}
      />
    );
    // 既存
  } else {
    // 受注ヘッダーデータ（本番日を含む）、受注機材ヘッダーデータ、受注車両ヘッダーデータ、添付ファイルデータ
    const [juchuHeadData, juchuKizaiHeadDatas, juchuSharyoHeadDatas, juchuTempuDatas] = await Promise.all([
      getJuchuHead(juchuHeadId),
      getJuchuKizaiHeadList(juchuHeadId),
      getJuchuSharyoHeadList(juchuHeadId),
      getJuchuTempuList(juchuHeadId),
    ]);

    if (!juchuHeadData) {
      return <div>受注情報が見つかりません。</div>;
    }
    return (
      <Order
        user={user}
        juchuHeadData={juchuHeadData}
        juchuKizaiHeadDatas={juchuKizaiHeadDatas}
        juchusharyoHeadDatas={juchuSharyoHeadDatas}
        userList={userList}
        juchuTempuDatas={juchuTempuDatas}
        honbanbiColor={honbanbiColor}
        edit={edit}
      />
    );
  }
};
export default Page;
