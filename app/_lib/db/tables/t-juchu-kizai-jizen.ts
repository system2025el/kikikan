'use server';

import { PoolClient } from 'pg';

import pool from '../postgres';
import { SCHEMA } from '../schema';
import { JuchuKizaiJizen } from '../types/t-juchu-kizai-jizen-type';

/**
 * 事前準備（明細ごとの準備日時・準備数）取得
 * @param juchuHeadId 受注ヘッダーid
 * @param juchuKizaiHeadId 受注機材ヘッダーid
 * @returns 事前準備の行
 */
export const selectJuchuKizaiJizen = async (juchuHeadId: number, juchuKizaiHeadId: number) => {
  const query = `
    SELECT
      juchu_head_id
      ,juchu_kizai_head_id
      ,juchu_kizai_meisai_id
      ,kizai_id
      ,jizen_dat
      ,jizen_qty
    FROM
      ${SCHEMA}.t_juchu_kizai_jizen
    WHERE
      juchu_head_id = $1
      AND juchu_kizai_head_id = $2
  `;

  try {
    const { rows } = await pool.query<{
      juchu_head_id: number;
      juchu_kizai_head_id: number;
      juchu_kizai_meisai_id: number;
      kizai_id: number;
      jizen_dat: Date;
      jizen_qty: number;
    }>(query, [juchuHeadId, juchuKizaiHeadId]);
    return rows;
  } catch (e) {
    throw new Error('[selectJuchuKizaiJizen] DBエラー:', { cause: e });
  }
};

/**
 * 事前準備の追加・更新（明細のキー4列で1行）
 * @param data 事前準備データ（add_* は追加時、upd_* は更新時に使う）
 * @param connection
 */
export const upsertJuchuKizaiJizen = async (data: JuchuKizaiJizen, connection: PoolClient) => {
  const query = `
    INSERT INTO ${SCHEMA}.t_juchu_kizai_jizen (
      juchu_head_id
      ,juchu_kizai_head_id
      ,juchu_kizai_meisai_id
      ,kizai_id
      ,jizen_dat
      ,jizen_qty
      ,add_dat
      ,add_user
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    ON CONFLICT (juchu_head_id, juchu_kizai_head_id, juchu_kizai_meisai_id, kizai_id)
    DO UPDATE SET
      jizen_dat = EXCLUDED.jizen_dat
      ,jizen_qty = EXCLUDED.jizen_qty
      ,upd_dat = $9
      ,upd_user = $10
    WHERE
      t_juchu_kizai_jizen.jizen_dat IS DISTINCT FROM EXCLUDED.jizen_dat
      OR t_juchu_kizai_jizen.jizen_qty IS DISTINCT FROM EXCLUDED.jizen_qty
  `;

  const values = [
    data.juchu_head_id,
    data.juchu_kizai_head_id,
    data.juchu_kizai_meisai_id,
    data.kizai_id,
    data.jizen_dat,
    data.jizen_qty,
    data.add_dat ?? null,
    data.add_user ?? null,
    data.upd_dat ?? null,
    data.upd_user ?? null,
  ];

  try {
    await connection.query(query, values);
  } catch (e) {
    throw new Error('[upsertJuchuKizaiJizen] DBエラー:', { cause: e });
  }
};

/**
 * 事前準備削除（明細1件分）
 * @param data 明細のキー
 * @param connection
 */
export const deleteJuchuKizaiJizen = async (
  data: { juchu_head_id: number; juchu_kizai_head_id: number; juchu_kizai_meisai_id: number; kizai_id: number },
  connection: PoolClient
) => {
  const query = `
    DELETE FROM
      ${SCHEMA}.t_juchu_kizai_jizen
    WHERE
      juchu_head_id = $1
      AND juchu_kizai_head_id = $2
      AND juchu_kizai_meisai_id = $3
      AND kizai_id = $4
  `;

  try {
    await connection.query(query, [
      data.juchu_head_id,
      data.juchu_kizai_head_id,
      data.juchu_kizai_meisai_id,
      data.kizai_id,
    ]);
  } catch (e) {
    throw new Error('[deleteJuchuKizaiJizen] DBエラー:', { cause: e });
  }
};

/**
 * 事前準備削除（受注機材ヘッダー単位）
 * @param juchuHeadId 受注ヘッダーid
 * @param juchuKizaiHeadId 受注機材ヘッダーid
 * @param connection
 */
export const deleteJuchuKizaiJizenFromOrder = async (
  juchuHeadId: number,
  juchuKizaiHeadId: number,
  connection: PoolClient
) => {
  const query = `
    DELETE FROM
      ${SCHEMA}.t_juchu_kizai_jizen
    WHERE
      juchu_head_id = $1
      AND juchu_kizai_head_id = $2
  `;

  try {
    await connection.query(query, [juchuHeadId, juchuKizaiHeadId]);
  } catch (e) {
    throw new Error('[deleteJuchuKizaiJizenFromOrder] DBエラー:', { cause: e });
  }
};
