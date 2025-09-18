'use server';

import { toJapanTimeString } from '@/app/(main)/_lib/date-conversion';
import { DaibumonsMasterDialogValues } from '@/app/(main)/(masters)/daibumons-master/_lib/types';

import pool from '../postgres';
import { SCHEMA, supabase } from '../supabase';
import { MDaibumonDBValues } from '../types/m-daibumon-type';

/**
 * DBから有効な大部門を取得する関数
 * @returns 有効な大部門のidと名前の配列
 */
export const selectActiveDaibumons = async () => {
  try {
    return await supabase.schema(SCHEMA).from('m_dai_bumon').select('dai_bumon_id, dai_bumon_nam').neq('del_flg', 1);
  } catch (e) {
    throw e;
  }
};

/**
 * dai_bumon_namが一致する大部門を取得する関数
 * @param {string} query 大部門名
 * @returns dai_bumon_nameで検索された大部門マスタの配列 検索無しなら全件
 */
export const selectFilteredDaibumons = async (query: string) => {
  const builder = supabase
    .schema(SCHEMA)
    .from('m_dai_bumon')
    .select('dai_bumon_id, dai_bumon_nam,  mem, del_flg') // テーブルに表示するカラム
    .order('dsp_ord_num'); // 並び順

  if (query && query.trim() !== '') {
    builder.ilike('dai_bumon_nam', `%${query}%`);
  }

  try {
    return await builder;
  } catch (e) {
    throw e;
  }
};

/**
 * dai_bumon_idが一致する大部門を取得する関数
 * @param id 探すdai_bumon_id
 * @returns dai_bumon_idが一致する大部門
 */
export const selectOneDaibumon = async (id: number) => {
  try {
    return await supabase
      .schema(SCHEMA)
      .from('m_dai_bumon')
      .select('dai_bumon_nam, del_flg, mem')
      .eq('dai_bumon_id', id)
      .single();
  } catch (e) {
    throw e;
  }
};

/**
 * 大部門マスタに新規挿入する関数
 * @param data 挿入するデータ
 */
export const insertNewDaibumon = async (data: DaibumonsMasterDialogValues) => {
  const query = `
          INSERT INTO ${SCHEMA}.m_dai_bumon (
            dai_bumon_id, dai_bumon_nam, del_flg, dsp_ord_num,
            mem, add_dat, add_user
          )
          VALUES (
            (SELECT coalesce(max(dai_bumon_id),0) + 1 FROM ${SCHEMA}.m_dai_bumon),
            $1, $2,
            (SELECT coalesce(max(dsp_ord_num),0) + 1 FROM ${SCHEMA}.m_dai_bumon),
            $3, $4, $5
          );
        `;
  const date = toJapanTimeString();
  const values = [data.daibumonNam, Number(data.delFlg), data.mem, date, 'shigasan'];

  try {
    await pool.query(query, values);
  } catch (e) {
    throw e;
  }
};

/**
 * 大部門マスタを更新する関数
 * @param data 更新するデータ
 * @param id 更新する大部門のdai_bumon_id
 */
export const updateDaibumonDB = async (data: MDaibumonDBValues) => {
  try {
    await supabase
      .schema(SCHEMA)
      .from('m_dai_bumon')
      .update({ ...data })
      .eq('dai_bumon_id', data.dai_bumon_id);
  } catch (e) {
    throw e;
  }
};
