'use server';

import { BASHO_ID, JUCHU_KIZAI_HEAD_KBN, SAGYO_KBN_ID } from '@/app/_lib/constants';

import pool from '../postgres';
import { SCHEMA } from '../supabase';

/**
 * 納品書PDF用受注機材データ取得
 * @param juchuHeadId 受注ヘッダーid
 * @param juchuKizaiHeadIds 受注機材ヘッダーid
 * @param nyushukoBashoId 入出庫場所id
 * @param shukoDat 出庫時間
 * @returns
 */
export const selectPdfJuchuKizaiMeisai = async (
  juchuHeadId: number,
  juchuKizaiHeadIds: string,
  shukoDat: string,
  nyushukoBashoId: number
) => {
  try {
    const shukoBasho = nyushukoBashoId === BASHO_ID.kics ? 'kics' : 'yard';
    const query = `select 

    v_juchu_kizai_head_lst.juchu_head_id
    ,v_juchu_kizai_head_lst.${shukoBasho}_shuko_dat --$4

    ,v_juchu_kizai_meisai.kizai_id
    ,v_juchu_kizai_meisai.kizai_nam
    
    ,(coalesce( v_juchu_kizai_meisai.plan_kizai_qty,0)) + (coalesce(v_juchu_kizai_meisai.keep_qty,0)) as plan_qty
    ,(coalesce(v_juchu_kizai_meisai.plan_yobi_qty,0)) as plan_yobi_qty

    ,v_juchu_kizai_meisai.mem2
    
    --ソート用カラム
    ,v_juchu_kizai_head_lst.juchu_kizai_head_id
    ,0 as ctn_flg
    ,v_juchu_kizai_meisai.dsp_ord_num
    
from 
    ${SCHEMA}.v_juchu_kizai_head_lst

    --left join  ${SCHEMA}.v_juchu_kizai_meisai on-
    inner join  ${SCHEMA}.v_juchu_kizai_meisai on
        v_juchu_kizai_head_lst.juchu_head_id = v_juchu_kizai_meisai.juchu_head_id
        and
        v_juchu_kizai_head_lst.juchu_kizai_head_id = v_juchu_kizai_meisai.juchu_kizai_head_id
        
where
    v_juchu_kizai_head_lst.juchu_head_id = $1
    and
    v_juchu_kizai_head_lst.juchu_kizai_head_id=any(string_to_array($2, ',')::int[])    --出庫明細から機材ヘッダーIDセット
  
    and
    v_juchu_kizai_head_lst.${shukoBasho}_shuko_dat = $3   --$4
    
    and
    v_juchu_kizai_head_lst.juchu_kizai_head_kbn in (${JUCHU_KIZAI_HEAD_KBN.normal},${JUCHU_KIZAI_HEAD_KBN.keep})    --通常、キープ
    
--コンテナも追加(KICS+YARD)
union all
select 

    v_juchu_kizai_head_lst.juchu_head_id
    ,v_juchu_kizai_head_lst.${shukoBasho}_shuko_dat  --$4

    ,v_juchu_ctn_meisai.kizai_id
    ,v_juchu_ctn_meisai.kizai_nam
    
    ,(coalesce(v_juchu_ctn_meisai.kics_plan_kizai_qty,0)) + (coalesce(v_juchu_ctn_meisai.yard_plan_kizai_qty,0)) as plan_qty
    --~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    --コンテナはKICS+YARD両方を合算
    
    ,0 as plan_yobi_qty
    ,'' as mem2
    
    --ソート用カラム
    ,v_juchu_kizai_head_lst.juchu_kizai_head_id
    ,1 as ctn_flg
    ,v_juchu_ctn_meisai.dsp_ord_num
from 
    ${SCHEMA}.v_juchu_kizai_head_lst

    --left join  ${SCHEMA}.v_juchu_ctn_meisai on
    inner join  ${SCHEMA}.v_juchu_ctn_meisai on
        v_juchu_kizai_head_lst.juchu_head_id = v_juchu_ctn_meisai.juchu_head_id
        and
        v_juchu_kizai_head_lst.juchu_kizai_head_id = v_juchu_ctn_meisai.juchu_kizai_head_id
        
where
    v_juchu_kizai_head_lst.juchu_head_id = $1
    and
    v_juchu_kizai_head_lst.juchu_kizai_head_id=any(string_to_array($2, ',')::int[])    --出庫明細から機材ヘッダーIDセット
    and
    v_juchu_kizai_head_lst.${shukoBasho}_shuko_dat = $3    --$4
    
    and
    v_juchu_kizai_head_lst.juchu_kizai_head_kbn in (${JUCHU_KIZAI_HEAD_KBN.normal},${JUCHU_KIZAI_HEAD_KBN.keep})    --通常、キープ
    

order by
    juchu_kizai_head_id
    ,ctn_flg
    ,dsp_ord_num
`;
    const values = [juchuHeadId, juchuKizaiHeadIds, shukoDat];
    const result = await pool.query(query, values);
    return result;
  } catch (e) {
    throw new Error('[selectPdfJuchuKizaiMeisai] DBエラー:', { cause: e });
  }
};

/**
 * 員数表PDF用受注機材データ取得
 * @param juchuHeadId 受注ヘッダーid
 * @param juchuKizaiHeadIds 受注機材ヘッダーid
 * @param nyushukoBashoId 入出庫場所id
 * @returns
 */
export const selectNyukoPdfJuchuKizaiMeisai = async (
  juchuHeadId: number,
  juchuKizaiHeadIds: string,
  nyukoDat: string,
  nyushukoBashoId: number
) => {
  const ids = juchuKizaiHeadIds.split(',').map(Number);
  try {
    const values = [juchuHeadId, ids, nyukoDat];
    const nyukoBasho = nyushukoBashoId === BASHO_ID.kics ? 'kics' : 'yard';
    // ---------------------------------------------------
    // 入庫リスト印刷ボタンSQL
    // ---------------------------------------------------
    const headerQuery = `
      SELECT 
          v_juchu_kizai_head_lst.juchu_head_id
          ,v_juchu_kizai_head_lst.juchu_kizai_head_kbn
          ,v_juchu_kizai_head_lst.${nyukoBasho}_nyuko_dat 

          ,max(v_juchu_kizai_head_lst.juchu_honbanbi_calc_qty) as juchu_honbanbi_calc_qty
      
      FROM 
          ${SCHEMA}.v_juchu_kizai_head_lst
      
      WHERE
          v_juchu_kizai_head_lst.juchu_head_id = $1
          AND v_juchu_kizai_head_lst.juchu_kizai_head_id = ANY ($2)   --入庫明細ビューから機材ヘッダーIDセット
          AND v_juchu_kizai_head_lst.${nyukoBasho}_nyuko_dat = $3
      
      GROUP BY
          v_juchu_kizai_head_lst.juchu_head_id
          ,v_juchu_kizai_head_lst.juchu_kizai_head_kbn
          ,v_juchu_kizai_head_lst.${nyukoBasho}_nyuko_dat 
    `;

    // ---------------------------------------------------
    //--入庫リスト 明細部--
    // ---------------------------------------------------
    const meisaiQuery = `
      SELECT 
          v_juchu_kizai_head_lst.juchu_head_id
          ,v_juchu_kizai_head_lst.juchu_kizai_head_kbn
          ,v_juchu_kizai_head_lst.${nyukoBasho}_nyuko_dat 
          ,v_nyushuko_den2_lst.kizai_id
          ,v_nyushuko_den2_lst.kizai_nam
          ,v_nyushuko_den2_lst.plan_qty::integer
          ,v_nyushuko_den2_lst.mem2
          ,v_kizai_lst_sel.kizai_grp_cod
          ,v_kizai_lst_sel.dsp_ord_num
          --ソート用カラム
          ,v_juchu_kizai_head_lst.juchu_kizai_head_id
          ,v_nyushuko_den2_lst.ctn_flg
          ,v_nyushuko_den2_lst.dsp_ord_num_meisai
      
      FROM 
          ${SCHEMA}.v_juchu_kizai_head_lst
          INNER JOIN ${SCHEMA}.v_nyushuko_den2_lst ON
          v_juchu_kizai_head_lst.juchu_head_id = v_nyushuko_den2_lst.juchu_head_id
          AND v_juchu_kizai_head_lst.juchu_kizai_head_id = v_nyushuko_den2_lst.juchu_kizai_head_id
          INNER JOIN ${SCHEMA}.v_kizai_lst_sel ON
          v_nyushuko_den2_lst.kizai_id = v_kizai_lst_sel.kizai_id
      
      WHERE
          v_juchu_kizai_head_lst.juchu_head_id = $1
          AND v_juchu_kizai_head_lst.juchu_kizai_head_id = ANY ($2)    --入庫明細ビューから機材ヘッダーIDセット
          AND v_juchu_kizai_head_lst.${nyukoBasho}_nyuko_dat = $3
          AND v_nyushuko_den2_lst.sagyo_kbn_id = ${SAGYO_KBN_ID.nyukoCount}
      ORDER BY
          juchu_kizai_head_id
          ,ctn_flg
          ,dsp_ord_num_meisai
    `;

    // ---------------------------------------------------
    // 2つのクエリを並行して実行する
    // ---------------------------------------------------
    const [headerResult, meisaiResult] = await Promise.all([
      pool.query(headerQuery, values),
      pool.query(meisaiQuery, values),
    ]);

    // 結果をまとめて返す
    return {
      header: headerResult.rows[0] || null,
      meisai: meisaiResult.rows,
    };
  } catch (e) {
    throw new Error('[selectNyukoPdfJuchuKizaiMeisai] DBエラー:', { cause: e });
  }
};
