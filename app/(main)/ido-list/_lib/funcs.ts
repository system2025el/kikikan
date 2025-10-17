'use server';

import { selectFilteredIdoList } from '@/app/_lib/db/tables/v-ido-den2yoko';

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
    const { data: ykData, error: ykDataError } = await selectFilteredIdoList(sagyoDenDat, 2);

    if (ykDataError) {
      console.error('getIdoList error : ', ykDataError);
      return null;
    }

    if (ykData.length > 0) {
      const ykIdoData: IdoTableValues = {
        idoDenId: ykData[0].ido_den_id,
        nyushukoDat: sagyoDenDat,
        juchuFlg: ykData[0].juchu_flg,
        sagyoSijiId: 2,
        schkSagyoStsId: ykData[0].schk_sagyo_sts_id,
        nchkSagyoStsId: ykData[0].nchk_sagyo_sts_id,
        shukoFixFlg: ykData[0].shuko_fix_flg,
        nyukoFixFlg: ykData[0].nyuko_fix_flg,
      };
      idoData.push(ykIdoData);
    } else {
      const ykIdoData: IdoTableValues = {
        idoDenId: 0,
        nyushukoDat: sagyoDenDat,
        juchuFlg: null,
        sagyoSijiId: 2,
        schkSagyoStsId: null,
        nchkSagyoStsId: null,
        shukoFixFlg: null,
        nyukoFixFlg: null,
      };
      idoData.push(ykIdoData);
    }

    const { data: kyData, error: kyDataError } = await selectFilteredIdoList(sagyoDenDat, 1);

    if (kyDataError) {
      console.error('getIdoList error : ', kyDataError);
      return null;
    }

    if (kyData.length > 0) {
      const kyIdoData: IdoTableValues = {
        idoDenId: kyData[0].ido_den_id,
        nyushukoDat: sagyoDenDat,
        juchuFlg: kyData[0].juchu_flg,
        sagyoSijiId: 1,
        schkSagyoStsId: kyData[0].schk_sagyo_sts_id,
        nchkSagyoStsId: kyData[0].nchk_sagyo_sts_id,
        shukoFixFlg: kyData[0].shuko_fix_flg,
        nyukoFixFlg: kyData[0].nyuko_fix_flg,
      };
      idoData.push(kyIdoData);
    } else {
      const kyIdoData: IdoTableValues = {
        idoDenId: 0,
        nyushukoDat: sagyoDenDat,
        juchuFlg: null,
        sagyoSijiId: 1,
        schkSagyoStsId: null,
        nchkSagyoStsId: null,
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
