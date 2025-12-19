import dayjs from 'dayjs';
import timezone from 'dayjs/plugin/timezone';
import utc from 'dayjs/plugin/utc';

import { toJapanYMDString } from '@/app/(main)/_lib/date-conversion';
import { NyukoListSearchValues } from '@/app/(main)/nyuko-list/_lib/types';
import { ShukoListSearchValues } from '@/app/(main)/shuko-list/_lib/types';

import pool from '../postgres';
import { SCHEMA, supabase } from '../supabase';

// .tz()を使う準備
dayjs.extend(utc);
dayjs.extend(timezone);

export const selectFilteredShukoList = async (queries: ShukoListSearchValues) => {
  let query = `
    SELECT
      d2.juchu_head_id,
      d2.koen_nam,
      d2.koenbasho_nam,
      d2.nyushuko_dat,
      d2.nyushuko_basho_id,
      d2.juchu_kizai_head_idv,
      d2.juchu_kizai_head_kbnv,
      d2.head_namv,
      d2.section_namv,
      d2.kokyaku_nam,
      d2.sstb_sagyo_sts_id,
      d2.sstb_sagyo_sts_nam_short,
      d2.schk_sagyo_sts_id,
      d2.schk_sagyo_sts_nam_short,
      d2.shuko_fix_flg
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

  // '指定期間'
  if (queries.shukoDat.from && queries.shukoDat.to) {
    // 指定日がどちらも入ってる場合
    const startOfDay = dayjs(queries.shukoDat.from).tz('Asia/Tokyo').startOf('day').toISOString();
    const startOfnextDay = dayjs(queries.shukoDat.to).tz('Asia/Tokyo').add(1, 'day').startOf('day').toISOString();
    query += ` AND d2.nyushuko_dat >= '${startOfDay}' AND d2.nyushuko_dat < '${startOfnextDay}'`;
  } else if (queries.shukoDat.from) {
    // fromだけの場合
    const startOfDay = dayjs(queries.shukoDat.from).tz('Asia/Tokyo').startOf('day').toISOString();
    console.log('start of the day: ', startOfDay);
    query += ` AND d2.nyushuko_dat >= '${startOfDay}'`;
  } else if (queries.shukoDat.to) {
    // toだけの場合
    const startOfnextDay = dayjs(queries.shukoDat.to).tz('Asia/Tokyo').add(1, 'day').startOf('day').toISOString();
    console.log('start of the next day: ', startOfnextDay);
    query += ` AND d2.nyushuko_dat < '${startOfnextDay}'`;
  }

  if (queries.section && queries.section.length !== 0) {
    const likeClouds = queries.section.map((d) => ` d2.section_namv::TEXT LIKE '%${d}%'`).join(' OR');
    query += ` AND (${likeClouds})`;
  }

  query += ' ORDER BY d2.nyushuko_dat';

  try {
    return (await pool.query(query)).rows;
  } catch (e) {
    throw e;
  }
};

export const selectFilteredNyukoList = async (queries: NyukoListSearchValues) => {
  let query = `
    SELECT
      d2.juchu_head_id,
      d2.koen_nam,
      d2.koenbasho_nam,
      d2.nyushuko_dat,
      d2.nyushuko_basho_id,
      d2.juchu_kizai_head_idv,
      d2.juchu_kizai_head_kbnv,
      d2.head_namv,
      d2.section_namv,
      d2.kokyaku_nam,
      d2.nchk_sagyo_sts_id,
      d2.nchk_sagyo_sts_nam_short,
      d2.nyuko_fix_flg
    FROM
      ${SCHEMA}.v_nyushuko_den2 as d2
    WHERE
      d2.nyushuko_shubetu_id = 2
  `;

  if (queries.juchuHeadId !== null) {
    query += ` AND d2.juchu_head_id = ${queries.juchuHeadId}`;
  }
  if (queries.nyukoBasho !== 0) {
    query += ` AND d2.nyushuko_basho_id = ${queries.nyukoBasho}`;
  }

  // '指定期間'
  if (queries.nyukoDat.from && queries.nyukoDat.to) {
    // 指定日がどちらも入ってる場合
    const startOfDay = dayjs(queries.nyukoDat.from).tz('Asia/Tokyo').startOf('day').toISOString();
    const startOfnextDay = dayjs(queries.nyukoDat.to).tz('Asia/Tokyo').add(1, 'day').startOf('day').toISOString();
    query += ` AND d2.nyushuko_dat >= '${startOfDay}' AND d2.nyushuko_dat < '${startOfnextDay}'`;
  } else if (queries.nyukoDat.from) {
    // fromだけの場合
    const startOfDay = dayjs(queries.nyukoDat.from).tz('Asia/Tokyo').startOf('day').toISOString();
    console.log('start of the day: ', startOfDay);
    query += ` AND d2.nyushuko_dat >= '${startOfDay}'`;
  } else if (queries.nyukoDat.to) {
    // toだけの場合
    const startOfnextDay = dayjs(queries.nyukoDat.to).tz('Asia/Tokyo').add(1, 'day').startOf('day').toISOString();
    console.log('start of the next day: ', startOfnextDay);
    query += ` AND d2.nyushuko_dat < '${startOfnextDay}'`;
  }
  if (queries.section && queries.section.length !== 0) {
    const likeClouds = queries.section.map((d) => ` d2.section_namv::TEXT LIKE '%${d}%'`).join(' OR');
    query += ` AND (${likeClouds})`;
  }

  query += ' ORDER BY d2.nyushuko_dat';

  try {
    return (await pool.query(query)).rows;
  } catch (e) {
    throw e;
  }
};

export const selectNyukoOne = async (
  juchuHeadId: number,
  juchuKizaiHeadKbn: number,
  nyushukoBashoId: number,
  nyushukoDat: string,
  nyushukoShubetuId: number
) => {
  try {
    return await supabase
      .schema(SCHEMA)
      .from('v_nyushuko_den2')
      .select('koen_nam, juchu_kizai_head_idv, head_namv, koenbasho_nam, kokyaku_nam')
      .eq('juchu_head_id', juchuHeadId)
      .eq('juchu_kizai_head_kbnv', juchuKizaiHeadKbn.toString())
      .eq('nyushuko_basho_id', nyushukoBashoId)
      .eq('nyushuko_dat', nyushukoDat)
      .eq('nyushuko_shubetu_id', nyushukoShubetuId)
      .single();
  } catch (e) {
    throw e;
  }
};
