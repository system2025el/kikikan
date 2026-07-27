'use server';

import { BasesMasterDialogValues } from '@/app/(main)/(masters)/bases-master/_lib/types';

import pool from '../postgres';
import { SCHEMA } from '../supabase';
import { createClient } from '../supabase-server';
import { MShozokuDBValues } from '../types/m-shozoku-type';

/**
 * DBから有効な所属を取得する関数
 * @returns 有効な所属のidと名前の配列
 */
export const selectActiveShozokus = async () => {
  const supabase = await createClient();
  try {
    return await supabase
      .schema(SCHEMA)
      .from('m_shozoku')
      .select('shozoku_id, shozoku_nam')
      .neq('del_flg', 1)
      .order('shozoku_id');
  } catch (e) {
    throw new Error('[selectActiveShozokus] DBエラー:', { cause: e });
  }
};

/**
 * shozoku_namが一致する所属を取得する関数
 * @param {string} query 所属名
 * @returns shozoku_nameで検索された所属マスタの配列 検索無しなら全件
 */
export const selectFilteredShozokus = async (query: string) => {
  const supabase = await createClient();
  const builder = supabase
    .schema(SCHEMA)
    .from('m_shozoku')
    .select('shozoku_id, shozoku_nam, mem, del_flg') // テーブルに表示するカラム
    .order('shozoku_nam'); // 並び順
  // 必要か？
  //   if (query && query.trim() !== '') {
  //     builder.ilike('shozoku_nam', `%${query}%`);
  //   }
  try {
    return await builder;
  } catch (e) {
    throw new Error('[selectFilteredShozokus] DBエラー:', { cause: e });
  }
};

/**
 * shozoku_idが一致する所属を取得する関数
 * @param id 探すshozoku_id
 * @returns shozoku_idが一致する所属
 */
export const selectOneShozoku = async (id: number) => {
  const supabase = await createClient();
  try {
    return await supabase
      .schema(SCHEMA)
      .from('m_shozoku')
      .select('shozoku_nam, mem, del_flg')
      .eq('shozoku_id', id)
      .single();
  } catch (e) {
    throw new Error('[selectOneShozoku] DBエラー:', { cause: e });
  }
};

/**
 * 所属マスタに新規挿入する関数
 * @param data 挿入するデータ
 */
export const insertNewShozoku = async (data: BasesMasterDialogValues, user: string) => {
  const query = `
        INSERT INTO ${SCHEMA}.m_shozoku (
          shozoku_id, shozoku_nam, del_flg, dsp_ord_num, reg_amt,
          mem, add_dat, add_user
        )
        VALUES (
          (SELECT coalesce(max(shozoku_id),0) + 1 FROM ${SCHEMA}.m_shozoku),
          $1, $2, 
          (SELECT coalesce(max(dsp_ord_num),0) + 1 FROM ${SCHEMA}.m_shozoku),
          $3, $4, $5, $6
        );
      `;
  const date = new Date().toISOString();
  const values = [data.shozokuNam, Number(data.delFlg), data.mem, date, user];
  try {
    await pool.query(query, values);
  } catch (e) {
    throw new Error('[insertNewShozoku] DBエラー:', { cause: e });
  }
};

/**
 * 所属マスタを更新する関数
 * @param data 更新するデータ
 * @param id 更新する所属のshozoku_id
 */
export const upDateShozokuDB = async (data: MShozokuDBValues) => {
  const supabase = await createClient();
  try {
    await supabase
      .schema(SCHEMA)
      .from('m_shozoku')
      .update({ ...data })
      .eq('shozoku_id', data.shozoku_id);
  } catch (e) {
    throw new Error('[upDateShozokuDB] DBエラー:', { cause: e });
  }
};
