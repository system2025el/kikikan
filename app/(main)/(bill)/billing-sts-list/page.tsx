import { Typography } from '@mui/material';
import { Metadata } from 'next';
import { redirect } from 'next/navigation';

import { getCurrentUser } from '../../_lib/funcs';
import { permission } from '../../_lib/permission';
import { getCustomerSelection } from '../../(masters)/_lib/funcs';
import { EXCLUDED_KOKYAKU_ID } from './_lib/datas';
import { BillingStsList } from './_ui/billing-sts-list';

export const metadata: Metadata = {
  title: '請求状況一覧',
  description: '請求状況一覧ページです',
};

const Page = async () => {
  const user = await getCurrentUser();
  if (!user) {
    await redirect('/login');
    return;
  }

  const hasPermission = !!(user.permission.juchu & permission.juchu_ref);

  if (!hasPermission) {
    return <Typography>このページを閲覧する権限がありません。</Typography>;
  }
  // 検索条件の選択肢（顧客）はサーバー側で取って渡す（画面から取ると Server Action の往復が一覧の取得と順番に並ぶため）
  // （(株)エンジニア・ライティングは対象外）
  const custs = (await getCustomerSelection()).filter((c) => c.id !== EXCLUDED_KOKYAKU_ID);

  return <BillingStsList user={user} custs={custs} />;
};

export default Page;
