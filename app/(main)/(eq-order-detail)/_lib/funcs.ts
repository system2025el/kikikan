'use server';

import { QueryResult } from 'pg';

import pool from '@/app/_lib/postgres/postgres';
import { supabase } from '@/app/_lib/supabase/supabase';

import { toISOStringYearMonthDay } from '../../_lib/date-conversion';
import {
  JuchuKizaiHeadValues,
  JuchuKizaiHonbanbiValues,
  JuchuKizaiMeisaiValues,
  StockTableValues,
} from '../eq-main-order-detail/[juchu_head_id]/[juchu_kizai_head_id]/[mode]/_lib/types';

/**
 * 受注機材ヘッダー取得
 * @param juchuHeadId 受注ヘッダーid
 * @param juchuKizaiHeadId 受注機材ヘッダーid
 * @returns 受注機材ヘッダーデータ
 */
export const GetJuchuKizaiHead = async (juchuHeadId: number, juchuKizaiHeadId: number) => {
  try {
    const { data: juchuKizaiHead, error: juchuKizaiHeadError } = await supabase
      .schema('dev2')
      .from('t_juchu_kizai_head')
      .select('juchu_head_id, juchu_kizai_head_id, juchu_kizai_head_kbn, juchu_honbanbi_qty, nebiki_amt, mem, head_nam')
      .eq('juchu_head_id', juchuHeadId)
      .eq('juchu_kizai_head_id', juchuKizaiHeadId)
      .single();
    if (juchuKizaiHeadError) {
      console.error('GetEqHeader juchuKizaiHead error : ', juchuKizaiHeadError);
      return null;
    }

    const juchuDate = await GetJuchuKizaiNyushuko(juchuHeadId, juchuKizaiHeadId);

    const jucuKizaiHeadData: JuchuKizaiHeadValues = {
      juchuHeadId: juchuKizaiHead.juchu_head_id,
      juchuKizaiHeadId: juchuKizaiHead.juchu_kizai_head_id,
      juchuKizaiHeadKbn: juchuKizaiHead.juchu_kizai_head_kbn,
      juchuHonbanbiQty: juchuKizaiHead.juchu_honbanbi_qty,
      nebikiAmt: juchuKizaiHead.nebiki_amt,
      mem: juchuKizaiHead.mem ? juchuKizaiHead.mem : '',
      headNam: juchuKizaiHead.head_nam,
      kicsShukoDat: juchuDate && juchuDate.kicsShukoDat,
      kicsNyukoDat: juchuDate && juchuDate.kicsNyukoDat,
      yardShukoDat: juchuDate && juchuDate.yardShukoDat,
      yardNyukoDat: juchuDate && juchuDate.yardNyukoDat,
    };
    return jucuKizaiHeadData;
  } catch (e) {
    console.log(e);
  }
};

/**
 * 受注機材ヘッダーid最大値取得
 * @returns 受注機材ヘッダーid最大値
 */
export const GetJuchuKizaiHeadMaxId = async (juchuHeadId: number) => {
  try {
    const { data, error } = await supabase
      .schema('dev2')
      .from('t_juchu_kizai_head')
      .select('juchu_kizai_head_id')
      .eq('juchu_head_id', juchuHeadId)
      .order('juchu_kizai_head_id', {
        ascending: false,
      })
      .limit(1)
      .single();
    if (!error) {
      console.log('GetMaxId : ', data);
      return data;
    }
  } catch (e) {
    console.error(e);
  }
};

/**
 * 表示順最大値取得
 * @returns 表示順最大値
 */
export const GetJuchuKizaiHeadDspOrdNum = async () => {
  try {
    const { data, error } = await supabase
      .schema('dev2')
      .from('t_juchu_kizai_head')
      .select('dsp_ord_num')
      .order('dsp_ord_num', {
        ascending: false,
      })
      .limit(1)
      .single();
    if (!error) {
      console.log('GetMaxDspOrdNum : ', data);
      return data;
    }
  } catch (e) {
    console.error(e);
  }
};

/**
 * 受注機材ヘッダー新規追加
 * @param juchuKizaiHeadId 受注機材ヘッダーid
 * @param juchuKizaiHeadData 受注機材ヘッダーデータ
 * @param dspOrdNum 表示順
 * @param userNam ユーザー名
 * @returns
 */
export const AddJuchuKizaiHead = async (
  juchuKizaiHeadId: number,
  juchuKizaiHeadData: JuchuKizaiHeadValues,
  juchuKizaiHeadKbn: number,
  dspOrdNum: number,
  userNam: string
) => {
  const newData = {
    juchu_head_id: juchuKizaiHeadData.juchuHeadId,
    juchu_kizai_head_id: juchuKizaiHeadId,
    juchu_kizai_head_kbn: juchuKizaiHeadKbn,
    juchu_honbanbi_qty: juchuKizaiHeadData.juchuHonbanbiQty,
    nebiki_amt: juchuKizaiHeadData.nebikiAmt,
    mem: juchuKizaiHeadData.mem,
    head_nam: juchuKizaiHeadData.headNam,
    dsp_ord_num: dspOrdNum,
    oya_juchu_kizai_head_id: null,
    ht_kbn: 0,
    add_dat: new Date(),
    add_user: userNam,
  };
  try {
    const { error: insertError } = await supabase.schema('dev2').from('t_juchu_kizai_head').insert(newData);

    if (!insertError) {
      console.log('New juchuKizaiHead added successfully:', newData);
      return true;
    } else {
      console.error('Error adding new juchuKizaiHead:', insertError.message);
      return false;
    }
  } catch (e) {
    console.error(e);
    return false;
  }
};

/**
 * 受注機材ヘッダー更新
 * @param juchuKizaiHeadData 受注機材ヘッダーデータ
 * @param userNam ユーザー名
 * @returns
 */
export const UpdateJuchuKizaiHead = async (juchuKizaiHeadData: JuchuKizaiHeadValues, userNam: string) => {
  const updateData = {
    juchu_head_id: juchuKizaiHeadData.juchuHeadId,
    juchu_kizai_head_id: juchuKizaiHeadData.juchuKizaiHeadId,
    juchu_kizai_head_kbn: juchuKizaiHeadData.juchuKizaiHeadKbn,
    juchu_honbanbi_qty: juchuKizaiHeadData.juchuHonbanbiQty,
    nebiki_amt: juchuKizaiHeadData.nebikiAmt,
    mem: juchuKizaiHeadData.mem,
    head_nam: juchuKizaiHeadData.headNam,
    oya_juchu_kizai_head_id: null,
    ht_kbn: 0,
    upd_dat: new Date(),
    upd_user: userNam,
  };

  try {
    const { error } = await supabase
      .schema('dev2')
      .from('t_juchu_kizai_head')
      .update(updateData)
      .eq('juchu_head_id', updateData.juchu_head_id)
      .eq('juchu_kizai_head_id', updateData.juchu_kizai_head_id)
      .eq('juchu_kizai_head_kbn', updateData.juchu_kizai_head_kbn);

    if (error) {
      console.error('Error updating juchu kizai head:', error.message);
      return false;
    }
    console.log('juchu kizai head updated successfully:', updateData);
    return true;
  } catch (e) {
    console.error('Exception while updating juchu kizai head:', e);
    return false;
  }
};

export const GetJuchuKizaiNyushuko = async (juchuHeadId: number, juchuKizaiHeadId: number) => {
  try {
    const { data, error } = await supabase
      .schema('dev2')
      .from('t_juchu_kizai_nyushuko')
      .select('nyushuko_shubetu_id, nyushuko_basho_id, nyushuko_dat')
      .eq('juchu_head_id', juchuHeadId)
      .eq('juchu_kizai_head_id', juchuKizaiHeadId);
    if (error) {
      console.error('GetEqHeader juchuDate error: ', error);
      return null;
    }

    const juchuKizaiNyushukoData = {
      kicsShukoDat: data.find((d) => d.nyushuko_shubetu_id === 1 && d.nyushuko_basho_id === 1)?.nyushuko_dat ?? null,
      kicsNyukoDat: data.find((d) => d.nyushuko_shubetu_id === 2 && d.nyushuko_basho_id === 1)?.nyushuko_dat ?? null,
      yardShukoDat: data.find((d) => d.nyushuko_shubetu_id === 1 && d.nyushuko_basho_id === 2)?.nyushuko_dat ?? null,
      yardNyukoDat: data.find((d) => d.nyushuko_shubetu_id === 2 && d.nyushuko_basho_id === 2)?.nyushuko_dat ?? null,
    };

    return juchuKizaiNyushukoData;
  } catch (e) {
    console.error(e);
    return null;
  }
};

/**
 * 受注機材入出庫新規追加
 * @param juchuKizaiHeadId 受注機材ヘッダーid
 * @param juchuKizaiHeadData 受注機材ヘッダーデータ
 * @param userNam ユーザー名
 * @returns
 */
export const AddJuchuKizaiNyushuko = async (
  juchuKizaiHeadId: number,
  juchuKizaiHeadData: JuchuKizaiHeadValues,
  userNam: string
) => {
  const dates = [
    juchuKizaiHeadData.kicsShukoDat,
    juchuKizaiHeadData.yardShukoDat,
    juchuKizaiHeadData.kicsNyukoDat,
    juchuKizaiHeadData.yardNyukoDat,
  ];
  for (let i = 0; i < dates.length; i++) {
    if (!dates[i]) continue;
    const newData = {
      juchu_head_id: juchuKizaiHeadData.juchuHeadId,
      juchu_kizai_head_id: juchuKizaiHeadId,
      nyushuko_shubetu_id: i === 0 || i === 1 ? 1 : 2,
      nyushuko_basho_id: i === 0 || i === 2 ? 1 : 2,
      nyushuko_dat: dates[i],
      add_dat: new Date(),
      add_user: userNam,
    };

    try {
      const { error: insertError } = await supabase.schema('dev2').from('t_juchu_kizai_nyushuko').insert(newData);

      if (!insertError) {
        console.log('kizai Nyushuko added successfully:', newData);
      } else {
        console.error('Error adding kizai Nyushuko:', insertError.message);
        return false;
      }
    } catch (e) {
      console.error('Exception while adding kizai Nyushuko:', e);
    }
  }
  return true;
};

/**
 * 受注機材入出庫更新
 * @param juchuKizaiHeadData 受注機材ヘッダーデータ
 * @param userNam ユーザー名
 * @returns
 */
export const UpdateJuchuKizaiNyushuko = async (juchuKizaiHeadData: JuchuKizaiHeadValues, userNam: string) => {
  const dates = [
    juchuKizaiHeadData.kicsShukoDat,
    juchuKizaiHeadData.yardShukoDat,
    juchuKizaiHeadData.kicsNyukoDat,
    juchuKizaiHeadData.yardNyukoDat,
  ];
  for (let i = 0; i < dates.length; i++) {
    const updateData =
      dates[i] !== null
        ? {
            juchu_head_id: juchuKizaiHeadData.juchuHeadId,
            juchu_kizai_head_id: juchuKizaiHeadData.juchuKizaiHeadId,
            nyushuko_shubetu_id: i === 0 || i === 1 ? 1 : 2,
            nyushuko_basho_id: i === 0 || i === 2 ? 1 : 2,
            nyushuko_dat: dates[i],
          }
        : null;

    const confirmData = {
      juchu_head_id: juchuKizaiHeadData.juchuHeadId,
      juchu_kizai_head_id: juchuKizaiHeadData.juchuKizaiHeadId,
      nyushuko_shubetu_id: i === 0 || i === 1 ? 1 : 2,
      nyushuko_basho_id: i === 0 || i === 2 ? 1 : 2,
    };

    try {
      const { data: selectData, error: selectError } = await supabase
        .schema('dev2')
        .from('t_juchu_kizai_nyushuko')
        .select('*')
        .eq('juchu_head_id', confirmData.juchu_head_id)
        .eq('juchu_kizai_head_id', confirmData.juchu_kizai_head_id)
        .eq('nyushuko_shubetu_id', confirmData.nyushuko_shubetu_id)
        .eq('nyushuko_basho_id', confirmData.nyushuko_basho_id)
        .single();

      if (selectData && updateData) {
        const { error: updateError } = await supabase
          .schema('dev2')
          .from('t_juchu_kizai_nyushuko')
          .update({ ...updateData, upd_dat: new Date(), upd_user: userNam })
          .eq('juchu_head_id', updateData.juchu_head_id)
          .eq('juchu_kizai_head_id', updateData.juchu_kizai_head_id)
          .eq('nyushuko_shubetu_id', updateData.nyushuko_shubetu_id)
          .eq('nyushuko_basho_id', updateData.nyushuko_basho_id);
        if (updateError) {
          console.error('Error updating kizai nyushuko:', updateError.message);
          continue;
        }
      } else if (selectData && !updateData) {
        const { error: deleteError } = await supabase
          .schema('dev2')
          .from('t_juchu_kizai_nyushuko')
          .delete()
          .eq('juchu_head_id', confirmData.juchu_head_id)
          .eq('juchu_kizai_head_id', confirmData.juchu_kizai_head_id)
          .eq('nyushuko_shubetu_id', confirmData.nyushuko_shubetu_id)
          .eq('nyushuko_basho_id', confirmData.nyushuko_basho_id);
        if (deleteError) {
          console.error('Error updating kizai nyushuko:', deleteError.message);
          continue;
        }
      } else if (!selectData && updateData) {
        const { error: insertError } = await supabase
          .schema('dev2')
          .from('t_juchu_kizai_nyushuko')
          .insert({ ...updateData, add_dat: new Date(), add_user: userNam });
        if (insertError) {
          console.error('Error updating kizai nyushuko:', insertError.message);
          continue;
        }
      }
      console.log('kizai nyushuko updated successfully:', updateData);
    } catch (e) {
      console.error('Exception while updating kizai nyushuko:', e);
      break;
    }
  }
  return true;
};

/**
 * 受注機材明細リスト取得
 * @param juchuHeadId 受注ヘッダーid
 * @param juchuKizaiHeadId 受注機材ヘッダーid
 * @returns 受注機材明細リスト
 */
export const GetJuchuKizaiMeisai = async (juchuHeadId: number, juchuKizaiHeadId: number) => {
  try {
    const { data: eqList, error: eqListError } = await supabase
      .schema('dev2')
      .from('v_juchu_kizai_meisai')
      .select(
        'juchu_head_id, juchu_kizai_head_id, juchu_kizai_meisai_id, ido_den_id, ido_den_dat, ido_siji_id, shozoku_id, shozoku_nam, mem, kizai_id, kizai_nam, kizai_qty, plan_kizai_qty, plan_yobi_qty, plan_qty'
      )
      .eq('juchu_head_id', juchuHeadId)
      .eq('juchu_kizai_head_id', juchuKizaiHeadId)
      .not('kizai_id', 'is', null);
    if (eqListError) {
      console.error('GetEqList eqList error : ', eqListError);
      return [];
    }

    const { data: eqTanka, error: eqTankaError } = await supabase
      .schema('dev2')
      .from('t_juchu_kizai_meisai')
      .select('kizai_id, kizai_tanka_amt')
      .eq('juchu_head_id', juchuHeadId)
      .eq('juchu_kizai_head_id', juchuKizaiHeadId);
    if (eqTankaError) {
      console.error('GetEqHeader eqTanka error : ', eqTankaError);
      return [];
    }

    const juchuKizaiMeisaiData: JuchuKizaiMeisaiValues[] = eqList.map((d) => ({
      juchuHeadId: d.juchu_head_id,
      juchuKizaiHeadId: d.juchu_kizai_head_id,
      juchuKizaiMeisaiId: d.juchu_kizai_meisai_id,
      idoDenId: d.ido_den_id,
      idoDenDat: d.ido_den_dat ? new Date(d.ido_den_dat) : null,
      idoSijiId: d.ido_siji_id,
      shozokuId: d.shozoku_id,
      shozokuNam: d.shozoku_nam,
      mem: d.mem,
      kizaiId: d.kizai_id,
      kizaiTankaAmt: eqTanka.find((t) => t.kizai_id === d.kizai_id)?.kizai_tanka_amt || 0,
      kizaiNam: d.kizai_nam,
      kizaiQty: d.kizai_qty,
      planKizaiQty: d.plan_kizai_qty,
      planYobiQty: d.plan_yobi_qty,
      planQty: d.plan_qty,
      delFlag: false,
      saveFlag: true,
    }));
    return juchuKizaiMeisaiData;
  } catch (e) {
    console.log(e);
  }
};

/**
 * 受注機材明細id最大値取得
 * @param juchuHeadId 受注ヘッダーid
 * @param juchuKizaiHeadId 受注機材ヘッダーid
 * @returns 受注機材明細id最大値
 */
export const GetJuchuKizaiMeisaiMaxId = async (juchuHeadId: number, juchuKizaiHeadId: number) => {
  try {
    const { data, error } = await supabase
      .schema('dev2')
      .from('t_juchu_kizai_meisai')
      .select('juchu_kizai_meisai_id')
      .eq('juchu_head_id', juchuHeadId)
      .eq('juchu_kizai_head_id', juchuKizaiHeadId)
      .order('juchu_kizai_meisai_id', {
        ascending: false,
      })
      .limit(1)
      .single();
    if (!error) {
      console.log('GetMaxId : ', data);
      return data;
    }
  } catch (e) {
    console.error(e);
  }
};

/**
 * 受注機材明細新規追加
 * @param juchuKizaiMeisaiData 受注機材明細データ
 * @param userNam ユーザー名
 * @returns
 */
export const AddJuchuKizaiMeisai = async (juchuKizaiMeisaiData: JuchuKizaiMeisaiValues[], userNam: string) => {
  const newData = juchuKizaiMeisaiData.map((d) => ({
    juchu_head_id: d.juchuHeadId,
    juchu_kizai_head_id: d.juchuKizaiHeadId,
    juchu_kizai_meisai_id: d.juchuKizaiMeisaiId,
    kizai_id: d.kizaiId,
    kizai_tanka_amt: d.kizaiTankaAmt,
    plan_kizai_qty: d.planKizaiQty,
    plan_yobi_qty: d.planYobiQty,
    mem: d.mem,
    keep_qty: null,
    add_dat: new Date(),
    add_user: userNam,
    shozoku_id: d.shozokuId,
  }));

  try {
    const { error: insertError } = await supabase.schema('dev2').from('t_juchu_kizai_meisai').insert(newData);

    if (!insertError) {
      console.log('kizai meisai added successfully:', newData);
      return true;
    } else {
      console.error('Error adding kizai meisai:', insertError.message);
      return false;
    }
  } catch (e) {
    console.error('Exception while adding kizai meisai:', e);
    return false;
  }
};

/**
 * 受注機材明細更新
 * @param juchuKizaiMeisaiData 受注機材明細データ
 * @param userNam ユーザー名
 * @returns
 */
export const UpdateJuchuKizaiMeisai = async (juchuKizaiMeisaiData: JuchuKizaiMeisaiValues[], userNam: string) => {
  const updateData = juchuKizaiMeisaiData.map((d) => ({
    juchu_head_id: d.juchuHeadId,
    juchu_kizai_head_id: d.juchuKizaiHeadId,
    juchu_kizai_meisai_id: d.juchuKizaiMeisaiId,
    kizai_id: d.kizaiId,
    kizai_tanka_amt: d.kizaiTankaAmt,
    plan_kizai_qty: d.planKizaiQty,
    plan_yobi_qty: d.planYobiQty,
    mem: d.mem,
    keep_qty: null,
    upd_dat: new Date(),
    upd_user: userNam,
    shozoku_id: d.shozokuId,
  }));

  try {
    for (const data of updateData) {
      const { error } = await supabase
        .schema('dev2')
        .from('t_juchu_kizai_meisai')
        .update(data)
        .eq('juchu_head_id', data.juchu_head_id)
        .eq('juchu_kizai_head_id', data.juchu_kizai_head_id)
        .eq('juchu_kizai_meisai_id', data.juchu_kizai_meisai_id);

      if (error) {
        console.error('Error updating juchu kizai meisai:', error.message);
        return false;
      }
      console.log('juchu kizai meisai updated successfully:', data);
    }
    return true;
  } catch (e) {
    console.error('Exception while updating juchu kizai meisai:', e);
    return false;
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
    const { error } = await supabase
      .schema('dev2')
      .from('t_juchu_kizai_meisai')
      .delete()
      .eq('juchu_head_id', juchuHeadId)
      .eq('juchu_kizai_head_id', juchuKizaiHeadId)
      .in('juchu_kizai_meisai_id', juchuKizaiMeisaiIds);

    if (error) {
      console.error('Error delete kizai meisai:', error.message);
    }
  } catch (e) {
    console.error(e);
  }
};

/**
 * 移動伝票id最大値取得
 * @returns 移動伝票id最大値
 */
export const GetIdoDenMaxId = async () => {
  try {
    const { data, error } = await supabase
      .schema('dev2')
      .from('t_ido_den')
      .select('ido_den_id')
      .order('ido_den_id', {
        ascending: false,
      })
      .limit(1)
      .single();
    if (!error) {
      console.log('GetMaxId : ', data);
      return data;
    }
  } catch (e) {
    console.error(e);
  }
};

/**
 * 移動伝票新規追加
 * @param newIdoDenId 新規移動伝票id
 * @param idoKizaiData 移動伝票データ
 * @param userNam ユーザー名
 * @returns
 */
export const AddIdoDen = async (newIdoDenId: number, idoKizaiData: JuchuKizaiMeisaiValues[], userNam: string) => {
  const newData = idoKizaiData.map((d, index) => ({
    ido_den_id: newIdoDenId + index,
    ido_den_dat: toISOStringYearMonthDay(d.idoDenDat as Date),
    ido_siji_id: d.shozokuId,
    ido_sagyo_id: d.shozokuId,
    ido_sagyo_nam: d.shozokuNam,
    kizai_id: d.kizaiId,
    plan_qty: d.planQty,
    result_qty: null,
    juchu_head_id: d.juchuHeadId,
    juchu_kizai_head_id: d.juchuKizaiHeadId,
    juchu_kizai_meisai_id: d.juchuKizaiMeisaiId,
    add_dat: new Date(),
    add_user: userNam,
  }));

  try {
    const { error: insertError } = await supabase.schema('dev2').from('t_ido_den').insert(newData);

    if (!insertError) {
      console.log('ido den added successfully:', newData);
      return true;
    } else {
      console.error('Error adding ido den:', insertError.message);
      return false;
    }
  } catch (e) {
    console.error('Exception while adding ido den:', e);
    return false;
  }
};

/**
 * 移動伝票更新
 * @param idoKizaiData 移動伝票データ
 * @param userNam ユーザー名
 * @returns
 */
export const UpdateIdoDen = async (idoKizaiData: JuchuKizaiMeisaiValues[], userNam: string) => {
  const updateData = idoKizaiData.map((d) => ({
    ido_den_id: d.idoDenId,
    ido_den_dat: toISOStringYearMonthDay(d.idoDenDat as Date),
    ido_siji_id: d.shozokuId,
    ido_sagyo_id: d.shozokuId,
    ido_sagyo_nam: d.shozokuNam,
    kizai_id: d.kizaiId,
    plan_qty: d.planQty,
    result_qty: null,
    juchu_head_id: d.juchuHeadId,
    juchu_kizai_head_id: d.juchuKizaiHeadId,
    juchu_kizai_meisai_id: d.juchuKizaiMeisaiId,
    upd_dat: new Date(),
    upd_user: userNam,
  }));

  try {
    for (const data of updateData) {
      const { error } = await supabase.schema('dev2').from('t_ido_den').update(data).eq('ido_den_id', data.ido_den_id);

      if (error) {
        console.error('Error updating ido den:', error.message);
        return false;
      }
      console.log('ido den updated successfully:', updateData);
      return true;
    }
  } catch (e) {
    console.error('Exception while updating ido den:', e);
    return false;
  }
};

/**
 * 移動伝票削除
 * @param idoDenIds 移動伝票id
 */
export const DeleteIdoDen = async (idoDenIds: number[]) => {
  try {
    const { error } = await supabase.schema('dev2').from('t_ido_den').delete().in('ido_den_id', idoDenIds);

    if (error) {
      console.error('Error delete ido den:', error.message);
    }
  } catch (e) {
    console.error(e);
  }
};

/**
 * 機材在庫テーブル用データ取得
 * @param juchuHeadId 受注ヘッダーid
 * @param juchuKizaiHeadId 受注機材ヘッダーid
 * @param kizaiId 機材id
 * @param planQty 使用数
 * @param date 開始日
 * @returns 機材在庫テーブル用データ
 */
export const GetStockList = async (juchuHeadId: number, juchuKizaiHeadId: number, kizaiId: number, date: Date) => {
  const stringDate = toISOStringYearMonthDay(date);
  try {
    console.log('DB Connected');
    await pool.query(` SET search_path TO dev2;`);
    const result: QueryResult<StockTableValues> = await pool.query(`
      select   
    cal.cal_dat as "calDat" --スケジュール日
    ,coalesce(zaiko_kizai.kizai_id,${kizaiId} /*■変数箇所■*/) as "kizaiId"   -- 機材ID
    ,coalesce(zaiko_kizai.kizai_qty,(select v_kizai_qty.kizai_qty from v_kizai_qty where v_kizai_qty.kizai_id = ${kizaiId} /*■変数箇所■*/)) as "kizaiQty"   --機材数（保有数） 
    ,coalesce(zaiko_kizai.juchu_qty,0) as "juchuQty"   --受注数 NULL時0固定    /*貸出状況スケジュール*/
    
--     ,coalesce(zaiko_kizai.yobi_qty,0) as yobi_qty   --予備数 NULL時0固定  
--     ,coalesce(zaiko_kizai.plan_qty,0) as plan_qty   --合計数 NULL時0固定  

    ,coalesce(zaiko_kizai.zaiko_qty,(select v_kizai_qty.kizai_qty from v_kizai_qty where v_kizai_qty.kizai_id = ${kizaiId} /*■変数箇所■*/)) as "zaikoQty"     --在庫数   /*受注機材明細スケジュール、在庫状況スケジュール*/
    ,coalesce(zaiko_kizai.juchu_honbanbi_shubetu_id,0) as "juchuHonbanbiShubetuId" --受注本番日種別
    ,coalesce(zaiko_kizai.juchu_honbanbi_shubetu_color,'white') as "juchuHonbanbiColor" --受注本番日種別カラー
from 
    (
        select 
             v_zaiko_qty.plan_dat    --機材の使用日
            ,v_zaiko_qty.kizai_id   --機材ID
            ,v_zaiko_qty.kizai_qty  --機材の機材数
            ,v_zaiko_qty.juchu_qty   --機材の受注数
            ,v_zaiko_qty.yobi_qty   --機材の予備数
            ,v_zaiko_qty.plan_qty   --機材の受注合計数
            ,v_zaiko_qty.zaiko_qty  --機材の在庫数
            ,honbanbi.juchu_honbanbi_shubetu_id --受注本番日種別ID
            ,honbanbi.juchu_honbanbi_shubetu_color --受注本番日種別カラー
        from
            v_zaiko_qty
            
        left outer join
            ----------------------
            ----１．受注機材明細スケジュールビュー
            v_honbanbi_juchu_kizai as honbanbi on
            ----------------------
            
            v_zaiko_qty.plan_dat = honbanbi.plan_dat
            and
            v_zaiko_qty.kizai_id = honbanbi.kizai_id

            ----------------------
--             ----１．受注機材明細スケジュールビュー
             and
             honbanbi.juchu_head_id = ${juchuHeadId} /*■変数箇所■*/
             and
             honbanbi.juchu_kizai_head_id = ${juchuKizaiHeadId} /*■変数箇所■*/
        -----------
        where
            --指定した１機材
            v_zaiko_qty.kizai_id = ${kizaiId} /*■変数箇所■*/
    ) as zaiko_kizai
right outer join 
    /* スケジュール生成して外部結合 */
    (
        -- スケジュールの生成範囲 /*■変数箇所■*/
        select '${stringDate}'::date + g.i as cal_dat from generate_series(0, 90) as g(i)
    ) as cal on 
    zaiko_kizai.plan_dat = cal.cal_dat    

order by cal_dat;

    `);
    //console.log('result : ', result.rows);
    const data: StockTableValues[] = result.rows;
    //console.log('data : ', data);
    return data;
  } catch (e) {
    console.error(e);
    return [];
  }
};

/**
 * 受注機材本番日取得
 * @param juchuHeadId 受注ヘッダーid
 * @param juchuKizaiHeadId 受注機材ヘッダーid
 * @returns 受注機材本番日
 */
export const GetHonbanbi = async (juchuHeadId: number, juchuKizaiHeadId: number) => {
  try {
    const { data: honbanbi, error: honbanbiError } = await supabase
      .schema('dev2')
      .from('t_juchu_kizai_honbanbi')
      .select(
        'juchu_head_id, juchu_kizai_head_id, juchu_honbanbi_shubetu_id, juchu_honbanbi_dat, mem, juchu_honbanbi_add_qty'
      )
      .eq('juchu_head_id', juchuHeadId)
      .eq('juchu_kizai_head_id', juchuKizaiHeadId)
      .in('juchu_honbanbi_shubetu_id', [10, 20, 30, 40])
      .order('juchu_honbanbi_dat');
    if (honbanbiError) {
      console.error('GetHonbanbi honbanbi error : ', honbanbiError);
      return [];
    }

    const juchuKizaiHonbanbiData: JuchuKizaiHonbanbiValues[] = honbanbi.map((d) => ({
      juchuHeadId: d.juchu_head_id,
      juchuKizaiHeadId: d.juchu_kizai_head_id,
      juchuHonbanbiShubetuId: d.juchu_honbanbi_shubetu_id,
      juchuHonbanbiDat: new Date(d.juchu_honbanbi_dat),
      mem: d.mem,
      juchuHonbanbiAddQty: d.juchu_honbanbi_add_qty,
    }));

    return juchuKizaiHonbanbiData;
  } catch (e) {
    console.error(e);
  }
};

/**
 * 受注機材本番日データの存在確認
 * @param juchuHeadId 受注ヘッダーid
 * @param juchuKizaiHeadId 受注機材ヘッダーid
 * @param juchuHonbanbiData 受注機材本番日データ
 * @returns あり：true　なし：false
 */
export const ConfirmHonbanbi = async (
  juchuHeadId: number,
  juchuKizaiHeadId: number,
  juchuHonbanbiData: JuchuKizaiHonbanbiValues
) => {
  try {
    const { error: honbanbiError } = await supabase
      .schema('dev2')
      .from('t_juchu_kizai_honbanbi')
      .select('juchu_head_id, juchu_kizai_head_id, juchu_honbanbi_shubetu_id, juchu_honbanbi_dat, mem')
      .eq('juchu_head_id', juchuHeadId)
      .eq('juchu_kizai_head_id', juchuKizaiHeadId)
      .eq('juchu_honbanbi_shubetu_id', juchuHonbanbiData.juchuHonbanbiShubetuId)
      .eq('juchu_honbanbi_dat', toISOStringYearMonthDay(juchuHonbanbiData.juchuHonbanbiDat))
      .single();
    if (honbanbiError) {
      console.error('ConfirmHonbanbi error : ', honbanbiError);
      return false;
    }
    return true;
  } catch (e) {
    console.error(e);
    return false;
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
export const AddHonbanbi = async (
  juchuHeadId: number,
  juchuKizaiHeadId: number,
  juchuHonbanbiData: JuchuKizaiHonbanbiValues,
  userNam: string
) => {
  try {
    const { error } = await supabase
      .schema('dev2')
      .from('t_juchu_kizai_honbanbi')
      .insert({
        juchu_head_id: juchuHeadId,
        juchu_kizai_head_id: juchuKizaiHeadId,
        juchu_honbanbi_shubetu_id: juchuHonbanbiData.juchuHonbanbiShubetuId,
        juchu_honbanbi_dat: toISOStringYearMonthDay(juchuHonbanbiData.juchuHonbanbiDat),
        mem: juchuHonbanbiData.mem ? juchuHonbanbiData.mem : null,
        juchu_honbanbi_add_qty: juchuHonbanbiData.juchuHonbanbiAddQty,
        add_dat: new Date(),
        add_user: userNam,
      });
    if (error) {
      console.log('Error Add honbanbi:', error.message);
      return false;
    }
    return true;
  } catch (e) {
    console.log(e);
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
export const AddAllHonbanbi = async (
  juchuHeadId: number,
  juchuKizaiHeadId: number,
  juchuHonbanbiData: JuchuKizaiHonbanbiValues[],
  userNam: string
) => {
  const newData = juchuHonbanbiData.map((d) => ({
    juchu_head_id: juchuHeadId,
    juchu_kizai_head_id: juchuKizaiHeadId,
    juchu_honbanbi_shubetu_id: d.juchuHonbanbiShubetuId,
    juchu_honbanbi_dat: toISOStringYearMonthDay(d.juchuHonbanbiDat),
    mem: d.mem ? d.mem : null,
    juchu_honbanbi_add_qty: d.juchuHonbanbiAddQty,
    add_dat: new Date(),
    add_user: userNam,
  }));
  try {
    const { error } = await supabase.schema('dev2').from('t_juchu_kizai_honbanbi').insert(newData);
    if (error) {
      console.log('Error Add honbanbi:', error.message);
      return false;
    }
    return true;
  } catch (e) {
    console.log(e);
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
export const UpdateNyushukoHonbanbi = async (
  juchuHeadId: number,
  juchuKizaiHeadId: number,
  juchuHonbanbiData: JuchuKizaiHonbanbiValues,
  userNam: string
) => {
  const updateData = {
    juchu_head_id: juchuHeadId,
    juchu_kizai_head_id: juchuKizaiHeadId,
    juchu_honbanbi_shubetu_id: juchuHonbanbiData.juchuHonbanbiShubetuId,
    juchu_honbanbi_dat: toISOStringYearMonthDay(juchuHonbanbiData.juchuHonbanbiDat),
    mem: juchuHonbanbiData.mem ? juchuHonbanbiData.mem : null,
    juchu_honbanbi_add_qty: juchuHonbanbiData.juchuHonbanbiAddQty,
    upd_dat: new Date(),
    upd_user: userNam,
  };

  try {
    const { error } = await supabase
      .schema('dev2')
      .from('t_juchu_kizai_honbanbi')
      .update(updateData)
      .eq('juchu_head_id', juchuHeadId)
      .eq('juchu_kizai_head_id', juchuKizaiHeadId)
      .eq('juchu_honbanbi_shubetu_id', juchuHonbanbiData.juchuHonbanbiShubetuId);
    if (error) {
      console.error('Error updating honbanbi:', error.message);
      return false;
    }
    console.log('honbanbi updated successfully:', updateData);
    return true;
  } catch (e) {
    console.error(e);
    return false;
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
export const UpdateHonbanbi = async (
  juchuHeadId: number,
  juchuKizaiHeadId: number,
  juchuHonbanbiData: JuchuKizaiHonbanbiValues,
  userNam: string
) => {
  const updateData = {
    juchu_head_id: juchuHeadId,
    juchu_kizai_head_id: juchuKizaiHeadId,
    juchu_honbanbi_shubetu_id: juchuHonbanbiData.juchuHonbanbiShubetuId,
    juchu_honbanbi_dat: toISOStringYearMonthDay(juchuHonbanbiData.juchuHonbanbiDat),
    mem: juchuHonbanbiData.mem ? juchuHonbanbiData.mem : null,
    juchu_honbanbi_add_qty: juchuHonbanbiData.juchuHonbanbiAddQty,
    upd_dat: new Date(),
    upd_user: userNam,
  };

  try {
    const { error } = await supabase
      .schema('dev2')
      .from('t_juchu_kizai_honbanbi')
      .update(updateData)
      .eq('juchu_head_id', juchuHeadId)
      .eq('juchu_kizai_head_id', juchuKizaiHeadId)
      .eq('juchu_honbanbi_shubetu_id', juchuHonbanbiData.juchuHonbanbiShubetuId)
      .eq('juchu_honbanbi_dat', toISOStringYearMonthDay(juchuHonbanbiData.juchuHonbanbiDat));
    if (error) {
      console.error('Error updating honbanbi:', error.message);
      return false;
    }
    console.log('honbanbi updated successfully:', updateData);
    return true;
  } catch (e) {
    console.error(e);
    return false;
  }
};

/**
 * 受注機材本番日削除
 * @param juchuHeadId 受注ヘッダーid
 * @param juchuKizaiHeadId 受注機材ヘッダーid
 * @param juchuHonbanbiData 受注機材本番日データ
 */
export const DeleteHonbanbi = async (
  juchuHeadId: number,
  juchuKizaiHeadId: number,
  juchuHonbanbiData: JuchuKizaiHonbanbiValues
) => {
  try {
    const { error } = await supabase
      .schema('dev2')
      .from('t_juchu_kizai_honbanbi')
      .delete()
      .eq('juchu_head_id', juchuHeadId)
      .eq('juchu_kizai_head_id', juchuKizaiHeadId)
      .eq('juchu_honbanbi_shubetu_id', juchuHonbanbiData.juchuHonbanbiShubetuId)
      .eq('juchu_honbanbi_dat', toISOStringYearMonthDay(juchuHonbanbiData.juchuHonbanbiDat));

    if (error) {
      console.error('Error delete honbanbi:', error.message);
    }
  } catch (e) {
    console.error(e);
  }
};

/**
 * 受注機材本番日(使用日)削除
 * @param juchuHeadId 受注ヘッダーid
 * @param juchuKizaiHeadId 受注機材ヘッダーid
 * @param juchuHonbanbiData 受注機材本番日データ
 */
export const DeleteSiyouHonbanbi = async (juchuHeadId: number, juchuKizaiHeadId: number) => {
  try {
    const { error } = await supabase
      .schema('dev2')
      .from('t_juchu_kizai_honbanbi')
      .delete()
      .eq('juchu_head_id', juchuHeadId)
      .eq('juchu_kizai_head_id', juchuKizaiHeadId)
      .eq('juchu_honbanbi_shubetu_id', 1);

    if (error) {
      console.error('Error delete honbanbi:', error.message);
    }
  } catch (e) {
    console.error(e);
  }
};
