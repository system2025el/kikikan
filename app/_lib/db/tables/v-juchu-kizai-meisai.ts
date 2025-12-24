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
        'juchu_head_id, juchu_kizai_head_id, juchu_kizai_meisai_id, shozoku_id, shozoku_nam, kizai_id, kizai_nam, plan_kizai_qty, plan_yobi_qty, dsp_ord_num, indent_num'
      )
      .eq('juchu_head_id', juchuHeadId)
      .eq('juchu_kizai_head_id', juchuKizaiHeadId)
      .not('kizai_id', 'is', null)
      .order('dsp_ord_num');
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
        'juchu_head_id, juchu_kizai_head_id, juchu_kizai_meisai_id, shozoku_id, shozoku_nam, mem, kizai_id, kizai_nam, plan_kizai_qty, plan_yobi_qty, keep_qty, dsp_ord_num, indent_num'
      )
      .eq('juchu_head_id', juchuHeadId)
      .eq('juchu_kizai_head_id', juchuKizaiHeadId)
      .not('kizai_id', 'is', null)
      .order('dsp_ord_num');
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
        'juchu_head_id, juchu_kizai_head_id, juchu_kizai_meisai_id, shozoku_id, shozoku_nam, mem, kizai_id, kizai_nam, plan_kizai_qty, dsp_ord_num, indent_num'
      )
      .eq('juchu_head_id', juchuHeadId)
      .eq('juchu_kizai_head_id', juchuKizaiHeadId)
      .not('kizai_id', 'is', null)
      .order('dsp_ord_num');
  } catch (e) {
    throw e;
  }
};

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
    const shukoBasho = nyushukoBashoId === 1 ? 'kics' : 'yard';
    const query = `select 

    v_juchu_kizai_head_lst.juchu_head_id
    ,v_juchu_kizai_head_lst.${shukoBasho}_shuko_dat --$4

    ,v_juchu_kizai_meisai.kizai_id
    ,v_juchu_kizai_meisai.kizai_nam
    
    ,(coalesce( v_juchu_kizai_meisai.plan_kizai_qty,0)) + (coalesce(v_juchu_kizai_meisai.keep_qty,0)) as plan_qty
    ,(coalesce(v_juchu_kizai_meisai.plan_yobi_qty,0)) as plan_yobi_qty
    
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
    v_juchu_kizai_head_lst.juchu_kizai_head_kbn in (1,3)    --通常、キープ
    
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
    v_juchu_kizai_head_lst.juchu_kizai_head_kbn in (1,3)    --通常、キープ
    

order by
    juchu_kizai_head_id
    ,ctn_flg
    ,dsp_ord_num
`;
    const values = [juchuHeadId, juchuKizaiHeadIds, shukoDat];
    const result = await pool.query(query, values);
    return result;
  } catch (e) {
    console.error('selectPdfJuchuKizaiMeisai でエラーが発生しました:', e);

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
export const selectNyukoPdfJuchuKizaiMeisai = async (
  juchuHeadId: number,
  nyukoDat: string,
  nyushukoBashoId: number
) => {
  try {
    const values = [juchuHeadId, nyukoDat];
    const nyukoBasho = nyushukoBashoId === 1 ? 'kics' : 'yard';
    // ---------------------------------------------------
    // 入庫リスト印刷ボタンSQL
    // ---------------------------------------------------
    const headerQuery = `
      SELECT 
          v_juchu_kizai_head_lst.juchu_head_id
          ,v_juchu_kizai_head_lst.${nyukoBasho}_nyuko_dat --YARDの場合

          ,max(v_juchu_kizai_head_lst.juchu_honbanbi_calc_qty) as juchu_honbanbi_calc_qty
      
      FROM 
          ${SCHEMA}.v_juchu_kizai_head_lst
      
      WHERE
          v_juchu_kizai_head_lst.juchu_head_id = $1
   --     AND v_juchu_kizai_head_lst.juchu_kizai_head_id in (1,2)    --入庫明細ビューから機材ヘッダーIDセット
          AND v_juchu_kizai_head_lst.${nyukoBasho}_nyuko_dat = $2    --YARDの場合
          AND v_juchu_kizai_head_lst.juchu_kizai_head_kbn IN (1,3) --通常、キープ
      
      GROUP BY
          v_juchu_kizai_head_lst.juchu_head_id
          ,v_juchu_kizai_head_lst.${nyukoBasho}_nyuko_dat --YARDの場合
    `;

    // ---------------------------------------------------
    //--入庫リスト 明細部--
    // ---------------------------------------------------
    const meisaiQuery = `
      SELECT 
          v_juchu_kizai_head_lst.juchu_head_id
          ,v_juchu_kizai_head_lst.${nyukoBasho}_nyuko_dat 
          ,v_juchu_kizai_meisai.kizai_id
          ,v_juchu_kizai_meisai.kizai_nam
          ,(coalesce( v_juchu_kizai_meisai.plan_kizai_qty,0)) + (coalesce(v_juchu_kizai_meisai.keep_qty,0)) as plan_qty
          ,(coalesce(v_juchu_kizai_meisai.plan_yobi_qty,0)) as plan_yobi_qty
          --ソート用カラム
          ,v_juchu_kizai_head_lst.juchu_kizai_head_id
          ,0 as ctn_flg
          ,v_juchu_kizai_meisai.dsp_ord_num
      
      FROM 
          ${SCHEMA}.v_juchu_kizai_head_lst
          INNER JOIN ${SCHEMA}.v_juchu_kizai_meisai ON
          v_juchu_kizai_head_lst.juchu_head_id = v_juchu_kizai_meisai.juchu_head_id
          AND v_juchu_kizai_head_lst.juchu_kizai_head_id = v_juchu_kizai_meisai.juchu_kizai_head_id
      
          WHERE
          v_juchu_kizai_head_lst.juchu_head_id = $1
   --     AND v_juchu_kizai_head_lst.juchu_kizai_head_id in (1,2)    --入庫明細ビューから機材ヘッダーIDセット
          AND v_juchu_kizai_head_lst.${nyukoBasho}_nyuko_dat = $2   --YARDの場合
          AND v_juchu_kizai_head_lst.juchu_kizai_head_kbn IN (1,3)   --通常、キープ

   --コンテナも追加(YARD+YARD)     
      UNION ALL

      SELECT 
          v_juchu_kizai_head_lst.juchu_head_id
          ,v_juchu_kizai_head_lst.${nyukoBasho}_nyuko_dat 
          ,v_juchu_ctn_meisai.kizai_id
          ,v_juchu_ctn_meisai.kizai_nam
          ,(coalesce(v_juchu_ctn_meisai.kics_plan_kizai_qty,0)) + (coalesce(v_juchu_ctn_meisai.yard_plan_kizai_qty,0)) as plan_qty
  --コンテナはYARD+YARD両方を合算
          
          ,0 as plan_yobi_qty

  --ソート用カラム
          ,v_juchu_kizai_head_lst.juchu_kizai_head_id
          ,1 as ctn_flg
          ,v_juchu_ctn_meisai.dsp_ord_num

      FROM 
          ${SCHEMA}.v_juchu_kizai_head_lst

      INNER JOIN ${SCHEMA}.v_juchu_ctn_meisai ON
          v_juchu_kizai_head_lst.juchu_head_id = v_juchu_ctn_meisai.juchu_head_id
          AND v_juchu_kizai_head_lst.juchu_kizai_head_id = v_juchu_ctn_meisai.juchu_kizai_head_id

      WHERE
          v_juchu_kizai_head_lst.juchu_head_id = $1   --入庫明細から機材ヘッダーIDセット
          AND v_juchu_kizai_head_lst.${nyukoBasho}_nyuko_dat = $2   --YARD入庫日時
          AND v_juchu_kizai_head_lst.juchu_kizai_head_kbn IN (1,3)   --通常、キープ
       
      ORDER BY
          juchu_kizai_head_id
          ,ctn_flg
          ,dsp_ord_num
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
    console.error('selectNyukoPdfJuchuKizaiMeisai でエラーが発生しました:', e);
    throw e;
  }
};
