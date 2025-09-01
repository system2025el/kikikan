'use server';

import { SCHEMA, supabase } from '../supabase';

/**
 * 受注機材明細id最大値取得
 * @param juchuHeadId 受注ヘッダーid
 * @param juchuKizaiHeadId 受注機材ヘッダーid
 * @returns 受注機材明細id最大値
 */
export const SelectJuchuKizaiMeisaiMaxId = async (juchuHeadId: number, juchuKizaiHeadId: number) => {
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
export const SelectJuchuKizaiMeisaiKizaiTanka = async (juchuHeadId: number, juchuKizaiHeadId: number) => {
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
export const InsertJuchuKizaiMeisai = async (
  data: {
    juchu_head_id: number;
    juchu_kizai_head_id: number;
    juchu_kizai_meisai_id: number;
    kizai_id: number;
    kizai_tanka_amt: number;
    plan_kizai_qty: number;
    plan_yobi_qty: number | null;
    mem: string | null;
    keep_qty: number | null;
    add_dat: Date;
    add_user: string;
    shozoku_id: number;
  }[]
) => {
  try {
    return await supabase.schema(SCHEMA).from('t_juchu_kizai_meisai').insert(data);
  } catch (e) {
    throw e;
  }
};

/**
 * キープ受注機材明細新規追加
 * @param juchuKizaiMeisaiData 受注機材明細データ
 * @param userNam ユーザー名
 * @returns
 */
export const InsertKeepJuchuKizaiMeisai = async (
  data: {
    juchu_head_id: number;
    juchu_kizai_head_id: number;
    juchu_kizai_meisai_id: number;
    kizai_id: number;
    mem: string;
    keep_qty: number;
    add_dat: Date;
    add_user: string;
    shozoku_id: number;
  }[]
) => {
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
export const UpdateJuchuKizaiMeisai = async (data: {
  juchu_head_id: number;
  juchu_kizai_head_id: number;
  juchu_kizai_meisai_id: number;
  kizai_id: number;
  kizai_tanka_amt: number;
  plan_kizai_qty: number;
  plan_yobi_qty: number | null;
  mem: string | null;
  keep_qty: number | null;
  upd_dat: Date;
  upd_user: string;
  shozoku_id: number;
}) => {
  try {
    return await supabase
      .schema(SCHEMA)
      .from('t_juchu_kizai_meisai')
      .update(data)
      .eq('juchu_head_id', data.juchu_head_id)
      .eq('juchu_kizai_head_id', data.juchu_kizai_head_id)
      .eq('juchu_kizai_meisai_id', data.juchu_kizai_meisai_id);
  } catch (e) {
    throw e;
  }
};

/**
 * キープ受注機材明細更新
 * @param juchuKizaiMeisaiData 受注機材明細データ
 * @param userNam ユーザー名
 * @returns
 */
export const UpdateKeepJuchuKizaiMeisai = async (data: {
  juchu_head_id: number;
  juchu_kizai_head_id: number;
  juchu_kizai_meisai_id: number;
  kizai_id: number;
  mem: string;
  keep_qty: number;
  upd_dat: Date;
  upd_user: string;
  shozoku_id: number;
}) => {
  try {
    return await supabase
      .schema(SCHEMA)
      .from('t_juchu_kizai_meisai')
      .update(data)
      .eq('juchu_head_id', data.juchu_head_id)
      .eq('juchu_kizai_head_id', data.juchu_kizai_head_id)
      .eq('juchu_kizai_meisai_id', data.juchu_kizai_meisai_id);
  } catch (e) {
    throw e;
  }
};

/**
 * 受注機材明細削除
 * @param juchuHeadId 受注ヘッダーid
 * @param juchuKizaiHeadId 受注機材ヘッダーid
 * @param juchuKizaiMeisaiIds 受注機材明細id
 */
export const DeleteJuchuKizaiMeisai = async (
  juchuHeadId: number,
  juchuKizaiHeadId: number,
  juchuKizaiMeisaiIds: number[]
) => {
  try {
    return await supabase
      .schema(SCHEMA)
      .from('t_juchu_kizai_meisai')
      .delete()
      .eq('juchu_head_id', juchuHeadId)
      .eq('juchu_kizai_head_id', juchuKizaiHeadId)
      .in('juchu_kizai_meisai_id', juchuKizaiMeisaiIds);
  } catch (e) {
    throw e;
  }
};

/**
 * キープ受注機材明細削除
 * @param juchuHeadId 受注ヘッダーid
 * @param juchuKizaiHeadId 受注機材ヘッダーid
 * @param juchuKizaiMeisaiIds 受注機材明細id
 */
export const DeleteKeepJuchuKizaiMeisai = async (
  juchuHeadId: number,
  juchuKizaiHeadId: number,
  juchuKizaiMeisaiIds: number[]
) => {
  try {
    return await supabase
      .schema(SCHEMA)
      .from('t_juchu_kizai_meisai')
      .delete()
      .eq('juchu_head_id', juchuHeadId)
      .eq('juchu_kizai_head_id', juchuKizaiHeadId)
      .in('juchu_kizai_meisai_id', juchuKizaiMeisaiIds);
  } catch (e) {
    throw e;
  }
};
