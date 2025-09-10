'use server';

import { SCHEMA, supabase } from '../supabase';
import { IdoDen } from '../types/t-ido-den-type';

/**
 * 移動伝票id最大値取得
 * @returns 移動伝票id最大値
 */
export const selectIdoDenMaxId = async () => {
  try {
    return await supabase
      .schema(SCHEMA)
      .from('t_ido_den')
      .select('ido_den_id')
      .order('ido_den_id', {
        ascending: false,
      })
      .limit(1)
      .single();
  } catch (e) {
    throw e;
  }
};

/**
 * 移動伝票新規追加
 * @param newIdoDenId 新規移動伝票id
 * @param idoKizaiData 移動伝票データ
 * @param userNam ユーザー名
 * @returns
 */
export const insertIdoDen = async (data: IdoDen[]) => {
  try {
    return await supabase.schema(SCHEMA).from('t_ido_den').insert(data);
  } catch (e) {
    throw e;
  }
};

/**
 * 移動伝票更新
 * @param idoKizaiData 移動伝票データ
 * @param userNam ユーザー名
 * @returns
 */
export const updateIdoDen = async (data: IdoDen) => {
  try {
    return await supabase.schema(SCHEMA).from('t_ido_den').update(data).eq('ido_den_id', data.ido_den_id);
  } catch (e) {
    throw e;
  }
};

/**
 * 移動伝票削除
 * @param idoDenIds 移動伝票id
 */
export const deleteIdoDen = async (idoDenIds: number[]) => {
  try {
    return await supabase.schema(SCHEMA).from('t_ido_den').delete().in('ido_den_id', idoDenIds);
  } catch (e) {
    throw e;
  }
};
