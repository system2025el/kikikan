'use server';

import { PoolClient } from 'pg';

import { SCHEMA } from '../schema';

/**
 * 出庫実績（ピッキング・最終確認）の作業日時を更新（明細・機材・作業場所単位）
 * 作業場所と機材も条件にする（同じ明細idで別の場所に受注削除の行が残っていることがあり、その実績まで移さないため）
 * @param juchuHeadId 受注ヘッダーid
 * @param juchuKizaiHeadId 受注機材ヘッダーid
 * @param juchuKizaiMeisaiId 受注機材明細id
 * @param kizaiId 機材id
 * @param sagyoId 作業id（作業場所）
 * @param shukoDat 新しい作業日時
 * @param connection
 */
export const updateShukoResult = async (
  juchuHeadId: number,
  juchuKizaiHeadId: number,
  juchuKizaiMeisaiId: number,
  kizaiId: number,
  sagyoId: number,
  shukoDat: string,
  connection: PoolClient
) => {
  const query = `
      UPDATE
        ${SCHEMA}.t_nyushuko_result
      SET
        sagyo_den_dat = $1
      WHERE
        juchu_head_id = $2
        AND juchu_kizai_head_id = $3
        AND juchu_kizai_meisai_id = $4
        AND sagyo_kbn_id = ANY($5)
        AND kizai_id = $6
        AND sagyo_id = $7
    `;

  const values = [shukoDat, juchuHeadId, juchuKizaiHeadId, juchuKizaiMeisaiId, [10, 20], kizaiId, sagyoId];

  try {
    await connection.query(query, values);
  } catch (e) {
    throw new Error('[updateShukoResult] DBエラー:', { cause: e });
  }
};

/**
 * 出庫場所が変わった機材の、元の場所の出庫実績（ピッキング・最終確認）を新しい明細idに付け替える
 * moveShukoDenToDeletedMeisai で付け替えた伝票（同じ作業区分・作業日時・作業場所・機材で、新しい明細idのもの）が
 * ある実績だけが対象。付け替えなかった実績は呼び出し元で今までどおり削除する。必ず伝票の付け替えの後に呼ぶこと
 * @param juchuHeadId 受注ヘッダーid
 * @param juchuKizaiHeadId 受注機材ヘッダーid
 * @param oldMeisaiId 変更前の明細id
 * @param kizaiId 機材id
 * @param oldSagyoId 変更前の出庫場所
 * @param newMeisaiId 付け替え先の明細id
 * @param connection
 */
export const moveShukoResultToDeletedMeisai = async (
  juchuHeadId: number,
  juchuKizaiHeadId: number,
  oldMeisaiId: number,
  kizaiId: number,
  oldSagyoId: number,
  newMeisaiId: number,
  connection: PoolClient
) => {
  const query = `
    UPDATE
      ${SCHEMA}.t_nyushuko_result AS r
    SET
      juchu_kizai_meisai_id = $6
    WHERE
      r.juchu_head_id = $1
      AND r.juchu_kizai_head_id = $2
      AND r.juchu_kizai_meisai_id = $3
      AND r.kizai_id = $4
      AND r.sagyo_id = $5
      AND r.sagyo_kbn_id = ANY($7)
      AND EXISTS (
        SELECT
          1
        FROM
          ${SCHEMA}.t_nyushuko_den AS d
        WHERE
          d.juchu_head_id = r.juchu_head_id
          AND d.juchu_kizai_head_id = r.juchu_kizai_head_id
          AND d.juchu_kizai_meisai_id = $6
          AND d.kizai_id = r.kizai_id
          AND d.sagyo_kbn_id = r.sagyo_kbn_id
          AND d.sagyo_den_dat = r.sagyo_den_dat
          AND d.sagyo_id = r.sagyo_id
      )
  `;

  const values = [juchuHeadId, juchuKizaiHeadId, oldMeisaiId, kizaiId, oldSagyoId, newMeisaiId, [10, 20]];

  try {
    await connection.query(query, values);
  } catch (e) {
    throw new Error('[moveShukoResultToDeletedMeisai] DBエラー:', { cause: e });
  }
};

/**
 * 受注削除で残した機材の出庫実績（ピッキング・最終確認）の作業日時を更新（作業場所単位）
 * updateDeletedShukoDenDat と組で使い、伝票と同じ新しい日時に移す
 * （その作業場所の受注明細が無い実績が対象。明細はあっても出庫場所が違う＝送信とのすれ違いで残ったものも含む）
 * @param juchuHeadId 受注ヘッダーid
 * @param juchuKizaiHeadId 受注機材ヘッダーid
 * @param sagyoId 作業id（作業場所）
 * @param sagyoDenDat 新しい作業日時
 * @param connection
 */
export const updateDeletedShukoResultDat = async (
  juchuHeadId: number,
  juchuKizaiHeadId: number,
  sagyoId: number,
  sagyoDenDat: string,
  connection: PoolClient
) => {
  const query = `
    UPDATE
      ${SCHEMA}.t_nyushuko_result AS r
    SET
      sagyo_den_dat = $4
    WHERE
      r.juchu_head_id = $1
      AND r.juchu_kizai_head_id = $2
      AND r.sagyo_id = $3
      AND r.sagyo_kbn_id = ANY($5)
      AND NOT EXISTS (
        SELECT
          1
        FROM
          ${SCHEMA}.t_juchu_kizai_meisai AS m
        WHERE
          m.juchu_head_id = r.juchu_head_id
          AND m.juchu_kizai_head_id = r.juchu_kizai_head_id
          AND m.juchu_kizai_meisai_id = r.juchu_kizai_meisai_id
          AND m.kizai_id = r.kizai_id
          AND m.shozoku_id = r.sagyo_id
      )
  `;

  const values = [juchuHeadId, juchuKizaiHeadId, sagyoId, sagyoDenDat, [10, 20]];

  try {
    await connection.query(query, values);
  } catch (e) {
    throw new Error('[updateDeletedShukoResultDat] DBエラー:', { cause: e });
  }
};

export const deleteNyushukoResult = async (
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
        ${SCHEMA}.t_nyushuko_result
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
    throw new Error('[deleteNyushukoResult] DBエラー:', { cause: e });
  }
};

export const deleteKizaiIdNyushukoResult = async (
  juchuHeadId: number,
  juchuKizaiHeadId: number,
  juchuKizaiMeisaiId: number,
  kizaiId: number,
  connection: PoolClient
) => {
  const query = `
      DELETE FROM
        ${SCHEMA}.t_nyushuko_result
      WHERE
        juchu_head_id = $1
        AND juchu_kizai_head_id = $2
        AND juchu_kizai_meisai_id = $3
        AND kizai_id = $4
    `;

  const values = [juchuHeadId, juchuKizaiHeadId, juchuKizaiMeisaiId, kizaiId];

  try {
    await connection.query(query, values);
  } catch (e) {
    throw new Error('[deleteKizaiIdNyushukoResult] DBエラー:', { cause: e });
  }
};

/**
 * 入出庫実績削除（伝票行が残っているものは残す）
 *
 * deleteNyushukoDenKeepResulted が予定数0で残した出庫伝票行の実績は、どのRFIDタグを
 * 確保していたかを出庫画面に出すために残す必要がある。伝票行が消えた実績だけを削除する。
 * 判定に伝票の現在の状態を使うため、必ず伝票の削除より後に呼ぶこと。
 *
 * @param juchuHeadId 受注ヘッダーid
 * @param juchuKizaiHeadId 受注機材ヘッダーid
 * @param juchuKizaiMeisaiId 受注機材明細id
 * @param kizaiId 機材id
 * @param connection
 */
export const deleteKizaiIdNyushukoResultKeepDen = async (
  juchuHeadId: number,
  juchuKizaiHeadId: number,
  juchuKizaiMeisaiId: number,
  kizaiId: number,
  connection: PoolClient
) => {
  const query = `
      DELETE FROM
        ${SCHEMA}.t_nyushuko_result AS r
      WHERE
        r.juchu_head_id = $1
        AND r.juchu_kizai_head_id = $2
        AND r.juchu_kizai_meisai_id = $3
        AND r.kizai_id = $4
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

  const values = [juchuHeadId, juchuKizaiHeadId, juchuKizaiMeisaiId, kizaiId];

  try {
    await connection.query(query, values);
  } catch (e) {
    throw new Error('[deleteKizaiIdNyushukoResultKeepDen] DBエラー:', { cause: e });
  }
};

export const deleteAllNyushukoResult = async (
  juchuHeadId: number,
  juchuKizaiHeadId: number,
  sagyoId: number,
  connection: PoolClient
) => {
  const query = `
      DELETE FROM
        ${SCHEMA}.t_nyushuko_result
      WHERE
        juchu_head_id = $1
        AND juchu_kizai_head_id = $2
        AND sagyo_id = $3
    `;

  const values = [juchuHeadId, juchuKizaiHeadId, sagyoId];

  try {
    await connection.query(query, values);
  } catch (e) {
    throw new Error('[deleteAllNyushukoResult] DBエラー:', { cause: e });
  }
};

export const deleteAllShukoResult = async (
  juchuHeadId: number,
  juchuKizaiHeadId: number,
  sagyoId: number,
  connection: PoolClient
) => {
  const query = `
      DELETE FROM
        ${SCHEMA}.t_nyushuko_result
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
    throw new Error('[deleteAllShukoResult] DBエラー:', { cause: e });
  }
};

export const deleteAllNyukoResult = async (
  juchuHeadId: number,
  juchuKizaiHeadId: number,
  sagyoId: number,
  connection: PoolClient
) => {
  const query = `
      DELETE FROM
        ${SCHEMA}.t_nyushuko_result
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
    throw new Error('[deleteAllNyukoResult] DBエラー:', { cause: e });
  }
};

export const deleteKizaiIdShukoResult = async (
  juchuHeadId: number,
  juchuKizaiHeadId: number,
  juchuKizaiMeisaiId: number,
  kizaiId: number,
  connection: PoolClient
) => {
  const query = `
      DELETE FROM
        ${SCHEMA}.t_nyushuko_result
      WHERE
        juchu_head_id = $1
        AND juchu_kizai_head_id = $2
        AND juchu_kizai_meisai_id = $3
        AND kizai_id = $4
        AND sagyo_kbn_id = ANY($5)
    `;

  const values = [juchuHeadId, juchuKizaiHeadId, juchuKizaiMeisaiId, kizaiId, [10, 20]];

  try {
    await connection.query(query, values);
  } catch (e) {
    throw new Error('[deleteKizaiIdShukoResult] DBエラー:', { cause: e });
  }
};

export const deleteKizaiIdNyukoResult = async (
  juchuHeadId: number,
  juchuKizaiHeadId: number,
  juchuKizaiMeisaiId: number,
  kizaiId: number,
  connection: PoolClient
) => {
  const query = `
      DELETE FROM
        ${SCHEMA}.t_nyushuko_result
      WHERE
        juchu_head_id = $1
        AND juchu_kizai_head_id = $2
        AND juchu_kizai_meisai_id = $3
        AND kizai_id = $4
        AND sagyo_kbn_id = $5
    `;

  const values = [juchuHeadId, juchuKizaiHeadId, juchuKizaiMeisaiId, kizaiId, 30];

  try {
    await connection.query(query, values);
  } catch (e) {
    throw new Error('[deleteKizaiIdNyukoResult] DBエラー:', { cause: e });
  }
};

export const deleteShukoResult = async (
  juchuHeadId: number,
  juchuKizaiHeadId: number,
  juchuKizaiMeisaiId: number,
  kizaiId: number,
  connection: PoolClient
) => {
  const query = `
    DELETE FROM
      ${SCHEMA}.t_nyushuko_result
    WHERE
      juchu_head_id = $1
      AND juchu_kizai_head_id = $2
      AND juchu_kizai_meisai_id = $3
      AND kizai_id = $4
      AND sagyo_kbn_id = ANY($5)
  `;

  const values = [juchuHeadId, juchuKizaiHeadId, juchuKizaiMeisaiId, kizaiId, [10, 20]];

  try {
    await connection.query(query, values);
  } catch (e) {
    throw new Error('[deleteShukoResult] DBエラー:', { cause: e });
  }
};

export const deleteNyukoResult = async (
  juchuHeadId: number,
  juchuKizaiHeadId: number,
  juchuKizaiMeisaiId: number,
  kizaiId: number,
  sagyoId: number,
  connection: PoolClient
) => {
  const query = `
    DELETE FROM
      ${SCHEMA}.t_nyushuko_result
    WHERE
      juchu_head_id = $1
      AND juchu_kizai_head_id = $2
      AND juchu_kizai_meisai_id = $3
      AND kizai_id = $4
      AND sagyo_id = $5
      AND sagyo_kbn_id = $6
  `;

  const values = [juchuHeadId, juchuKizaiHeadId, juchuKizaiMeisaiId, kizaiId, sagyoId, 30];

  try {
    await connection.query(query, values);
  } catch (e) {
    throw new Error('[deleteNyukoResult] DBエラー:', { cause: e });
  }
};

export const deleteNyushukoResultFromOrder = async (
  juchuHeadId: number,
  juchuKizaiHeadId: number,
  connection: PoolClient
) => {
  const query = `
    DELETE FROM
      ${SCHEMA}.t_nyushuko_result
    WHERE
      juchu_head_id = $1
      AND juchu_kizai_head_id = $2
  `;

  const values = [juchuHeadId, juchuKizaiHeadId];

  try {
    await connection.query(query, values);
  } catch (e) {
    throw new Error('[deleteNyushukoResultFromOrder] DBエラー:', { cause: e });
  }
};
