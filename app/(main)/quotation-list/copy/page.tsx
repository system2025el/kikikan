import { Typography } from '@mui/material';
import { Metadata } from 'next';
import { redirect } from 'next/navigation';

import { getCurrentUser } from '../../_lib/funcs';
import { permission } from '../../_lib/permission';
import { getChosenQuot } from '../_lib/funcs';
import { QuotHeadValues } from '../_lib/types';
import { Quotation } from '../_ui/quotation';

export const metadata: Metadata = {
  title: '見積',
  description: '見積(コピー)ページです',
};

/**
 * 見積のコピーページ
 * @param param0
 * @returns
 */
const Page = async ({ searchParams }: { searchParams: Promise<{ [key: string]: string | undefined }> }) => {
  const searchParam = await searchParams;

  const user = await getCurrentUser();
  if (!user) {
    await redirect('/login');
    return;
  }

  const hasPermission = !!(user.permission.juchu & permission.juchu_upd);

  if (!hasPermission) {
    return <Typography>このページを閲覧する権限がありません。</Typography>;
  }

  const data = await getChosenQuot(Number(searchParam.mituId));
  const quot: QuotHeadValues = {
    ...data.m,
    mituHeadId: null,
    kizaiChukeiAmt: (data.m.meisaiHeads?.kizai ?? []).reduce((acc, item) => acc + (item.nebikiAftAmt ?? 0), 0),
    chukeiAmt:
      (data.m.meisaiHeads?.kizai ?? []).reduce((acc, item) => acc + (item.nebikiAftAmt ?? 0), 0) +
      (data.m.meisaiHeads?.labor ?? []).reduce((acc, item) => acc + (item.nebikiAftAmt ?? 0), 0) +
      (data.m.meisaiHeads?.other ?? []).reduce((acc, item) => acc + (item.nebikiAftAmt ?? 0), 0),
    preTaxGokeiAmt:
      (data.m.meisaiHeads?.kizai ?? []).reduce((acc, item) => acc + (item.nebikiAftAmt ?? 0), 0) +
      (data.m.meisaiHeads?.labor ?? []).reduce((acc, item) => acc + (item.nebikiAftAmt ?? 0), 0) +
      (data.m.meisaiHeads?.other ?? []).reduce((acc, item) => acc + (item.nebikiAftAmt ?? 0), 0) -
      (data.m.tokuNebikiAmt ?? 0),
  };
  const order = data.j ?? {
    juchuHeadId: null,
    juchuSts: null,
    juchuDat: null,
    juchuRange: { strt: null, end: null },
    nyuryokuUser: null,
    koenNam: null,
    koenbashoNam: null,
    kokyaku: { id: null, name: null },
    kokyakuTantoNam: null,
    mem: null,
    nebikiAmt: null,
    zeiKbn: null,
  };
  return <Quotation user={user} order={order} isNew={true} quot={quot} />;
};

export default Page;
