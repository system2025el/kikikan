'use server';

import { SCHEMA } from '../schema';
import { createClient } from '../supabase-server';
import { JuchuTempu } from '../types/t-juchu-tempu-type';

/**
 * 受注添付ファイル一覧取得
 * @param juchuHeadId 受注ヘッダーid
 * @returns 受注添付ファイルデータ
 */
export const selectJuchuTempuList = async (juchuHeadId: number) => {
  const supabase = await createClient();
  try {
    return await supabase
      .schema(SCHEMA)
      .from('t_juchu_tempu')
      .select('juchu_tempu_id, file_nam, file_pat, file_siz, add_dat, add_user')
      .eq('juchu_head_id', juchuHeadId)
      .eq('del_flg', 0)
      .order('juchu_tempu_id');
  } catch (e) {
    throw new Error('[selectJuchuTempuList] DBエラー:', { cause: e });
  }
};

/**
 * 受注添付ファイル件数取得（削除済みを除く）
 * @param juchuHeadId 受注ヘッダーid
 * @returns 件数
 */
export const selectJuchuTempuCount = async (juchuHeadId: number) => {
  const supabase = await createClient();
  try {
    return await supabase
      .schema(SCHEMA)
      .from('t_juchu_tempu')
      .select('juchu_tempu_id', { count: 'exact', head: true })
      .eq('juchu_head_id', juchuHeadId)
      .eq('del_flg', 0);
  } catch (e) {
    throw new Error('[selectJuchuTempuCount] DBエラー:', { cause: e });
  }
};

/**
 * 受注添付ファイル取得（1件）
 * @param juchuTempuId 受注添付ファイルid
 * @returns 受注添付ファイルデータ
 */
export const selectJuchuTempu = async (juchuTempuId: number) => {
  const supabase = await createClient();
  try {
    return await supabase
      .schema(SCHEMA)
      .from('t_juchu_tempu')
      .select('juchu_tempu_id, juchu_head_id, file_nam, file_pat')
      .eq('juchu_tempu_id', juchuTempuId)
      .eq('del_flg', 0)
      .single();
  } catch (e) {
    throw new Error('[selectJuchuTempu] DBエラー:', { cause: e });
  }
};

/**
 * 受注添付ファイル新規追加
 * @param data 受注添付ファイルデータ
 * @returns
 */
export const insertJuchuTempu = async (data: JuchuTempu) => {
  const supabase = await createClient();
  try {
    return await supabase.schema(SCHEMA).from('t_juchu_tempu').insert(data);
  } catch (e) {
    throw new Error('[insertJuchuTempu] DBエラー:', { cause: e });
  }
};

/**
 * 受注添付ファイル論理削除
 * @param juchuTempuId 受注添付ファイルid
 * @param userNam ユーザー名
 * @returns
 */
export const updateJuchuTempuDelFlg = async (juchuTempuId: number, userNam: string) => {
  const supabase = await createClient();
  try {
    return await supabase
      .schema(SCHEMA)
      .from('t_juchu_tempu')
      .update({ del_flg: 1, upd_dat: new Date().toISOString(), upd_user: userNam })
      .eq('juchu_tempu_id', juchuTempuId)
      .eq('del_flg', 0);
  } catch (e) {
    throw new Error('[updateJuchuTempuDelFlg] DBエラー:', { cause: e });
  }
};
