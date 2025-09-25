'use server';

import { JuchuContainerMeisaiValues } from '@/app/(main)/(eq-order-detail)/eq-main-order-detail/[juchu_head_id]/[juchu_kizai_head_id]/[mode]/_lib/types';

import { SCHEMA, supabase } from '../supabase';
import { JuchuCtnMeisai } from '../types/t_juchu_ctn_meisai-type';

/**
 * 受注コンテナ明細id最大値取得
 * @param juchuHeadId 受注ヘッダーid
 * @param juchuKizaiHeadId 受注機材ヘッダーid
 * @returns
 */
export const selectJuchuContainerMeisaiMaxId = async (juchuHeadId: number, juchuKizaiHeadId: number) => {
  try {
    return await supabase
      .schema(SCHEMA)
      .from('t_juchu_ctn_meisai')
      .select('juchu_kizai_meisai_id')
      .eq('juchu_head_id', juchuHeadId)
      .eq('juchu_kizai_head_id', juchuKizaiHeadId)
      .order('juchu_kizai_meisai_id', {
        ascending: false,
      })
      .limit(1)
      .single();
  } catch (e) {
    throw e;
  }
};

/**
 * 受注コンテナ明細新規追加
 * @param data 受注コンテナ明細データ
 * @returns
 */
export const insertJuchuContainerMeisai = async (data: JuchuCtnMeisai[]) => {
  try {
    return await supabase.schema(SCHEMA).from('t_juchu_ctn_meisai').insert(data);
  } catch (e) {
    throw e;
  }
};

/**
 * 受注コンテナ明細更新
 * @param data 受注コンテナ明細データ
 * @returns
 */
export const updateJuchuContainerMeisai = async (data: JuchuCtnMeisai) => {
  try {
    return await supabase
      .schema(SCHEMA)
      .from('t_juchu_ctn_meisai')
      .update(data)
      .eq('juchu_head_id', data.juchu_head_id)
      .eq('juchu_kizai_head_id', data.juchu_kizai_head_id)
      .eq('juchu_kizai_meisai_id', data.juchu_kizai_meisai_id)
      .eq('shozoku_id', data.shozoku_id);
  } catch (e) {
    throw e;
  }
};

/**
 * 受注コンテナ明細削除
 * @param juchuHeadId 受注ヘッダーid
 * @param juchuKizaiHeadId 受注機材ヘッダーid
 * @param deleteJuchuContainerMeisaiIds 受注コンテナ明細id
 * @returns
 */
export const deleteJuchuContainerMeisai = async (
  juchuHeadId: number,
  juchuKizaiHeadId: number,
  deleteJuchuContainerMeisaiIds: number[]
) => {
  try {
    return await supabase
      .schema(SCHEMA)
      .from('t_juchu_ctn_meisai')
      .delete()
      .eq('juchu_head_id', juchuHeadId)
      .eq('juchu_kizai_head_id', juchuKizaiHeadId)
      .in('juchu_kizai_meisai_id', deleteJuchuContainerMeisaiIds);
  } catch (e) {
    throw e;
  }
};
