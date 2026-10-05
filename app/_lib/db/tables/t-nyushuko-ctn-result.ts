'use server';

import { PoolClient } from 'pg';

import { SCHEMA } from '../schema';

export const deleteNyushukoCtnResult = async (
  juchuHeadId: number,
  juchuKizaiHeadId: number,
  juchuKizaiMeisaiId: number,
  sagyoKbnId: number,
  nyushukoDat: string,
  sagyoId: number,
  kizaiId: number,
  rfidTagIds: string[],
  connection: PoolClient
) => {
  const query = `
    DELETE FROM
      ${SCHEMA}.t_nyushuko_ctn_result
    WHERE
      juchu_head_id = $1
      AND juchu_kizai_head_id = $2
      AND juchu_kizai_meisai_id = $3
      AND sagyo_kbn_id = $4
      AND sagyo_den_dat = $5
      AND sagyo_id = $6
      AND kizai_id = $7
      AND rfid_tag_id = ANY($8)
    `;

  const values = [
    juchuHeadId,
    juchuKizaiHeadId,
    juchuKizaiMeisaiId,
    sagyoKbnId,
    nyushukoDat,
    sagyoId,
    kizaiId,
    rfidTagIds,
  ];

  try {
    await connection.query(query, values);
  } catch (e) {
    throw new Error('[deleteNyushukoCtnResult] DBエラー:', { cause: e });
  }
};

export const deleteKizaiIdNyushukoCtnResult = async (
  juchuHeadId: number,
  juchuKizaiHeadId: number,
  kizaiIds: number[],
  connection: PoolClient
) => {
  const query = `
      DELETE FROM
        ${SCHEMA}.t_nyushuko_ctn_result
      WHERE
        juchu_head_id = $1
        AND juchu_kizai_head_id = $2
        AND kizai_id = ANY($3)
    `;

  const values = [juchuHeadId, juchuKizaiHeadId, kizaiIds];

  try {
    await connection.query(query, values);
  } catch (e) {
    throw new Error('[deleteKizaiIdNyushukoCtnResult] DBエラー:', { cause: e });
  }
};

export const deleteAllNyushukoCtnResult = async (
  juchuHeadId: number,
  juchuKizaiHeadId: number,
  sagyoId: number,
  connection: PoolClient
) => {
  const query = `
      DELETE FROM
        ${SCHEMA}.t_nyushuko_ctn_result
      WHERE
        juchu_head_id = $1
        AND juchu_kizai_head_id = $2
        AND sagyo_id = $3
    `;

  const values = [juchuHeadId, juchuKizaiHeadId, sagyoId];

  try {
    await connection.query(query, values);
  } catch (e) {
    throw new Error('[deleteAllNyushukoCtnResult] DBエラー:', { cause: e });
  }
};

export const deleteAllShukoCtnResult = async (
  juchuHeadId: number,
  juchuKizaiHeadId: number,
  sagyoId: number,
  connection: PoolClient
) => {
  const query = `
      DELETE FROM
        ${SCHEMA}.t_nyushuko_ctn_result
      WHERE
        juchu_head_id = $1
        AND juchu_kizai_head_id = $2
        AND sagyo_id = $3
        AND sagyo_kbn_id = ANY($4)
    `;

  const values = [juchuHeadId, juchuKizaiHeadId, sagyoId, [10, 20]];

  try {
    await connection.query(query, values);
  } catch (e) {
    throw new Error('[deleteAllShukoCtnResult] DBエラー:', { cause: e });
  }
};

/**
 * 出庫（ピッキング・最終確認）のコンテナ実績の作業日時を更新（作業場所単位）
 * 出庫日時を変えたときに、実績を削除せず日時だけ変えるために使う
 * @param juchuHeadId 受注ヘッダーid
 * @param juchuKizaiHeadId 受注機材ヘッダーid
 * @param sagyoId 作業id（作業場所）
 * @param sagyoDenDat 新しい作業日時
 * @param connection
 */
export const updateShukoCtnResultDat = async (
  juchuHeadId: number,
  juchuKizaiHeadId: number,
  sagyoId: number,
  sagyoDenDat: string,
  connection: PoolClient
) => {
  const query = `
    UPDATE
      ${SCHEMA}.t_nyushuko_ctn_result
    SET
      sagyo_den_dat = $4
    WHERE
      juchu_head_id = $1
      AND juchu_kizai_head_id = $2
      AND sagyo_id = $3
      AND sagyo_kbn_id = ANY($5)
  `;

  const values = [juchuHeadId, juchuKizaiHeadId, sagyoId, sagyoDenDat, [10, 20]];

  try {
    await connection.query(query, values);
  } catch (e) {
    throw new Error('[updateShukoCtnResultDat] DBエラー:', { cause: e });
  }
};

/**
 * コンテナ1件の出庫（ピッキング・最終確認）実績を削除（作業場所単位）
 * @param juchuHeadId 受注ヘッダーid
 * @param juchuKizaiHeadId 受注機材ヘッダーid
 * @param kizaiId 機材id
 * @param sagyoId 作業id（作業場所）
 * @param connection
 */
export const deleteShukoCtnResult = async (
  juchuHeadId: number,
  juchuKizaiHeadId: number,
  kizaiId: number,
  sagyoId: number,
  connection: PoolClient
) => {
  const query = `
    DELETE FROM
      ${SCHEMA}.t_nyushuko_ctn_result
    WHERE
      juchu_head_id = $1
      AND juchu_kizai_head_id = $2
      AND kizai_id = $3
      AND sagyo_id = $4
      AND sagyo_kbn_id = ANY($5)
  `;

  const values = [juchuHeadId, juchuKizaiHeadId, kizaiId, sagyoId, [10, 20]];

  try {
    await connection.query(query, values);
  } catch (e) {
    throw new Error('[deleteShukoCtnResult] DBエラー:', { cause: e });
  }
};

/**
 * コンテナの入庫実績（sagyo_kbn_id = 30）を削除（コンテナ・入庫場所を指定）
 * deleteNyukoCtnDen と組で使う
 * @param juchuHeadId 受注ヘッダーid
 * @param juchuKizaiHeadId 受注機材ヘッダーid
 * @param targets 削除するコンテナ（受注機材明細id、機材id、作業id＝入庫場所）
 * @param connection
 */
export const deleteNyukoCtnResult = async (
  juchuHeadId: number,
  juchuKizaiHeadId: number,
  targets: { juchuKizaiMeisaiId: number; kizaiId: number; sagyoId: number }[],
  connection: PoolClient
) => {
  if (targets.length === 0) return;

  const query = `
    DELETE FROM
      ${SCHEMA}.t_nyushuko_ctn_result
    WHERE
      juchu_head_id = $1
      AND juchu_kizai_head_id = $2
      AND sagyo_kbn_id = 30
      AND (juchu_kizai_meisai_id, kizai_id, sagyo_id) IN (SELECT * FROM UNNEST($3::int[], $4::int[], $5::int[]))
  `;

  try {
    await connection.query(query, [
      juchuHeadId,
      juchuKizaiHeadId,
      targets.map((t) => t.juchuKizaiMeisaiId),
      targets.map((t) => t.kizaiId),
      targets.map((t) => t.sagyoId),
    ]);
  } catch (e) {
    throw new Error('[deleteNyukoCtnResult] DBエラー:', { cause: e });
  }
};

export const deleteAllNyukoCtnResult = async (
  juchuHeadId: number,
  juchuKizaiHeadId: number,
  sagyoId: number,
  connection: PoolClient
) => {
  const query = `
      DELETE FROM
        ${SCHEMA}.t_nyushuko_ctn_result
      WHERE
        juchu_head_id = $1
        AND juchu_kizai_head_id = $2
        AND sagyo_id = $3
        AND sagyo_kbn_id = $4
    `;

  const values = [juchuHeadId, juchuKizaiHeadId, sagyoId, 30];

  try {
    await connection.query(query, values);
  } catch (e) {
    throw new Error('[deleteAllNyukoCtnResult] DBエラー:', { cause: e });
  }
};

export const deleteNyushukoCtnResultFromOrder = async (
  juchuHeadId: number,
  juchuKizaiHeadId: number,
  connection: PoolClient
) => {
  const query = `
    DELETE FROM
      ${SCHEMA}.t_nyushuko_ctn_result
    WHERE
      juchu_head_id = $1
      AND juchu_kizai_head_id = $2
  `;

  const values = [juchuHeadId, juchuKizaiHeadId];

  try {
    await connection.query(query, values);
  } catch (e) {
    throw new Error('[deleteNyushukoCtnResultFromOrder] DBエラー:', { cause: e });
  }
};
