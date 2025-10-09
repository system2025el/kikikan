'use server';

import { PoolClient } from 'pg';

import { SCHEMA } from '../supabase';

export const deleteNyushukoCtnResult = async (
  juchuHeadId: number,
  sagyoKbnId: number,
  nyushukoDat: string,
  sagyoId: number,
  kizaiId: number,
  rfidTagIds: string[],
  connection: PoolClient
) => {
  const query = `
    DELETE FROM
      ${SCHEMA}.t_nyushuko_ctn_result
    WHERE
      juchu_head_id = $1
      AND sagyo_kbn_id = $2
      AND sagyo_den_dat = $3
      AND sagyo_id = $4
      AND kizai_id = $5
      AND rfid_tag_id = ANY($6)
    `;

  const values = [juchuHeadId, sagyoKbnId, nyushukoDat, sagyoId, kizaiId, rfidTagIds];

  try {
    await connection.query(query, values);
  } catch (e) {
    throw e;
  }
};
