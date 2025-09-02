import { toJapanTimeString } from '@/app/(main)/_lib/date-conversion';
import { VehsMasterDialogValues } from '@/app/(main)/(masters)/vehicles-master/_lib/types';

import pool from '../postgres';
import { SCHEMA, supabase } from '../supabase';
import { MSharyoDBValues } from '../types/m-sharyo-type';

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
    .order('dsp_ord_num'); // 並び順
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
export const insertNewVeh = async (data: VehsMasterDialogValues) => {
  const query = `
    INSERT INTO m_sharyo (
      sharyo_id, sharyo_nam, del_flg, dsp_ord_num,
      mem, dsp_flg, add_dat, add_user
    )
    VALUES (
      (SELECT coalesce(max(sharyo_id),0) + 1 FROM m_sharyo),
      $1, $2, 
      (SELECT coalesce(max(dsp_ord_num),0) + 1 FROM m_sharyo),
      $3, $4, $5, $6
    );
  `;
  const date = toJapanTimeString();
  const values = [data.sharyoNam, Number(data.delFlg), data.mem, Number(data.dspFlg), date, 'shigasan'];
  try {
    await pool.query(` SET search_path TO dev2;`);
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
