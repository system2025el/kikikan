'use server';

import { SCHEMA, supabase } from '../supabase';

/**
 * 受注ヘッダー用顧客データ取得
 * @param kokyaku_id 顧客id
 * @returns
 */
export const SelectKokyaku = async (kokyaku_id: number) => {
  try {
    return await supabase
      .schema(SCHEMA)
      .from('m_kokyaku')
      .select('kokyaku_nam, kokyaku_rank')
      .eq('kokyaku_id', kokyaku_id)
      .single();
  } catch (e) {
    throw e;
  }
};

/**
 * 顧客マスタテーブルのデータを取得する関数
 * @param query 検索キーワード
 * @returns {Promise<CustomersDialogValues[]>} 公演場所マスタテーブルに表示するデータ（ 検索キーワードが空の場合は全て ）
 */
export const SelectFilteredCustomers = async (query: string) => {
  try {
    return await supabase
      .schema(SCHEMA)
      .from('m_kokyaku')
      .select('kokyaku_id, kokyaku_nam, kokyaku_rank, adr_shozai, adr_tatemono, adr_sonota, tel,  fax, mem, dsp_flg') // テーブルに表示するカラム
      // あいまい検索、場所名、場所名かな、住所、電話番号、fax番号
      .or(
        `kokyaku_nam.ilike.%${query}%, kana.ilike.%${query}%, adr_shozai.ilike.%${query}%, adr_tatemono.ilike.%${query}%, adr_sonota.ilike.%${query}%, tel.ilike.%${query}%, fax.ilike.%${query}%`
      )
      .neq('del_flg', 1) // 削除フラグが立っていない
      .order('dsp_ord_num'); // 並び順
  } catch (e) {
    throw e;
  }
};
