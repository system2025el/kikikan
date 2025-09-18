'use server';

import { toJapanTimeString } from '@/app/(main)/_lib/date-conversion';
import { BumonsMasterDialogValues } from '@/app/(main)/(masters)/bumons-master/_lib/types';

import pool from '../postgres';
import { SCHEMA, supabase } from '../supabase';
import { MBumonDBValues } from '../types/m-bumon-type';
import { MDaibumonDBValues } from '../types/m-daibumon-type';

/**
 * DBから有効な部門を取得する関数
 * @returns 有効な部門のidと名前の配列
 */
export const selectActiveBumons = async () => {
  try {
    return await supabase
      .schema(SCHEMA)
      .from('m_bumon')
      .select('bumon_id, bumon_nam')
      .neq('del_flg', 1)
      .order('dsp_ord_num');
  } catch (e) {
    throw e;
  }
};

/**
 * 条件が一致する部門を取得する関数
 * @param {string} query 部門名, 大部門ID, 集計部門ID
 * @returns bumon_name, dai_bumon_id, shukei_bumon_idで検索された部門マスタの配列 検索無しなら全件
 */
export const selectFilteredBumons = async (queries: { q: string; d: number; s: number }) => {
  const builder = supabase
    .schema(SCHEMA)
    .from('m_bumon')
    .select('bumon_id, bumon_nam, mem, del_flg')
    .order('dsp_ord_num');

  if (queries.q && queries.q.trim() !== '') {
    builder.ilike('bumon_nam', `%${queries.q}%`);
  }
  if (queries.d !== 0) {
    builder.eq('dai_bumon_id', queries.d);
  }
  if (queries.s !== 0) {
    builder.eq('shukei_bumon_id', queries.s);
  }
  try {
    return await builder;
  } catch (e) {
    throw e;
  }
};

/**
 * bumon_idが一致する部門を取得する関数
 * @param id 探すbumon_id
 * @returns bumon_idが一致する部門
 */
export const selectOneBumon = async (id: number) => {
  try {
    return await supabase
      .schema(SCHEMA)
      .from('m_bumon')
      .select('bumon_nam, del_flg, dai_bumon_id, shukei_bumon_id, mem ')
      .eq('bumon_id', id)
      .single();
  } catch (e) {
    throw e;
  }
};

/**
 * 部門マスタに新規挿入する関数
 * @param data 挿入するデータ
 */
export const insertNewBumon = async (data: BumonsMasterDialogValues) => {
  const query = `
    INSERT INTO ${SCHEMA}.m_bumon (
      bumon_id, bumon_nam, del_flg, dsp_ord_num,
      dai_bumon_id, shukei_bumon_id,
      mem, add_dat, add_user
    )
    VALUES (
      (SELECT coalesce(max(bumon_id),0) + 1 FROM ${SCHEMA}.m_bumon),
      $1, $2,
      (SELECT coalesce(max(dsp_ord_num),0) + 1 FROM ${SCHEMA}.m_bumon),
      $3, $4, $5, $6, $7
    );
  `;

  const date = toJapanTimeString();
  const values = [data.bumonNam, Number(data.delFlg), data.daibumonId, data.shukeibumonId, data.mem, date, 'shigasan'];

  try {
    await pool.query(query, values);
  } catch (e) {
    throw e;
  }
};

/**
 * 部門マスタを更新する関数
 * @param data 更新するデータ
 * @param id 更新する部門のbumon_id
 */
export const upDateBumonDB = async (data: MBumonDBValues) => {
  try {
    await supabase
      .schema(SCHEMA)
      .from('m_bumon')
      .update({ ...data })
      .eq('bumon_id', data.bumon_id);
  } catch (e) {
    throw e;
  }
};
