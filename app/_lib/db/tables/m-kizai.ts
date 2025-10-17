'use server';

import { PoolClient } from 'pg';

import { toJapanTimeString } from '@/app/(main)/_lib/date-conversion';
import { fakeToNull } from '@/app/(main)/(masters)/_lib/value-converters';
import { EqptsMasterDialogValues } from '@/app/(main)/(masters)/eqpt-master/_lib/types';

import pool from '../postgres';
import { SCHEMA, supabase } from '../supabase';
import { MKizaiDBValues } from '../types/m-kizai-type';

/**
 * kizai_idが一致する機材を取得する関数
 * @param id 探すkizai_id
 * @returns kizai_idが一致する機材
 */
export const selectOneEqpt = async (id: number) => {
  try {
    return await supabase.schema(SCHEMA).from('m_kizai').select('*').eq('kizai_id', id).single();
  } catch (e) {
    throw e;
  }
};

/**
 * 機材マスタに新規挿入する関数
 * @param data 挿入するデータ
 */
export const insertNewEqpt = async (data: EqptsMasterDialogValues, connection: PoolClient) => {
  const query = `
    INSERT INTO ${SCHEMA}.m_kizai (
      kizai_id, kizai_nam, del_flg, section_num, el_num, shozoku_id,
      bld_cod, tana_cod, eda_cod, kizai_grp_cod, dsp_ord_num, mem,
      bumon_id, shukei_bumon_id, dsp_flg, ctn_flg, def_dat_qty,
      reg_amt, rank_amt_1, rank_amt_2, rank_amt_3, rank_amt_4, rank_amt_5, 
      add_dat, add_user
    )
    VALUES (
      (SELECT coalesce(max(kizai_id),0) + 1 FROM ${SCHEMA}.m_kizai),
      $1, $2, $3, $4, $5, $6, $7, $8, $9,
      $24,
      $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23
    );
  `;
  const date = toJapanTimeString();
  const values = [
    data.kizaiNam,
    Number(data.delFlg),
    data.sectionNum,
    data.elNum,
    data.shozokuId,
    data.bldCod,
    data.tanaCod,
    data.edaCod,
    data.kizaiGrpCod,
    data.mem,
    fakeToNull(data.bumonId),
    fakeToNull(data.shukeibumonId),
    Number(data.dspFlg),
    Number(data.ctnFlg),
    data.defDatQty,
    data.regAmt,
    data.rankAmt1,
    data.rankAmt2,
    data.rankAmt3,
    data.rankAmt4,
    data.rankAmt5,
    date,
    'shigasan',
    data.dspOrdNum,
  ];
  try {
    await connection.query(query, values);
  } catch (e) {
    throw e;
  }
};

/**
 * 機材マスタを更新する関数
 * @param data 更新するデータ
 * @param id 更新する機材のkizai_id
 */
export const upDateEqptDB = async (data: MKizaiDBValues, connection: PoolClient) => {
  const { kizai_id, ...rest } = data;
  // 準備
  const cols = Object.keys(rest);
  const values = Object.values(rest);
  // SET句
  const setClause = cols.map((key, i) => `${key} = $${i + 1}`).join(', ');

  const query = `UPDATE ${SCHEMA}.m_kizai SET ${setClause} WHERE kizai_id = $${cols.length + 1}`;
  try {
    await connection.query(query, [...values, data.kizai_id]);
  } catch (e) {
    throw e;
  }
};

/**
 * 有効な機材を取得する関数
 * @param query kizai_nam
 * @returns 有効な機材の配列（機材選択用）
 */
export const selectActiveEqpts = async (query: string) => {
  let sqlQuery = `
    SELECT
      k.kizai_id as "kizaiId",
      k.kizai_nam as "kizaiNam",
      s.shozoku_nam as "shozokuNam",
      k.bumon_id as "bumonId",
      k.kizai_grp_cod as "kizaiGrpCod",
      k.ctn_flg as "ctnFlg"
    FROM
      ${SCHEMA}.m_kizai as k
    INNER JOIN
      ${SCHEMA}.m_shozoku as s
    ON
      k.shozoku_id = s.shozoku_id
    WHERE
      k.del_flg <> 1
      AND k.dsp_flg <> 0
  `;
  const values = [];
  // queryチェック
  if (query && query.trim() !== '') {
    sqlQuery += ` AND k.kizai_nam ILIKE $${values.length + 1}`;
    values.push(`%${query}%`);
  }
  // ORDER BY
  sqlQuery += `
    ORDER BY
      k.kizai_grp_cod,
      k.dsp_ord_num;
  `;
  try {
    return await pool.query(sqlQuery, values);
  } catch (e) {
    throw e;
  }
};

/**
 * セットになっている機材リストを取得する関数
 * @param setIds 選択された機材のセットになってる機材IDリスト
 * @returns 機材IDが一致する機材リスト
 */
export const selectBundledEqpts = async (setIds: number[]) => {
  const placeholders = setIds.map((_, i) => `$${i + 1}`).join(',');
  const query = `
          SELECT
            k.kizai_id as "kizaiId",
            k.kizai_nam as "kizaiNam",
            s.shozoku_nam as "shozokuNam",
            k.bumon_id as "bumonId",
            k.kizai_grp_cod as "kizaiGrpCod"
          FROM
            dev6.m_kizai as k
          INNER JOIN
            dev6.m_shozoku as s
          ON
            k.shozoku_id = s.shozoku_id
          WHERE
            k.del_flg <> 1
            AND k.dsp_flg <> 0
            AND k.kizai_id IN (${placeholders})
          ORDER BY
            k.kizai_grp_cod,
            k.dsp_ord_num;
        `;
  try {
    return await pool.query(query, setIds);
  } catch (e) {
    throw e;
  }
};

export const selectMeisaiEqts = async (ids: number[]) => {
  try {
    return await supabase
      .schema(SCHEMA)
      .from('m_kizai')
      .select('kizai_id, shozoku_id')
      .in('kizai_id', ids)
      .eq('del_flg', 0)
      .eq('dsp_flg', 1);
  } catch (e) {
    throw e;
  }
};
