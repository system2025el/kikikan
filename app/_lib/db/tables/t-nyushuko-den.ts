'use server';

import { PoolClient } from 'pg';

import { SCHEMA, supabase } from '../supabase';
import { NyushukoDen } from '../types/t-nyushuko-den-type';

/**
 * 入出庫伝票新規追加
 * @param data 入出庫伝票データ
 * @returns
 */
export const insertNyushukoDen = async (data: NyushukoDen[], connection: PoolClient) => {
  if (!data || data.length === 0) {
    console.log('入出庫伝票データがありません。');
    return;
  }

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
      ${SCHEMA}.t_nyushuko_den (${cols.join(',')})
    VALUES 
      ${placeholders}
  `;

  try {
    await connection.query(query, values);
  } catch (e) {
    throw e;
  }
};

/**
 * 入出庫伝票更新
 * @param data 入出庫伝票データ
 * @returns
 */
export const updateNyushukoDen = async (data: NyushukoDen, connection: PoolClient) => {
  const whereKeys = [
    'juchu_head_id',
    'juchu_kizai_head_id',
    'juchu_kizai_meisai_id',
    'sagyo_kbn_id',
    'sagyo_id',
    'kizai_id',
  ] as const;

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
        ${SCHEMA}.t_nyushuko_den
      SET
        ${setClause}
      WHERE
        ${whereClause}
    `;
  try {
    await connection.query(query, allValues);
  } catch (e) {
    throw e;
  }
};

/**
 * 親入庫伝票更新
 * @param data 入出庫伝票データ
 * @param connection
 */
export const updateOyaNyukoDen = async (data: NyushukoDen, connection: PoolClient) => {
  const query = `
    UPDATE
      ${SCHEMA}.t_nyushuko_den
    SET
      plan_qty = plan_qty - ${data.plan_qty ?? 0},
      -- upd_dat = ${data.upd_dat},
      upd_user = '${data.upd_user}'
    WHERE
      juchu_head_id = ${data.juchu_head_id}
      AND juchu_kizai_head_id = (
        SELECT 
          oya_juchu_kizai_head_id 
        FROM 
          ${SCHEMA}.t_juchu_kizai_head 
        WHERE 
          juchu_head_id = ${data.juchu_head_id} 
          AND juchu_kizai_head_id = ${data.juchu_kizai_head_id}
      )
      AND sagyo_kbn_id = ${data.sagyo_kbn_id}
      AND sagyo_id = ${data.sagyo_id}
      AND kizai_id = ${data.kizai_id}
      AND dsp_ord_num = ${data.dsp_ord_num}
  `;

  console.log(query);

  try {
    await connection.query(query);
  } catch (e) {
    throw e;
  }
};

/**
 * 入出庫伝票UPSERT
 * @param data 入出庫伝票データ
 * @param connection
 */
export const upsertNyushukoDen = async (data: NyushukoDen[], connection: PoolClient) => {
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
  const conflictKeys = [
    'juchu_head_id',
    'juchu_kizai_head_id',
    'juchu_kizai_meisai_id',
    'sagyo_den_dat',
    'sagyo_kbn_id',
    'sagyo_id',
    'kizai_id',
  ];

  // UPDATE用の競合キー(複合キー)の定義
  const updateKeys = [
    'juchu_head_id',
    'juchu_kizai_head_id',
    'juchu_kizai_meisai_id',
    'sagyo_kbn_id',
    'sagyo_id',
    'kizai_id',
  ];

  // UPDATE対象列のリストを動的生成(競合キー、add_* 列、upd_* 列 を除く)
  const columnsToUpdate = cols.filter(
    (col) =>
      !updateKeys.includes(col as string) &&
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
      ${SCHEMA}.t_nyushuko_den (${cols.join(',')})
    VALUES 
      ${placeholders}
    ON CONFLICT (${conflictKeys.join(', ')})
    DO UPDATE SET
      ${updateSetNormal ? updateSetNormal + ',\n    ' : ''}${updateSetAudit}
  `;

  try {
    await connection.query(query, values);
  } catch (e) {
    throw e;
  }
};

/**
 * 入出庫伝票全削除
 * @param juchuHeadId 受注ヘッダーid
 * @param juchuKizaiHeadId 受注機材ヘッダーid
 * @param connection
 */
export const deleteAllNyushukoDen = async (juchuHeadId: number, juchuKizaiHeadId: number, connection: PoolClient) => {
  const query = `
    DELETE FROM
      ${SCHEMA}.t_nyushuko_den
    WHERE
      juchu_head_id = $1
      AND juchu_kizai_head_id = $2
  `;

  const values = [juchuHeadId, juchuKizaiHeadId];

  try {
    await connection.query(query, values);
  } catch (e) {
    throw e;
  }
};

/**
 * 出庫伝票全削除
 * @param juchuHeadId 受注ヘッダーid
 * @param juchuKizaiHeadId 受注機材ヘッダーid
 * @param connection
 */
export const deleteAllShukoDen = async (juchuHeadId: number, juchuKizaiHeadId: number, connection: PoolClient) => {
  const query = `
    DELETE FROM
      ${SCHEMA}.t_nyushuko_den
    WHERE
      juchu_head_id = $1
      AND juchu_kizai_head_id = $2
      AND sagyo_kbn_id = ANY($3)
  `;

  const values = [juchuHeadId, juchuKizaiHeadId, [10, 20]];

  try {
    await connection.query(query, values);
  } catch (e) {
    throw e;
  }
};

/**
 * 入庫伝票全削除
 * @param juchuHeadId 受注ヘッダーid
 * @param juchuKizaiHeadId 受注機材ヘッダーid
 * @param connection
 */
export const deleteAllNyukoDen = async (juchuHeadId: number, juchuKizaiHeadId: number, connection: PoolClient) => {
  const query = `
    DELETE FROM
      ${SCHEMA}.t_nyushuko_den
    WHERE
      juchu_head_id = $1
      AND juchu_kizai_head_id = $2
      AND sagyo_kbn_id = $3
  `;

  const values = [juchuHeadId, juchuKizaiHeadId, 30];

  try {
    await connection.query(query, values);
  } catch (e) {
    throw e;
  }
};

/**
 * 入出庫伝票削除
 * @param juchuHeadId 受注ヘッダーid
 * @param juchuKizaiHeadId 受注機材ヘッダーid
 * @param juchuKizaiMeisaiIds 受注機材ヘッダーid
 * @returns
 */
export const deleteNyushukoDen = async (
  data: { juchu_head_id: number; juchu_kizai_head_id: number; juchu_kizai_meisai_id: number; kizai_id: number },
  connection: PoolClient
) => {
  const query = `
    DELETE FROM
      ${SCHEMA}.t_nyushuko_den
    WHERE
      juchu_head_id = $1
      AND juchu_kizai_head_id = $2
      AND juchu_kizai_meisai_id = $3
      AND kizai_id = $4
  `;

  const values = [data.juchu_head_id, data.juchu_kizai_head_id, data.juchu_kizai_meisai_id, data.kizai_id];

  try {
    await connection.query(query, values);
  } catch (e) {
    throw e;
  }
};

/**
 * 出庫伝票削除
 * @param data 出庫伝票削除データ
 * @param connection
 */
export const deleteShukoDen = async (
  data: {
    juchu_head_id: number;
    juchu_kizai_head_id: number;
    juchu_kizai_meisai_id: number;
    kizai_id: number;
  },
  connection: PoolClient
) => {
  const query = `
    DELETE FROM
      ${SCHEMA}.t_nyushuko_den
    WHERE
      juchu_head_id = $1
      AND juchu_kizai_head_id = $2
      AND juchu_kizai_meisai_id = $3
      AND kizai_id = $4
      AND sagyo_kbn_id = ANY($5)
  `;

  const values = [data.juchu_head_id, data.juchu_kizai_head_id, data.juchu_kizai_meisai_id, data.kizai_id, [10, 20]];

  try {
    await connection.query(query, values);
  } catch (e) {
    throw e;
  }
};

/**
 * 入庫伝票削除
 * @param data 入庫伝票削除データ
 * @param connection
 */
export const deleteNyukoDen = async (
  data: {
    juchu_head_id: number;
    juchu_kizai_head_id: number;
    juchu_kizai_meisai_id: number;
    kizai_id: number;
  },
  connection: PoolClient
) => {
  const query = `
    DELETE FROM
      ${SCHEMA}.t_nyushuko_den
    WHERE
      juchu_head_id = $1
      AND juchu_kizai_head_id = $2
      AND juchu_kizai_meisai_id = $3
      AND sagyo_kbn_id = $4
      AND kizai_id = $5
  `;

  const values = [data.juchu_head_id, data.juchu_kizai_head_id, data.juchu_kizai_meisai_id, 30, data.kizai_id];

  try {
    await connection.query(query, values);
  } catch (e) {
    throw e;
  }
};

/**
 * コンテナ入出庫伝票確認
 * @param data コンテナ入出庫伝票確認データ
 * @returns
 */
export const selectContainerNyushukoDenConfirm = async (data: {
  juchu_head_id: number;
  juchu_kizai_head_id: number;
  juchu_kizai_meisai_id: number;
  kizai_id: number;
  sagyo_id: number;
}) => {
  try {
    return await supabase
      .schema(SCHEMA)
      .from('t_nyushuko_den')
      .select('*')
      .eq('juchu_head_id', data.juchu_head_id)
      .eq('juchu_kizai_head_id', data.juchu_kizai_head_id)
      .eq('juchu_kizai_meisai_id', data.juchu_kizai_meisai_id)
      .eq('kizai_id', data.kizai_id)
      .eq('sagyo_id', data.sagyo_id);
  } catch (e) {
    throw e;
  }
};

/**
 * コンテナ入出庫伝票削除
 * @param data コンテナ入出庫伝票削除データ
 * @returns
 */
export const deleteContainerNyushukoDen = async (
  data: {
    juchu_head_id: number;
    juchu_kizai_head_id: number;
    juchu_kizai_meisai_id: number;
    kizai_id: number;
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
      ${SCHEMA}.t_nyushuko_den
    WHERE
      ${whereClause}
  `;

  try {
    await connection.query(query, values);
  } catch (e) {
    throw e;
  }
};

/**
 * 入出庫伝票補正数更新
 * @param data 補正数更新データ
 * @returns
 */
export const updateResultAdjQty = async (data: NyushukoDen) => {
  const whereKeys = [
    'juchu_head_id',
    'juchu_kizai_head_id',
    'sagyo_kbn_id',
    'sagyo_den_dat',
    'sagyo_id',
    'kizai_id',
  ] as const;

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
        ${SCHEMA}.t_nyushuko_den
      SET
        ${setClause}
      WHERE
        ${whereClause}
    `;
  try {
    await supabase
      .schema(SCHEMA)
      .from('t_nyushuko_den')
      .update(data)
      .eq('juchu_head_id', data.juchu_head_id)
      .eq('juchu_kizai_head_id', data.juchu_kizai_head_id)
      .eq('juchu_kizai_meisai_id', data.juchu_kizai_meisai_id)
      .eq('sagyo_kbn_id', data.sagyo_kbn_id)
      .eq('sagyo_den_dat', data.sagyo_den_dat)
      .eq('kizai_id', data.kizai_id)
      .eq('sagyo_id', data.sagyo_id);
  } catch (e) {
    throw e;
  }
};
