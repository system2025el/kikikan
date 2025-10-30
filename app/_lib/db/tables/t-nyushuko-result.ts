'use server';

import { PoolClient } from 'pg';

import { SCHEMA } from '../supabase';

export const deleteNyushukoResult = async (
  juchuHeadId: number,
  juchuKizaiHeadId: number,
  juchuKizaiMeisaiId: number,
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
        AND juchu_kizai_head_id = $2
        AND juchu_kizai_meisai_id = $3
        AND sagyo_kbn_id = $4
        AND sagyo_den_dat = $5
        AND sagyo_id = $6
        AND kizai_id = $7
        AND rfid_tag_id = ANY($8)
    `;

  const values = [
    juchuHeadId,
    juchuKizaiHeadId,
    juchuKizaiMeisaiId,
    sagyoKbnId,
    nyushukoDat,
    sagyoId,
    kizaiId,
    rfidTagIds,
  ];

  try {
    await connection.query(query, values);
  } catch (e) {
    throw e;
  }
};

export const deleteKizaiIdNyushukoResult = async (
  juchuHeadId: number,
  juchuKizaiHeadId: number,
  juchuKizaiMeisaiId: number,
  sagyoDenDat: string,
  sagyoId: number,
  kizaiId: number,
  connection: PoolClient
) => {
  const query = `
      DELETE FROM
        ${SCHEMA}.t_nyushuko_result
      WHERE
        juchu_head_id = $1
        AND juchu_kizai_head_id = $2
        AND juchu_kizai_meisai_id = $3
        AND sagyo_den_dat = $4
        AND sagyo_id = $5
        AND kizai_id = $6
    `;

  const values = [juchuHeadId, juchuKizaiHeadId, juchuKizaiMeisaiId, sagyoDenDat, sagyoId, kizaiId];

  try {
    await connection.query(query, values);
  } catch (e) {
    throw e;
  }
};

export const deleteAllNyushukoResult = async (
  juchuHeadId: number,
  juchuKizaiHeadId: number,
  sagyoDenDat: string,
  sagyoId: number,
  connection: PoolClient
) => {
  const query = `
      DELETE FROM
        ${SCHEMA}.t_nyushuko_result
      WHERE
        juchu_head_id = $1
        AND juchu_kizai_head_id = $2
        AND sagyo_den_dat = $3
        AND sagyo_id = $4
    `;

  const values = [juchuHeadId, juchuKizaiHeadId, sagyoDenDat, sagyoId];

  try {
    await connection.query(query, values);
  } catch (e) {
    throw e;
  }
};
