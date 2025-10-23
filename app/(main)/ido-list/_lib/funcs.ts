'use server';

import { selectFilteredIdoList } from '@/app/_lib/db/tables/v-ido-den3';

import { IdoTableValues } from './types';

/**
 * 作業日指定移動リスト取得
 * @param sagyoDenDat 作業日
 * @param sagyoSijiId 作業指示id
 * @returns
 */
export const getIdoList = async (sagyoDenDat: string) => {
  const idoData: IdoTableValues[] = [];
  try {
    const ykData = await selectFilteredIdoList(sagyoDenDat, 2);
    console.log('ykData: ', ykData.length);

    if (ykData.length > 0) {
      const ykIdoData: IdoTableValues = {
        nyushukoDat: sagyoDenDat,
        juchuFlg: ykData[0].juchu_flg,
        sagyoSijiId: 2,
        schkSagyoStsId: ykData[0].schk_sagyo_sts_id,
        schkSagyoStsNamShort: ykData[0].schk_sagyo_sts_nam_short,
        nchkSagyoStsId: ykData[0].nchk_sagyo_sts_id,
        nchkSagyoStsNamShort: ykData[0].nchk_sagyo_sts_nam_short,
        shukoFixFlg: ykData[0].shuko_fix_flg,
        nyukoFixFlg: ykData[0].nyuko_fix_flg,
      };
      idoData.push(ykIdoData);
    } else {
      const ykIdoData: IdoTableValues = {
        nyushukoDat: sagyoDenDat,
        juchuFlg: null,
        sagyoSijiId: 2,
        schkSagyoStsId: null,
        schkSagyoStsNamShort: '無し',
        nchkSagyoStsId: null,
        nchkSagyoStsNamShort: '無し',
        shukoFixFlg: null,
        nyukoFixFlg: null,
      };
      idoData.push(ykIdoData);
    }

    const kyData = await selectFilteredIdoList(sagyoDenDat, 1);
    console.log('kyData: ', kyData.length);

    if (kyData.length > 0) {
      const kyIdoData: IdoTableValues = {
        nyushukoDat: sagyoDenDat,
        juchuFlg: kyData[0].juchu_flg,
        sagyoSijiId: 1,
        schkSagyoStsId: kyData[0].schk_sagyo_sts_id,
        schkSagyoStsNamShort: kyData[0].schk_sagyo_sts_nam_short,
        nchkSagyoStsId: kyData[0].nchk_sagyo_sts_id,
        nchkSagyoStsNamShort: kyData[0].nchk_sagyo_sts_nam_short,
        shukoFixFlg: kyData[0].shuko_fix_flg,
        nyukoFixFlg: kyData[0].nyuko_fix_flg,
      };
      idoData.push(kyIdoData);
    } else {
      const kyIdoData: IdoTableValues = {
        nyushukoDat: sagyoDenDat,
        juchuFlg: null,
        sagyoSijiId: 1,
        schkSagyoStsId: null,
        schkSagyoStsNamShort: '無し',
        nchkSagyoStsId: null,
        nchkSagyoStsNamShort: '無し',
        shukoFixFlg: null,
        nyukoFixFlg: null,
      };
      idoData.push(kyIdoData);
    }
    return idoData;
  } catch (e) {
    console.error(e);
    return null;
  }
};
