import { toJapanDateString } from '../_lib/date-conversion';
import { getIdoList } from './_lib/funcs';
import { IdoTableValues } from './_lib/types';
import { IdoList } from './_ui/ido-list';

const Page = async () => {
  const date = toJapanDateString(undefined, '-');
  // const idoData = await getIdoList(date);

  // if (!idoData) {
  //   return <div>エラー</div>;
  // }

  const idoData: IdoTableValues[] = [
    {
      nyushukoDat: date,
      juchuFlg: 1,
      sagyoSijiId: 2,
      schkSagyoStsId: 42,
      schkSagyoStsNamShort: '〇',
      nchkSagyoStsId: 51,
      nchkSagyoStsNamShort: '△',
      shukoFixFlg: 1,
      nyukoFixFlg: 0,
    },
    {
      nyushukoDat: date,
      juchuFlg: 1,
      sagyoSijiId: 1,
      schkSagyoStsId: null,
      schkSagyoStsNamShort: '無し',
      nchkSagyoStsId: null,
      nchkSagyoStsNamShort: '無し',
      shukoFixFlg: null,
      nyukoFixFlg: null,
    },
  ];

  return <IdoList idoData={idoData} />;
};
export default Page;
