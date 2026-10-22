'use server';

import { PoolClient } from 'pg';

import { SAGYO_KBN_ID } from '@/app/_lib/constants';

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
 * 出庫場所が変わった機材の、元の場所の出庫実績（ピッキング・最終確認）のうち、伝票が無くなったものを削除する
 * deleteShukoDenBashoKeepResulted で元の場所の伝票を整理した後に呼ぶ（残した受注削除の伝票の実績はそのまま残る）。
 * 判定に伝票の今の状態を使うため、必ず伝票の整理の後に呼ぶこと
 * @param juchuHeadId 受注ヘッダーid
 * @param juchuKizaiHeadId 受注機材ヘッダーid
 * @param juchuKizaiMeisaiId 受注機材明細id
 * @param kizaiId 機材id
 * @param oldSagyoId 変更前の出庫場所（事前では事前の実績の作業場所）
 * @param connection
 * @param jizen true なら事前（80/90）の実績を対象にする（準備日を消したとき）
 */
export const deleteShukoResultBashoKeepDen = async (
  juchuHeadId: number,
  juchuKizaiHeadId: number,
  juchuKizaiMeisaiId: number,
  kizaiId: number,
  oldSagyoId: number,
  connection: PoolClient,
  jizen = false
) => {
  const query = `
    DELETE FROM
      ${SCHEMA}.t_nyushuko_result AS r
    WHERE
      r.juchu_head_id = $1
      AND r.juchu_kizai_head_id = $2
      AND r.juchu_kizai_meisai_id = $3
      AND r.kizai_id = $4
      AND r.sagyo_id = $5
      AND r.sagyo_kbn_id = ANY($6)
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

  const values = [
    juchuHeadId,
    juchuKizaiHeadId,
    juchuKizaiMeisaiId,
    kizaiId,
    oldSagyoId,
    jizen ? [SAGYO_KBN_ID.jizenPicking, SAGYO_KBN_ID.jizenConfirmation] : [10, 20],
  ];

  try {
    await connection.query(query, values);
  } catch (e) {
    throw new Error('[deleteShukoResultBashoKeepDen] DBエラー:', { cause: e });
  }
};

/**
 * 事前の実績（80/90）の作業日時を更新（明細・機材・作業場所単位）
 * 準備日時を変えたときに、伝票（upsertJizenDen）と同じ新しい日時に移す
 * @param data 明細のキー
 * @param sagyoId 作業場所（明細の出庫場所）
 * @param jizenDat 新しい準備日時
 * @param connection
 */
export const updateJizenResultDat = async (
  data: { juchu_head_id: number; juchu_kizai_head_id: number; juchu_kizai_meisai_id: number; kizai_id: number },
  sagyoId: number,
  jizenDat: string,
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
      AND kizai_id = $5
      AND sagyo_id = $6
      AND sagyo_kbn_id = ANY($7)
      AND sagyo_den_dat <> $1
  `;

  const values = [
    jizenDat,
    data.juchu_head_id,
    data.juchu_kizai_head_id,
    data.juchu_kizai_meisai_id,
    data.kizai_id,
    sagyoId,
    [SAGYO_KBN_ID.jizenPicking, SAGYO_KBN_ID.jizenConfirmation],
  ];

  try {
    await connection.query(query, values);
  } catch (e) {
    throw new Error('[updateJizenResultDat] DBエラー:', { cause: e });
  }
};

/**
 * 事前の実績（80/90）を明細1件分削除する
 * deleteJizenDen と組で使う。本番（10/20）にコピーした実績は消さない
 * @param data 明細のキー
 * @param connection
 * @param sagyoId 作業場所（省略すると作業場所を問わず全部）
 */
export const deleteJizenResult = async (
  data: { juchu_head_id: number; juchu_kizai_head_id: number; juchu_kizai_meisai_id: number; kizai_id: number },
  connection: PoolClient,
  sagyoId?: number
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
      AND ($6::integer IS NULL OR sagyo_id = $6)
  `;

  const values = [
    data.juchu_head_id,
    data.juchu_kizai_head_id,
    data.juchu_kizai_meisai_id,
    data.kizai_id,
    [SAGYO_KBN_ID.jizenPicking, SAGYO_KBN_ID.jizenConfirmation],
    sagyoId ?? null,
  ];

  try {
    await connection.query(query, values);
  } catch (e) {
    throw new Error('[deleteJizenResult] DBエラー:', { cause: e });
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

/**
 * 事前で削除したタグを、本番（事前ピッキング→ピッキング、事前最終確認→最終確認）からも削除する
 * 本番の行は「受注・作業区分・本番の出庫日時・作業場所・機材・タグ」で探す（機材ヘッダー・明細は見ない。
 * 合体ヘッダーで別のヘッダーに付いていても消す）。本番の行が無ければ何もしない
 * 本番の出庫日時は、事前の明細と同じ明細・機材・作業場所の本番の伝票から取る
 * @param data 事前の明細のキー
 * @param honbanSagyoKbnId 本番の作業区分（10/20）
 * @param sagyoId 作業場所
 * @param rfidTagIds 削除したタグ
 * @param connection
 * @returns 本番の出庫日時（伝票が無ければ null。読取数の数え直しに使う）
 */
export const deleteHonbanResultByJizenTags = async (
  data: { juchu_head_id: number; juchu_kizai_head_id: number; juchu_kizai_meisai_id: number; kizai_id: number },
  honbanSagyoKbnId: number,
  sagyoId: number,
  rfidTagIds: string[],
  connection: PoolClient
) => {
  const datQuery = `
    SELECT
      sagyo_den_dat
    FROM
      ${SCHEMA}.t_nyushuko_den
    WHERE
      juchu_head_id = $1
      AND juchu_kizai_head_id = $2
      AND juchu_kizai_meisai_id = $3
      AND kizai_id = $4
      AND sagyo_kbn_id = $5
      AND sagyo_id = $6
    ORDER BY
      sagyo_den_dat DESC
    LIMIT 1
  `;
  const deleteQuery = `
    DELETE FROM
      ${SCHEMA}.t_nyushuko_result
    WHERE
      juchu_head_id = $1
      AND sagyo_kbn_id = $2
      AND sagyo_den_dat = $3
      AND sagyo_id = $4
      AND kizai_id = $5
      AND rfid_tag_id = ANY($6)
  `;

  try {
    const { rows } = await connection.query<{ sagyo_den_dat: Date }>(datQuery, [
      data.juchu_head_id,
      data.juchu_kizai_head_id,
      data.juchu_kizai_meisai_id,
      data.kizai_id,
      honbanSagyoKbnId,
      sagyoId,
    ]);
    const honbanDat = rows[0]?.sagyo_den_dat ?? null;
    if (!honbanDat || rfidTagIds.length === 0) return honbanDat;
    await connection.query(deleteQuery, [
      data.juchu_head_id,
      honbanSagyoKbnId,
      honbanDat,
      sagyoId,
      data.kizai_id,
      rfidTagIds,
    ]);
    return honbanDat;
  } catch (e) {
    throw new Error('[deleteHonbanResultByJizenTags] DBエラー:', { cause: e });
  }
};
