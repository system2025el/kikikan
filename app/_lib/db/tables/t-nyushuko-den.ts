'use server';

import { SCHEMA, supabase } from '../supabase';
import { NyushukoDen } from '../types/t-nyushuko-den-type';

/**
 * 入出庫伝票新規追加
 * @param data 入出庫伝票データ
 * @returns
 */
export const insertNyushukoDen = async (data: NyushukoDen[]) => {
  try {
    return await supabase.schema(SCHEMA).from('t_nyushuko_den').insert(data);
  } catch (e) {
    throw e;
  }
};

/**
 * 入出庫伝票更新
 * @param data 入出庫伝票データ
 * @returns
 */
export const updateNyushukoDen = async (data: NyushukoDen) => {
  try {
    return await supabase
      .schema(SCHEMA)
      .from('t_nyushuko_den')
      .update(data)
      .eq('juchu_head_id', data.juchu_head_id)
      .eq('juchu_kizai_head_id', data.juchu_kizai_head_id)
      .eq('kizai_id', data.kizai_id)
      .eq('sagyo_id', data.sagyo_id)
      .eq('sagyo_kbn_id', data.sagyo_kbn_id);
  } catch (e) {
    throw e;
  }
};

/**
 * 入出庫伝票削除
 * @param juchuHeadId 受注ヘッダーid
 * @param juchuKizaiHeadId 受注機材ヘッダーid
 * @param juchuKizaiMeisaiIds 受注機材ヘッダーid
 * @returns
 */
export const deleteNyushukoDen = async (juchuHeadId: number, juchuKizaiHeadId: number, kizaiId: number[]) => {
  try {
    return await supabase
      .schema(SCHEMA)
      .from('t_nyushuko_den')
      .delete()
      .eq('juchu_head_id', juchuHeadId)
      .eq('juchu_kizai_head_id', juchuKizaiHeadId)
      .in('kizai_id', kizaiId);
  } catch (e) {
    throw e;
  }
};

/**
 * コンテナ入出庫伝票確認
 * @param data コンテナ入出庫伝票確認データ
 * @returns
 */
export const selectContainerNyushukoDenConfirm = async (data: {
  juchu_head_id: number;
  juchu_kizai_head_id: number;
  juchu_kizai_meisai_id: number;
  kizai_id: number;
  sagyo_id: number;
}) => {
  try {
    return await supabase
      .schema(SCHEMA)
      .from('t_nyushuko_den')
      .select('*')
      .eq('juchu_head_id', data.juchu_head_id)
      .eq('juchu_kizai_head_id', data.juchu_kizai_head_id)
      .eq('juchu_kizai_meisai_id', data.juchu_kizai_meisai_id)
      .eq('kizai_id', data.kizai_id)
      .eq('sagyo_id', data.sagyo_id);
  } catch (e) {
    throw e;
  }
};

/**
 * コンテナ入出庫伝票削除
 * @param data コンテナ入出庫伝票削除データ
 * @returns
 */
export const deleteContainerNyushukoDen = async (data: {
  juchu_head_id: number;
  juchu_kizai_head_id: number;
  juchu_kizai_meisai_id: number;
  kizai_id: number;
  sagyo_id: number;
}) => {
  try {
    return await supabase
      .schema(SCHEMA)
      .from('t_nyushuko_den')
      .delete()
      .eq('juchu_head_id', data.juchu_head_id)
      .eq('juchu_kizai_head_id', data.juchu_kizai_head_id)
      .eq('juchu_kizai_meisai_id', data.juchu_kizai_meisai_id)
      .eq('kizai_id', data.kizai_id)
      .eq('sagyo_id', data.sagyo_id);
  } catch (e) {
    throw e;
  }
};
