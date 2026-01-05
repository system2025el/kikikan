'use server';

import { VehsMasterDialogValues } from '@/app/(main)/(masters)/vehicles-master/_lib/types';

import pool from '../postgres';
import { SCHEMA, supabase } from '../supabase';
import { MSharyoDBValues } from '../types/m-sharyo-type';

/**
 * m_sharyoから有効な車両の配列を取得する関数
 * @returns 有効な車両の配列
 */
export const selectActiveVehs = async () => {
  try {
    return supabase
      .schema(SCHEMA)
      .from('m_sharyo')
      .select('sharyo_id, sharyo_nam')
      .neq('del_flg', 1)
      .neq('dsp_flg', 0)
      .order('sharyo_nam');
  } catch (e) {
    throw e;
  }
};

/**
 * 車両マスタテーブルのデータを取得する関数
 * @param query 検索キーワード
 * @returns {Promise<VehsDialogValues[]>} 公演場所マスタテーブルに表示するデータ（ 検索キーワードが空の場合は全て ）
 */
export const SelectFilteredVehs = async (/*query: string*/) => {
  const builder = supabase
    .schema(SCHEMA)
    .from('m_sharyo')
    .select('sharyo_id, sharyo_nam, mem, dsp_flg, del_flg') // テーブルに表示するカラム
    .order('sharyo_nam'); // 並び順
  try {
    return await builder;
  } catch (e) {
    throw e;
  }
};

/**
 * sharyo_idが一致する車両を取得する関数
 * @param id 探すsharyo_id
 * @returns 車両IDが一致する車両情報
 */
export const selectOneVeh = async (id: number) => {
  try {
    return await supabase
      .schema(SCHEMA)
      .from('m_sharyo')
      .select('sharyo_nam, mem, del_flg, dsp_flg')
      .eq('sharyo_id', id)
      .single();
  } catch (e) {
    throw e;
  }
};

/**
 * 車両マスタに新規挿入する関数
 * @param data 挿入するデータ
 */
export const insertNewVeh = async (data: VehsMasterDialogValues, user: string) => {
  const query = `
    INSERT INTO ${SCHEMA}.m_sharyo (
      sharyo_id, sharyo_nam, del_flg, dsp_ord_num,
      mem, dsp_flg, add_dat, add_user
    )
    VALUES (
      (SELECT coalesce(max(sharyo_id),0) + 1 FROM ${SCHEMA}.m_sharyo),
      $1, $2, 
      (SELECT coalesce(max(dsp_ord_num),0) + 1 FROM ${SCHEMA}.m_sharyo),
      $3, $4, $5, $6
    );
  `;
  const date = new Date().toISOString();
  const values = [data.sharyoNam, Number(data.delFlg), data.mem, Number(data.dspFlg), date, user];
  try {
    await pool.query(query, values);
  } catch (e) {
    throw e;
  }
};

/**
 * 車両マスタを更新する関数
 * @param data 更新するデータ
 * @param id 更新する車両のsharyo_id
 */
export const upDateVehDB = async (data: MSharyoDBValues) => {
  try {
    await supabase
      .schema(SCHEMA)
      .from('m_sharyo')
      .update({ ...data })
      .eq('sharyo_id', data.sharyo_id);
  } catch (e) {
    throw e;
  }
};
