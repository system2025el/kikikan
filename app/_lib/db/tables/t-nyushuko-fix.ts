'use server';

import { PoolClient } from 'pg';

import { NYUSHUKO_SHUBETU_ID, SAGYO_KBN_ID } from '@/app/_lib/constants';

import pool from '../postgres';
import { SCHEMA } from '../schema';
import { createClient } from '../supabase-server';
import { NyushukoFix } from '../types/t-nyushuko-fix-type';

/**
 * 入出庫確定フラグ取得
 * @param juchuHeadId 受注ヘッダーid
 * @param juchuKizaiHeadId 受注機材ヘッダーid
 * @param sagyoKbnId 作業区分id
 * @param sagyoId 作業id
 * @returns
 */
export const selectNyushukoFixFlag = async (juchuHeadId: number, juchuKizaiHeadId: number, sagyoKbnId: number) => {
  const supabase = await createClient();
  try {
    return await supabase
      .schema(SCHEMA)
      .from('t_nyushuko_fix')
      .select('sagyo_fix_flg')
      .eq('juchu_head_id', juchuHeadId)
      .eq('juchu_kizai_head_id', juchuKizaiHeadId)
      .eq('sagyo_kbn_id', sagyoKbnId);
  } catch (e) {
    throw new Error('[selectNyushukoFixFlag] DBエラー:', { cause: e });
  }
};

/**
 * 入出庫確定フラグ取得(作業id指定)
 * @param juchuHeadId 受注ヘッダーid
 * @param juchuKizaiHeadId 受注機材ヘッダーid
 * @param sagyoKbnId 作業区分id
 * @param sagyoDenDat 作業日時
 * @param sagyoId 作業id
 * @returns
 */
export const selectSagyoIdFilterNyushukoFixFlag = async (
  juchuHeadId: number,
  juchuKizaiHeadId: number,
  sagyoKbnId: number,
  sagyoDenDat: string,
  sagyoId: number
) => {
  const supabase = await createClient();
  try {
    return await supabase
      .schema(SCHEMA)
      .from('t_nyushuko_fix')
      .select('sagyo_fix_flg')
      .eq('juchu_head_id', juchuHeadId)
      .eq('juchu_kizai_head_id', juchuKizaiHeadId)
      .eq('sagyo_kbn_id', sagyoKbnId)
      .eq('sagyo_den_dat', sagyoDenDat)
      .eq('sagyo_id', sagyoId)
      .single();
  } catch (e) {
    throw new Error('[selectSagyoIdFilterNyushukoFixFlag] DBエラー:', { cause: e });
  }
};

/**
 * 確定済みの受注機材ヘッダーid取得（複数ヘッダー分をまとめて）
 * 入出庫明細画面は同じ日時・場所の複数ヘッダーを合体して表示するため、どのヘッダーが確定済みかをまとめて取る
 * @param juchuHeadId 受注ヘッダーid
 * @param juchuKizaiHeadIds 受注機材ヘッダーid
 * @param sagyoKbnId 作業区分id（出庫確定 60 / 入庫確定 70）
 * @param sagyoDenDat 作業日時
 * @param sagyoId 作業id
 * @returns
 */
export const selectFixedJuchuKizaiHeadIds = async (
  juchuHeadId: number,
  juchuKizaiHeadIds: number[],
  sagyoKbnId: number,
  sagyoDenDat: string,
  sagyoId: number
) => {
  const supabase = await createClient();
  try {
    return await supabase
      .schema(SCHEMA)
      .from('t_nyushuko_fix')
      .select('juchu_kizai_head_id')
      .eq('juchu_head_id', juchuHeadId)
      .in('juchu_kizai_head_id', juchuKizaiHeadIds)
      .eq('sagyo_kbn_id', sagyoKbnId)
      .eq('sagyo_den_dat', sagyoDenDat)
      .eq('sagyo_id', sagyoId)
      .eq('sagyo_fix_flg', 1);
  } catch (e) {
    throw new Error('[selectFixedJuchuKizaiHeadIds] DBエラー:', { cause: e });
  }
};

/**
 * 確定済みの受注機材ヘッダーid取得（トランザクション内）
 * 確定・確定解除の処理で、画面を開いた後の変化も含めて確定済みのヘッダーを取り直すために使う
 * @param juchuHeadId 受注ヘッダーid
 * @param juchuKizaiHeadIds 受注機材ヘッダーid
 * @param sagyoKbnId 作業区分id（出庫確定 60 / 入庫確定 70）
 * @param sagyoDenDat 作業日時
 * @param sagyoId 作業id
 * @param connection
 * @returns 確定済みの受注機材ヘッダーid
 */
export const selectFixedJuchuKizaiHeadIdsTx = async (
  juchuHeadId: number,
  juchuKizaiHeadIds: number[],
  sagyoKbnId: number,
  sagyoDenDat: string,
  sagyoId: number,
  connection: PoolClient
) => {
  const query = `
    SELECT
      juchu_kizai_head_id
    FROM
      ${SCHEMA}.t_nyushuko_fix
    WHERE
      juchu_head_id = $1
      AND juchu_kizai_head_id = ANY($2::int[])
      AND sagyo_kbn_id = $3
      AND sagyo_den_dat = $4::timestamptz
      AND sagyo_id = $5
      AND sagyo_fix_flg = 1
  `;

  try {
    const result = await connection.query<{ juchu_kizai_head_id: number }>(query, [
      juchuHeadId,
      juchuKizaiHeadIds,
      sagyoKbnId,
      sagyoDenDat,
      sagyoId,
    ]);
    return result.rows.map((r) => r.juchu_kizai_head_id);
  } catch (e) {
    throw new Error('[selectFixedJuchuKizaiHeadIdsTx] DBエラー:', { cause: e });
  }
};

/**
 * 確定済みの作業場所id取得（受注機材ヘッダー単位、トランザクション内）
 * コンテナの入庫伝票を作る・残すかを、出庫場所ごとの出発状況で決めるために使う
 * @param juchuHeadId 受注ヘッダーid
 * @param juchuKizaiHeadId 受注機材ヘッダーid
 * @param sagyoKbnId 作業区分id（出庫確定 60 / 入庫確定 70）
 * @param connection
 * @returns 確定済みの作業id（作業場所）
 */
export const selectFixedSagyoIdsTx = async (
  juchuHeadId: number,
  juchuKizaiHeadId: number,
  sagyoKbnId: number,
  connection: PoolClient
) => {
  const query = `
    SELECT DISTINCT
      sagyo_id
    FROM
      ${SCHEMA}.t_nyushuko_fix
    WHERE
      juchu_head_id = $1
      AND juchu_kizai_head_id = $2
      AND sagyo_kbn_id = $3
      AND sagyo_fix_flg = 1
  `;

  try {
    const result = await connection.query<{ sagyo_id: number }>(query, [juchuHeadId, juchuKizaiHeadId, sagyoKbnId]);
    return result.rows.map((r) => r.sagyo_id);
  } catch (e) {
    throw new Error('[selectFixedSagyoIdsTx] DBエラー:', { cause: e });
  }
};

/**
 * 入出庫確定確認
 * @param data 入出庫確定確認データ
 * @returns
 */
export const selectNyushukoFixConfirm = async (data: {
  juchu_head_id: number;
  juchu_kizai_head_id: number;
  sagyo_id: number;
}) => {
  const supabase = await createClient();
  try {
    return await supabase
      .schema(SCHEMA)
      .from('t_nyushuko_fix')
      .select('*')
      .eq('juchu_head_id', data.juchu_head_id)
      .eq('juchu_kizai_head_id', data.juchu_kizai_head_id)
      .eq('sagyo_id', data.sagyo_id);
  } catch (e) {
    throw new Error('[selectNyushukoFixConfirm] DBエラー:', { cause: e });
  }
};

/**
 * 入出庫確定新規追加
 * @param data 入出庫確定データ
 * @returns
 */
export const insertNyushukoFix = async (data: NyushukoFix[], connection: PoolClient) => {
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
      ${SCHEMA}.t_nyushuko_fix (${cols.join(',')})
    VALUES 
      ${placeholders}
  `;

  try {
    await connection.query(query, values);
  } catch (e) {
    throw new Error('[insertNyushukoFix] DBエラー:', { cause: e });
  }
};

/**
 * 入出庫確定更新
 * @param data 入出庫確定データ
 * @returns
 */
export const updateNyushukoFix = async (data: NyushukoFix, connection: PoolClient) => {
  const whereKeys = ['juchu_head_id', 'juchu_kizai_head_id', 'sagyo_kbn_id', 'sagyo_den_dat', 'sagyo_id'] as const;

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
        ${SCHEMA}.t_nyushuko_fix
      SET
        ${setClause}
      WHERE
        ${whereClause}
    `;
  try {
    await connection.query(query, allValues);
  } catch (e) {
    throw new Error('[updateNyushukoFix] DBエラー:', { cause: e });
  }
};

/**
 * 入出庫確定削除
 * @param data 出庫確定削除データ
 * @param connection
 */
export const deleteNyushukoFix = async (
  data: {
    juchu_head_id: number;
    juchu_kizai_head_id: number;
    sagyo_kbn_id: number;
    sagyo_id: number;
  },
  connection: PoolClient
) => {
  const whereKeys = Object.keys(data) as (keyof typeof data)[];

  if (whereKeys.length === 0) {
    throw new Error('DELETE conditions cannot be empty.');
  }

  const whereClause = whereKeys.map((key, index) => `${key} = $${index + 1}`).join(' AND ');

  const values = whereKeys.map((key) => data[key]);

  const query = `
    DELETE FROM
      ${SCHEMA}.t_nyushuko_fix
    WHERE
      ${whereClause}
  `;

  try {
    await connection.query(query, values);
  } catch (e) {
    throw new Error('[deleteNyushukoFix] DBエラー:', { cause: e });
  }
};

export const deleteNyushukoFixFromOrder = async (
  juchuHeadId: number,
  juchuKizaiHeadId: number,
  connection: PoolClient
) => {
  const query = `
    DELETE FROM
      ${SCHEMA}.t_nyushuko_fix
    WHERE
      juchu_head_id = $1
      AND juchu_kizai_head_id = $2
  `;

  const values = [juchuHeadId, juchuKizaiHeadId];

  try {
    await connection.query(query, values);
  } catch (e) {
    throw new Error('[deleteNyushukoFixFromOrder] DBエラー:', { cause: e });
  }
};

/**
 * 本番の出庫（同じ受注機材ヘッダー・作業場所）が出発済みか
 * 事前（事前ピッキング・事前最終確認）の画面で、補正・実績クリアを止めるために使う。
 * 本番の出庫日時は t_juchu_kizai_nyushuko から取る（v_nyushuko_den の事前の行・送信RPC と同じ判定）
 * @param juchuHeadId 受注ヘッダーid
 * @param juchuKizaiHeadId 受注機材ヘッダーid
 * @param sagyoId 作業場所（出庫場所）
 * @returns 出発済みなら true
 */
export const selectHonbanShukoFixed = async (juchuHeadId: number, juchuKizaiHeadId: number, sagyoId: number) => {
  const query = `
    SELECT
      EXISTS (
        SELECT
          1
        FROM
          ${SCHEMA}.t_juchu_kizai_nyushuko AS n
          JOIN ${SCHEMA}.t_nyushuko_fix AS f
            ON f.juchu_head_id = n.juchu_head_id
            AND f.juchu_kizai_head_id = n.juchu_kizai_head_id
            AND f.sagyo_kbn_id = $4
            AND f.sagyo_den_dat = n.nyushuko_dat
            AND f.sagyo_id = n.nyushuko_basho_id
            AND f.sagyo_fix_flg = 1
        WHERE
          n.juchu_head_id = $1
          AND n.juchu_kizai_head_id = $2
          AND n.nyushuko_shubetu_id = $5
          AND n.nyushuko_basho_id = $3
      ) AS fixed
  `;

  try {
    const { rows } = await pool.query<{ fixed: boolean }>(query, [
      juchuHeadId,
      juchuKizaiHeadId,
      sagyoId,
      SAGYO_KBN_ID.shukoConfirmed,
      NYUSHUKO_SHUBETU_ID.shuko,
    ]);
    return rows[0]?.fixed ?? false;
  } catch (e) {
    throw new Error('[selectHonbanShukoFixed] DBエラー:', { cause: e });
  }
};
