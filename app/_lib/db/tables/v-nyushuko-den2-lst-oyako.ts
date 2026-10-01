'use server';

import { PoolClient } from 'pg';

import { JUCHU_KIZAI_HEAD_KBN, SAGYO_KBN_ID } from '@/app/_lib/constants';

import pool from '../postgres';
import { SCHEMA } from '../schema';

/**
 * 到着済みの返却で、到着時に親の入庫伝票から引いた読取数（nyuko_fix_qty）を伝票の行ごとに取得
 * 到着解除で nyuko_fix_qty は NULL に戻るので、NULL でない行＝到着で親から引いた行。
 * 到着後に作られた行（HT・ゲートの再送信）は NULL なので含まれない。
 * planQty には nyuko_fix_qty を入れる（呼び出し側は同じ機材・dsp の行を合計して親から引く）
 * @param juchuHeadId 受注ヘッダーid
 * @param juchuKizaiHeadId 親の受注機材ヘッダーid
 * @param connection
 * @returns
 */
export const selectFinishedReturn = async (juchuHeadId: number, juchuKizaiHeadId: number, connection: PoolClient) => {
  const query = `
    SELECT
      d.kizai_id AS "kizaiId",
      d.nyuko_fix_qty AS "planQty",
      d.dsp_ord_num AS "dspOrdNumMeisai",
      d.sagyo_id AS "nyushukoBashoId"
    FROM
      ${SCHEMA}.t_nyushuko_den AS d
    INNER JOIN
      ${SCHEMA}.t_juchu_kizai_head AS h
    ON
      d.juchu_head_id = h.juchu_head_id
      AND d.juchu_kizai_head_id = h.juchu_kizai_head_id
    WHERE
      d.juchu_head_id = $1
      AND h.oya_juchu_kizai_head_id = $2
      AND h.juchu_kizai_head_kbn = $3
      AND d.sagyo_kbn_id = $4
      AND d.nyuko_fix_qty IS NOT NULL
      AND d.dsp_ord_num IS NOT NULL
      AND d.kizai_id <> $5
  `;

  const values = [juchuHeadId, juchuKizaiHeadId, JUCHU_KIZAI_HEAD_KBN.return, SAGYO_KBN_ID.nyukoCount, 0];

  try {
    return (await connection.query(query, values)).rows;
  } catch (e) {
    throw new Error('[selectFinishedReturn] DBエラー:', { cause: e });
  }
};
