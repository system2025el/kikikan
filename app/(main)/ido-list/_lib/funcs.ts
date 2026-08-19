'use server';

import { SAGYO_SIJI_ID } from '@/app/_lib/constants';
import { selectFilteredIdoList } from '@/app/_lib/db/tables/v-ido-den3';

import { IdoTableValues } from './types';

/**
 * 表示順（ido-list-tableが datas[0]/datas[1] を位置で参照しているため順序を変えないこと）
 */
const DISPLAY_SAGYO_SIJI_IDS = [SAGYO_SIJI_ID.yk, SAGYO_SIJI_ID.ky];

/**
 * 作業日指定移動リスト取得
 * @param sagyoDenDat 作業日
 * @returns
 */
export const getIdoList = async (sagyoDenDat: string) => {
  try {
    // v_ido_den3は1回の取得が重いため、作業指示ごとに分けず1回のクエリでまとめて取得する
    const rows = await selectFilteredIdoList(sagyoDenDat, [...DISPLAY_SAGYO_SIJI_IDS]);

    const idoData: IdoTableValues[] = DISPLAY_SAGYO_SIJI_IDS.map((sagyoSijiId) => {
      const row = rows.find((r) => r.sagyo_siji_id === sagyoSijiId);

      if (!row) {
        return {
          nyushukoDat: sagyoDenDat,
          juchuFlg: null,
          sagyoSijiId: sagyoSijiId,
          schkSagyoStsId: null,
          schkSagyoStsNamShort: '無し',
          nchkSagyoStsId: null,
          nchkSagyoStsNamShort: '無し',
          shukoFixFlg: null,
          nyukoFixFlg: null,
        };
      }

      return {
        nyushukoDat: sagyoDenDat,
        juchuFlg: row.juchu_flg,
        sagyoSijiId: sagyoSijiId,
        schkSagyoStsId: row.schk_sagyo_sts_id,
        schkSagyoStsNamShort: row.schk_sagyo_sts_nam_short ?? '無し',
        nchkSagyoStsId: row.nchk_sagyo_sts_id,
        nchkSagyoStsNamShort: row.nchk_sagyo_sts_nam_short ?? '無し',
        shukoFixFlg: row.schk_sagyo_sts_id == null ? null : row.shuko_fix_flg,
        nyukoFixFlg: row.nchk_sagyo_sts_id == null ? null : row.nyuko_fix_flg,
      };
    });

    return idoData;
  } catch (e) {
    if (e instanceof Error) {
      console.error(`[ERROR] ${e.message}`);
      if (e.cause) {
        console.error(`[CAUSE]`, e.cause);
      }
    } else {
      console.error(e);
    }
    throw e;
  }
};
