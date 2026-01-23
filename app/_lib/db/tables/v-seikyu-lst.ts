'use server';

import { toJapanYMDString } from '@/app/(main)/_lib/date-conversion';
import { escapeLikeString } from '@/app/(main)/_lib/escape-string';
import { BillSearchValues } from '@/app/(main)/(bill)/bill-list/_lib/types';
import { FAKE_NEW_ID } from '@/app/(main)/(masters)/_lib/constants';

import pool from '../postgres';
import { SCHEMA, supabase } from '../supabase';

export const selectFilteredBills = async (queries: BillSearchValues) => {
  const { billId, billingSts, range, kokyaku, seikyuHeadNam } = queries;

  // 基本の検索
  let query = `
    SELECT
      seikyu_head_id,
      sts_nam,
      seikyu_head_nam,
      kokyaku_nam,
      seikyu_dat
    FROM ${SCHEMA}.v_seikyu_lst
    WHERE seikyu_head_id IS NOT NULL`;
  // 請求番号
  if (billId) {
    query += ` AND seikyu_head_id = ${billId}`;
  }
  // 請求ステータス
  if (billingSts !== null && billingSts !== FAKE_NEW_ID) {
    query += ` AND seikyu_sts = ${billingSts}`;
  }
  // 発行日
  if (range) {
    if (range.str) {
      query += ` AND seikyu_dat >= '${toJapanYMDString(range.str)}'`;
    }
    if (range.end) {
      query += ` AND seikyu_dat <= '${toJapanYMDString(range.end)}'`;
    }
  }
  // 請求相手名
  if (kokyaku && kokyaku.trim() !== '' /*&& kokyaku !== '未選択'*/) {
    const escapedKokyaku = escapeLikeString(kokyaku);
    query += ` AND kokyaku_nam ILIKE '%${escapedKokyaku}%'`;
  }
  // 請求書名
  if (seikyuHeadNam && seikyuHeadNam.trim() !== '') {
    const escapedSeikyuHeadNam = escapeLikeString(seikyuHeadNam);
    query += ` AND seikyu_head_nam ILIKE '%${escapedSeikyuHeadNam}%'`;
  }

  // group by
  query += `
    GROUP BY
      seikyu_head_id,
      sts_nam,
      seikyu_head_nam,
      kokyaku_nam,
      seikyu_dat
    ORDER BY
      seikyu_head_id DESC, seikyu_dat DESC;
  `;

  try {
    return await pool.query(query);
  } catch (e) {
    throw e;
  }
};
