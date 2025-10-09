'use server';

import { toJapanTimeString } from '@/app/(main)/_lib/date-conversion';
import { ShukeibumonsMasterDialogValues } from '@/app/(main)/(masters)/shukeibumons-master/_lib/types';

import pool from '../postgres';
import { SCHEMA, supabase } from '../supabase';
import { MShukeibumonDBValues } from '../types/m-shukeibumon-type';

/**
 * DBから有効な集計部門を取得する関数
 * @returns 有効な集計部門のidと名前の配列
 */
export const selectActiveShukeibumons = async () => {
  try {
    return await supabase
      .schema(SCHEMA)
      .from('m_shukei_bumon')
      .select('shukei_bumon_id, shukei_bumon_nam')
      .neq('del_flg', 1)
      .order('dsp_ord_num');
  } catch (e) {
    throw e;
  }
};

/**
 * shukei_bumon_namが一致する集計部門を取得する関数
 * @param {string} query 集計部門名
 * @returns shukei_bumon_nameで検索された集計部門マスタの配列 検索無しなら全件
 */
export const selectFilteredShukeibumons = async (query: string) => {
  const builder = supabase
    .schema(SCHEMA)
    .from('m_shukei_bumon')
    .select('shukei_bumon_id, shukei_bumon_nam, mem, del_flg') // テーブルに表示するカラム
    .order('dsp_ord_num'); // 並び順

  if (query && query.trim() !== '') {
    builder.ilike('shukei_bumon_nam', `%${query}%`);
  }

  try {
    return await builder;
  } catch (e) {
    throw e;
  }
};

/**
 * shukei_bumon_idが一致する集計部門を取得する関数
 * @param id 探すshukei_bumon_id
 * @returns shukei_bumon_idが一致する集計部門
 */
export const selectOneShukeibumon = async (id: number) => {
  try {
    return await supabase
      .schema(SCHEMA)
      .from('m_shukei_bumon')
      .select('shukei_bumon_nam, del_flg, mem')
      .eq('shukei_bumon_id', id)
      .single();
  } catch (e) {
    throw e;
  }
};

/**
 * 集計部門マスタに新規挿入する関数
 * @param data 挿入するデータ
 */
export const insertNewShukeibumon = async (data: ShukeibumonsMasterDialogValues) => {
  const query = `
    INSERT INTO ${SCHEMA}.m_shukei_bumon (
      shukei_bumon_id, shukei_bumon_nam, del_flg, dsp_ord_num,
      mem, add_dat, add_user
    )
    VALUES (
      (SELECT coalesce(max(shukei_bumon_id),0) + 1 FROM ${SCHEMA}.m_shukei_bumon),
      $1, $2,
      (SELECT coalesce(max(dsp_ord_num),0) + 1 FROM ${SCHEMA}.m_shukei_bumon),
      $3, $4, $5
    );
  `;
  const date = toJapanTimeString();
  const values = [data.shukeibumonNam, Number(data.delFlg), data.mem, date, 'shigasan'];

  try {
    await pool.query(query, values);
  } catch (e) {
    throw e;
  }
};

/**
 * 集計部門マスタを更新する関数
 * @param data 更新するデータ
 * @param id 更新する集計部門のshukei_bumon_id
 */
export const upDateShukeibumonDB = async (data: MShukeibumonDBValues) => {
  try {
    await supabase
      .schema(SCHEMA)
      .from('m_shukei_bumon')
      .update({ ...data })
      .eq('shukei_bumon_id', data.shukei_bumon_id);
  } catch (e) {
    throw e;
  }
};
