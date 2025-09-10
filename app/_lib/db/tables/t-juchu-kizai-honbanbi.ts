'use server';

import { SCHEMA, supabase } from '../supabase';
import { JuchuKizaiHonbanbi } from '../types/t-juchu-kizai-honbanbi-type';

/**
 * 受注機材本番日取得
 * @param juchuHeadId 受注ヘッダーid
 * @param juchuKizaiHeadId 受注機材ヘッダーid
 * @returns 受注機材本番日
 */
export const selectHonbanbi = async (juchuHeadId: number, juchuKizaiHeadId: number) => {
  try {
    return await supabase
      .schema(SCHEMA)
      .from('t_juchu_kizai_honbanbi')
      .select(
        'juchu_head_id, juchu_kizai_head_id, juchu_honbanbi_shubetu_id, juchu_honbanbi_dat, mem, juchu_honbanbi_add_qty'
      )
      .eq('juchu_head_id', juchuHeadId)
      .eq('juchu_kizai_head_id', juchuKizaiHeadId)
      .in('juchu_honbanbi_shubetu_id', [10, 20, 30, 40])
      .order('juchu_honbanbi_dat');
  } catch (e) {
    throw e;
  }
};

/**
 * 受注機材本番日データの存在確認
 * @param juchuHeadId 受注ヘッダーid
 * @param juchuKizaiHeadId 受注機材ヘッダーid
 * @param juchuHonbanbiData 受注機材本番日データ
 * @returns あり：true　なし：false
 */
export const selectHonbanbiConfirm = async (
  juchuHeadId: number,
  juchuKizaiHeadId: number,
  juchuHonbanbiShubetuId: number,
  juchuHonbanbiDat: string
) => {
  try {
    return await supabase
      .schema(SCHEMA)
      .from('t_juchu_kizai_honbanbi')
      .select('juchu_head_id, juchu_kizai_head_id, juchu_honbanbi_shubetu_id, juchu_honbanbi_dat, mem')
      .eq('juchu_head_id', juchuHeadId)
      .eq('juchu_kizai_head_id', juchuKizaiHeadId)
      .eq('juchu_honbanbi_shubetu_id', juchuHonbanbiShubetuId)
      .eq('juchu_honbanbi_dat', juchuHonbanbiDat)
      .single();
  } catch (e) {
    throw e;
  }
};

/**
 * 受注機材本番日新規追加(1件)
 * @param juchuHeadId 受注ヘッダーid
 * @param juchuKizaiHeadId 受注機材ヘッダーid
 * @param juchuHonbanbiData 受注機材本番日データ
 * @param userNam ユーザー名
 * @returns
 */
export const insertHonbanbi = async (data: JuchuKizaiHonbanbi) => {
  try {
    return await supabase.schema(SCHEMA).from('t_juchu_kizai_honbanbi').insert(data);
  } catch (e) {
    throw e;
  }
};

/**
 * 受注機材本番日新規追加(複数件)
 * @param juchuHeadId 受注ヘッダーid
 * @param juchuKizaiHeadId 受注機材ヘッダーid
 * @param juchuHonbanbiData 受注機材本番日データ
 * @param userNam ユーザー名
 * @returns
 */
export const insertAllHonbanbi = async (data: JuchuKizaiHonbanbi[]) => {
  try {
    return await supabase.schema(SCHEMA).from('t_juchu_kizai_honbanbi').insert(data);
  } catch (e) {
    throw e;
  }
};

/**
 * 受注機材入出庫本番日更新
 * @param juchuHeadId 受注ヘッダーid
 * @param juchuKizaiHeadId 受注機材ヘッダーid
 * @param juchuHonbanbiData 受注機材本番日データ
 * @param userNam ユーザー名
 * @returns
 */
export const updateNyushukoHonbanbi = async (data: JuchuKizaiHonbanbi) => {
  try {
    return await supabase
      .schema(SCHEMA)
      .from('t_juchu_kizai_honbanbi')
      .update(data)
      .eq('juchu_head_id', data.juchu_head_id)
      .eq('juchu_kizai_head_id', data.juchu_kizai_head_id)
      .eq('juchu_honbanbi_shubetu_id', data.juchu_honbanbi_shubetu_id);
  } catch (e) {
    throw e;
  }
};

/**
 * 受注機材本番日更新
 * @param juchuHeadId 受注ヘッダーid
 * @param juchuKizaiHeadId 受注機材ヘッダーid
 * @param juchuHonbanbiData 受注機材本番日データ
 * @param userNam ユーザー名
 * @returns
 */
export const updateHonbanbi = async (data: JuchuKizaiHonbanbi) => {
  try {
    return await supabase
      .schema(SCHEMA)
      .from('t_juchu_kizai_honbanbi')
      .update(data)
      .eq('juchu_head_id', data.juchu_head_id)
      .eq('juchu_kizai_head_id', data.juchu_kizai_head_id)
      .eq('juchu_honbanbi_shubetu_id', data.juchu_honbanbi_shubetu_id)
      .eq('juchu_honbanbi_dat', data.juchu_honbanbi_dat);
  } catch (e) {
    throw e;
  }
};

/**
 * 受注機材本番日削除
 * @param juchuHeadId 受注ヘッダーid
 * @param juchuKizaiHeadId 受注機材ヘッダーid
 * @param juchuHonbanbiData 受注機材本番日データ
 */
export const deleteHonbanbi = async (
  juchuHeadId: number,
  juchuKizaiHeadId: number,
  juchuHonbanbiShubetuId: number,
  juchuHonbanbiDat: string
) => {
  try {
    return await supabase
      .schema(SCHEMA)
      .from('t_juchu_kizai_honbanbi')
      .delete()
      .eq('juchu_head_id', juchuHeadId)
      .eq('juchu_kizai_head_id', juchuKizaiHeadId)
      .eq('juchu_honbanbi_shubetu_id', juchuHonbanbiShubetuId)
      .eq('juchu_honbanbi_dat', juchuHonbanbiDat);
  } catch (e) {
    throw e;
  }
};

/**
 * 受注機材本番日(使用中)削除
 * @param juchuHeadId 受注ヘッダーid
 * @param juchuKizaiHeadId 受注機材ヘッダーid
 * @param juchuHonbanbiData 受注機材本番日データ
 */
export const deleteSiyouHonbanbi = async (juchuHeadId: number, juchuKizaiHeadId: number) => {
  try {
    return await supabase
      .schema(SCHEMA)
      .from('t_juchu_kizai_honbanbi')
      .delete()
      .eq('juchu_head_id', juchuHeadId)
      .eq('juchu_kizai_head_id', juchuKizaiHeadId)
      .eq('juchu_honbanbi_shubetu_id', 1);
  } catch (e) {
    throw e;
  }
};
