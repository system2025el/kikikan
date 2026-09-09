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

/**
 * コンテナ入出庫実績削除（伝票行が残っているものは残す）
 *
 * deleteNyushukoDenKeepResulted が予定数0で残した出庫伝票行の実績は、どのRFIDタグを
 * 確保していたかを出庫画面に出すために残す必要がある。伝票行が消えた実績だけを削除する。
 * 判定に伝票の現在の状態を使うため、必ず伝票の削除より後に呼ぶこと。
 *
 * @param juchuHeadId 受注ヘッダーid
 * @param juchuKizaiHeadId 受注機材ヘッダーid
 * @param kizaiIds 機材idの配列
 * @param connection
 */
export const deleteKizaiIdNyushukoCtnResultKeepDen = async (
  juchuHeadId: number,
  juchuKizaiHeadId: number,
  kizaiIds: number[],
  connection: PoolClient
) => {
  const query = `
      DELETE FROM
        ${SCHEMA}.t_nyushuko_ctn_result AS r
      WHERE
        r.juchu_head_id = $1
        AND r.juchu_kizai_head_id = $2
        AND r.kizai_id = ANY($3)
        AND NOT EXISTS (
          SELECT
            1
          FROM
            ${SCHEMA}.t_nyushuko_den AS d
          WHERE
            d.juchu_head_id = r.juchu_head_id
            AND d.juchu_kizai_head_id = r.juchu_kizai_head_id
            AND d.juchu_kizai_meisai_id = r.juchu_kizai_meisai_id
            AND d.kizai_id = r.kizai_id
            AND d.sagyo_kbn_id = r.sagyo_kbn_id
            AND d.sagyo_den_dat = r.sagyo_den_dat
            AND d.sagyo_id = r.sagyo_id
        )
    `;

  const values = [juchuHeadId, juchuKizaiHeadId, kizaiIds];

  try {
    await connection.query(query, values);
  } catch (e) {
    throw new Error('[deleteKizaiIdNyushukoCtnResultKeepDen] DBエラー:', { cause: e });
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
 * コンテナ出庫実績を場所・機材id単位で削除
 *
 * deleteAllShukoCtnResult は場所単位で全件消すため、予定数0で残した「受注削除」の
 * 伝票行だけが実績を失い、出庫画面から解消できなくなる。伝票を消す
 * deleteAllKicsOrYardShukoCtnDen と同じ機材idでスコープすることで対称にする。
 *
 * @param juchuHeadId 受注ヘッダーid
 * @param juchuKizaiHeadId 受注機材ヘッダーid
 * @param kizaiIds 機材idの配列
 * @param sagyoId 作業id（出庫場所）
 * @param connection
 */
export const deleteAllKicsOrYardShukoCtnResult = async (
  juchuHeadId: number,
  juchuKizaiHeadId: number,
  kizaiIds: number[],
  sagyoId: number,
  connection: PoolClient
) => {
  const query = `
      DELETE FROM
        ${SCHEMA}.t_nyushuko_ctn_result
      WHERE
        juchu_head_id = $1
        AND juchu_kizai_head_id = $2
        AND kizai_id = ANY($3)
        AND sagyo_id = $4
        AND sagyo_kbn_id = ANY($5)
    `;

  const values = [juchuHeadId, juchuKizaiHeadId, kizaiIds, sagyoId, [10, 20]];

  try {
    await connection.query(query, values);
  } catch (e) {
    throw new Error('[deleteAllKicsOrYardShukoCtnResult] DBエラー:', { cause: e });
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
