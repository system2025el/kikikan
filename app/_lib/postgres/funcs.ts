'use server';

import { QueryResult } from 'pg';

import { EqptsMasterTableValues } from '@/app/(main)/(masters)/eqpt-master/_lib/types';
import { VehsMasterTableValues } from '@/app/(main)/(masters)/vehicles-master/_lib/types';

import pool from './postgres';

export const shigasan = async () => {
  try {
    console.log('DB Connected');
    await pool.query(` SET search_path TO dev2;`);
    const result: QueryResult<EqptsMasterTableValues> = await pool.query(`
    select
       v_kizai_lst.kizai_nam           as "kizaiNam",
       v_kizai_lst.shozoku_nam         as "shozokuNam",
       v_kizai_lst.kizai_qty           as "kizaiQty",
       v_kizai_lst.bumon_nam           as "bumonNam",
       v_kizai_lst.dai_bumon_nam       as "daibumonNam",
       v_kizai_lst.shukei_bumon_nam    as "shukeibumonNam",
       v_kizai_lst.reg_amt             as "regAmt",
       v_kizai_lst.rank_amt_1          as "rankAmt1",
       v_kizai_lst.rank_amt_2          as "rankAmt2",
       v_kizai_lst.rank_amt_3          as "rankAmt3",
       v_kizai_lst.rank_amt_4          as "rankAmt4",
       v_kizai_lst.rank_amt_5          as "rankAmt5",
       v_kizai_lst.mem                 as "mem",
       v_kizai_lst.kizai_id            as "kizaiId",
       v_kizai_lst.del_flg             as "delFlg"
  from
      v_kizai_lst
  where
      --大文字・小文字無視はilikeを使う
      --機材マスタ
      --    機材名キーワード
      v_kizai_lst.kizai_nam ilike '%SH%'
      and
      --    部門
      v_kizai_lst.bumon_nam ilike '%ムー%'
      and
      --    大部門
      v_kizai_lst.dai_bumon_nam ilike '%照%'
      and
      --    集計部門
      v_kizai_lst.shukei_bumon_nam ilike '%照%'
  `);
    console.log('res : ', result.rows);
    const data: EqptsMasterTableValues[] = result.rows;
    console.log('data : ', data);
    return data;
  } catch (e) {
    console.error(e);
    return [];
  }
};

export const shiori = async () => {
  try {
    console.log('DB Connected');
    await pool.query(` SET search_path TO dev2;`);
    const res: QueryResult<VehsMasterTableValues> = await pool.query(`
        select
            sharyo_id as "sharyoId",
            sharyo_nam as "sharyoNam",
            del_flg as "delFlg",
            dsp_flg as "dspFlg",
            mem
        from m_sharyo`);
    console.log('res : ', res.rows);
    const data = res.rows;
    console.log('data : ', data);
    return data;
  } catch (e) {
    console.error('DB Connection Failure', e);
    return [];
  }
};
