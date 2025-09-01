'use server';

import { SCHEMA, supabase } from '../supabase';

/**
 * 移動伝票id最大値取得
 * @returns 移動伝票id最大値
 */
export const SelectIdoDenMaxId = async () => {
  try {
    return await supabase
      .schema(SCHEMA)
      .from('t_ido_den')
      .select('ido_den_id')
      .order('ido_den_id', {
        ascending: false,
      })
      .limit(1)
      .single();
  } catch (e) {
    throw e;
  }
};

/**
 * 移動伝票新規追加
 * @param newIdoDenId 新規移動伝票id
 * @param idoKizaiData 移動伝票データ
 * @param userNam ユーザー名
 * @returns
 */
export const InsertIdoDen = async (
  data: {
    ido_den_id: number;
    ido_den_dat: Date | string;
    ido_siji_id: number;
    ido_sagyo_id: number;
    ido_sagyo_nam: string;
    kizai_id: number;
    plan_qty: number;
    result_qty: number | null;
    juchu_head_id: number;
    juchu_kizai_head_id: number;
    juchu_kizai_meisai_id: number;
    add_dat: Date;
    add_user: string;
  }[]
) => {
  try {
    return await supabase.schema(SCHEMA).from('t_ido_den').insert(data);
  } catch (e) {
    throw e;
  }
};

/**
 * 移動伝票更新
 * @param idoKizaiData 移動伝票データ
 * @param userNam ユーザー名
 * @returns
 */
export const UpdateIdoDen = async (data: {
  ido_den_id: number | null;
  ido_den_dat: Date | string;
  ido_siji_id: number;
  ido_sagyo_id: number;
  ido_sagyo_nam: string;
  kizai_id: number;
  plan_qty: number;
  result_qty: number | null;
  juchu_head_id: number;
  juchu_kizai_head_id: number;
  juchu_kizai_meisai_id: number;
  upd_dat: Date;
  upd_user: string;
}) => {
  try {
    return await supabase.schema(SCHEMA).from('t_ido_den').update(data).eq('ido_den_id', data.ido_den_id);
  } catch (e) {
    throw e;
  }
};

/**
 * 移動伝票削除
 * @param idoDenIds 移動伝票id
 */
export const DeleteIdoDen = async (idoDenIds: number[]) => {
  try {
    return await supabase.schema(SCHEMA).from('t_ido_den').delete().in('ido_den_id', idoDenIds);
  } catch (e) {
    throw e;
  }
};
