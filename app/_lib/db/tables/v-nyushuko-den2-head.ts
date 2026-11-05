'use server';

import { NYUSHUKO_SHUBETU_ID } from '@/app/_lib/constants';

import pool from '../postgres';
import { SCHEMA } from '../schema';

export const selectNyushukoOne = async (
  juchuHeadId: number,
  juchuKizaiHeadKbn: number,
  nyushukoBashoId: number,
  nyushukoDat: string,
  nyushukoShubetuId: number
) => {
  try {
    const queey = `
      SELECT
        koen_nam,
        juchu_kizai_head_idv,
        head_namv,
        koenbasho_nam,
        kokyaku_nam,
        juchu_dat,
        memv,
        nyuryoku_user
      FROM ${SCHEMA}.v_nyushuko_den2_head
      WHERE juchu_head_id = $1
        AND juchu_kizai_head_kbnv = $2
        AND nyushuko_basho_id = $3
        AND nyushuko_dat = $4
        AND nyushuko_shubetu_id = $5
        LIMIT 1
    `;
    const values = [juchuHeadId, juchuKizaiHeadKbn.toString(), nyushukoBashoId, nyushukoDat, nyushukoShubetuId];
    const result = await pool.query(queey, values);
    return result.rows;
  } catch (e) {
    throw new Error('[selectNyushukoOne] DBエラー:', { cause: e });
  }
};

/**
 * 事前（事前ピッキング・事前最終確認）の明細画面のヘッダー情報
 * 事前の行は機材ヘッダーごとに1行なので、機材ヘッダーidで絞る（juchu_kizai_head_idv がそのヘッダーidだけになる）
 * @param juchuHeadId 受注ヘッダーid
 * @param juchuKizaiHeadId 受注機材ヘッダーid
 * @param nyushukoBashoId 作業場所
 * @param nyushukoDat 準備日時
 */
export const selectJizenNyushukoOne = async (
  juchuHeadId: number,
  juchuKizaiHeadId: number,
  nyushukoBashoId: number,
  nyushukoDat: string
) => {
  const query = `
    SELECT
      koen_nam,
      juchu_kizai_head_idv,
      head_namv,
      koenbasho_nam,
      kokyaku_nam,
      juchu_dat,
      memv,
      nyuryoku_user,
      shuko_fix_flg
    FROM ${SCHEMA}.v_nyushuko_den2_head
    WHERE juchu_head_id = $1
      AND juchu_kizai_head_idv = $2
      AND nyushuko_basho_id = $3
      AND nyushuko_dat = $4
      AND nyushuko_shubetu_id = $5
    LIMIT 1
  `;
  try {
    const result = await pool.query(query, [
      juchuHeadId,
      juchuKizaiHeadId.toString(),
      nyushukoBashoId,
      nyushukoDat,
      NYUSHUKO_SHUBETU_ID.jizen,
    ]);
    return result.rows;
  } catch (e) {
    throw new Error('[selectJizenNyushukoOne] DBエラー:', { cause: e });
  }
};
