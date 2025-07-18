'use server';

import { supabase } from '@/app/_lib/supabase/supabase';
import { CustomersMasterTableValues } from '@/app/(main)/(masters)/customers-master/_lib/types';

import { JuchuHeadValues, LockValues, OrderValues } from './types';

/**
 * 受注ヘッダー取得
 * @param juchuHeadId 受注ヘッダーID
 * @returns 受注ヘッダーデータ
 */
export const GetOrder = async (juchuHeadId: number) => {
  try {
    const { data: juchuData, error: juchuError } = await supabase
      .schema('dev2')
      .from('t_juchu_head')
      .select(
        'juchu_head_id, del_flg, juchu_sts, juchu_dat, juchu_str_dat, juchu_end_dat, nyuryoku_user, koen_nam, koenbasho_nam, kokyaku_id, kokyaku_tanto_nam, mem, nebiki_amt, zei_kbn'
      )
      .eq('juchu_head_id', juchuHeadId)
      .single();
    if (juchuError) {
      console.error('GetOrder juchu error : ', juchuError);
      return null;
    }

    if (juchuData.kokyaku_id) {
      const { data: kokyakuData, error: kokyakuError } = await supabase
        .schema('dev2')
        .from('m_kokyaku')
        .select('kokyaku_nam')
        .eq('kokyaku_id', juchuData.kokyaku_id)
        .single();
      if (kokyakuError) {
        console.error('GetOrder kokyaku error : ', kokyakuError);
        return null;
      }
      const order: OrderValues = {
        juchuHeadId: juchuData.juchu_head_id,
        delFlg: juchuData.del_flg,
        juchuSts: juchuData.juchu_sts,
        juchuDat: juchuData.juchu_dat,
        juchuRange: juchuData.juchu_str_dat !== null ? [juchuData.juchu_str_dat, juchuData.juchu_end_dat] : null,
        nyuryokuUser: juchuData.nyuryoku_user,
        koenNam: juchuData.koen_nam,
        koenbashoNam: juchuData.koenbasho_nam,
        kokyaku: { kokyakuId: juchuData.kokyaku_id, kokyakuNam: kokyakuData.kokyaku_nam },
        kokyakuTantoNam: juchuData.kokyaku_tanto_nam,
        mem: juchuData.mem,
        nebikiAmt: juchuData.nebiki_amt,
        zeiKbn: juchuData.zei_kbn,
      };
      console.log('GetOrder order : ', order);
      return order;
    } else {
      const order: OrderValues = {
        juchuHeadId: juchuData.juchu_head_id,
        delFlg: juchuData.del_flg,
        juchuSts: juchuData.juchu_sts,
        juchuDat: juchuData.juchu_dat,
        juchuRange: juchuData.juchu_str_dat !== null ? [juchuData.juchu_str_dat, juchuData.juchu_end_dat] : null,
        nyuryokuUser: juchuData.nyuryoku_user,
        koenNam: juchuData.koen_nam,
        koenbashoNam: juchuData.koenbasho_nam,
        kokyaku: { kokyakuId: juchuData.kokyaku_id, kokyakuNam: '' },
        kokyakuTantoNam: juchuData.kokyaku_tanto_nam,
        mem: juchuData.mem,
        nebikiAmt: juchuData.nebiki_amt,
        zeiKbn: juchuData.zei_kbn,
      };
      console.log('GetOrder No kokyakuId order : ', order);
      return order;
    }
  } catch (e) {
    console.log(e);
  }
};

/**
 * 受注ヘッダーid最大値取得
 * @returns 受注ヘッダーid最大値
 */
export const GetMaxId = async () => {
  try {
    const { data, error } = await supabase
      .schema('dev2')
      .from('t_juchu_head')
      .select('juchu_head_id')
      .order('juchu_head_id', {
        ascending: false,
      })
      .limit(1)
      .single();
    if (!error) {
      console.log('GetMaxId data : ', data);
      return data;
    }
  } catch (e) {
    console.error(e);
  }
};

/**
 * ロック情報取得
 * @param lockShubetu ロック種別
 * @param headId ヘッダーid
 * @returns ロックデータ
 */
export const GetLock = async (lockShubetu: number, headId: number) => {
  const { data, error } = await supabase
    .schema('dev2')
    .from('t_lock')
    .select('*')
    .eq('lock_shubetu', lockShubetu)
    .eq('head_id', headId)
    .single();

  console.log('GetLock data : ', data);

  if (error) {
    console.log(error.code);
    if (error.code === 'PGRST116') {
      console.log('ロックデータなし');
      return null;
    }
    console.error('Error lock:', error.message);
    return null;
  } else {
    const lockData: LockValues = {
      lockShubetu: data.lock_shubetu,
      headId: data.head_id,
      addDat: data.add_dat,
      addUser: data.add_user,
    };
    return lockData;
  }
};

/**
 * ロック情報追加
 * @param lockShubetu ロック種別
 * @param headId ヘッダーid
 */
export const AddLock = async (lockShubetu: number, headId: number, add_user: string) => {
  const { error } = await supabase.schema('dev2').from('t_lock').insert({
    lock_shubetu: lockShubetu,
    head_id: headId,
    add_dat: new Date(),
    add_user: add_user,
  });
  if (error) {
    console.error('Error adding lock:', error.message);
  }
};

/**
 * ロック情報削除
 * @param lockShubetu ロック種別
 * @param headId ヘッダーid
 */
export const DeleteLock = async (lockShubetu: number, headId: number) => {
  const { error } = await supabase
    .schema('dev2')
    .from('t_lock')
    .delete()
    .eq('lock_shubetu', lockShubetu)
    .eq('head_id', headId);

  if (error) {
    console.error('Error delete lock:', error.message);
  }
};

/**
 * 受注ヘッダー情報新規追加
 * @param juchuHeadId 受注ヘッダーid
 */
export const AddNewOrder = async (juchuHeadId: number, nyuryokuUser: string | undefined) => {
  const newData = {
    juchu_head_id: juchuHeadId,
    del_flg: 0,
    juchu_sts: 0,
    juchu_dat: new Date(),
    juchu_str_dat: null,
    juchu_end_dat: null,
    nyuryoku_user: nyuryokuUser,
    koen_nam: null,
    koenbasho_nam: null,
    kokyaku_id: null,
    kokyaku_tanto_nam: null,
    mem: null,
    nebiki_amt: null,
    zei_kbn: 2,
    add_dat: new Date(),
    add_user: nyuryokuUser,
    upd_dat: null,
    upd_user: null,
  };

  try {
    const { error: insertError } = await supabase
      .schema('dev2')
      .from('t_juchu_head')
      .insert({
        ...newData,
      });

    if (!insertError) {
      console.log('New order added successfully:', newData);
    } else {
      console.error('Error adding new order:', insertError.message);
    }
  } catch (e) {
    console.error('Exception while adding new order:', e);
  }
};

/**
 * 受注ヘッダー情報更新
 * @param data 受注ヘッダーデータ
 * @returns 正誤
 */
export const Update = async (data: OrderValues) => {
  const updateData = {
    juchu_head_id: data.juchuHeadId,
    del_flg: data.delFlg,
    juchu_sts: data.juchuSts,
    juchu_dat: data.juchuDat,
    juchu_str_dat: data.juchuRange && data.juchuRange[0],
    juchu_end_dat: data.juchuRange && data.juchuRange[1],
    nyuryoku_user: data.nyuryokuUser,
    koen_nam: data.koenNam,
    koenbasho_nam: data.koenbashoNam,
    kokyaku_id: data.kokyaku.kokyakuId,
    kokyaku_tanto_nam: data.kokyakuTantoNam,
    mem: data.mem,
    nebiki_amt: data.nebikiAmt,
    zei_kbn: data.zeiKbn,
    upd_dat: new Date(),
    upd_user: 'test_user',
  };

  try {
    const { error } = await supabase
      .schema('dev2')
      .from('t_juchu_head')
      .update(updateData)
      .eq('juchu_head_id', updateData.juchu_head_id);

    if (error) {
      console.error('Error updating order:', error.message);
      return false;
    }
    console.log('Order updated successfully:', updateData);
    return true;
  } catch (e) {
    console.error('Exception while updating order:', e);
    return false;
  }
};

/**
 * 公演場所マスタテーブルのデータを取得する関数
 * @param query 検索キーワード
 * @returns {Promise<CustomerMasterTableValues[]>} 公演場所マスタテーブルに表示するデータ（ 検索キーワードが空の場合は全て ）
 */
export const GetFilteredCustomers = async (query: string) => {
  try {
    const { data, error } = await supabase
      .schema('dev2')
      .from('m_kokyaku')
      .select('kokyaku_id, kokyaku_nam, adr_shozai, adr_tatemono, adr_sonota, tel,  fax, mem, dsp_flg') // テーブルに表示するカラム
      // あいまい検索、場所名、場所名かな、住所、電話番号、fax番号
      .or(
        `kokyaku_nam.ilike.%${query}%, kana.ilike.%${query}%, adr_shozai.ilike.%${query}%, adr_tatemono.ilike.%${query}%, adr_sonota.ilike.%${query}%, tel.ilike.%${query}%, fax.ilike.%${query}%`
      )
      .neq('del_flg', 1) // 削除フラグが立っていない
      .order('dsp_ord_num'); // 並び順
    if (!error) {
      console.log('I got a datalist from db', data.length);
      if (!data || data.length === 0) {
        return [];
      } else {
        const filteredCustomers: CustomersMasterTableValues[] = data.map((d) => ({
          kokyakuId: d.kokyaku_id,
          kokyakuNam: d.kokyaku_nam,
          adrShozai: d.adr_shozai,
          adrTatemono: d.adr_tatemono,
          adrSonota: d.adr_sonota,
          tel: d.tel,
          fax: d.fax,
          mem: d.mem,
          dspFlg: Boolean(d.dsp_flg),
        }));
        console.log(filteredCustomers.length);
        return filteredCustomers;
      }
    } else {
      console.error('顧客情報取得エラー。', { message: error.message, code: error.code });
      return [];
    }
  } catch (e) {
    console.error('例外が発生しました:', e);
  }
};
