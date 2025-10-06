'use server';

import { BillingStsSearchValues } from '@/app/(main)/(bill)/billing-sts-list/_lib/types';

import pool from '../postgres';
import { SCHEMA, supabase } from '../supabase';

/**
 * 受注請求状況一覧を取得する関数
 * @param queries
 * @returns 検索条件に一致する受注請求状況の配列
 */
export const selectFilteredBillingSituations = async (queries: BillingStsSearchValues) => {
  const { kokyaku, kokyakuTantoNam, sts } = queries;

  const builder = supabase
    .schema(SCHEMA)
    .from('v_seikyu_date_lst')
    .select('*')
    .eq('kokyaku_id', kokyaku)
    .eq('shuko_fix_flg', 1);

  if (kokyakuTantoNam && kokyakuTantoNam !== '') {
    builder.eq('kokyaku_tanto_nam', kokyakuTantoNam);
  }
  if (sts.length === 1 && sts[0] === '1') {
    builder.neq('seikyu_jokyo_total_sts_id', 9).neq('seikyu_jokyo_sts_id', 9);
  } else if (sts.length === 1 && sts[0] === '2') {
    builder.eq('seikyu_jokyo_total_sts_id', 9).eq('seikyu_jokyo_sts_id', 9);
  }
  try {
    return await builder;
  } catch (e) {
    throw e;
  }
};

/**
 * 受注請求状況一覧を取得する関数
 * @param queries
 * @returns 検索条件に一致する受注請求状況の配列
 */
export const selectFilteredJuchusForBill = async (queries: { kokyakuId: number; date: string }) => {
  const { kokyakuId, date } = queries;

  const query = `
    SELECT
      v.juchu_head_id,
      v.juchu_kizai_head_id,
      v.kokyaku_tanto_nam,
      v.koen_nam,
      v.head_nam,
      v.shuko_dat,
      v.nyuko_dat,
      v.seikyu_dat,
      meisai.shokei_amt,
      (
        SELECT
          count(juchu_honbanbi_dat)
        FROM
          ${SCHEMA}.t_juchu_kizai_honbanbi as ch
        WHERE
          ch.juchu_head_id = v.juchu_head_id
        AND
          ch.juchu_kizai_head_id = v.juchu_kizai_head_id
        AND
          ch.juchu_honbanbi_shubetu_id = 40
        AND
          ch.juchu_honbanbi_dat >= COALESCE(v.seikyu_dat, v.shuko_dat)
        AND
          ch.juchu_honbanbi_dat <= LEAST(v.nyuko_dat, '${date}')
      ) as honbanbi_qty,
      (
        SELECT
          sum(juchu_honbanbi_add_qty)
        FROM
          ${SCHEMA}.t_juchu_kizai_honbanbi as sh
       WHERE
          sh.juchu_head_id = v.juchu_head_id
        AND
          sh.juchu_kizai_head_id = v.juchu_kizai_head_id
        AND
          sh.juchu_honbanbi_dat >= COALESCE(v.seikyu_dat, v.shuko_dat)
        AND
          sh.juchu_honbanbi_dat <= LEAST(v.nyuko_dat, '${date}')
      ) as add_dat_qty
    FROM
      ${SCHEMA}.v_seikyu_date_lst as v
    LEFT JOIN
      (
        SELECT
            juchu_head_id,
            juchu_kizai_head_id,
            sum((plan_kizai_qty + plan_yobi_qty) * kizai_tanka_amt) as shokei_amt
        FROM
            ${SCHEMA}.t_juchu_kizai_meisai
        GROUP BY
            juchu_head_id, juchu_kizai_head_id
      ) as meisai
      ON v.juchu_head_id = meisai.juchu_head_id AND v.juchu_kizai_head_id = meisai.juchu_kizai_head_id
    WHERE
      v.kokyaku_id = ${kokyakuId} AND
      v.shuko_fix_flg = 1 AND
      v.shuko_dat <= '${date}' AND
      v.seikyu_jokyo_sts_id <> 9
    ORDER BY
      v.juchu_head_id ASC, v.juchu_kizai_head_id ASC;
    `;
  // console.log(query);
  try {
    return await pool.query(query);
  } catch (e) {
    throw e;
  }
};
