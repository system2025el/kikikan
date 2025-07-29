'use server';

import { QueryResult } from 'pg';

import pool from '@/app/_lib/postgres/postgres';
import { supabase } from '@/app/_lib/supabase/supabase';

import {
  JuchuKizaiHeadValues,
  JuchuKizaiMeisaiValues,
  StockTableValues,
} from '../eq-main-order-detail/[juchu_head_id]/[juchu_kizai_head_id]/[mode]/_lib/types';
import { toISOStringYearMonthDay } from './getshukodat';

export const GetEqHeader = async (juchuHeadId: number, juchuKizaiHeadId: number) => {
  try {
    const { data: juchuKizaiHead, error: juchuKizaiHeadError } = await supabase
      .schema('dev2')
      .from('t_juchu_kizai_head')
      .select(
        'juchu_head_id, juchu_kizai_head_id, juchu_kizai_head_kbn, juchu_honbanbi_qty, zei_kbn, nebiki_amt, mem, head_nam'
      )
      .eq('juchu_head_id', juchuHeadId)
      .eq('juchu_kizai_head_id', juchuKizaiHeadId)
      .single();
    if (juchuKizaiHeadError) {
      console.error('GetEqHeader juchuKizaiHead error : ', juchuKizaiHeadError);
      return null;
    }

    const { data: juchuDate, error: juchuDateError } = await supabase
      .schema('dev2')
      .from('v_nyushuko_den2')
      .select('kics_shuko_dat, kics_nyuko_dat, yard_shuko_dat, yard_nyuko_dat')
      .eq('juchu_head_id', juchuHeadId)
      .eq('juchu_kizai_head_id', juchuKizaiHeadId)
      .limit(1);
    if (juchuDateError) {
      console.error('GetEqHeader juchuDate error : ', juchuDateError);
      return null;
    }

    const jucuKizaiHeadData: JuchuKizaiHeadValues = {
      juchuHeadId: juchuKizaiHead.juchu_head_id,
      juchuKizaiHeadId: juchuKizaiHead.juchu_kizai_head_id,
      juchuKizaiHeadKbn: juchuKizaiHead.juchu_kizai_head_kbn,
      juchuHonbanbiQty: juchuKizaiHead.juchu_honbanbi_qty,
      zeiKbn: juchuKizaiHead.zei_kbn,
      nebikiAmt: juchuKizaiHead.nebiki_amt,
      mem: juchuKizaiHead.mem,
      headNam: juchuKizaiHead.head_nam,
      kicsShukoDat: juchuDate[0].kics_shuko_dat,
      kicsNyukoDat: juchuDate[0].kics_nyuko_dat,
      yardShukoDat: juchuDate[0].yard_shuko_dat,
      yardNyukoDat: juchuDate[0].yard_nyuko_dat,
    };
    return jucuKizaiHeadData;
  } catch (e) {
    console.log(e);
  }
};

export const GetEqList = async (juchuHeadId: number, juchuKizaiHeadId: number) => {
  try {
    const { data: eqList, error: eqListError } = await supabase
      .schema('dev2')
      .from('v_juchu_kizai_meisai')
      .select('*')
      .eq('juchu_head_id', juchuHeadId)
      .eq('juchu_kizai_head_id', juchuKizaiHeadId);
    if (eqListError) {
      console.error('GetEqHeader juchuDate error : ', eqListError);
      return [];
    }

    const juchuKizaiMeisaiData: JuchuKizaiMeisaiValues[] = eqList.map((d) => ({
      juchuHeadId: d.juchu_head_id,
      juchuKizaiHeadId: d.juchu_kizai_head_id,
      juchuKizaiMeisaiId: d.juchu_kizai_meisai_id,
      idoDenId: d.ido_den_id,
      idoDenDat: d.ido_den_dat,
      idoSijiId: d.ido_siji_id,
      shozokuId: d.shozoku_id,
      shozokuNam: d.shozoku_nam,
      mem: d.mem,
      kizaiId: d.kizai_id,
      kizaiNam: d.kizai_nam,
      kizaiQty: d.kizai_qty,
      planKizaiQty: d.plan_kizai_qty,
      planYobiQty: d.plan_yobi_qty,
      planQty: d.plan_qty,
    }));
    return juchuKizaiMeisaiData;
  } catch (e) {
    console.log(e);
  }
};

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
            v_zaiko_qty.kizai_id = 1 /*■変数箇所■*/
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
    console.log('result : ', result.rows);
    const data: StockTableValues[] = result.rows;
    console.log('data : ', data);
    return data;
  } catch (e) {
    console.error(e);
    return [];
  }
};
