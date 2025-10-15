'use server';

import { FAKE_NEW_ID } from '@/app/(main)/(masters)/_lib/constants';

import { SCHEMA, supabase } from '../supabase';

/**
 * 条件が一致する機材を取得する関数
 * @param {string} query 機材名, 部門ID, 大部門ID, 集計部門ID
 * @returns kizai_name, bumon_id, dai_bumon_id, shukei_bumon_idで検索された機材マスタの配列 検索無しなら全件
 */
export const selectFilteredEqpts = async (queries: {
  q: string;
  d: number | null;
  s: number | null;
  b: number | null;
}) => {
  const builder = supabase
    .schema(SCHEMA)
    .from('v_kizai_lst')
    .select(
      'kizai_id, kizai_nam, kizai_qty, shozoku_nam, mem, bumon_nam, dai_bumon_nam, shukei_bumon_nam, reg_amt, rank_amt_1, rank_amt_2, rank_amt_3, rank_amt_4, rank_amt_5, dsp_flg, del_flg'
    )
    .order('kizai_grp_cod')
    .order('dsp_ord_num');

  if (queries.q && queries.q.trim() !== '') {
    builder.ilike('kizai_nam', `%${queries.q}%`);
  }
  if (queries.b !== null && queries.b !== FAKE_NEW_ID) {
    builder.eq('bumon_id', queries.b);
  }
  if (queries.d !== null && queries.d !== FAKE_NEW_ID) {
    builder.eq('dai_bumon_id', queries.d);
  }
  if (queries.s !== null && queries.s !== FAKE_NEW_ID) {
    builder.eq('shukei_bumon_id', queries.s);
  }

  try {
    return await builder;
  } catch (e) {
    throw e;
  }
};

/**
 * 機材IDが一致一致する機材のデータ配列を取得する関数
 * @param idList kizai_idの配列
 * @returns 機材ID, 機材名, 所属ID, 所属名, 機材グループコード, 表示順, 定価, ランクごとの価格, 保有数
 */
export const selectChosenEqptsDetails = async (idList: number[]) => {
  try {
    return await supabase
      .schema(SCHEMA)
      .from('v_kizai_lst')
      .select(
        `kizai_id, kizai_nam, shozoku_id, shozoku_nam, kizai_grp_cod, dsp_ord_num, ctn_flg, reg_amt, rank_amt_1, rank_amt_2, rank_amt_3, rank_amt_4, rank_amt_5, kizai_qty`
      )
      .in('kizai_id', idList)
      .order('kizai_grp_cod')
      .order('dsp_ord_num');
  } catch (e) {
    throw e;
  }
};

/**
 * 貸出状況用機材データ取得
 * @param kizaiId 機材id
 * @returns 機材id,機材名,定価,保有数
 */
export const selectLoanKizai = async (kizaiId: number) => {
  try {
    return await supabase
      .schema(SCHEMA)
      .from('v_kizai_lst')
      .select('kizai_id, kizai_nam, reg_amt, kizai_qty')
      .eq('kizai_id', kizaiId)
      .single();
  } catch (e) {
    throw e;
  }
};

/**
 * 在庫確認用機材データ取得
 * @param bumonId 部門id
 * @returns 機材id,機材名,保有数,部門id,部門名
 */
export const selectStockKizai = async (bumonId: number) => {
  try {
    return await supabase
      .schema(SCHEMA)
      .from('v_kizai_lst')
      .select(`kizai_id, kizai_nam, kizai_qty, bumon_id, bumon_nam`)
      .eq('bumon_id', bumonId)
      .eq('del_flg', 0)
      .eq('dsp_flg', 1)
      .order('dsp_ord_num');
  } catch (e) {
    throw e;
  }
};
