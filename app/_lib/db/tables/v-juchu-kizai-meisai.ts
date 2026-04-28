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
    const queey = `
      SELECT 
        juchu_head_id, 
        juchu_kizai_head_id, 
        juchu_kizai_meisai_id, 
        shozoku_id, 
        mem, 
        mem2, 
        kizai_id, 
        kizai_nam, 
        plan_kizai_qty, 
        plan_yobi_qty, 
        plan_qty, 
        dsp_ord_num, 
        indent_num 
      FROM ${SCHEMA}.v_juchu_kizai_meisai
      WHERE juchu_head_id = $1
        AND juchu_kizai_head_id = $2
        AND kizai_id IS NOT NULL
      ORDER BY 
        dsp_ord_num
    `;
    const values = [juchuHeadId, juchuKizaiHeadId];
    const result = await pool.query(queey, values);
    //await pool.end();
    return result.rows;
    // return await supabase
    //   .schema(SCHEMA)
    //   .from('v_juchu_kizai_meisai')
    //   .select(
    //     'juchu_head_id, juchu_kizai_head_id, juchu_kizai_meisai_id, shozoku_id, mem, mem2, kizai_id, kizai_nam, plan_kizai_qty, plan_yobi_qty, plan_qty, dsp_ord_num, indent_num'
    //   )
    //   .eq('juchu_head_id', juchuHeadId)
    //   .eq('juchu_kizai_head_id', juchuKizaiHeadId)
    //   .not('kizai_id', 'is', null)
    //   .order('dsp_ord_num');
  } catch (e) {
    throw new Error('[selectJuchuKizaiMeisai] DBエラー:', { cause: e });
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
        'juchu_head_id, juchu_kizai_head_id, juchu_kizai_meisai_id, shozoku_id, shozoku_nam, kizai_id, kizai_nam, plan_kizai_qty, plan_yobi_qty, dsp_ord_num, indent_num'
      )
      .eq('juchu_head_id', juchuHeadId)
      .eq('juchu_kizai_head_id', juchuKizaiHeadId)
      .not('kizai_id', 'is', null)
      .order('dsp_ord_num');
  } catch (e) {
    throw new Error('[selectOyaJuchuKizaiMeisai] DBエラー:', { cause: e });
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
        'juchu_head_id, juchu_kizai_head_id, juchu_kizai_meisai_id, shozoku_id, shozoku_nam, mem, kizai_id, kizai_nam, plan_kizai_qty, plan_yobi_qty, keep_qty, dsp_ord_num, indent_num'
      )
      .eq('juchu_head_id', juchuHeadId)
      .eq('juchu_kizai_head_id', juchuKizaiHeadId)
      .not('kizai_id', 'is', null)
      .order('dsp_ord_num');
  } catch (e) {
    throw new Error('[selectKeepJuchuKizaiMeisai] DBエラー:', { cause: e });
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
        'juchu_head_id, juchu_kizai_head_id, juchu_kizai_meisai_id, shozoku_id, shozoku_nam, mem, kizai_id, kizai_nam, plan_kizai_qty, dsp_ord_num, indent_num'
      )
      .eq('juchu_head_id', juchuHeadId)
      .eq('juchu_kizai_head_id', juchuKizaiHeadId)
      .not('kizai_id', 'is', null)
      .order('dsp_ord_num');
  } catch (e) {
    throw new Error('[selectReturnJuchuKizaiMeisai] DBエラー:', { cause: e });
  }
};
