'use server';

import { SCHEMA, supabase } from '../supabase';
import { Lock } from '../types/t-lock-type';

/**
 * ロック情報取得
 * @param lockShubetu ロック種別
 * @param headId ヘッダーid
 * @returns ロックデータ
 */
export const SelectLock = async (lockShubetu: number, headId: number) => {
  try {
    return await supabase
      .schema(SCHEMA)
      .from('t_lock')
      .select('*')
      .eq('lock_shubetu', lockShubetu)
      .eq('head_id', headId)
      .single();
  } catch (e) {
    throw e;
  }
};

/**
 * ロック情報追加
 * @param lockShubetu ロック種別
 * @param headId ヘッダーid
 */
export const InsertLock = async (data: Lock) => {
  try {
    return await supabase.schema(SCHEMA).from('t_lock').insert(data);
  } catch (e) {
    throw e;
  }
};

/**
 * ロック情報削除
 * @param lockShubetu ロック種別
 * @param headId ヘッダーid
 */
export const DeleteLock = async (lockShubetu: number, headId: number) => {
  try {
    return await supabase.schema(SCHEMA).from('t_lock').delete().eq('lock_shubetu', lockShubetu).eq('head_id', headId);
  } catch (e) {
    throw e;
  }
};
