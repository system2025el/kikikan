'use server';

import pool from '../postgres';
import { SCHEMA, supabase } from '../supabase';

export const selectNyushukoOne = async (
  juchuHeadId: number,
  juchuKizaiHeadKbn: number,
  nyushukoBashoId: number,
  nyushukoDat: string,
  nyushukoShubetuId: number
) => {
  try {
    const queey = `
      SELECT
        koen_nam,
        juchu_kizai_head_idv,
        head_namv,
        koenbasho_nam,
        kokyaku_nam,
        juchu_dat,
        memv
      FROM ${SCHEMA}.v_nyushuko_den2_head
      WHERE juchu_head_id = $1
        AND juchu_kizai_head_kbnv = $2
        AND nyushuko_basho_id = $3
        AND nyushuko_dat = $4
        AND nyushuko_shubetu_id = $5
        LIMIT 1
    `;
    const values = [juchuHeadId, juchuKizaiHeadKbn.toString(), nyushukoBashoId, nyushukoDat, nyushukoShubetuId];
    const result = await pool.query(queey, values);
    return result.rows;
  } catch (e) {
    throw new Error('[selectNyushukoOne] DBエラー:', { cause: e });
  }
};
