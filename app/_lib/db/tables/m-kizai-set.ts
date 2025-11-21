'use server';

import { toJapanTimeStampString } from '@/app/(main)/_lib/date-conversion';
import { EqptSetsMasterDialogValues } from '@/app/(main)/(masters)/eqpt-set-master/_lib/types';

import pool from '../postgres';
import { SCHEMA, supabase } from '../supabase';
import { MKizaiSetDBValues } from '../types/m-kizai-set-type';

/**
 * 選択された機材のセット機材のIDリストを取得する関数
 * @param idList 選択された機材のIDリスト
 * @returns 選択された機材のセット機材のIDリスト
 */
export const selectBundledEqptIds = async (idList: number[]) => {
  try {
    return await supabase.schema(SCHEMA).from('m_kizai_set').select('kizai_id, set_kizai_id').in('kizai_id', idList);
  } catch (e) {
    throw e;
  }
};

/**
 * 機材IDに一致するセット機材を取得する関数
 * @param kizaiId kizai_id
 * @returns m_kizai_setのDB型の配列
 */
export const selectSetOptions = async (kizaiId: number) => {
  const query = `
  SELECT
    s.set_kizai_id, v.kizai_nam, v.shozoku_nam, v.bumon_id, v.kizai_grp_cod, v.ctn_flg
  FROM
    ${SCHEMA}.m_kizai_set as s
  LEFT JOIN
    ${SCHEMA}.v_kizai_lst as v
  ON
    s.set_kizai_id = v.kizai_id
  WHERE
    s.kizai_id = $1
  AND
    v.del_flg <> 1`;
  try {
    return await pool.query(query, [kizaiId]);
  } catch (e) {
    throw e;
  }
};

/**
 * DBから有効な機材セットを取得する関数
 * @returns 有効な機材セットのidと名前の配列
 */
export const selectActiveEqptSets = async () => {
  try {
    return await supabase
      .schema(SCHEMA)
      .from('m_kizai_set')
      .select('kizai_set_id, kizai_set_nam')
      .neq('del_flg', 1)
      .order('kizai_set_nam');
  } catch (e) {
    throw e;
  }
};

/**
 * kizai_set_namが一致する機材セットを取得する関数
 * @param {string} query 機材セット名
 * @returns kizai_set_nameで検索された機材セットマスタの配列 検索無しなら全件
 */
export const selectFilteredEqptSets = async (query: string) => {
  // const builder = supabase.schema(SCHEMA).from('m_kizai_set').select('set_kizai_id,  mem, del_flg'); // テーブルに表示するカラム

  // if (query && query.trim() !== '') {
  //   builder.ilike('kizai_set_nam', `%${query}%`);
  // }

  let queryString = `
    SELECT
      s.kizai_id, k.kizai_nam, s.mem, s.del_flg
    FROM
      ${SCHEMA}.m_kizai_set as s
    LEFT JOIN
      ${SCHEMA}.m_kizai as k
    ON s.kizai_id = k.kizai_id
  `;
  const values = [];

  if (query && query.trim() !== '') {
    queryString += ` WHERE k.kizai_nam ILIKE '$1'`;
    values.push(query);
  }

  queryString += ` GROUP BY s.kizai_id, k.kizai_nam, s.mem, s.del_flg`;

  try {
    // return await builder;
    return await pool.query(queryString, values);
  } catch (e) {
    throw e;
  }
};

/**
 * kizai_set_idが一致する機材セットを取得する関数
 * @param id 探すkizai_set_id
 * @returns kizai_set_idが一致する機材セット
 */
export const selectOneEqptSet = async (id: number) => {
  const query = `
    SELECT
      set.kizai_id, set.set_kizai_id, k.kizai_nam as set_kizai_nam, set.del_flg
    FROM
      ${SCHEMA}.m_kizai_set as set
    LEFT JOIN
      ${SCHEMA}.m_kizai as k
    ON
      k.kizai_id = set.set_kizai_id
    WHERE
      set.kizai_id = $1
  `;
  try {
    return pool.query(query, [id]);
    // return await supabase
    //   .schema(SCHEMA)
    //   .from('m_kizai_set')
    //   .select('set_kizai_id, del_flg, mem')
    //   .eq('kizai_set_id', id)
    //   .single();
  } catch (e) {
    throw e;
  }
};

/**
 * 機材セットマスタに新規挿入する関数
 * @param data 挿入するデータ
 */
export const insertNewEqptSet = async (data: EqptSetsMasterDialogValues, user: string) => {
  const query = `
          INSERT INTO ${SCHEMA}.m_kizai_set (
            kizai_set_id, kizai_set_nam, del_flg, dsp_ord_num,
            mem, add_dat, add_user
          )
          VALUES (
            (SELECT coalesce(max(kizai_set_id),0) + 1 FROM ${SCHEMA}.m_kizai_set),
            $1, $2,
            (SELECT coalesce(max(dsp_ord_num),0) + 1 FROM ${SCHEMA}.m_kizai_set),
            $3, $4, $5
          );
        `;
  const date = toJapanTimeStampString();
  const values = [Number(data.delFlg), data.mem, date, user];

  try {
    await pool.query(query, values);
  } catch (e) {
    throw e;
  }
};

/**
 * 機材セットマスタを更新する関数
 * @param data 更新するデータ
 * @param id 更新する機材セットのkizai_set_id
 */
export const updateEqptSetDB = async (data: MKizaiSetDBValues) => {
  try {
    await supabase
      .schema(SCHEMA)
      .from('m_kizai_set')
      .update({ ...data })
      .eq('kizai_id', data.kizai_id);
  } catch (e) {
    throw e;
  }
};
