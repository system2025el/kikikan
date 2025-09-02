'use server';

import { SCHEMA, supabase } from '../supabase';
import { JuchuKizaiNyushuko } from '../types/t-juchu-kizai-nyushuko-type';

/**
 * 受注機材入出庫データ取得
 * @param juchuHeadId 受注ヘッダーid
 * @param juchuKizaiHeadId 受注機材ヘッダーid
 * @returns 受注機材入出庫データ
 */
export const SelectJuchuKizaiNyushuko = async (juchuHeadId: number, juchuKizaiHeadId: number) => {
  try {
    return await supabase
      .schema(SCHEMA)
      .from('t_juchu_kizai_nyushuko')
      .select('nyushuko_shubetu_id, nyushuko_basho_id, nyushuko_dat')
      .eq('juchu_head_id', juchuHeadId)
      .eq('juchu_kizai_head_id', juchuKizaiHeadId);
  } catch (e) {
    throw e;
  }
};

/**
 * 受注機材入出庫データ確認
 * @param confirmData 受注機材入出庫確認データ
 * @returns
 */
export const SelectJuchuKizaiNyushukoConfirm = async (data: {
  juchu_head_id: number;
  juchu_kizai_head_id: number;
  nyushuko_shubetu_id: number;
  nyushuko_basho_id: number;
}) => {
  try {
    return await supabase
      .schema(SCHEMA)
      .from('t_juchu_kizai_nyushuko')
      .select('*')
      .eq('juchu_head_id', data.juchu_head_id)
      .eq('juchu_kizai_head_id', data.juchu_kizai_head_id)
      .eq('nyushuko_shubetu_id', data.nyushuko_shubetu_id)
      .eq('nyushuko_basho_id', data.nyushuko_basho_id)
      .single();
  } catch (e) {
    throw e;
  }
};

/**
 * 受注機材入出庫新規追加
 * @param juchuKizaiHeadId 受注機材ヘッダーid
 * @param juchuKizaiHeadData 受注機材ヘッダーデータ
 * @param userNam ユーザー名
 * @returns
 */
export const InsertJuchuKizaiNyushuko = async (data: JuchuKizaiNyushuko) => {
  try {
    return await supabase.schema(SCHEMA).from('t_juchu_kizai_nyushuko').insert(data);
  } catch (e) {
    throw e;
  }
};

/**
 * 受注機材入出庫更新
 * @param juchuKizaiHeadData 受注機材ヘッダーデータ
 * @param userNam ユーザー名
 * @returns
 */
export const UpdateJuchuKizaiNyushuko = async (data: JuchuKizaiNyushuko) => {
  try {
    return await supabase
      .schema(SCHEMA)
      .from('t_juchu_kizai_nyushuko')
      .update(data)
      .eq('juchu_head_id', data.juchu_head_id)
      .eq('juchu_kizai_head_id', data.juchu_kizai_head_id)
      .eq('nyushuko_shubetu_id', data.nyushuko_shubetu_id)
      .eq('nyushuko_basho_id', data.nyushuko_basho_id);
  } catch (e) {
    throw e;
  }
};

export const DeleteJchuKizaiNyushuko = async (data: {
  juchu_head_id: number;
  juchu_kizai_head_id: number;
  nyushuko_shubetu_id: number;
  nyushuko_basho_id: number;
}) => {
  try {
    return await supabase
      .schema(SCHEMA)
      .from('t_juchu_kizai_nyushuko')
      .delete()
      .eq('juchu_head_id', data.juchu_head_id)
      .eq('juchu_kizai_head_id', data.juchu_kizai_head_id)
      .eq('nyushuko_shubetu_id', data.nyushuko_shubetu_id)
      .eq('nyushuko_basho_id', data.nyushuko_basho_id);
  } catch (e) {
    throw e;
  }
};
