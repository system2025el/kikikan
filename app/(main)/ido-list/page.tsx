import { Metadata } from 'next';

import { toJapanYMDString } from '../_lib/date-conversion';
import { getIdoList } from './_lib/funcs';
import { IdoTableValues } from './_lib/types';
import { IdoList } from './_ui/ido-list';

export const metadata: Metadata = {
  title: '移動一覧',
  description: '移動一覧ページです',
};

const Page = async () => {
  // const date = toJapanYMDString(undefined, '-');
  // const idoData = await getIdoList(date);

  // if (!idoData) {
  //   return <div>エラー</div>;
  // }
  return <IdoList />;
};
export default Page;
