'use server';

import { SCHEMA, supabase } from '../supabase';
import { NyushukoFix } from '../types/t-nyushuko-fix-type';

/**
 * 入出庫確定確認
 * @param data 入出庫確定確認データ
 * @returns
 */
export const selectNyushukoFixConfirm = async (data: {
  juchu_head_id: number;
  juchu_kizai_head_id: number;
  sagyo_id: number;
}) => {
  try {
    return await supabase
      .schema(SCHEMA)
      .from('t_nyushuko_fix')
      .select('*')
      .eq('juchu_head_id', data.juchu_head_id)
      .eq('juchu_kizai_head_id', data.juchu_kizai_head_id)
      .eq('sagyo_id', data.sagyo_id);
  } catch (e) {
    throw e;
  }
};

/**
 * 入出庫確定新規追加
 * @param data 入出庫確定データ
 * @returns
 */
export const insertNyushukoFix = async (data: NyushukoFix[]) => {
  try {
    return await supabase.schema(SCHEMA).from('t_nyushuko_fix').insert(data);
  } catch (e) {
    throw e;
  }
};

/**
 * 入出庫確定更新
 * @param data 入出庫確定データ
 * @returns
 */
export const updateNyushukoFix = async (data: NyushukoFix) => {
  try {
    return await supabase
      .schema(SCHEMA)
      .from('t_nyushuko_fix')
      .update(data)
      .eq('juchu_head_id', data.juchu_head_id)
      .eq('juchu_kizai_head_id', data.juchu_kizai_head_id)
      .eq('sagyo_kbn_id', data.sagyo_kbn_id)
      .eq('sagyo_id', data.sagyo_id);
  } catch (e) {
    throw e;
  }
};

/**
 * 入出庫確定削除
 * @param data 入出庫確定削除データ
 * @returns
 */
export const deleteNyushukoFix = async (data: {
  juchu_head_id: number;
  juchu_kizai_head_id: number;
  sagyo_id: number;
}) => {
  try {
    return await supabase
      .schema(SCHEMA)
      .from('t_nyushuko_fix')
      .delete()
      .eq('juchu_head_id', data.juchu_head_id)
      .eq('juchu_kizai_head_id', data.juchu_kizai_head_id)
      .eq('sagyo_id', data.sagyo_id);
  } catch (e) {
    throw e;
  }
};
