'use server';

import pool from '../postgres';
import { SCHEMA, supabase } from '../supabase';

export const selectNyushukoDetail = async (
  juchuHeadId: number,
  juchuKizaiHeadKbn: number,
  nyushukoBashoId: number,
  nyushukoDat: string,
  sagyoKbnId: number
) => {
  const query = `
    SELECT
      n.juchu_head_id,
      n.juchu_kizai_head_id,
      n.juchu_kizai_meisai_id,
      n.juchu_kizai_head_kbnv,
      n.head_namv,
      n.kizai_id,
      n.kizai_nam,
      n.koen_nam,
      n.koenbasho_nam,
      n.kokyaku_nam,
      n.nyushuko_basho_id,
      n.nyushuko_dat,
      n.nyushuko_shubetu_id,
      n.plan_qty,
      m.plan_kizai_qty,
      m.plan_yobi_qty,
      n.result_adj_qty,
      n.result_qty,
      n.sagyo_kbn_id,
      n.ctn_flg,
      n.dsp_ord_num_meisai,
      n.indent_num,
      n.mem2
    FROM
      ${SCHEMA}.v_nyushuko_den2_lst as n
      LEFT JOIN ${SCHEMA}.t_juchu_kizai_meisai as m
      ON n.juchu_head_id = m.juchu_head_id
      AND n.juchu_kizai_head_id = m.juchu_kizai_head_id
      AND n.juchu_kizai_meisai_id = m.juchu_kizai_meisai_id
      AND n.kizai_id = m.kizai_id
    WHERE
      n.juchu_head_id = $1
      AND n.juchu_kizai_head_kbnv = $2
      AND n.nyushuko_basho_id = $3
      AND n.nyushuko_dat = $4
      AND n.sagyo_kbn_id = $5
    ORDER BY
      juchu_kizai_head_id,
      dsp_ord_num_meisai
  `;

  const values = [juchuHeadId, juchuKizaiHeadKbn.toString(), nyushukoBashoId, nyushukoDat, sagyoKbnId];

  try {
    return (await pool.query(query, values)).rows;
  } catch (e) {
    throw new Error('[selectNyushukoDetail] DBエラー:', { cause: e });
  }
};

export const selectCtnNyushukoDetail = async (
  juchuHeadId: number,
  juchuKizaiHeadId: number,
  juchuKizaiHeadKbn: number,
  nyushukoBashoId: number,
  nyushukoDat: string,
  sagyoKbnId: number
) => {
  try {
    return await supabase
      .schema(SCHEMA)
      .from('v_nyushuko_den2_lst')
      .select('juchu_kizai_head_id, kizai_id, plan_qty')
      .eq('juchu_head_id', juchuHeadId)
      .eq('juchu_kizai_head_id', juchuKizaiHeadId)
      .eq('juchu_kizai_head_kbnv', juchuKizaiHeadKbn.toString())
      .eq('nyushuko_basho_id', nyushukoBashoId)
      .eq('nyushuko_dat', nyushukoDat)
      .eq('sagyo_kbn_id', sagyoKbnId)
      .eq('ctn_flg', 1)
      .order('juchu_kizai_head_id')
      .order('dsp_ord_num_meisai');
  } catch (e) {
    throw new Error('[selectCtnNyushukoDetail] DBエラー:', { cause: e });
  }
};

export const selectNyushukoDetailOne = async (
  juchuHeadId: number,
  juchuKizaiHeadId: number,
  juchuKizaiMeisaiId: number,
  nyushukoBashoId: number,
  nyushukoDat: string,
  sagyoKbnId: number,
  kizaiId: number
) => {
  try {
    return await supabase
      .schema(SCHEMA)
      .from('v_nyushuko_den2_lst')
      .select(
        'kizai_nam, kizai_mem, plan_qty, result_adj_qty, result_qty, ctn_flg, bld_cod, tana_cod, eda_cod, dsp_ord_num_meisai, indent_num'
      )
      .eq('juchu_head_id', juchuHeadId)
      .eq('juchu_kizai_head_id', juchuKizaiHeadId)
      .eq('juchu_kizai_meisai_id', juchuKizaiMeisaiId)
      .eq('nyushuko_basho_id', nyushukoBashoId)
      .eq('nyushuko_dat', nyushukoDat)
      .eq('sagyo_kbn_id', sagyoKbnId)
      .eq('kizai_id', kizaiId)
      .single();
  } catch (e) {
    throw new Error('[selectNyushukoDetailOne] DBエラー:', { cause: e });
  }
};
