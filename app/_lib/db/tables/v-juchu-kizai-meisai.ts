'use server';

import pool from '../postgres';
import { SCHEMA, supabase } from '../supabase';

/**
 * メイン受注機材明細リスト取得
 * @param juchuHeadId 受注ヘッダーid
 * @param juchuKizaiHeadId 受注機材ヘッダーid
 * @returns 受注機材明細リスト
 */
export const selectJuchuKizaiMeisai = async (juchuHeadId: number, juchuKizaiHeadId: number) => {
  try {
    return await supabase
      .schema(SCHEMA)
      .from('v_juchu_kizai_meisai')
      .select(
        'juchu_head_id, juchu_kizai_head_id, juchu_kizai_meisai_id, shozoku_id, mem, kizai_id, kizai_nam, plan_kizai_qty, plan_yobi_qty, plan_qty'
      )
      .eq('juchu_head_id', juchuHeadId)
      .eq('juchu_kizai_head_id', juchuKizaiHeadId)
      .not('kizai_id', 'is', null);
  } catch (e) {
    throw e;
  }
};

/**
 * 親受注機材明細リスト取得
 * @param juchuHeadId 受注ヘッダーid
 * @param juchuKizaiHeadId 受注機材ヘッダーid
 * @returns 受注機材明細リスト
 */
export const selectOyaJuchuKizaiMeisai = async (juchuHeadId: number, juchuKizaiHeadId: number) => {
  try {
    return await supabase
      .schema(SCHEMA)
      .from('v_juchu_kizai_meisai')
      .select(
        'juchu_head_id, juchu_kizai_head_id, juchu_kizai_meisai_id, shozoku_id, shozoku_nam, kizai_id, kizai_nam, plan_kizai_qty, plan_yobi_qty'
      )
      .eq('juchu_head_id', juchuHeadId)
      .eq('juchu_kizai_head_id', juchuKizaiHeadId)
      .not('kizai_id', 'is', null);
  } catch (e) {
    throw e;
  }
};

/**
 * キープ受注機材明細リスト取得
 * @param juchuHeadId 受注ヘッダーid
 * @param juchuKizaiHeadId 受注機材ヘッダーid
 * @returns キープ受注機材明細
 */
export const selectKeepJuchuKizaiMeisai = async (juchuHeadId: number, juchuKizaiHeadId: number) => {
  try {
    return await supabase
      .schema(SCHEMA)
      .from('v_juchu_kizai_meisai')
      .select(
        'juchu_head_id, juchu_kizai_head_id, juchu_kizai_meisai_id, shozoku_id, shozoku_nam, mem, kizai_id, kizai_nam, plan_kizai_qty, plan_yobi_qty, keep_qty'
      )
      .eq('juchu_head_id', juchuHeadId)
      .eq('juchu_kizai_head_id', juchuKizaiHeadId)
      .not('kizai_id', 'is', null);
  } catch (e) {
    throw e;
  }
};

/**
 * 返却受注機材明細リスト取得
 * @param juchuHeadId 受注ヘッダーid
 * @param juchuKizaiHeadId 受注機材ヘッダーid
 * @returns キープ受注機材明細
 */
export const selectReturnJuchuKizaiMeisai = async (juchuHeadId: number, juchuKizaiHeadId: number) => {
  try {
    return await supabase
      .schema(SCHEMA)
      .from('v_juchu_kizai_meisai')
      .select(
        'juchu_head_id, juchu_kizai_head_id, juchu_kizai_meisai_id, shozoku_id, shozoku_nam, mem, kizai_id, kizai_nam, plan_kizai_qty, plan_yobi_qty, plan_qty'
      )
      .eq('juchu_head_id', juchuHeadId)
      .eq('juchu_kizai_head_id', juchuKizaiHeadId)
      .not('kizai_id', 'is', null);
  } catch (e) {
    throw e;
  }
};

/**
 * 納品書PDF用受注機材データ取得
 * @param juchuHeadId 受注ヘッダーid
 * @param juchuKizaiHeadIds 受注機材ヘッダーid
 * @param nyushukoBashoId 入出庫場所id
 * @returns
 */
export const selectPdfJuchuKizaiMeisai = async (
  juchuHeadId: number,
  juchuKizaiHeadIds: string,
  nyushukoBashoId: number
) => {
  try {
    await pool.query(` SET search_path TO ${SCHEMA};`);
    return await pool.query(`
      select 
          v_juchu_kizai_meisai.kizai_id as "kizaiId"
          ,v_juchu_kizai_meisai.kizai_nam as "kizaiNam"
          
          ,sum(coalesce( v_juchu_kizai_meisai.plan_kizai_qty,0)) + sum(coalesce(v_juchu_kizai_meisai.keep_qty,0)) as "planKizaiQty"
          ,sum(coalesce(v_juchu_kizai_meisai.plan_yobi_qty,0)) as "planYobiQty"
          ,sum(coalesce( v_juchu_kizai_meisai.plan_kizai_qty,0)) + sum(coalesce(v_juchu_kizai_meisai.keep_qty,0)) + sum(coalesce(v_juchu_kizai_meisai.plan_yobi_qty,0)) as "planQty"
          
      from 
          v_juchu_kizai_meisai
              
      where
          v_juchu_kizai_meisai.juchu_head_id = ${juchuHeadId}
          and
          v_juchu_kizai_meisai.juchu_kizai_head_id in (${juchuKizaiHeadIds})    --出庫明細から機材ヘッダーIDセット
          and 
          v_juchu_kizai_meisai.shozoku_id = ${nyushukoBashoId}  -- 入出庫場所
          
      group by
          v_juchu_kizai_meisai.juchu_head_id
          ,v_juchu_kizai_meisai.kizai_id
          ,v_juchu_kizai_meisai.kizai_nam
      ;
    `);
  } catch (e) {
    throw e;
  }
};
