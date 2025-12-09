'use server';

import pool from '../postgres';
import { SCHEMA, supabase } from '../supabase';

/**
 * メイン受注機材明細リスト取得
 * @param juchuHeadId 受注ヘッダーid
 * @param juchuKizaiHeadId 受注機材ヘッダーid
 * @returns 受注機材明細リスト
 */
export const selectIdoJuchuKizaiMeisai = async (juchuHeadId: number, juchuKizaiHeadId: number) => {
  try {
    const query = `
      SELECT 
        juchu_head_id, 
        juchu_kizai_head_id, 
        ido_den_id, 
        sagyo_den_dat, 
        sagyo_siji_id, 
        shozoku_id, 
        shozoku_nam, 
        mem, 
        kizai_id, 
        kizai_nam, 
        kizai_qty, 
        plan_kizai_qty, 
        plan_yobi_qty, 
        plan_qty, 
        kizai_grp_cod, 
        dsp_ord_num 
      FROM ${SCHEMA}.v_juchu_kizai_meisai_sum
      WHERE juchu_head_id = $1
        AND juchu_kizai_head_id = $2
        AND kizai_id IS NOT NULL
    `;
    const values = [juchuHeadId, juchuKizaiHeadId];
    const result = await pool.query(query, values);
    return result.rows;

    // return await supabase
    //   .schema(SCHEMA)
    //   .from('v_juchu_kizai_meisai_sum')
    //   .select(
    //     'juchu_head_id, juchu_kizai_head_id, ido_den_id, sagyo_den_dat, sagyo_siji_id, shozoku_id, shozoku_nam, mem, kizai_id, kizai_nam, kizai_qty, plan_kizai_qty, plan_yobi_qty, plan_qty, kizai_grp_cod, dsp_ord_num'
    //   )
    //   .eq('juchu_head_id', juchuHeadId)
    //   .eq('juchu_kizai_head_id', juchuKizaiHeadId)
    //   .not('kizai_id', 'is', null);
  } catch (e) {
    throw e;
  }
};
