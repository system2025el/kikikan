'use server';

import { PoolClient } from 'pg';

import pool from '../postgres';
import { SCHEMA, supabase } from '../supabase';
import { MIsshikiDBValues } from '../types/m-issiki-type';

/**
 * DBから有効な一式を取得する関数
 * @returns 有効な一式のidと名前の配列
 */
export const selectActiveIsshikis = async () => {
  try {
    return await supabase
      .schema(SCHEMA)
      .from('m_issiki')
      .select('issiki_id, issiki_nam')
      .neq('del_flg', 1)
      .order('issiki_nam');
  } catch (e) {
    throw e;
  }
};

/**
 * issiki_namが一致する一式を取得する関数
 * @param {string} query 一式名
 * @returns issiki_nameで検索された一式マスタの配列 検索無しなら全件
 */
export const selectFilteredIsshikis = async () => {
  const builder = supabase
    .schema(SCHEMA)
    .from('m_issiki')
    .select('issiki_id, issiki_nam, reg_amt, mem, del_flg') // テーブルに表示するカラム
    .order('issiki_nam'); // 並び順

  try {
    return await builder;
  } catch (e) {
    throw e;
  }
};

/**
 * issiki_idが一致する一式を取得する関数
 * @param id 探すissiki_id
 * @returns issiki_idが一致する一式
 */
export const selectOneIsshiki = async (id: number) => {
  const query = `
    SELECT
      i.issiki_id, i.issiki_nam, set.kizai_id, k.kizai_nam, i.del_flg, i.mem, i.reg_amt
    FROM
      ${SCHEMA}.m_issiki as i
    LEFT JOIN
      ${SCHEMA}.m_issiki_set as set
    ON
      set.issiki_id = i.issiki_id
    LEFT JOIN
      ${SCHEMA}.m_kizai as k
    ON
      set.kizai_id = k.kizai_id
    WHERE
      i.issiki_id = $1
    ORDER BY k.kizai_grp_cod, k.dsp_ord_num
    `;
  try {
    // return await supabase.schema(SCHEMA).from('m_issiki_set').select('kizai_id').eq('issiki_id', id);
    return await pool.query(query, [id]);
  } catch (e) {
    throw e;
  }
};

/**
 * 一式マスタに新規挿入する関数
 * @param data 挿入するデータ
 */
export const insertNewIsshiki = async (data: MIsshikiDBValues, connection: PoolClient) => {
  const values = [data.issiki_nam, data.reg_amt, data.mem, data.del_flg, data.add_dat, data.add_user];
  const query = `
          INSERT INTO ${SCHEMA}.m_issiki (
            issiki_id, issiki_nam, reg_amt, dsp_ord_num, mem, del_flg,
            add_dat, add_user
          )
          VALUES (
            (SELECT coalesce(max(issiki_id),0) + 1 FROM ${SCHEMA}.m_issiki),
            $1, $2,
            (SELECT coalesce(max(dsp_ord_num),0) + 1 FROM ${SCHEMA}.m_issiki),
            $3, $4, $5, $6
          )
          RETURNING
           issiki_id;
        `;

  try {
    return await connection.query(query, values);
  } catch (e) {
    throw e;
  }
};

/**
 * 一式マスタを更新する関数
 * @param data 更新するデータ
 * @param id 更新する一式のissiki_id
 */
export const updateIsshikiDB = async (data: MIsshikiDBValues) => {
  try {
    await supabase
      .schema(SCHEMA)
      .from('m_issiki')
      .update({ ...data })
      .eq('issiki_id', data.issiki_id);
  } catch (e) {
    throw e;
  }
};

/**
 * 一式マスタの無効化フラグを変更する関数
 * @param {number} id 一式ID
 * @param {0 | 1} flg 無効化フラグ
 */
export const updIsshikiDelFlgDB = async (
  id: number,
  data: {
    del_flg: number;
    upd_user: string;
    upd_dat: string;
  }
) => {
  try {
    await supabase.schema(SCHEMA).from('m_issiki').update(data).eq('issiki_id', id);
  } catch (e) {
    console.error(e);
    throw e;
  }
};
