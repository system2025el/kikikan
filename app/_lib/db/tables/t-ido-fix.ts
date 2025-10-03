'use server';

import { SCHEMA, supabase } from '../supabase';
import { IdoFix } from '../types/t-ido-fix-type';

/**
 * 移動確定新規追加
 * @param data 移動確定データ
 * @returns
 */
export const insertIdoFix = async (data: IdoFix[]) => {
  try {
    return await supabase.schema(SCHEMA).from('t_ido_fix').insert(data);
  } catch (e) {
    throw e;
  }
};

/**
 * 移動確定更新
 * @param data 移動確定データ
 * @returns
 */
export const updateIdoFix = async (data: IdoFix) => {
  try {
    return await supabase.schema(SCHEMA).from('t_ido_fix').update(data).eq('ido_den_id', data.ido_den_id);
  } catch (e) {
    throw e;
  }
};

/**
 * 移動確定削除
 * @param idoDenIds 移動確定id
 * @returns
 */
export const deleteIdoFix = async (idoDenIds: number[]) => {
  try {
    return await supabase.schema(SCHEMA).from('t_ido_fix').delete().in('ido_den_id', idoDenIds);
  } catch (e) {
    throw e;
  }
};
