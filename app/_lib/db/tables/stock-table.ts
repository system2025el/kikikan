'use server';

import pool from '../postgres';
import { SCHEMA } from '../supabase';

/**
 * 機材明細用在庫データ取得
 * @param juchuHeadId 受注ヘッダーid
 * @param juchuKizaiHeadId 受注機材ヘッダーid
 * @param kizaiId 機材id
 * @param date 開始日
 * @returns 機材在庫テーブル用データ
 */
export const selectDetailStockList = async (
  juchuHeadId: number,
  juchuKizaiHeadId: number,
  kizaiId: number,
  date: string
) => {
  try {
    await pool.query(` SET search_path TO ${SCHEMA};`);
    const query = `
      select   
    cal.cal_dat as "calDat" --スケジュール日
    ,coalesce(zaiko_kizai.kizai_id,$1 /*■変数箇所■*/)::integer as "kizaiId"   -- 機材ID
    ,coalesce(zaiko_kizai.kizai_qty,(select v_kizai_qty.kizai_qty from v_kizai_qty where v_kizai_qty.kizai_id = $1 /*■変数箇所■*/))::integer as "kizaiQty"   --機材数（有効数） 
    ,coalesce(zaiko_kizai.juchu_qty,0)::integer as "juchuQty"   --受注数 NULL時0固定    /*貸出状況スケジュール*/
    
--     ,coalesce(zaiko_kizai.yobi_qty,0) as yobi_qty   --予備数 NULL時0固定  
--     ,coalesce(zaiko_kizai.plan_qty,0) as plan_qty   --合計数 NULL時0固定  

    ,coalesce(zaiko_kizai.zaiko_qty,(select v_kizai_qty.kizai_qty from v_kizai_qty where v_kizai_qty.kizai_id = $1 /*■変数箇所■*/))::integer as "zaikoQty"     --在庫数   /*受注機材明細スケジュール、在庫状況スケジュール*/
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
             honbanbi.juchu_head_id = $2 /*■変数箇所■*/
             and
             honbanbi.juchu_kizai_head_id = $3 /*■変数箇所■*/
        -----------
        where
            --指定した１機材
            v_zaiko_qty.kizai_id = $1 /*■変数箇所■*/
    ) as zaiko_kizai
right outer join 
    /* スケジュール生成して外部結合 */
    (
        -- スケジュールの生成範囲 /*■変数箇所■*/
        select $4::date + g.i as cal_dat from generate_series(0, 90) as g(i)
    ) as cal on 
    zaiko_kizai.plan_dat = cal.cal_dat    

order by cal_dat;

    `;

    const values = [kizaiId, juchuHeadId, juchuKizaiHeadId, date];

    return await pool.query(query, values);
  } catch (e) {
    throw e;
  }
};

/**
 * 貸出状況用使用データ取得
 * @param juchuHeadId 受注ヘッダーid
 * @param kizaiId 機材id
 * @param date 開始日
 * @returns 貸出状況用使用データ
 */
export const selectUseList = async (juchuHeadId: number, kizaiId: number, date: string) => {
  try {
    await pool.query(` SET search_path TO ${SCHEMA};`);
    const query = `
      select   
    cal.cal_dat as "calDat" --スケジュール日
    ,coalesce(zaiko_kizai.kizai_id,$1 /*■変数箇所■*/)::integer as "kizaiId"   -- 機材ID
    ,coalesce(zaiko_kizai.kizai_qty,(select v_kizai_qty.kizai_qty from v_kizai_qty where v_kizai_qty.kizai_id = $1 /*■変数箇所■*/))::integer as "kizaiQty"   --機材数（保有数） 

--    ,coalesce(zaiko_kizai.juchu_qty,0) as juchuQty   --全体受注数 NULL時0固定    
--    ,coalesce(zaiko_kizai.yobi_qty,0) as yobiQty   --全体予備数 NULL時0固定  
    ,coalesce(zaiko_kizai.plan_qty,0)::integer as "planQty"   --全体合計数 NULL時0固定  
    ,coalesce(zaiko_kizai.zaiko_qty,(select v_kizai_qty.kizai_qty from v_kizai_qty where v_kizai_qty.kizai_id = $1 /*■変数箇所■*/))::integer as "zaikoQty"     --全体在庫数   /*受注機材明細スケジュール、在庫状況スケジュール*/

--     -- 自受注合計数を全体在庫から引いておいて、画面側で自受注合計数を加算しても制御は可能
--     ,coalesce(zaiko_kizai.zaiko_qty,(select v_kizai_qty.kizai_qty from v_kizai_qty where v_kizai_qty.kizai_id = $1 /*■変数箇所■*/)) as zaiko_qty_jogai     --全体在庫数   /*受注機材明細スケジュール、在庫状況スケジュール*/

--    ,coalesce(zaiko_kizai.juchu_honbanbi_shubetu_id,0) as juchu_honbanbi_shubetu_id --受注本番日種別
    ,coalesce(zaiko_kizai.juchu_honbanbi_shubetu_color,'white') as "juchuHonbanbiColor" --受注本番日種別カラー
from 
    (
        select 
             v_zaiko_qty_kasi.plan_dat    --機材の使用日
            ,v_zaiko_qty_kasi.kizai_id   --機材ID
            ,v_zaiko_qty_kasi.kizai_qty  --機材の機材数
            ,v_zaiko_qty_kasi.juchu_qty   --機材の受注数
            ,v_zaiko_qty_kasi.yobi_qty   --機材の予備数
            ,v_zaiko_qty_kasi.plan_qty   --機材の受注合計数
            ,v_zaiko_qty_kasi.zaiko_qty  --機材の在庫数
            ,honbanbi.juchu_honbanbi_shubetu_id --受注本番日種別ID
            ,honbanbi.juchu_honbanbi_shubetu_color --受注本番日種別カラー
        from
            v_zaiko_qty_kasi
            
        left outer join
            ----------------------
             --２．貸出状況スケジュールビュー
              v_honbanbi_kasi_jokyo as honbanbi on
            ----------------------
            
            v_zaiko_qty_kasi.plan_dat = honbanbi.plan_dat
            and
            v_zaiko_qty_kasi.kizai_id = honbanbi.kizai_id

            ----------------------
             
             --２．貸出状況スケジュールビュー
             and
             honbanbi.juchu_head_id = $2 /*■変数箇所■*/
             and
             v_zaiko_qty_kasi.juchu_head_id = $2 /*■変数箇所■*/
        -----------
        where
            --指定した１機材
            v_zaiko_qty_kasi.kizai_id = $1 /*■変数箇所■*/
            and
            v_zaiko_qty_kasi.juchu_head_id = $2 /*■変数箇所■*/
    ) as zaiko_kizai
right outer join 
    /* スケジュール生成して外部結合 */
    (
        -- スケジュールの生成範囲 /*■変数箇所■*/
        select $3::date + g.i as cal_dat from generate_series(0, 90) as g(i)
    ) as cal on 
    zaiko_kizai.plan_dat = cal.cal_dat    

order by cal_dat;
      `;

    const values = [kizaiId, juchuHeadId, date];

    return await pool.query(query, values);
  } catch (e) {
    throw e;
  }
};

/**
 * 機材在庫データ取得
 * @param kizaiId 機材id
 * @param date 日付
 * @returns 機材在庫データ
 */
export const selectStockList = async (kizaiId: number, date: string) => {
  try {
    await pool.query(` SET search_path TO ${SCHEMA};`);
    const query = `
      select   
        cal.cal_dat as "calDat" --スケジュール日
        ,coalesce(zaiko_kizai.kizai_id,$1 /*■変数箇所■*/) as "kizaiId"   -- 機材ID
        ,coalesce(zaiko_kizai.zaiko_qty,(select v_kizai_qty.kizai_qty from v_kizai_qty where v_kizai_qty.kizai_id = $1 /*■変数箇所■*/)) as "zaikoQty"     --在庫数   /*受注機材明細スケジュール、在庫状況スケジュール*/
      from 
      (
        select 
            v_zaiko_qty.plan_dat   --機材の使用日
            ,v_zaiko_qty.kizai_id   --機材ID
            ,v_zaiko_qty.zaiko_qty  --機材の在庫数
        from
            v_zaiko_qty
        where
            --指定した１機材
            v_zaiko_qty.kizai_id = $1 /*■変数箇所■*/
      ) as zaiko_kizai
      right outer join 
        /* スケジュール生成して外部結合 */
        (
            -- スケジュールの生成範囲 /*■変数箇所■*/
            select $2::date + g.i as cal_dat from generate_series(0, 90) as g(i)
        ) as cal on 
        zaiko_kizai.plan_dat = cal.cal_dat    

      order by cal_dat;

    `;

    const values = [kizaiId, date];

    return await pool.query(query, values);
  } catch (e) {
    throw e;
  }
};
