import { toISOString, toISOStringYearMonthDay, toJapanDateString } from '@/app/(main)/_lib/date-conversion';
import { ShukoListSearchValues } from '@/app/(main)/shuko-list/_lib/types';

import pool from '../postgres';
import { SCHEMA, supabase } from '../supabase';

export const selectFilteredShukoList = async (queries: ShukoListSearchValues) => {
  let query = `
    SELECT
      d2.juchu_head_id,
      d2.koen_nam,
      d2.nyushuko_dat,
      d2.nyushuko_basho_id,
      d2.juchu_kizai_head_idv,
      d2.head_namv,
      d2.section_namv,
      d2.kokyaku_nam,
      d2.sstb_sagyo_sts_id,
      d2.schk_sagyo_sts_id
    FROM
      ${SCHEMA}.v_nyushuko_den2 as d2
    WHERE
      d2.nyushuko_shubetu_id = 1
  `;

  if (queries.juchuHeadId !== null) {
    query += ` AND d2.juchu_head_id = ${queries.juchuHeadId}`;
  }
  if (queries.shukoBasho !== 0) {
    query += ` AND d2.nyushuko_basho_id = ${queries.shukoBasho}`;
  }
  if (queries.shukoDat !== null) {
    query += ` AND d2.nyushuko_dat::text LIKE '%${toJapanDateString(queries.shukoDat, '-')}%'`;
  }

  query += ' ORDER BY d2.nyushuko_dat';

  try {
    return (await pool.query(query)).rows;
  } catch (e) {
    throw e;
  }
};

export const selectFilteredNyukoList = async (queries: ShukoListSearchValues) => {
  let query = `
    SELECT
      d2.juchu_head_id,
      d2.koen_nam,
      d2.nyushuko_dat,
      d2.nyushuko_basho_id,
      d2.juchu_kizai_head_idv,
      d2.head_namv,
      d2.section_namv,
      d2.kokyaku_nam,
      d2.nchk_sagyo_sts_id
    FROM
      ${SCHEMA}.v_nyushuko_den2 as d2
    WHERE
      d2.nyushuko_shubetu_id = 2
  `;

  if (queries.juchuHeadId !== null) {
    query += ` AND d2.juchu_head_id = ${queries.juchuHeadId}`;
  }
  if (queries.shukoBasho !== 0) {
    query += ` AND d2.nyushuko_basho_id = ${queries.shukoBasho}`;
  }
  if (queries.shukoDat !== null) {
    query += ` AND d2.nyushuko_dat::text LIKE '%${toJapanDateString(queries.shukoDat, '-')}%'`;
  }

  query += ' ORDER BY d2.nyushuko_dat';

  try {
    return (await pool.query(query)).rows;
  } catch (e) {
    throw e;
  }
};
