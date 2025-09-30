'use server';

import { SCHEMA, supabase } from '../supabase';
import { JuchuKizaiMeisai } from '../types/t-juchu-kizai-meisai-type';

/**
 * 受注機材明細id最大値取得
 * @param juchuHeadId 受注ヘッダーid
 * @param juchuKizaiHeadId 受注機材ヘッダーid
 * @returns 受注機材明細id最大値
 */
export const selectJuchuKizaiMeisaiMaxId = async (juchuHeadId: number, juchuKizaiHeadId: number) => {
  try {
    return await supabase
      .schema(SCHEMA)
      .from('t_juchu_kizai_meisai')
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
 * 機材単価取得
 * @param juchuHeadId 受注ヘッダーid
 * @param juchuKizaiHeadId 受注機材ヘッダーid
 * @returns
 */
export const selectJuchuKizaiMeisaiKizaiTanka = async (juchuHeadId: number, juchuKizaiHeadId: number) => {
  try {
    return await supabase
      .schema(SCHEMA)
      .from('t_juchu_kizai_meisai')
      .select('kizai_id, kizai_tanka_amt')
      .eq('juchu_head_id', juchuHeadId)
      .eq('juchu_kizai_head_id', juchuKizaiHeadId);
  } catch (e) {
    throw e;
  }
};

/**
 * 受注機材明細新規追加
 * @param juchuKizaiMeisaiData 受注機材明細データ
 * @param userNam ユーザー名
 * @returns
 */
export const insertJuchuKizaiMeisai = async (data: JuchuKizaiMeisai[]) => {
  try {
    return await supabase.schema(SCHEMA).from('t_juchu_kizai_meisai').insert(data);
  } catch (e) {
    throw e;
  }
};

/**
 * 受注機材明細更新
 * @param juchuKizaiMeisaiData 受注機材明細データ
 * @param userNam ユーザー名
 * @returns
 */
export const updateJuchuKizaiMeisai = async (data: JuchuKizaiMeisai) => {
  try {
    return await supabase
      .schema(SCHEMA)
      .from('t_juchu_kizai_meisai')
      .update(data)
      .eq('juchu_head_id', data.juchu_head_id)
      .eq('juchu_kizai_head_id', data.juchu_kizai_head_id)
      .eq('kizai_id', data.kizai_id);
  } catch (e) {
    throw e;
  }
};

/**
 * 受注機材明細削除
 * @param juchuHeadId 受注ヘッダーid
 * @param juchuKizaiHeadId 受注機材ヘッダーid
 * @param kizaiId 機材id
 */
export const deleteJuchuKizaiMeisai = async (juchuHeadId: number, juchuKizaiHeadId: number, kizaiId: number[]) => {
  try {
    return await supabase
      .schema(SCHEMA)
      .from('t_juchu_kizai_meisai')
      .delete()
      .eq('juchu_head_id', juchuHeadId)
      .eq('juchu_kizai_head_id', juchuKizaiHeadId)
      .in('kizai_id', kizaiId);
  } catch (e) {
    throw e;
  }
};
