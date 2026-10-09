'use server';

import { PoolClient } from 'pg';

import { JuchuContainerMeisaiValues } from '@/app/(main)/(eq-order-detail)/eq-main-order-detail/[juchuHeadId]/[juchuKizaiHeadId]/[mode]/_lib/types';

import { SCHEMA } from '../schema';
import { createClient } from '../supabase-server';
import { JuchuCtnMeisai } from '../types/t_juchu_ctn_meisai-type';

/**
 * 受注コンテナ明細id最大値取得
 * @param juchuHeadId 受注ヘッダーid
 * @param juchuKizaiHeadId 受注機材ヘッダーid
 * @returns
 */
export const selectJuchuContainerMeisaiMaxId = async (juchuHeadId: number, juchuKizaiHeadId: number) => {
  const supabase = await createClient();
  try {
    return await supabase
      .schema(SCHEMA)
      .from('t_juchu_ctn_meisai')
      .select('juchu_kizai_meisai_id')
      .eq('juchu_head_id', juchuHeadId)
      .eq('juchu_kizai_head_id', juchuKizaiHeadId)
      .order('juchu_kizai_meisai_id', {
        ascending: false,
      })
      .limit(1)
      .single();
  } catch (e) {
    throw new Error('[selectJuchuContainerMeisaiMaxId] DBエラー:', { cause: e });
  }
};

/**
 * 受注コンテナ明細新規追加
 * @param data 受注コンテナ明細データ
 * @returns
 */
export const insertJuchuContainerMeisai = async (data: JuchuCtnMeisai[], connection: PoolClient) => {
  const cols = Object.keys(data[0]) as (keyof (typeof data)[0])[];
  const values = data.flatMap((obj) => cols.map((col) => obj[col] ?? null));
  let placeholderIndex = 1;
  const placeholders = data
    .map(() => {
      const rowPlaceholders = cols.map(() => `$${placeholderIndex++}`);
      return `(${rowPlaceholders.join(', ')})`;
    })
    .join(', ');

  const query = `
    INSERT INTO
      ${SCHEMA}.t_juchu_ctn_meisai (${cols.join(',')})
    VALUES 
      ${placeholders}
  `;

  try {
    await connection.query(query, values);
  } catch (e) {
    throw new Error('[insertJuchuContainerMeisai] DBエラー:', { cause: e });
  }
};

/**
 * 受注コンテナ明細更新
 * @param data 受注コンテナ明細データ
 * @returns
 */
export const updateJuchuContainerMeisai = async (data: JuchuCtnMeisai, connection: PoolClient) => {
  const whereKeys = ['juchu_head_id', 'juchu_kizai_head_id', 'kizai_id', 'shozoku_id'] as const;

  const allKeys = Object.keys(data) as (keyof typeof data)[];

  const updateKeys = allKeys.filter((key) => !(whereKeys as readonly string[]).includes(key));

  if (updateKeys.length === 0) {
    throw new Error('No columns to update.');
  }

  const allValues: (string | number | null | undefined)[] = [];
  let placeholderIndex = 1;

  const setClause = updateKeys
    .map((key) => {
      allValues.push(data[key]);
      return `${key} = $${placeholderIndex++}`;
    })
    .join(', ');

  const whereClause = whereKeys
    .map((key) => {
      allValues.push(data[key]);
      return `${key} = $${placeholderIndex++}`;
    })
    .join(' AND ');

  const query = `
      UPDATE
        ${SCHEMA}.t_juchu_ctn_meisai
      SET
        ${setClause}
      WHERE
        ${whereClause}
    `;
  try {
    await connection.query(query, allValues);
  } catch (e) {
    throw new Error('[updateJuchuContainerMeisai] DBエラー:', { cause: e });
  }
};

/**
 * 受注コンテナ明細UPSERT
 * @param data 受注コンテナ明細データ
 * @returns
 */
export const upsertJuchuContainerMeisai = async (data: JuchuCtnMeisai[], connection: PoolClient) => {
  const cols = Object.keys(data[0]) as (keyof (typeof data)[0])[];

  // INSERT用の values 配列の生成
  const insertValues = data.flatMap((obj) => cols.map((col) => obj[col] ?? null));

  // INSERT用の placeholders を生成
  let placeholderIndex = 1;
  const placeholders = data
    .map(() => {
      const rowPlaceholders = cols.map(() => `$${placeholderIndex++}`);
      return `(${rowPlaceholders.join(', ')})`;
    })
    .join(', ');

  // UPDATE用の値を $ プレースホルダー用に準備(INSERT用プレースホルダーの続きの番号を使う)
  const updateTimestampPlaceholder = `$${placeholderIndex++}`;
  const updateUserPlaceholder = `$${placeholderIndex++}`;

  // 最終的な values 配列を作成(INSERT用の値配列 ...insertValues の後ろに、UPDATE用の値を追加)
  const values = [...insertValues, data[0].add_dat, data[0].add_user];

  // 競合キー(複合キー)の定義
  const conflictKeys = ['juchu_head_id', 'juchu_kizai_head_id', 'juchu_kizai_meisai_id', 'kizai_id', 'shozoku_id'];

  // UPDATE対象列のリストを動的生成(競合キー、add_* 列、upd_* 列 を除く)
  const columnsToUpdate = cols.filter(
    (col) =>
      !conflictKeys.includes(col as string) &&
      col !== 'add_dat' &&
      col !== 'add_user' &&
      col !== 'upd_dat' &&
      col !== 'upd_user'
  );

  // DO UPDATE SET 句のSQL文字列を生成
  const updateSetNormal = columnsToUpdate.map((col) => `${col as string} = EXCLUDED.${col as string}`).join(',\n    ');

  // upd_datとupd_userは別途作成
  const updateSetAudit = [`upd_dat = ${updateTimestampPlaceholder}`, `upd_user = ${updateUserPlaceholder}`].join(
    ',\n    '
  );

  // 最終的な UPSERT クエリの構築
  const query = `
    INSERT INTO
      ${SCHEMA}.t_juchu_ctn_meisai (${cols.join(',')})
    VALUES 
      ${placeholders}
    ON CONFLICT (${conflictKeys.join(', ')})
    DO UPDATE SET
      ${updateSetNormal ? updateSetNormal + ',\n    ' : ''}${updateSetAudit}
  `;

  try {
    await connection.query(query, values);
  } catch (e) {
    throw new Error('[upsertJuchuContainerMeisai] DBエラー:', { cause: e });
  }
};

/**
 * 受注コンテナ明細削除
 * @param juchuHeadId 受注ヘッダーid
 * @param juchuKizaiHeadId 受注機材ヘッダーid
 * @param kizaiId 機材id
 * @returns
 */
export const deleteJuchuContainerMeisai = async (
  juchuHeadId: number,
  juchuKizaiHeadId: number,
  kizaiId: number[],
  connection: PoolClient
) => {
  const query = `
    DELETE FROM
      ${SCHEMA}.t_juchu_ctn_meisai
    WHERE
      juchu_head_id = $1
      AND juchu_kizai_head_id = $2
      AND kizai_id = ANY($3)
  `;

  const values = [juchuHeadId, juchuKizaiHeadId, kizaiId];

  try {
    await connection.query(query, values);
  } catch (e) {
    throw new Error('[deleteJuchuContainerMeisai] DBエラー:', { cause: e });
  }
};

/**
 * 受注コンテナ明細の一部の列だけを UPSERT（無ければ追加、あれば指定した列だけ更新）
 * @param data 受注コンテナ明細データ（追加するときの全列）
 * @param updateColumns 既にある行で更新する列
 * @param connection
 */
export const upsertJuchuContainerMeisaiColumns = async (
  data: JuchuCtnMeisai[],
  updateColumns: (keyof JuchuCtnMeisai)[],
  connection: PoolClient
) => {
  const cols = Object.keys(data[0]) as (keyof (typeof data)[0])[];
  const insertValues = data.flatMap((obj) => cols.map((col) => obj[col] ?? null));

  let placeholderIndex = 1;
  const placeholders = data
    .map(() => {
      const rowPlaceholders = cols.map(() => `$${placeholderIndex++}`);
      return `(${rowPlaceholders.join(', ')})`;
    })
    .join(', ');

  const updateTimestampPlaceholder = `$${placeholderIndex++}`;
  const updateUserPlaceholder = `$${placeholderIndex++}`;
  const values = [...insertValues, data[0].add_dat, data[0].add_user];

  const conflictKeys = ['juchu_head_id', 'juchu_kizai_head_id', 'juchu_kizai_meisai_id', 'kizai_id', 'shozoku_id'];
  const updateSet = [
    ...updateColumns.map((col) => `${col as string} = EXCLUDED.${col as string}`),
    `upd_dat = ${updateTimestampPlaceholder}`,
    `upd_user = ${updateUserPlaceholder}`,
  ].join(',\n    ');

  const query = `
    INSERT INTO
      ${SCHEMA}.t_juchu_ctn_meisai (${cols.join(',')})
    VALUES
      ${placeholders}
    ON CONFLICT (${conflictKeys.join(', ')})
    DO UPDATE SET
      ${updateSet}
  `;

  try {
    await connection.query(query, values);
  } catch (e) {
    throw new Error('[upsertJuchuContainerMeisaiColumns] DBエラー:', { cause: e });
  }
};

/**
 * 受注コンテナ明細のメモ更新（1つの場所の行）
 * @param data 受注ヘッダーid、受注機材ヘッダーid、受注機材明細id、機材id、所属id、メモ
 * @param userNam ユーザー名
 * @param connection
 */
export const updateJuchuContainerMeisaiMem = async (
  data: {
    juchuHeadId: number;
    juchuKizaiHeadId: number;
    juchuKizaiMeisaiId: number;
    kizaiId: number;
    shozokuId: number;
    mem: string | null;
  },
  userNam: string,
  connection: PoolClient
) => {
  const query = `
    UPDATE
      ${SCHEMA}.t_juchu_ctn_meisai
    SET
      mem = $1,
      upd_dat = $2,
      upd_user = $3
    WHERE
      juchu_head_id = $4
      AND juchu_kizai_head_id = $5
      AND juchu_kizai_meisai_id = $6
      AND kizai_id = $7
      AND shozoku_id = $8
  `;

  const values = [
    data.mem,
    new Date().toISOString(),
    userNam,
    data.juchuHeadId,
    data.juchuKizaiHeadId,
    data.juchuKizaiMeisaiId,
    data.kizaiId,
    data.shozokuId,
  ];

  try {
    await connection.query(query, values);
  } catch (e) {
    throw new Error('[updateJuchuContainerMeisaiMem] DBエラー:', { cause: e });
  }
};

/**
 * 受注コンテナ明細削除（1つの場所の行）
 * @param data 受注ヘッダーid、受注機材ヘッダーid、受注機材明細id、機材id
 * @param shozokuId 所属id（作業場所）
 * @param connection
 */
export const deleteJuchuContainerMeisaiShozoku = async (
  data: { juchuHeadId: number; juchuKizaiHeadId: number; juchuKizaiMeisaiId: number; kizaiId: number },
  shozokuId: number,
  connection: PoolClient
) => {
  const query = `
    DELETE FROM
      ${SCHEMA}.t_juchu_ctn_meisai
    WHERE
      juchu_head_id = $1
      AND juchu_kizai_head_id = $2
      AND juchu_kizai_meisai_id = $3
      AND kizai_id = $4
      AND shozoku_id = $5
  `;

  const values = [data.juchuHeadId, data.juchuKizaiHeadId, data.juchuKizaiMeisaiId, data.kizaiId, shozokuId];

  try {
    await connection.query(query, values);
  } catch (e) {
    throw new Error('[deleteJuchuContainerMeisaiShozoku] DBエラー:', { cause: e });
  }
};

/**
 * 受注コンテナ明細を所属（作業場所）単位で全削除
 * @param juchuHeadId 受注ヘッダーid
 * @param juchuKizaiHeadId 受注機材ヘッダーid
 * @param shozokuId 所属id（作業場所）
 * @param connection
 */
export const deleteAllJuchuContainerMeisaiShozoku = async (
  juchuHeadId: number,
  juchuKizaiHeadId: number,
  shozokuId: number,
  connection: PoolClient
) => {
  const query = `
    DELETE FROM
      ${SCHEMA}.t_juchu_ctn_meisai
    WHERE
      juchu_head_id = $1
      AND juchu_kizai_head_id = $2
      AND shozoku_id = $3
  `;

  const values = [juchuHeadId, juchuKizaiHeadId, shozokuId];

  try {
    await connection.query(query, values);
  } catch (e) {
    throw new Error('[deleteAllJuchuContainerMeisaiShozoku] DBエラー:', { cause: e });
  }
};

/**
 * 受注コンテナ明細取得（トランザクション内。採番・出発用）
 * @param juchuHeadId 受注ヘッダーid
 * @param juchuKizaiHeadId 受注機材ヘッダーid
 * @param connection
 * @returns 受注機材明細id、機材id、所属id、表示順
 */
export const selectJuchuContainerMeisaiRowsTx = async (
  juchuHeadId: number,
  juchuKizaiHeadId: number,
  connection: PoolClient
) => {
  const query = `
    SELECT
      juchu_kizai_meisai_id,
      kizai_id,
      shozoku_id,
      dsp_ord_num,
      plan_kizai_qty
    FROM
      ${SCHEMA}.t_juchu_ctn_meisai
    WHERE
      juchu_head_id = $1
      AND juchu_kizai_head_id = $2
  `;

  try {
    return (
      await connection.query<{
        juchu_kizai_meisai_id: number;
        kizai_id: number;
        shozoku_id: number;
        dsp_ord_num: number | null;
        plan_kizai_qty: number | null;
      }>(query, [juchuHeadId, juchuKizaiHeadId])
    ).rows;
  } catch (e) {
    throw new Error('[selectJuchuContainerMeisaiRowsTx] DBエラー:', { cause: e });
  }
};

/**
 * コンテナの明細idの最大値取得（トランザクション内）
 * 受注機材ヘッダー内のコンテナ（受注コンテナ明細と、全作業区分・全作業場所のコンテナの入出庫伝票）の最大値を返す。
 * コンテナは作業場所ごとに伝票・受注コンテナ明細を作るので、場所内の最大値で採番すると別の場所の別のコンテナと
 * 明細idが重なる（ゲートの集中モードなど、明細idで行を探す処理で取り違える）。機材とは重なってよい（コンテナかどうかで区別できる）。
 * 送信RPC（nyushuko_send_20261009_1）の予定外コンテナの採番も同じ範囲の最大値を使う
 * @param juchuHeadId 受注ヘッダーid
 * @param juchuKizaiHeadId 受注機材ヘッダーid
 * @param connection
 * @returns 明細idの最大値（無ければ 0）
 */
export const selectCtnMaxMeisaiIdTx = async (juchuHeadId: number, juchuKizaiHeadId: number, connection: PoolClient) => {
  const query = `
    SELECT
      GREATEST(
        COALESCE((
          SELECT MAX(juchu_kizai_meisai_id) FROM ${SCHEMA}.t_juchu_ctn_meisai
          WHERE juchu_head_id = $1 AND juchu_kizai_head_id = $2
        ), 0),
        COALESCE((
          SELECT MAX(d.juchu_kizai_meisai_id) FROM ${SCHEMA}.t_nyushuko_den d
          JOIN ${SCHEMA}.m_kizai k ON k.kizai_id = d.kizai_id
          WHERE d.juchu_head_id = $1 AND d.juchu_kizai_head_id = $2 AND k.ctn_flg = 1
        ), 0)
      )::integer AS max_meisai_id
  `;

  try {
    const { rows } = await connection.query<{ max_meisai_id: number }>(query, [juchuHeadId, juchuKizaiHeadId]);
    return rows[0]?.max_meisai_id ?? 0;
  } catch (e) {
    throw new Error('[selectCtnMaxMeisaiIdTx] DBエラー:', { cause: e });
  }
};

/**
 * 受注機材明細・受注コンテナ明細の表示順の最大値取得（トランザクション内）
 * @param juchuHeadId 受注ヘッダーid
 * @param juchuKizaiHeadId 受注機材ヘッダーid
 * @param connection
 * @returns 表示順の最大値（無ければ 0）
 */
export const selectMeisaiMaxDspOrdNumTx = async (
  juchuHeadId: number,
  juchuKizaiHeadId: number,
  connection: PoolClient
) => {
  const query = `
    SELECT
      GREATEST(
        COALESCE((
          SELECT MAX(dsp_ord_num) FROM ${SCHEMA}.t_juchu_kizai_meisai
          WHERE juchu_head_id = $1 AND juchu_kizai_head_id = $2
        ), 0),
        COALESCE((
          SELECT MAX(dsp_ord_num) FROM ${SCHEMA}.t_juchu_ctn_meisai
          WHERE juchu_head_id = $1 AND juchu_kizai_head_id = $2
        ), 0)
      )::integer AS max_dsp_ord_num
  `;

  try {
    const { rows } = await connection.query<{ max_dsp_ord_num: number }>(query, [juchuHeadId, juchuKizaiHeadId]);
    return rows[0]?.max_dsp_ord_num ?? 0;
  } catch (e) {
    throw new Error('[selectMeisaiMaxDspOrdNumTx] DBエラー:', { cause: e });
  }
};

export const deleteJuchuCtnMeisaiFromOrder = async (
  juchuHeadId: number,
  juchuKizaiHeadId: number,
  connection: PoolClient
) => {
  const query = `
    DELETE FROM
      ${SCHEMA}.t_juchu_ctn_meisai
    WHERE
      juchu_head_id = $1
      AND juchu_kizai_head_id = $2
  `;

  const values = [juchuHeadId, juchuKizaiHeadId];

  try {
    await connection.query(query, values);
  } catch (e) {
    throw new Error('[deleteJuchuCtnMeisaiFromOrder] DBエラー:', { cause: e });
  }
};
