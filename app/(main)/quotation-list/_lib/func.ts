'use server';

import pool from '@/app/_lib/db/postgres';
import { SCHEMA } from '@/app/_lib/db/supabase';

import { toJapanDateString } from '../../_lib/date-conversion';

export const getFilteredQuotList = async (queries: string = '') => {
  try {
    const data = await pool.query(`
        SELECT
            mitu_head_id as "mituHeadId",
            juchu_head_id as "juchuHeadId",
            sts_nam as "mituStsNam",
            mitu_head_nam as "mituHeadNam",
            koen_nam as "koenNam",
            kokyaku_nam as "kokyakuNam",
            mitu_dat as "mituDat",
            nyuryoku_user as "nyuryokuUser"
        FROM
          ${SCHEMA}.v_mitu_lst
    `);
    if (data) {
      console.log(data.rows);
      return data.rows.map((d) => ({ ...d, mituDat: toJapanDateString(d.mituDat) }));
    }
    return [];
  } catch (e) {
    console.error('例外が発生しました:', e);
    throw e;
  }
};
