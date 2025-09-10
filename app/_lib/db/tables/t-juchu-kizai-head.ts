'use server';

import { KeepJuchuKizaiHeadValues } from '@/app/(main)/(eq-order-detail)/eq-keep-order-detail/[juchu_head_id]/[juchu_kizai_head_id]/[oya_juchu_kizai_head_id]/[mode]/_lib/types';
import { JuchuKizaiHeadValues } from '@/app/(main)/(eq-order-detail)/eq-main-order-detail/[juchu_head_id]/[juchu_kizai_head_id]/[mode]/_lib/types';

import { SCHEMA, supabase } from '../supabase';
import { JuchuKizaiHead } from '../types/t-juchu-kizai-head-type';

/**
 * 受注機材ヘッダーid最大値取得
 * @returns 受注機材ヘッダーid最大値
 */
export const selectJuchuKizaiHeadMaxId = async (juchuHeadId: number) => {
  try {
    return await supabase
      .schema(SCHEMA)
      .from('t_juchu_kizai_head')
      .select('juchu_kizai_head_id')
      .eq('juchu_head_id', juchuHeadId)
      .order('juchu_kizai_head_id', {
        ascending: false,
      })
      .limit(1)
      .single();
  } catch (e) {
    throw e;
  }
};

/**
 * 受注機材ヘッダー取得
 * @param juchuHeadId 受注ヘッダーid
 * @param juchuKizaiHeadId 受注機材ヘッダーid
 * @returns 受注機材ヘッダーデータ
 */
export const selectJuchuKizaiHead = async (juchuHeadId: number, juchuKizaiHeadId: number) => {
  try {
    return await supabase
      .schema(SCHEMA)
      .from('t_juchu_kizai_head')
      .select('juchu_head_id, juchu_kizai_head_id, juchu_kizai_head_kbn, juchu_honbanbi_qty, nebiki_amt, mem, head_nam')
      .eq('juchu_head_id', juchuHeadId)
      .eq('juchu_kizai_head_id', juchuKizaiHeadId)
      .single();
  } catch (e) {
    throw e;
  }
};

/**
 * キープ受注機材ヘッダー取得
 * @param juchuHeadId 受注ヘッダーid
 * @param juchuKizaiHeadId 受注機材ヘッダーid
 * @returns 受注機材ヘッダーデータ
 */
export const selectKeepJuchuKizaiHead = async (juchuHeadId: number, juchuKizaiHeadId: number) => {
  try {
    return await supabase
      .schema(SCHEMA)
      .from('t_juchu_kizai_head')
      .select('juchu_head_id, juchu_kizai_head_id, juchu_kizai_head_kbn, mem, head_nam, oya_juchu_kizai_head_id')
      .eq('juchu_head_id', juchuHeadId)
      .eq('juchu_kizai_head_id', juchuKizaiHeadId)
      .single();
  } catch (e) {
    throw e;
  }
};

/**
 * 返却受注機材ヘッダー取得
 * @param juchuHeadId 受注ヘッダーid
 * @param juchuKizaiHeadId 受注機材ヘッダーid
 * @returns 受注機材ヘッダーデータ
 */
export const selectReturnJuchuKizaiHead = async (juchuHeadId: number, juchuKizaiHeadId: number) => {
  try {
    return await supabase
      .schema(SCHEMA)
      .from('t_juchu_kizai_head')
      .select(
        'juchu_head_id, juchu_kizai_head_id, juchu_kizai_head_kbn, juchu_honbanbi_qty, nebiki_amt, mem, head_nam, oya_juchu_kizai_head_id'
      )
      .eq('juchu_head_id', juchuHeadId)
      .eq('juchu_kizai_head_id', juchuKizaiHeadId)
      .single();
  } catch (e) {
    throw e;
  }
};

export const selectJuchuHonbanbiQty = async (juchuHeadId: number, juchuKizaiHeadId: number) => {
  try {
    return await supabase
      .schema(SCHEMA)
      .from('t_juchu_kizai_head')
      .select('juchu_honbanbi_qty')
      .eq('juchu_head_id', juchuHeadId)
      .eq('juchu_kizai_head_id', juchuKizaiHeadId)
      .single();
  } catch (e) {
    throw e;
  }
};

/**
 * 受注機材ヘッダー新規追加
 * @param juchuKizaiHeadId 受注機材ヘッダーid
 * @param juchuKizaiHeadData 受注機材ヘッダーデータ
 * @param dspOrdNum 表示順
 * @param userNam ユーザー名
 * @returns
 */
export const insertJuchuKizaiHead = async (data: JuchuKizaiHead) => {
  try {
    return await supabase.schema(SCHEMA).from('t_juchu_kizai_head').insert(data);
  } catch (e) {
    throw e;
  }
};

/**
 * キープ受注機材ヘッダー新規追加
 * @param data キープ受注機材ヘッダーデータ
 * @returns
 */
export const insertKeepJuchuKizaiHead = async (data: JuchuKizaiHead) => {
  try {
    return await supabase.schema(SCHEMA).from('t_juchu_kizai_head').insert(data);
  } catch (e) {
    throw e;
  }
};

/**
 * 返却受注機材ヘッダー新規追加
 * @param data 返却受注機材ヘッダーデータ
 * @returns
 */
export const insertReturnJuchuKizaiHead = async (data: JuchuKizaiHead) => {
  try {
    return await supabase.schema(SCHEMA).from('t_juchu_kizai_head').insert(data);
  } catch (e) {
    throw e;
  }
};

/**
 * 受注機材ヘッダー更新
 * @param juchuKizaiHeadData 受注機材ヘッダーデータ
 * @param userNam ユーザー名
 * @returns
 */
export const updateJuchuKizaiHead = async (data: JuchuKizaiHead) => {
  try {
    return await supabase
      .schema(SCHEMA)
      .from('t_juchu_kizai_head')
      .update(data)
      .eq('juchu_head_id', data.juchu_head_id)
      .eq('juchu_kizai_head_id', data.juchu_kizai_head_id);
  } catch (e) {
    throw e;
  }
};

/**
 * キープ受注機材ヘッダー更新
 * @param juchuKizaiHeadData 受注機材ヘッダーデータ
 * @param userNam ユーザー名
 * @returns
 */
export const updateKeepJuchuKizaiHead = async (data: JuchuKizaiHead) => {
  try {
    return await supabase
      .schema(SCHEMA)
      .from('t_juchu_kizai_head')
      .update(data)
      .eq('juchu_head_id', data.juchu_head_id)
      .eq('juchu_kizai_head_id', data.juchu_kizai_head_id)
      .eq('juchu_kizai_head_kbn', data.juchu_kizai_head_kbn);
  } catch (e) {
    throw e;
  }
};

/**
 * 返却受注機材ヘッダー更新
 * @param juchuKizaiHeadData 受注機材ヘッダーデータ
 * @param userNam ユーザー名
 * @returns
 */
export const updateReturnJuchuKizaiHead = async (data: JuchuKizaiHead) => {
  try {
    return await supabase
      .schema(SCHEMA)
      .from('t_juchu_kizai_head')
      .update(data)
      .eq('juchu_head_id', data.juchu_head_id)
      .eq('juchu_kizai_head_id', data.juchu_kizai_head_id)
      .eq('juchu_kizai_head_kbn', data.juchu_kizai_head_kbn);
  } catch (e) {
    throw e;
  }
};
