'use server';

import dayjs from 'dayjs';

import { toJapanTimeString, toJapanYMDString } from '@/app/(main)/_lib/date-conversion';
import { FAKE_NEW_ID } from '@/app/(main)/(masters)/_lib/constants';
import { OrderSearchValues } from '@/app/(main)/order-list/_lib/types';

import pool from '../postgres';
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
  ngFlg?: boolean;
}) => {
  const builder = supabase
    .schema(SCHEMA)
    .from('v_kizai_lst')
    .select(
      'kizai_id, kizai_nam, kizai_qty, kizai_ng_qty, shozoku_nam, mem, bumon_nam, dai_bumon_nam, shukei_bumon_nam, reg_amt, dsp_flg, del_flg'
    );

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
  if (queries.ngFlg) {
    builder.gt('kizai_ng_qty', 0);
  }
  //   let query = `
  //     select distinct
  //   m_kizai.kizai_id,
  //   m_kizai.kizai_nam,
  //   m_kizai.shozoku_id,
  //   m_kizai.del_flg,
  //   m_kizai.bld_cod,
  //   m_kizai.tana_cod,
  //   m_kizai.eda_cod,
  //   case
  //     when m_kizai.kizai_grp_cod::text = ''::text then '未設定'::character varying
  //     when m_kizai.kizai_grp_cod is null then '未設定'::character varying
  //     else m_kizai.kizai_grp_cod
  //   end as kizai_grp_cod,
  //   m_kizai.dsp_ord_num,
  //   m_kizai.mem,
  //   m_kizai.bumon_id,
  //   m_kizai.shukei_bumon_id,
  //   m_kizai.dsp_flg,
  //   m_kizai.ctn_flg,
  //   m_kizai.def_dat_qty,
  //   m_kizai.reg_amt,
  //   m_kizai.rank_amt_1,
  //   m_kizai.rank_amt_2,
  //   m_kizai.rank_amt_3,
  //   m_kizai.rank_amt_4,
  //   m_kizai.rank_amt_5,
  //   m_kizai.section_num,
  //   case
  //     when m_section.section_nam_short is not null then m_section.section_nam_short::text
  //     else m_kizai.section_num::text
  //   end as section_nam,
  //   v_kizai_qty.kizai_qty,
  //   v_kizai_qty.kizai_ng_qty,
  //   v_kizai_qty.kizai_del_qty,
  //   m_shozoku.shozoku_nam,
  //   m_shozoku.shozoku_nam_short,
  //   m_bumon.bumon_nam,
  //   m_shukei_bumon.shukei_bumon_nam,
  //   m_dai_bumon.dai_bumon_id,
  //   m_dai_bumon.dai_bumon_nam,
  //   v_kizai_qty.rfid_kics_qty,
  //   v_kizai_qty.rfid_yard_qty
  // from
  //   ${SCHEMA}.m_kizai
  //   left join ${SCHEMA}.m_shozoku on m_shozoku.shozoku_id = m_kizai.shozoku_id
  //   and m_shozoku.del_flg = 0
  //   left join ${SCHEMA}.m_bumon on m_bumon.bumon_id = m_kizai.bumon_id
  //   and m_bumon.del_flg = 0
  //   left join ${SCHEMA}.m_shukei_bumon on m_shukei_bumon.shukei_bumon_id = m_kizai.shukei_bumon_id
  //   and m_shukei_bumon.del_flg = 0
  //   left join ${SCHEMA}.m_dai_bumon on m_dai_bumon.dai_bumon_id = m_bumon.dai_bumon_id
  //   and m_shukei_bumon.shukei_bumon_id = m_kizai.shukei_bumon_id
  //   and m_dai_bumon.del_flg = 0
  //   left join ${SCHEMA}.v_kizai_qty on v_kizai_qty.kizai_id = m_kizai.kizai_id
  //   left join ${SCHEMA}.m_section on m_section.section_id = COALESCE(m_kizai.section_num, 0)
  //   and m_section.del_flg = 0
  // order by
  //   (
  //     case
  //       when m_kizai.kizai_grp_cod::text = ''::text then '未設定'::character varying
  //       when m_kizai.kizai_grp_cod is null then '未設定'::character varying
  //       else m_kizai.kizai_grp_cod
  //     end
  //   ),
  //   m_kizai.dsp_ord_num,
  //   m_kizai.kizai_nam;
  //   `;

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
  if (queries.ngFlg) {
    builder.gt('kizai_ng_qty', 0);
  }

  try {
    // return await pool.query(query);
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
 * 移動機材IDが一致する移動機材のデータ配列を取得する関数
 * @param idList kizai_idの配列
 * @returns 機材ID, 機材名, 所属ID, 所属名, 機材グループコード, 表示順, 定価, ランクごとの価格, 保有数
 */
export const selectChosenIdoEqptsDetails = async (idList: number[]) => {
  try {
    return await supabase
      .schema(SCHEMA)
      .from('v_kizai_lst')
      .select(
        `kizai_id, kizai_nam, shozoku_id, shozoku_nam, kizai_grp_cod, dsp_ord_num, rfid_kics_qty, rfid_yard_qty, ctn_flg`
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
      .select('kizai_id, kizai_nam, reg_amt, kizai_qty, kizai_ng_qty')
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
      .select(`kizai_id, kizai_nam, kizai_qty, bumon_id, bumon_nam, kizai_ng_qty`)
      .eq('bumon_id', bumonId)
      .eq('del_flg', 0)
      .eq('dsp_flg', 1)
      .order('dsp_ord_num');
  } catch (e) {
    throw e;
  }
};
