'use server';

import { supabase } from '@/app/_lib/db/supabase';
import { SelectFilteredCustomers, SelectKokyaku } from '@/app/_lib/db/tables/m-kokyaku';
import { SelectJuchuHead } from '@/app/_lib/db/tables/t-juchu-head';
import { toISOStringYearMonthDay } from '@/app/(main)/_lib/date-conversion';
import { CustomersMasterTableValues } from '@/app/(main)/(masters)/customers-master/_lib/types';

import { CustomersDialogValues, EqTableValues, LockValues, OrderValues } from './types';

/**
 * 受注ヘッダー取得
 * @param juchuHeadId 受注ヘッダーID
 * @returns 受注ヘッダーデータ
 */
export const GetOrder = async (juchuHeadId: number) => {
  try {
    const juchuData = await SelectJuchuHead(juchuHeadId);

    if (juchuData.error || !juchuData.data) {
      console.error('GetOrder juchu error : ', juchuData.error);
      throw new Error('受注ヘッダーが存在しません');
    }

    const kokyakuData = await SelectKokyaku(juchuData.data.kokyaku_id);

    if (kokyakuData.error || !kokyakuData.data) {
      console.error('GetOrder kokyaku error : ', kokyakuData.error);
      throw new Error('顧客が存在しません');
    }
    const order: OrderValues = {
      juchuHeadId: juchuData.data.juchu_head_id,
      delFlg: juchuData.data.del_flg,
      juchuSts: juchuData.data.juchu_sts,
      juchuDat: juchuData.data.juchu_dat,
      juchuRange:
        juchuData.data.juchu_str_dat !== null ? [juchuData.data.juchu_str_dat, juchuData.data.juchu_end_dat] : null,
      nyuryokuUser: juchuData.data.nyuryoku_user,
      koenNam: juchuData.data.koen_nam,
      koenbashoNam: juchuData.data.koenbasho_nam,
      kokyaku: {
        kokyakuId: juchuData.data.kokyaku_id,
        kokyakuNam: kokyakuData.data.kokyaku_nam,
        kokyakuRank: kokyakuData.data.kokyaku_rank,
      },
      kokyakuTantoNam: juchuData.data.kokyaku_tanto_nam,
      mem: juchuData.data.mem,
      nebikiAmt: juchuData.data.nebiki_amt,
      zeiKbn: juchuData.data.zei_kbn,
    };
    console.log('GetOrder order : ', order);
    return order;
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
export const AddNewOrder = async (juchuHeadId: number, juchuHeadData: OrderValues, userNam: string) => {
  const newData = {
    juchu_head_id: juchuHeadId,
    del_flg: juchuHeadData.delFlg,
    juchu_sts: juchuHeadData.juchuSts,
    juchu_dat: juchuHeadData.juchuDat,
    juchu_str_dat: juchuHeadData.juchuRange && toISOStringYearMonthDay(juchuHeadData.juchuRange[0]),
    juchu_end_dat: juchuHeadData.juchuRange && toISOStringYearMonthDay(juchuHeadData.juchuRange[1]),
    nyuryoku_user: juchuHeadData.nyuryokuUser,
    koen_nam: juchuHeadData.koenNam,
    koenbasho_nam: juchuHeadData.koenbashoNam,
    kokyaku_id: juchuHeadData.kokyaku.kokyakuId,
    kokyaku_tanto_nam: juchuHeadData.kokyakuTantoNam,
    mem: juchuHeadData.mem,
    nebiki_amt: juchuHeadData.nebikiAmt,
    zei_kbn: juchuHeadData.zeiKbn,
    add_dat: new Date(),
    add_user: userNam,
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
    juchu_str_dat: data.juchuRange && toISOStringYearMonthDay(data.juchuRange[0]),
    juchu_end_dat: data.juchuRange && toISOStringYearMonthDay(data.juchuRange[1]),
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

export const Copy = async (juchuHeadId: number, data: OrderValues, add_user: string) => {
  const copyData = {
    juchu_head_id: juchuHeadId,
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
    const { error: insertError } = await supabase
      .schema('dev2')
      .from('t_juchu_head')
      .insert({
        ...copyData,
      });

    if (!insertError) {
      console.log('New order added successfully:', copyData);
    } else {
      console.error('Error adding new order:', insertError.message);
    }
  } catch (e) {
    console.error('Exception while adding new order:', e);
  }
};

export const GetEqHeaderList = async (juchuHeadId: number) => {
  try {
    const { data, error } = await supabase
      .schema('dev2')
      .from('v_juchu_kizai_head_lst')
      .select('*')
      .eq('juchu_head_id', juchuHeadId)
      .not('juchu_kizai_head_id', 'is', null);

    if (error) {
      console.error('GetOrder juchu error : ', error);
      return [];
    }

    if (!data || data.length === 0) return [];

    const EqTableData: EqTableValues[] = data.map((d) => ({
      juchuHeadId: d.juchu_head_id,
      juchuKizaiHeadId: d.juchu_kizai_head_id,
      headNam: d.head_nam,
      sagyoStaNam: d.sagyo_sts_nam,
      shukoDat: d.shuko_dat,
      nyukoDat: d.nyuko_dat,
      sikomibi: d.sikomibi,
      rihabi: d.rihabi,
      genebi: d.genebi,
      honbanbi: d.honbanbi,
      juchuHonbanbiCalcQty: d.juchu_honbanbi_calc_qty,
      shokei: d.shokei,
      keikoku: d.keikoku,
      oyaJuchuKizaiHeadId: d.oya_juchu_kizai_head_id,
      htKbn: d.ht_kbn,
      juchuKizaiHeadKbn: d.juchu_kizai_head_kbn,
    }));
    return EqTableData;
  } catch (e) {
    console.error('Exception while selecting eqlist:', e);
  }
};

/**
 * 顧客マスタテーブルのデータを取得する関数
 * @param query 検索キーワード
 * @returns {Promise<CustomersDialogValues[]>} 公演場所マスタテーブルに表示するデータ（ 検索キーワードが空の場合は全て ）
 */
export const GetFilteredCustomers = async (query: string) => {
  try {
    const { data, error } = await SelectFilteredCustomers(query);
    if (!error) {
      console.log('I got a datalist from db', data.length);
      if (!data || data.length === 0) {
        return [];
      } else {
        const filteredCustomers: CustomersDialogValues[] = data.map((d, index) => ({
          kokyakuId: d.kokyaku_id,
          kokyakuNam: d.kokyaku_nam,
          kokyakuRank: d.kokyaku_rank,
          adrShozai: d.adr_shozai,
          adrTatemono: d.adr_tatemono,
          adrSonota: d.adr_sonota,
          tel: d.tel,
          fax: d.fax,
          mem: d.mem,
          dspFlg: Boolean(d.dsp_flg),
          tblDspId: index + 1,
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
