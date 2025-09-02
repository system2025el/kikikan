'use server';

import { SCHEMA, supabase } from '../supabase';
import { JuchuHead } from '../types/t-juchu-head-type';

/**
 * 受注ヘッダーid最大値取得
 * @returns 受注ヘッダーid最大値
 */
export const SelectMaxId = async () => {
  try {
    return await supabase
      .schema(SCHEMA)
      .from('t_juchu_head')
      .select('juchu_head_id')
      .order('juchu_head_id', {
        ascending: false,
      })
      .limit(1)
      .single();
  } catch (e) {
    throw e;
  }
};

/**
 * 受注ヘッダー取得
 * @param juchuHeadId 受注ヘッダーID
 * @returns 受注ヘッダーデータ
 */
export const SelectJuchuHead = async (juchuHeadId: number) => {
  try {
    return await supabase
      .schema(SCHEMA)
      .from('t_juchu_head')
      .select(
        'juchu_head_id, del_flg, juchu_sts, juchu_dat, juchu_str_dat, juchu_end_dat, nyuryoku_user, koen_nam, koenbasho_nam, kokyaku_id, kokyaku_tanto_nam, mem, nebiki_amt, zei_kbn'
      )
      .eq('juchu_head_id', juchuHeadId)
      .single();
  } catch (e) {
    throw e;
  }
};

/**
 * 受注ヘッダー情報新規追加
 * @param juchuHeadId 受注ヘッダーid
 */
export const InsertJuchuHead = async (data: JuchuHead) => {
  try {
    return await supabase.schema(SCHEMA).from('t_juchu_head').insert(data);
  } catch (e) {
    throw e;
  }
};

/**
 * 受注ヘッダー情報更新
 * @param data 受注ヘッダーデータ
 * @returns 正誤
 */
export const UpdateJuchuHead = async (data: JuchuHead) => {
  try {
    return await supabase.schema(SCHEMA).from('t_juchu_head').update(data).eq('juchu_head_id', data.juchu_head_id);
  } catch (e) {
    throw e;
  }
};
