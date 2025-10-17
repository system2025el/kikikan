'use server';

import { PoolClient } from 'pg';

import { SCHEMA } from '../supabase';

export const deleteNyushukoResult = async (
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
        ${SCHEMA}.t_nyushuko_result
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

export const deleteKizaiIdNyushukoResult = async (
  juchuHeadId: number,
  sagyoDenDat: string,
  sagyoId: number,
  kizaiIds: number[],
  connection: PoolClient
) => {
  const query = `
      DELETE FROM
        ${SCHEMA}.t_nyushuko_result
      WHERE
        juchu_head_id = $1
        AND sagyo_den_dat = $2
        AND sagyo_id = $3
        AND kizai_id = ANY($4)
    `;

  const values = [juchuHeadId, sagyoDenDat, sagyoId, kizaiIds];

  try {
    await connection.query(query, values);
  } catch (e) {
    throw e;
  }
};

export const deleteAllNyushukoResult = async (
  juchuHeadId: number,
  sagyoDenDat: string,
  sagyoId: number,
  connection: PoolClient
) => {
  const query = `
      DELETE FROM
        ${SCHEMA}.t_nyushuko_result
      WHERE
        juchu_head_id = $1
        AND sagyo_den_dat = $2
        AND sagyo_id = $3
    `;

  const values = [juchuHeadId, sagyoDenDat, sagyoId];

  try {
    await connection.query(query, values);
  } catch (e) {
    throw e;
  }
};
