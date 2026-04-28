'use server';

import { PoolClient } from 'pg';

import pool from '../postgres';

export const selectFinishedReturn = async (juchuHeadId: number, juchuKizaiHeadId: number, connection: PoolClient) => {
  const query = `
    SELECT
      v.kizai_id AS "kizaiId", 
      v.plan_qty::integer AS "planQty", 
      v.dsp_ord_num_meisai AS "dspOrdNumMeisai",
      v.nyushuko_basho_id AS "nyushukoBashoId"
    FROM
      v_nyushuko_den2_lst_oyako AS v 
    INNER JOIN
      t_nyushuko_fix AS f
    ON
      v.juchu_head_id = f.juchu_head_id
      AND v.juchu_kizai_head_id = f.juchu_kizai_head_id
    WHERE
      v.juchu_head_id = $1
      AND v.oya_juchu_kizai_head_id = $2
      AND v.juchu_kizai_head_kbnv = $3
      AND f.sagyo_kbn_id = $4
      AND f.sagyo_fix_flg = $5
      AND v.kizai_id <> $6
  `;

  const values = [juchuHeadId, juchuKizaiHeadId, 2, 70, 1, 0];

  try {
    return (await connection.query(query, values)).rows;
  } catch (e) {
    throw new Error('[selectFinishedReturn] DBエラー:', { cause: e });
  }
};
