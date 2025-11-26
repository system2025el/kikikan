'use server';

import { PoolClient } from 'pg';

import pool from '../postgres';
import { SCHEMA } from '../supabase';
import { JuchuSharyoHeadDBValues } from '../types/t-juchu-sharyo-head-type';

/**
 * 受注ヘッダIDと受注車両ヘッダIDが一致する明細を取得する関数
 * @param {number} juchuHeadId 受注ヘッダID
 * @param {number} sharyoHeadId 受注車両ヘッダID
 */
export const selectJuchuSharyoMeisai = async (juchuHeadId: number, sharyoHeadId: number) => {
  const query = `
    SELECT
      head.juchu_head_id, head.juchu_sharyo_head_id, head.mem as head_mem, head.head_nam, head.dsp_ord_num, meisai.juchu_sharyo_meisai_id, 
      meisai.sharyo_id, meisai.nyushuko_shubetu_id, meisai.nyushuko_basho_id, meisai.nyushuko_dat, meisai.daisu, meisai.mem as sharyo_mem
    FROM
      ${SCHEMA}.t_juchu_sharyo_head as head
    LEFT JOIN
      ${SCHEMA}.t_juchu_sharyo_meisai as meisai
    ON
      head.juchu_head_id = meisai.juchu_head_id
    AND
      head.juchu_sharyo_head_id = meisai.juchu_sharyo_head_id
    WHERE
      head.juchu_head_id = $1
    AND
      head.juchu_sharyo_head_id = $2
    ORDER BY meisai.juchu_sharyo_meisai_id
  `;
  try {
    return pool.query(query, [juchuHeadId, sharyoHeadId]);
  } catch (e) {
    throw e;
  }
};

/**
 * 受注車両明細ヘッダを挿入する関数
 * @param {JuchuSharyoHeadDBValues} data DBの型のobject
 * @param {PoolClient} connection トランザクション用
 * @returns {number} 新規挿入した車両明細ヘッダID
 */
export const insertJuchuSharyoHead = async (data: JuchuSharyoHeadDBValues, connection: PoolClient) => {
  const { juchu_sharyo_head_id, dsp_ord_num, ...rest } = data;
  const cols = Object.keys(data);
  const values = Object.values(rest);
  let num: number = 0;
  const placeholders = cols
    .map((c, i) => {
      if (c === 'juchu_sharyo_head_id') {
        return `(SELECT coalesce(max(juchu_sharyo_head_id),0) + 1 FROM ${SCHEMA}.t_juchu_sharyo_head WHERE juchu_head_id = ${data.juchu_head_id})`;
      }
      if (c === 'dsp_ord_num') {
        return `(SELECT coalesce(max(dsp_ord_num),0) + 1 FROM ${SCHEMA}.t_juchu_sharyo_head WHERE juchu_head_id = ${data.juchu_head_id})`;
      }
      return `$${(num += 1)}`;
    })
    .join(', ');
  const query = `
    INSERT INTO
        ${SCHEMA}.t_juchu_sharyo_head (${cols})
    VALUES (${placeholders})
    RETURNING juchu_sharyo_head_id;
  `;
  try {
    console.log(query);
    return await connection.query(query, values);
  } catch (e) {
    throw e;
  }
};
