'use server';

import { toJapanDateString } from '@/app/(main)/_lib/date-conversion';
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

  if (kokyakuTantoNam && kokyakuTantoNam.trim() !== '') {
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
export const selectFilteredJuchusForBill = async (queries: {
  kokyakuId: number;
  date: string;
  tantouNam: string | null;
}) => {
  const { kokyakuId, date, tantouNam } = queries;
  console.log(queries);
  let query = `
    SELECT
      v.juchu_head_id,
      v.juchu_kizai_head_id,
      v.kokyaku_tanto_nam,
      v.koen_nam,
      v.koenbasho_nam,
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
          ch.juchu_honbanbi_dat <= LEAST(v.nyuko_dat, $2)
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
          sh.juchu_honbanbi_shubetu_id = 40
        AND
          sh.juchu_honbanbi_dat >= COALESCE(v.seikyu_dat, v.shuko_dat)
        AND
          sh.juchu_honbanbi_dat <= LEAST(v.nyuko_dat, $2)
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
      v.kokyaku_id = $1 AND
      v.shuko_fix_flg = 1 AND
      v.shuko_dat <= $2 AND
      (v.seikyu_dat <= $2 OR v.seikyu_dat IS NULL) AND
      v.seikyu_jokyo_sts_id <> 9
  `;

  // 実行時に渡す値の配列
  const values = [kokyakuId, date];

  // tantouNamがあれば、WHERE句とvaluesに条件を追加
  if (tantouNam && tantouNam.trim() !== '') {
    // プレースホルダの番号はvaluesの要素数+1で動的に決定
    query += ` AND v.kokyaku_tanto_nam = $${values.length + 1}`;
    values.push(tantouNam);
  }

  query += `
     ORDER BY
      v.juchu_head_id ASC, v.juchu_kizai_head_id ASC;
  `;

  try {
    return await pool.query(query, values);
  } catch (e) {
    throw e;
  }
};

/**
 * 受注請求状況明細一覧を詳細に取得する関数
 * @param queries
 * @returns 検索条件に一致する受注請求状況の明細の配列
 */
export const selectFilteredJuchuDetailsForBill = async (queries: {
  kokyakuId: number;
  date: string;
  tantouNam: string | null;
}) => {
  const { kokyakuId, date, tantouNam } = queries;
  console.log(queries);
  let query = `
      SELECT
        v.juchu_head_id,
        v.juchu_kizai_head_id,
        v.kokyaku_tanto_nam,
        v.koen_nam,
        v.koenbasho_nam,
        v.head_nam,
        v.shuko_dat,
        v.nyuko_dat,
        v.seikyu_dat,
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
            ch.juchu_honbanbi_dat <= LEAST(v.nyuko_dat, $2)
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
            sh.juchu_honbanbi_shubetu_id = 40
          AND
            sh.juchu_honbanbi_dat >= COALESCE(v.seikyu_dat, v.shuko_dat)
          AND
            sh.juchu_honbanbi_dat <= LEAST(v.nyuko_dat, $2)
        ) as add_dat_qty,
        kizai.kizai_nam,
        meisai.kizai_tanka_amt,
        (meisai.plan_kizai_qty + meisai.plan_yobi_qty) as plan_qty
      FROM
        ${SCHEMA}.v_seikyu_date_lst as v
      LEFT JOIN
        ${SCHEMA}.t_juchu_kizai_meisai as meisai
      ON v.juchu_head_id = meisai.juchu_head_id AND v.juchu_kizai_head_id = meisai.juchu_kizai_head_id
      LEFT JOIN
        ${SCHEMA}.m_kizai as kizai
      ON kizai.kizai_id = meisai.kizai_id
      WHERE
        v.kokyaku_id = $1 AND
        v.shuko_fix_flg = 1 AND
        v.shuko_dat <= $2 AND
        (v.seikyu_dat <= $2 OR v.seikyu_dat IS NULL) AND
        v.seikyu_jokyo_sts_id <> 9
    `;

  // 実行時に渡す値の配列
  const values = [kokyakuId, date];

  // tantouNamがあれば、WHERE句とvaluesに条件を追加
  if (tantouNam && tantouNam.trim() !== '') {
    // プレースホルダの番号はvaluesの要素数+1で動的に決定
    query += ` AND v.kokyaku_tanto_nam = $${values.length + 1}`;
    values.push(tantouNam);
  }

  query += `
       ORDER BY
        v.juchu_head_id ASC, v.juchu_kizai_head_id ASC;
    `;

  try {
    return await pool.query(query, values);
  } catch (e) {
    throw e;
  }
};

/**
 * 条件に合う明細ヘッダ名の配列を取得する関数
 * @param queries 検索条件 顧客情報、受注ヘッダID、年月日
 * @returns 機材ヘッダのID類お名前の配列
 */
export const selectJuchuKizaiHeadNamListFormBill = async (queries: {
  kokyaku: { id: number; nam: string };
  tantou: string | null;
  juchuId: number | null;
  dat: Date;
}) => {
  const builder = supabase
    .schema(SCHEMA)
    .from('v_seikyu_date_lst')
    .select('juchu_head_id, juchu_kizai_head_id, head_nam')
    .eq('juchu_head_id', queries.juchuId)
    .eq('kokyaku_id', queries.kokyaku.id)
    .eq('shuko_fix_flg', 1)
    .lte('shuko_dat', toJapanDateString(queries.dat, '-'))
    .or(`seikyu_dat.lte.${toJapanDateString(queries.dat, '-')},seikyu_dat.is.null`)
    .neq('seikyu_jokyo_sts_id', 9)
    .order('juchu_kizai_head_id');

  if (queries.tantou && queries.tantou.trim() !== '') {
    builder.eq('kokyaku_tanto_nam', queries.tantou);
  }
  try {
    return await builder;
  } catch (e) {
    throw e;
  }
};

/**
 * 条件に合う受注機材明細の情報を合算して取得する関数
 * @param juchuId 受注ヘッダID
 * @param kizaiHeadId 受注機材ヘッダID
 * @param date 年月日
 * @returns 機材明細を一式に合算した情報の配列
 */
export const selectJuchuKizaiMeisaiHeadForBill = async (juchuId: number, kizaiHeadId: number, date: Date) => {
  const query = `
    SELECT
      v.juchu_head_id,
      v.juchu_kizai_head_id,
      v.kokyaku_tanto_nam,
      v.koen_nam,
      v.koenbasho_nam,
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
          ch.juchu_honbanbi_dat <= LEAST(v.nyuko_dat, $3) -- プレースホルダ
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
          sh.juchu_honbanbi_shubetu_id = 40 
        AND
          sh.juchu_honbanbi_dat >= COALESCE(v.seikyu_dat, v.shuko_dat)
        AND
          sh.juchu_honbanbi_dat <= LEAST(v.nyuko_dat, $3) 
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
      v.juchu_head_id = $1
    AND
      v.juchu_kizai_head_id = $2; 
  `;

  // 実行時に渡す値の配列
  const values = [juchuId, kizaiHeadId, toJapanDateString(date, '-')];

  try {
    return await pool.query(query, values);
  } catch (e) {
    throw e;
  }
};

/**
 * 条件に合う受注機材明細の情報を取得する関数
 * @param juchuId 受注ヘッダID
 * @param kizaiHeadId 受注機材ヘッダID
 * @param date 年月日
 * @returns 機材明細の詳細情報の配列
 */
export const selectJuchuKizaiMeisaiDetailsForBill = async (juchuId: number, kizaiHeadId: number, date: Date) => {
  const query = `
    SELECT
      v.juchu_head_id,
      v.juchu_kizai_head_id,
      v.kokyaku_tanto_nam,
      v.koen_nam,
      v.koenbasho_nam,
      v.head_nam,
      v.shuko_dat,
      v.nyuko_dat,
      v.seikyu_dat,
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
          ch.juchu_honbanbi_dat <= LEAST(v.nyuko_dat, $3)
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
          sh.juchu_honbanbi_shubetu_id = 40
        AND
          sh.juchu_honbanbi_dat >= COALESCE(v.seikyu_dat, v.shuko_dat)
        AND
          sh.juchu_honbanbi_dat <= LEAST(v.nyuko_dat, $3)
      ) as add_dat_qty,
      kizai.kizai_nam,
      meisai.kizai_tanka_amt,
      (meisai.plan_kizai_qty + meisai.plan_yobi_qty) as plan_qty
    FROM
      ${SCHEMA}.v_seikyu_date_lst as v
    LEFT JOIN
      ${SCHEMA}.t_juchu_kizai_meisai as meisai
    ON v.juchu_head_id = meisai.juchu_head_id AND v.juchu_kizai_head_id = meisai.juchu_kizai_head_id
    LEFT JOIN
      ${SCHEMA}.m_kizai as kizai
    ON kizai.kizai_id = meisai.kizai_id
    WHERE
      v.juchu_head_id = $1
    AND
      v.juchu_kizai_head_id = $2; 
  `;

  // 実行時に渡す値の配列
  const values = [juchuId, kizaiHeadId, toJapanDateString(date, '-')];

  try {
    return await pool.query(query, values);
  } catch (e) {
    throw e;
  }
};
