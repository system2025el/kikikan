'use server';

import { PoolClient } from 'pg';
import { set } from 'zod';

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
        ${SCHEMA}.t_juchu_sharyo_head (${cols.join(',')})
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

/**
 * 受注車両ヘッダの更新する関数
 * @param {JuchuSharyoHeadDBValues} data 更新データ
 * @param {PoolClient} connection トランザクション用
 */
export const updJuchuSharyoHeadDB = async (data: JuchuSharyoHeadDBValues, connection: PoolClient) => {
  const { juchu_head_id, juchu_sharyo_head_id, ...rest } = data;
  const cols = Object.keys(rest);
  const values = Object.values(rest);
  const setClause = cols.map((c, index) => `${c} = $${index + 1}`).join(',');
  const query = `
    UPDATE
      ${SCHEMA}.t_juchu_sharyo_head
    SET
      ${setClause}
    WHERE
      juchu_head_id = $${cols.length + 1}
    AND
      juchu_sharyo_head_id = $${cols.length + 2}
  `;
  try {
    await connection.query(query, [...values, juchu_head_id, juchu_sharyo_head_id]);
  } catch (e) {
    throw e;
  }
};

/**
 * IDの組み合わせが一致する受注削除ヘッダを削除する関数
 * @param {{ juchu_head_id: number; juchu_sharyo_head_id: number }[]} ids 受注ヘッダIDと受注車両ヘッダIDの組み合わせ配列
 * @param {PoolClient} connection トランザクション
 */
export const deleteJuchuSharyoHead = async (
  ids: { juchu_head_id: number; juchu_sharyo_head_id: number }[],
  connection: PoolClient
) => {
  const cols = Object.keys(ids[0]);
  const values = ids.flatMap((d) => Object.values(d));
  const placeholders = ids
    .map((_, rowIndex) => {
      const start = rowIndex * cols.length + 1;
      const group = Array.from({ length: cols.length }, (_, colIndex) => `$${start + colIndex}`);
      return `(${group.join(',')})`;
    })
    .join(',');

  const query = `
    DELETE FROM 
      ${SCHEMA}.t_juchu_sharyo_head
    WHERE
      (${cols.join(',')})
    IN
      (${placeholders})
  `;

  console.log(query);

  try {
    await connection.query(query, values);
  } catch (e) {
    throw e;
  }
};

/**
 * 2週間（14日）分の車両情報を取得する関数
 * @param date 指定日
 * @returns 日付ごとの配列
 */
export const selectWeeklyList = async (date: string) => {
  try {
    const query = `
        SELECT   
          CAST(cal.cal_dat AS DATE), --スケジュール日
          s_meisai.juchu_head_id,
          s_meisai.juchu_sharyo_head_id,
          s_head.head_nam as sharyo_head_nam,
          s_meisai.nyushuko_dat,
          t_weekly.mem as weekly_mem,
          t_weekly.holiday_flg,
          t_weekly.tanto_nam,
          s_meisai.nyushuko_shubetu_id,
          s_meisai.nyushuko_basho_id,
          sharyo.sharyo_nam,
          s_meisai.daisu,
          juchu.koen_nam,
          kokyaku.kokyaku_nam
        FROM
          dev6.t_juchu_sharyo_head as s_head
        LEFT JOIN
          dev6.t_juchu_sharyo_meisai as s_meisai
        ON 
          s_head.juchu_head_id = s_meisai.juchu_head_id
        AND
          s_head.juchu_sharyo_head_id = s_meisai.juchu_sharyo_head_id
        LEFT JOIN
          dev6.t_juchu_head as juchu
        ON
          juchu.juchu_head_id = s_meisai.juchu_head_id
        LEFT JOIN
          dev6.m_kokyaku as kokyaku
        ON
          kokyaku.kokyaku_id = juchu.kokyaku_id
        LEFT JOIN
          dev6.m_sharyo as sharyo
        ON
          sharyo.sharyo_id = s_meisai.sharyo_id
        RIGHT OUTER JOIN 
          /* スケジュール生成して外部結合 */
          (
              -- スケジュールの生成範囲 /*■変数箇所■*/
              select $1::date + g.i as cal_dat from generate_series(0, 14) as g(i)
          ) as cal
        ON CAST(s_meisai.nyushuko_dat AS DATE) = cal.cal_dat    
        LEFT JOIN
          dev6.t_weekly
        ON cal.cal_dat = t_weekly.weekly_dat
        ORDER BY s_meisai.nyushuko_dat;
    `;

    const values = [date];

    return (await pool.query(query, values)).rows;
  } catch (e) {
    throw e;
  }
};
