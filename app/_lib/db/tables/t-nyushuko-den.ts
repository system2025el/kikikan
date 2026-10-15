'use server';

import { Pool, PoolClient } from 'pg';

import { SAGYO_KBN_ID } from '@/app/_lib/constants';

import pool from '../postgres';
import { SCHEMA } from '../schema';
import { createClient } from '../supabase-server';
import { NyushukoDen } from '../types/t-nyushuko-den-type';

/**
 * 入出庫伝票新規追加
 * @param data 入出庫伝票データ
 * @returns
 */
export const insertNyushukoDen = async (data: NyushukoDen[], connection: PoolClient) => {
  if (!data || data.length === 0) {
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
    throw new Error('[insertNyushukoDen] DBエラー:', { cause: e });
  }
};

/**
 * 入出庫伝票更新(受注機材明細画面の機材明細からの更新以外)
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
    throw new Error('[updateNyushukoDen] DBエラー:', { cause: e });
  }
};

/**
 * 入出庫伝票更新(受注機材明細画面の機材明細からの更新)
 * @param data 入出庫伝票データ
 * @returns
 */
export const updateNyushukoDenFromKizaiMeisai = async (data: NyushukoDen, connection: PoolClient) => {
  const whereKeys = [
    'juchu_head_id',
    'juchu_kizai_head_id',
    'juchu_kizai_meisai_id',
    'sagyo_kbn_id',
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
    throw new Error('[updateNyushukoDenFromKizaiMeisai] DBエラー:', { cause: e });
  }
};

/**
 * 親機材入庫伝票更新
 * @param data 入出庫伝票データ
 * @param connection
 */
export const updateOyaKizaiNyukoDen = async (data: NyushukoDen, connection: PoolClient) => {
  const query = `
    UPDATE
      ${SCHEMA}.t_nyushuko_den
    SET
      plan_qty = plan_qty - $1,
      upd_dat = $2,
      upd_user = $3
    WHERE
      juchu_head_id = $4
      AND juchu_kizai_head_id = (
        SELECT 
          oya_juchu_kizai_head_id 
        FROM 
          ${SCHEMA}.t_juchu_kizai_head 
        WHERE 
          juchu_head_id = $4 
          AND juchu_kizai_head_id = $5
      )
      AND sagyo_kbn_id = $6
      AND kizai_id = $7
      AND dsp_ord_num = $8
  `;

  const values = [
    data.plan_qty,
    data.upd_dat,
    data.upd_user,
    data.juchu_head_id,
    data.juchu_kizai_head_id,
    data.sagyo_kbn_id,
    data.kizai_id,
    data.dsp_ord_num,
  ];

  try {
    await connection.query(query, values);
  } catch (e) {
    throw new Error('[updateOyaKizaiNyukoDen] DBエラー:', { cause: e });
  }
};

/**
 * 親コンテナ入庫伝票更新
 * @param data 入出庫伝票データ
 * @param connection
 */
export const updateOyaCtnNyukoDen = async (data: NyushukoDen, connection: PoolClient) => {
  const query = `
    UPDATE
      ${SCHEMA}.t_nyushuko_den
    SET
      plan_qty = plan_qty - $1,
      upd_dat = $2,
      upd_user = $3
    WHERE
      juchu_head_id = $4
      AND juchu_kizai_head_id = (
        SELECT 
          oya_juchu_kizai_head_id 
        FROM 
          ${SCHEMA}.t_juchu_kizai_head 
        WHERE 
          juchu_head_id = $4 
          AND juchu_kizai_head_id = $5
      )
      AND sagyo_kbn_id = $6
      AND sagyo_id = $7
      AND kizai_id = $8
      AND dsp_ord_num = $9
  `;

  const values = [
    data.plan_qty,
    data.upd_dat,
    data.upd_user,
    data.juchu_head_id,
    data.juchu_kizai_head_id,
    data.sagyo_kbn_id,
    data.sagyo_id,
    data.kizai_id,
    data.dsp_ord_num,
  ];

  try {
    await connection.query(query, values);
  } catch (e) {
    throw new Error('[updateOyaCtnNyukoDen] DBエラー:', { cause: e });
  }
};

/**
 * 入庫伝票の「到着で親から引いた読取数」取得（入庫明細画面の到着・到着解除用）
 * @param juchuHeadId 受注ヘッダーid
 * @param juchuKizaiHeadIds 受注機材ヘッダーid
 * @param sagyoDenDat 作業日時（入庫日時）
 * @param sagyoId 作業id（入庫場所）
 * 行をロック（FOR UPDATE）してから読むので、同時に到着・到着解除されても後の処理は先の COMMIT 後の値を読む
 * （2人がほぼ同時に解除しても、親に二重に戻さない）
 * @param connection
 * @returns 入庫チェック（作業区分30）の行ごとの nyuko_fix_qty と、親の更新に使う列
 */
export const selectNyukoFixQty = async (
  juchuHeadId: number,
  juchuKizaiHeadIds: number[],
  sagyoDenDat: string,
  sagyoId: number,
  connection: PoolClient
) => {
  const query = `
    SELECT
      d.juchu_head_id
      ,d.juchu_kizai_head_id
      ,d.juchu_kizai_meisai_id
      ,d.kizai_id
      ,d.nyuko_fix_qty
      ,d.dsp_ord_num
      ,d.indent_num
      ,d.sagyo_den_dat
      ,d.sagyo_id
      ,COALESCE(k.ctn_flg, 0) AS ctn_flg
    FROM
      ${SCHEMA}.t_nyushuko_den AS d
    LEFT JOIN
      ${SCHEMA}.m_kizai AS k
    ON
      k.kizai_id = d.kizai_id
    WHERE
      d.juchu_head_id = $1
      AND d.juchu_kizai_head_id = ANY($2::int[])
      AND d.sagyo_kbn_id = 30
      AND d.sagyo_den_dat = $3::timestamptz
      AND d.sagyo_id = $4
    FOR UPDATE OF d
  `;

  try {
    const result = await connection.query<{
      juchu_head_id: number;
      juchu_kizai_head_id: number;
      juchu_kizai_meisai_id: number;
      kizai_id: number;
      nyuko_fix_qty: number | null;
      dsp_ord_num: number | null;
      indent_num: number | null;
      sagyo_den_dat: Date;
      sagyo_id: number;
      ctn_flg: number;
    }>(query, [juchuHeadId, juchuKizaiHeadIds, sagyoDenDat, sagyoId]);
    return result.rows;
  } catch (e) {
    throw new Error('[selectNyukoFixQty] DBエラー:', { cause: e });
  }
};

/**
 * 入庫伝票の「到着で親から引いた読取数」を消す（到着解除用）
 * @param juchuHeadId 受注ヘッダーid
 * @param juchuKizaiHeadIds 受注機材ヘッダーid
 * @param sagyoDenDat 作業日時（入庫日時）
 * @param sagyoId 作業id（入庫場所）
 * @param connection
 */
export const clearNyukoFixQty = async (
  juchuHeadId: number,
  juchuKizaiHeadIds: number[],
  sagyoDenDat: string,
  sagyoId: number,
  connection: PoolClient
) => {
  const query = `
    UPDATE
      ${SCHEMA}.t_nyushuko_den
    SET
      nyuko_fix_qty = NULL
    WHERE
      juchu_head_id = $1
      AND juchu_kizai_head_id = ANY($2::int[])
      AND sagyo_kbn_id = 30
      AND sagyo_den_dat = $3::timestamptz
      AND sagyo_id = $4
      AND nyuko_fix_qty IS NOT NULL
  `;

  try {
    await connection.query(query, [juchuHeadId, juchuKizaiHeadIds, sagyoDenDat, sagyoId]);
  } catch (e) {
    throw new Error('[clearNyukoFixQty] DBエラー:', { cause: e });
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
    throw new Error('[upsertNyushukoDen] DBエラー:', { cause: e });
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
    throw new Error('[deleteAllNyushukoDen] DBエラー:', { cause: e });
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
    throw new Error('[deleteAllShukoDen] DBエラー:', { cause: e });
  }
};

/**
 * KICS/YARD出庫伝票全削除
 * @param juchuHeadId 受注ヘッダーid
 * @param juchuKizaiHeadId 受注機材ヘッダーid
 * @param sagyoId 出庫区分ID
 * @param connection
 */
export const deleteAllKicsOrYardShukoDen = async (
  juchuHeadId: number,
  juchuKizaiHeadId: number,
  sagyoId: number,
  connection: PoolClient
) => {
  const query = `
    DELETE FROM
      ${SCHEMA}.t_nyushuko_den
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
    throw new Error('[deleteAllKicsOrYardShukoDen] DBエラー:', { cause: e });
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
    throw new Error('[deleteAllNyukoDen] DBエラー:', { cause: e });
  }
};

/**
 * KICS/YARD入庫伝票全削除
 * @param juchuHeadId 受注ヘッダーid
 * @param juchuKizaiHeadId 受注機材ヘッダーid
 * @param sagyoId 出庫区分ID
 * @param connection
 */
export const deleteAllKicsOrYardNyukoDen = async (
  juchuHeadId: number,
  juchuKizaiHeadId: number,
  sagyoId: number,
  connection: PoolClient
) => {
  const query = `
    DELETE FROM
      ${SCHEMA}.t_nyushuko_den
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
    throw new Error('[deleteAllKicsOrYardNyukoDen] DBエラー:', { cause: e });
  }
};

/**
 * コンテナの出庫伝票（ピッキング・最終確認）の作業日時を更新（作業場所単位）
 * 出庫日時を変えたときに、伝票を削除せず日時だけ変えるために使う
 * @param juchuHeadId 受注ヘッダーid
 * @param juchuKizaiHeadId 受注機材ヘッダーid
 * @param sagyoId 作業id（作業場所）
 * @param sagyoDenDat 新しい作業日時
 * @param connection
 */
export const updateShukoCtnDenDat = async (
  juchuHeadId: number,
  juchuKizaiHeadId: number,
  sagyoId: number,
  sagyoDenDat: string,
  connection: PoolClient
) => {
  const query = `
    UPDATE
      ${SCHEMA}.t_nyushuko_den AS d
    SET
      sagyo_den_dat = $4
    FROM
      ${SCHEMA}.m_kizai AS k
    WHERE
      k.kizai_id = d.kizai_id
      AND k.ctn_flg = 1
      AND d.juchu_head_id = $1
      AND d.juchu_kizai_head_id = $2
      AND d.sagyo_id = $3
      AND d.sagyo_kbn_id = ANY($5)
  `;

  const values = [juchuHeadId, juchuKizaiHeadId, sagyoId, sagyoDenDat, [10, 20]];

  try {
    await connection.query(query, values);
  } catch (e) {
    throw new Error('[updateShukoCtnDenDat] DBエラー:', { cause: e });
  }
};

/**
 * 受注削除で残した機材の出庫伝票（ピッキング・最終確認）の作業日時を更新（作業場所単位）
 * 出庫日時を変えたときに、受注明細の無い伝票も新しい日時に移して、新しい日時の出庫明細に「受注削除」として出す。
 * 通常の機材の伝票は画面の明細ごとに日時を更新しているため、受注明細が無いこの行は別に更新する必要がある。
 * 「その作業場所の受注明細が無い」で判定する（明細はあっても出庫場所が違う＝送信とのすれ違いで残った行も含む）。
 * コンテナ（受注コンテナ明細を持つ）は updateShukoCtnDenDat で更新するので対象外
 * @param juchuHeadId 受注ヘッダーid
 * @param juchuKizaiHeadId 受注機材ヘッダーid
 * @param sagyoId 作業id（作業場所）
 * @param sagyoDenDat 新しい作業日時
 * @param connection
 */
export const updateDeletedShukoDenDat = async (
  juchuHeadId: number,
  juchuKizaiHeadId: number,
  sagyoId: number,
  sagyoDenDat: string,
  connection: PoolClient
) => {
  const query = `
    UPDATE
      ${SCHEMA}.t_nyushuko_den AS d
    SET
      sagyo_den_dat = $4
    FROM
      ${SCHEMA}.m_kizai AS k
    WHERE
      k.kizai_id = d.kizai_id
      AND COALESCE(k.ctn_flg, 0) <> 1
      AND d.juchu_head_id = $1
      AND d.juchu_kizai_head_id = $2
      AND d.sagyo_id = $3
      AND d.sagyo_kbn_id = ANY($5)
      AND NOT EXISTS (
        SELECT
          1
        FROM
          ${SCHEMA}.t_juchu_kizai_meisai AS m
        WHERE
          m.juchu_head_id = d.juchu_head_id
          AND m.juchu_kizai_head_id = d.juchu_kizai_head_id
          AND m.juchu_kizai_meisai_id = d.juchu_kizai_meisai_id
          AND m.kizai_id = d.kizai_id
          AND m.shozoku_id = d.sagyo_id
      )
  `;

  const values = [juchuHeadId, juchuKizaiHeadId, sagyoId, sagyoDenDat, [10, 20]];

  try {
    await connection.query(query, values);
  } catch (e) {
    throw new Error('[updateDeletedShukoDenDat] DBエラー:', { cause: e });
  }
};

/**
 * コンテナの出庫伝票（ピッキング・最終確認）を作業場所単位で全削除
 * @param juchuHeadId 受注ヘッダーid
 * @param juchuKizaiHeadId 受注機材ヘッダーid
 * @param sagyoId 作業id（作業場所）
 * @param connection
 */
export const deleteAllShukoCtnDenBasho = async (
  juchuHeadId: number,
  juchuKizaiHeadId: number,
  sagyoId: number,
  connection: PoolClient
) => {
  const query = `
    DELETE FROM
      ${SCHEMA}.t_nyushuko_den AS d
    USING
      ${SCHEMA}.m_kizai AS k
    WHERE
      k.kizai_id = d.kizai_id
      AND k.ctn_flg = 1
      AND d.juchu_head_id = $1
      AND d.juchu_kizai_head_id = $2
      AND d.sagyo_id = $3
      AND d.sagyo_kbn_id = ANY($4)
  `;

  const values = [juchuHeadId, juchuKizaiHeadId, sagyoId, [10, 20]];

  try {
    await connection.query(query, values);
  } catch (e) {
    throw new Error('[deleteAllShukoCtnDenBasho] DBエラー:', { cause: e });
  }
};

/**
 * コンテナ1件の出庫伝票（ピッキング・最終確認）を削除（作業場所単位）
 * @param data 受注ヘッダーid、受注機材ヘッダーid、受注機材明細id、機材id
 * @param sagyoId 作業id（作業場所）
 * @param connection
 */
export const deleteShukoCtnDen = async (
  data: { juchuHeadId: number; juchuKizaiHeadId: number; juchuKizaiMeisaiId: number; kizaiId: number },
  sagyoId: number,
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
      AND sagyo_id = $5
      AND sagyo_kbn_id = ANY($6)
  `;

  const values = [data.juchuHeadId, data.juchuKizaiHeadId, data.juchuKizaiMeisaiId, data.kizaiId, sagyoId, [10, 20]];

  try {
    await connection.query(query, values);
  } catch (e) {
    throw new Error('[deleteShukoCtnDen] DBエラー:', { cause: e });
  }
};

/**
 * コンテナの出庫チェック伝票（sagyo_kbn_id = 20）取得（トランザクション内。採番用）
 * @param juchuHeadId 受注ヘッダーid
 * @param juchuKizaiHeadId 受注機材ヘッダーid
 * @param connection
 * @returns 受注機材明細id、機材id、作業id、作業日時、表示順
 */
export const selectShukoCtnDenRowsTx = async (
  juchuHeadId: number,
  juchuKizaiHeadId: number,
  connection: PoolClient
) => {
  const query = `
    SELECT
      d.juchu_kizai_meisai_id,
      d.kizai_id,
      d.sagyo_id,
      d.sagyo_den_dat,
      d.dsp_ord_num
    FROM
      ${SCHEMA}.t_nyushuko_den AS d
      INNER JOIN ${SCHEMA}.m_kizai AS k
        ON k.kizai_id = d.kizai_id
        AND k.ctn_flg = 1
    WHERE
      d.juchu_head_id = $1
      AND d.juchu_kizai_head_id = $2
      AND d.sagyo_kbn_id = 20
  `;

  try {
    return (
      await connection.query<{
        juchu_kizai_meisai_id: number;
        kizai_id: number;
        sagyo_id: number;
        sagyo_den_dat: Date;
        dsp_ord_num: number | null;
      }>(query, [juchuHeadId, juchuKizaiHeadId])
    ).rows;
  } catch (e) {
    throw new Error('[selectShukoCtnDenRowsTx] DBエラー:', { cause: e });
  }
};

/**
 * 入出庫伝票テーブルを、送信RPCと同時に採番しないようロックする（トランザクション内、COMMIT/ROLLBACK で解除）
 * 送信RPC（nyushuko_send_*）は冒頭で SHARE モードのロックを取ってから明細idを採番する。
 * SHARE ROW EXCLUSIVE はその SHARE とも、このモードどうしとも衝突するので、Web と RPC の採番が順番に行われる
 * （RPC は Web の COMMIT まで待ってから最新の最大値を読む。デッドロックにはならない）
 * @param connection
 */
export const lockNyushukoDenForNumberingTx = async (connection: PoolClient) => {
  try {
    await connection.query(`LOCK TABLE ${SCHEMA}.t_nyushuko_den IN SHARE ROW EXCLUSIVE MODE`);
  } catch (e) {
    throw new Error('[lockNyushukoDenForNumberingTx] DBエラー:', { cause: e });
  }
};

/**
 * コンテナの入庫伝票（sagyo_kbn_id = 30）を削除（コンテナ・入庫場所を指定）
 * @param juchuHeadId 受注ヘッダーid
 * @param juchuKizaiHeadId 受注機材ヘッダーid
 * @param targets 削除するコンテナ（受注機材明細id、機材id、作業id＝入庫場所）
 * @param connection
 */
export const deleteNyukoCtnDen = async (
  juchuHeadId: number,
  juchuKizaiHeadId: number,
  targets: { juchuKizaiMeisaiId: number; kizaiId: number; sagyoId: number }[],
  connection: PoolClient
) => {
  if (targets.length === 0) return;

  const query = `
    DELETE FROM
      ${SCHEMA}.t_nyushuko_den
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
    throw new Error('[deleteNyukoCtnDen] DBエラー:', { cause: e });
  }
};

/**
 * コンテナの入庫伝票（sagyo_kbn_id = 30）の予定数を更新（コンテナ・入庫場所を指定）
 * @param juchuHeadId 受注ヘッダーid
 * @param juchuKizaiHeadId 受注機材ヘッダーid
 * @param juchuKizaiMeisaiId 受注機材明細id
 * @param kizaiId 機材id
 * @param sagyoId 作業id（入庫場所）
 * @param planQty 予定数
 * @param userNam ユーザー名
 * @param connection
 */
export const updateNyukoCtnDenPlanQty = async (
  juchuHeadId: number,
  juchuKizaiHeadId: number,
  juchuKizaiMeisaiId: number,
  kizaiId: number,
  sagyoId: number,
  planQty: number,
  userNam: string,
  connection: PoolClient
) => {
  const query = `
    UPDATE
      ${SCHEMA}.t_nyushuko_den
    SET
      plan_qty = $6,
      upd_dat = $7,
      upd_user = $8
    WHERE
      juchu_head_id = $1
      AND juchu_kizai_head_id = $2
      AND juchu_kizai_meisai_id = $3
      AND kizai_id = $4
      AND sagyo_id = $5
      AND sagyo_kbn_id = 30
  `;

  try {
    await connection.query(query, [
      juchuHeadId,
      juchuKizaiHeadId,
      juchuKizaiMeisaiId,
      kizaiId,
      sagyoId,
      planQty,
      new Date().toISOString(),
      userNam,
    ]);
  } catch (e) {
    throw new Error('[updateNyukoCtnDenPlanQty] DBエラー:', { cause: e });
  }
};

export const deleteAllKicsOrYardShukoCtnDen = async (
  juchuHeadId: number,
  juchuKizaiHeadId: number,
  kizaiIds: number[],
  sagyoId: number,
  connection: PoolClient
) => {
  const query = `
      DELETE FROM
        ${SCHEMA}.t_nyushuko_den
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
    throw new Error('[deleteAllKicsOrYardCtnShukoDen] DBエラー:', { cause: e });
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
    throw new Error('[deleteNyushukoDen] DBエラー:', { cause: e });
  }
};

/**
 * 受注削除として予定数0で残す出庫伝票行の条件（d は対象の伝票行）
 * ・出庫（ピッキング・最終確認）で実績・補正がある
 * ・ピッキングの行は、同じ日時・場所の最終確認に実績・補正が無いときだけ
 * deleteNyushukoDenKeepResulted（明細の削除）と moveShukoDenToDeletedMeisai（出庫場所の変更）で共通
 * @returns SQL の条件式
 */
const shukoKeepCondition = () => `
    d.sagyo_kbn_id IN (${SAGYO_KBN_ID.shukoPicking}, ${SAGYO_KBN_ID.shukoConfirmation})
    AND COALESCE(d.result_qty, 0) + COALESCE(d.result_adj_qty, 0) > 0
    AND NOT (
      d.sagyo_kbn_id = ${SAGYO_KBN_ID.shukoPicking}
      AND EXISTS (
        SELECT
          1
        FROM
          ${SCHEMA}.t_nyushuko_den AS c
        WHERE
          c.juchu_head_id = d.juchu_head_id
          AND c.juchu_kizai_head_id = d.juchu_kizai_head_id
          AND c.juchu_kizai_meisai_id = d.juchu_kizai_meisai_id
          AND c.kizai_id = d.kizai_id
          AND c.sagyo_kbn_id = ${SAGYO_KBN_ID.shukoConfirmation}
          AND c.sagyo_den_dat = d.sagyo_den_dat
          AND c.sagyo_id = d.sagyo_id
          AND COALESCE(c.result_qty, 0) + COALESCE(c.result_adj_qty, 0) > 0
      )
    )
  `;

/**
 * 出庫場所が変わった機材の、元の場所の実績ある出庫伝票を受注削除として残す（新しい明細idに付け替えて予定数0にする）
 *
 * 出庫場所を変えても受注機材明細（明細id・機材）は残るため、そのまま予定数0にしても「受注明細が無い＝受注削除」の
 * 判定（v_nyushuko_den2_lst・updateDeletedShukoDenDat など）に乗らず、明細id単位で場所を見ずに動く処理
 * （delShukoDen・delShukoResult・updShukoResult）にも巻き込まれる。未使用の明細idに付け替えることで、
 * 明細を削除したときの受注削除と同じ扱いにする。
 * 残す条件は deleteNyushukoDenKeepResulted と同じ。付け替えなかった行は呼び出し元で今までどおり削除する。
 * 実績は moveShukoResultToDeletedMeisai で付け替える（この関数の後に呼ぶ）。
 *
 * @param data 対象の明細（受注ヘッダーid・受注機材ヘッダーid・変更前の明細id・機材id）
 * @param oldSagyoId 変更前の出庫場所
 * @param newMeisaiId 付け替え先の明細id（未使用のもの）
 * @param updDat 更新日時
 * @param updUser 更新者
 * @param connection
 */
export const moveShukoDenToDeletedMeisai = async (
  data: { juchu_head_id: number; juchu_kizai_head_id: number; juchu_kizai_meisai_id: number; kizai_id: number },
  oldSagyoId: number,
  newMeisaiId: number,
  updDat: string,
  updUser: string,
  connection: PoolClient
) => {
  const query = `
    UPDATE
      ${SCHEMA}.t_nyushuko_den AS d
    SET
      juchu_kizai_meisai_id = $6
      ,plan_qty = 0
      ,upd_dat = $7
      ,upd_user = $8
    WHERE
      d.juchu_head_id = $1
      AND d.juchu_kizai_head_id = $2
      AND d.juchu_kizai_meisai_id = $3
      AND d.kizai_id = $4
      AND d.sagyo_id = $5
      AND ${shukoKeepCondition()}
  `;

  try {
    const { rowCount } = await connection.query(query, [
      data.juchu_head_id,
      data.juchu_kizai_head_id,
      data.juchu_kizai_meisai_id,
      data.kizai_id,
      oldSagyoId,
      newMeisaiId,
      updDat,
      updUser,
    ]);
    return rowCount ?? 0;
  } catch (e) {
    throw new Error('[moveShukoDenToDeletedMeisai] DBエラー:', { cause: e });
  }
};

/**
 * 入出庫伝票削除（出庫実績が残っている行は予定数0にして残す）
 *
 * 受注機材明細を削除しても、既にピッキングで読み取られている出庫伝票行は消さずに
 * 予定数0にして残す。差異（実績−予定）が過剰として検出されるため、出庫画面に
 * 「受注から削除された＝現物をカートから取り除くべきもの」として表示できる。
 * 実績のない出庫行と入庫行は従来どおり物理削除する。
 *
 * ピッキング（10）の行は、同じ日時・場所の最終確認（20）に実績・補正があれば残さず削除する。
 * 現物は最終確認まで進んでいるので、最終確認の段階で取り除けば足りる（ピッキングと最終確認の
 * 両方に残すと、それぞれで実績をクリアする二度手間になり、出発後もピッキングの△が残るため）。
 *
 * @param data 入出庫伝票削除データ
 * @param updDat 更新日時
 * @param updUser 更新者
 * @param connection
 */
export const deleteNyushukoDenKeepResulted = async (
  data: { juchu_head_id: number; juchu_kizai_head_id: number; juchu_kizai_meisai_id: number; kizai_id: number },
  updDat: string,
  updUser: string,
  connection: PoolClient
) => {
  const keys = [data.juchu_head_id, data.juchu_kizai_head_id, data.juchu_kizai_meisai_id, data.kizai_id];
  const keepCondition = shukoKeepCondition();

  // 残す行は予定数0にする
  const updateQuery = `
    UPDATE
      ${SCHEMA}.t_nyushuko_den AS d
    SET
      plan_qty = 0
      ,upd_dat = $5
      ,upd_user = $6
    WHERE
      d.juchu_head_id = $1
      AND d.juchu_kizai_head_id = $2
      AND d.juchu_kizai_meisai_id = $3
      AND d.kizai_id = $4
      AND ${keepCondition}
  `;

  // それ以外（入庫行・実績のない出庫行・最終確認に実績があるピッキング行）は削除
  const deleteQuery = `
    DELETE FROM
      ${SCHEMA}.t_nyushuko_den AS d
    WHERE
      d.juchu_head_id = $1
      AND d.juchu_kizai_head_id = $2
      AND d.juchu_kizai_meisai_id = $3
      AND d.kizai_id = $4
      AND NOT (${keepCondition})
  `;

  try {
    await connection.query(updateQuery, [...keys, updDat, updUser]);
    await connection.query(deleteQuery, keys);
  } catch (e) {
    throw new Error('[deleteNyushukoDenKeepResulted] DBエラー:', { cause: e });
  }
};

/**
 * 出庫実績または補正数がある機材の件数を取得
 *
 * 受注機材明細の削除確認ダイアログで「既に実績があります」の警告を出すために使う。
 * ピッキング(10)と最終確認(20)の両方が対象。
 * deleteNyushukoDenKeepResulted が残す行とまったく同じ条件で数えるため、RFIDタグを
 * 付けられない機材で補正数だけ入っているケースも拾える。
 * 3つの配列は同じ長さで、同じ添字が1つの明細を表す。
 *
 * @param juchuHeadId 受注ヘッダーid
 * @param juchuKizaiHeadIds 受注機材ヘッダーidの配列
 * @param juchuKizaiMeisaiIds 受注機材明細idの配列
 * @param kizaiIds 機材idの配列
 * @returns 出庫実績または補正数がある機材の件数
 */
export const selectShukoResultDenKizaiCount = async (
  juchuHeadId: number,
  juchuKizaiHeadIds: number[],
  juchuKizaiMeisaiIds: number[],
  kizaiIds: number[]
) => {
  const query = `
    SELECT
      COUNT(DISTINCT (d.juchu_kizai_head_id, d.juchu_kizai_meisai_id, d.kizai_id))::integer AS kizai_cnt
    FROM
      ${SCHEMA}.t_nyushuko_den AS d
      JOIN unnest($2::integer[], $3::integer[], $4::integer[])
        AS k(juchu_kizai_head_id, juchu_kizai_meisai_id, kizai_id)
        ON d.juchu_kizai_head_id = k.juchu_kizai_head_id
        AND d.juchu_kizai_meisai_id = k.juchu_kizai_meisai_id
        AND d.kizai_id = k.kizai_id
    WHERE
      d.juchu_head_id = $1
      AND d.sagyo_kbn_id = ANY($5)
      AND COALESCE(d.result_qty, 0) + COALESCE(d.result_adj_qty, 0) > 0
  `;

  const values = [
    juchuHeadId,
    juchuKizaiHeadIds,
    juchuKizaiMeisaiIds,
    kizaiIds,
    [SAGYO_KBN_ID.shukoPicking, SAGYO_KBN_ID.shukoConfirmation],
  ];

  try {
    return (await pool.query(query, values)).rows;
  } catch (e) {
    throw new Error('[selectShukoResultDenKizaiCount] DBエラー:', { cause: e });
  }
};

/**
 * 受注明細が存在せず、実績数・補正数が0になった入出庫伝票を削除
 *
 * 受注明細が無く実績も補正も0の伝票行は、どこからも参照されず表示する意味も無いので削除する。
 * 対象は2種類ある。
 * - deleteNyushukoDenKeepResulted で残した「受注から削除された」行（予定数0）。現場が現物を
 *   取り除いた時点で不要になる。
 * - ハンディが予定外に読み取って作った行（予定数に読取数が入る）。誤送信した場合に、出発して
 *   受注明細を作ってから消すのではなく、実績を消すだけで伝票ごと消せるようにする。
 * 予定数は種類によって0だったり読取数だったりするため、条件に含めない。
 *
 * 1つの明細は機材（t_juchu_kizai_meisai）とコンテナ（t_juchu_ctn_meisai）のどちらか
 * 一方にしか存在しないため、両方に無いことを確認すればコンテナも正しく判定できる。
 * 受注明細がある行（コンテナ片側0や数量0保存などの正当な数量0の行を含む）は削除されない。
 *
 * @param data 入出庫伝票データ
 * @param connection トランザクション中の PoolClient、または Pool
 * @returns 削除した場合true
 */
export const deleteEmptyNyushukoDen = async (
  data: {
    juchu_head_id: number;
    juchu_kizai_head_id: number;
    juchu_kizai_meisai_id: number;
    sagyo_kbn_id: number;
    sagyo_den_dat: string;
    sagyo_id: number;
    kizai_id: number;
  },
  connection: PoolClient | Pool
) => {
  const query = `
    DELETE FROM
      ${SCHEMA}.t_nyushuko_den AS d
    WHERE
      d.juchu_head_id = $1
      AND d.juchu_kizai_head_id = $2
      AND d.juchu_kizai_meisai_id = $3
      AND d.sagyo_kbn_id = $4
      AND d.sagyo_den_dat = $5
      AND d.sagyo_id = $6
      AND d.kizai_id = $7
      AND COALESCE(d.result_qty, 0) = 0
      AND COALESCE(d.result_adj_qty, 0) = 0
      AND NOT EXISTS (
        SELECT
          1
        FROM
          ${SCHEMA}.t_juchu_kizai_meisai AS m
        WHERE
          m.juchu_head_id = d.juchu_head_id
          AND m.juchu_kizai_head_id = d.juchu_kizai_head_id
          AND m.juchu_kizai_meisai_id = d.juchu_kizai_meisai_id
          AND m.kizai_id = d.kizai_id
      )
      AND NOT EXISTS (
        SELECT
          1
        FROM
          ${SCHEMA}.t_juchu_ctn_meisai AS c
        WHERE
          c.juchu_head_id = d.juchu_head_id
          AND c.juchu_kizai_head_id = d.juchu_kizai_head_id
          AND c.juchu_kizai_meisai_id = d.juchu_kizai_meisai_id
          AND c.kizai_id = d.kizai_id
          AND c.shozoku_id = d.sagyo_id
      )
  `;

  const values = [
    data.juchu_head_id,
    data.juchu_kizai_head_id,
    data.juchu_kizai_meisai_id,
    data.sagyo_kbn_id,
    data.sagyo_den_dat,
    data.sagyo_id,
    data.kizai_id,
  ];

  try {
    const result = await connection.query(query, values);
    return (result.rowCount ?? 0) > 0;
  } catch (e) {
    throw new Error('[deleteEmptyNyushukoDen] DBエラー:', { cause: e });
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
    throw new Error('[deleteShukoDen] DBエラー:', { cause: e });
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
    throw new Error('[deleteNyukoDen] DBエラー:', { cause: e });
  }
};

/**
 * 出庫伝票削除(KICS/YARD)
 * @param data 入庫伝票削除データ
 * @param connection
 */
export const deleteKicsOrYardShukoDen = async (
  data: {
    juchu_head_id: number;
    juchu_kizai_head_id: number;
    juchu_kizai_meisai_id: number;
    kizai_id: number;
    sagyo_id: number;
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
      AND sagyo_kbn_id = ANY($4)
      AND kizai_id = $5
      AND sagyo_id = $6
  `;

  const values = [
    data.juchu_head_id,
    data.juchu_kizai_head_id,
    data.juchu_kizai_meisai_id,
    [10, 20],
    data.kizai_id,
    data.sagyo_id,
  ];

  try {
    await connection.query(query, values);
  } catch (e) {
    throw new Error('[deleteKicsOrYardShukoDen] DBエラー:', { cause: e });
  }
};

/**
 * 入庫伝票削除(KICS/YARD)
 * @param data 入庫伝票削除データ
 * @param connection
 */
export const deleteKicsOrYardNyukoDen = async (
  data: {
    juchu_head_id: number;
    juchu_kizai_head_id: number;
    juchu_kizai_meisai_id: number;
    kizai_id: number;
    sagyo_id: number;
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
      AND sagyo_id = $6
  `;

  const values = [
    data.juchu_head_id,
    data.juchu_kizai_head_id,
    data.juchu_kizai_meisai_id,
    30,
    data.kizai_id,
    data.sagyo_id,
  ];

  try {
    await connection.query(query, values);
  } catch (e) {
    throw new Error('[deleteKicsOrYardNyukoDen] DBエラー:', { cause: e });
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
  const supabase = await createClient();
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
    throw new Error('[selectContainerNyushukoDenConfirm] DBエラー:', { cause: e });
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
    throw new Error('[deleteContainerNyushukoDen] DBエラー:', { cause: e });
  }
};

/**
 * 入出庫伝票補正数更新
 * @param data 補正数更新データ
 * @returns
 */
export const updateResultAdjQty = async (data: NyushukoDen) => {
  // const whereKeys = [
  //   'juchu_head_id',
  //   'juchu_kizai_head_id',
  //   'juchu_kizai_meisai_id',
  //   'sagyo_kbn_id',
  //   'sagyo_den_dat',
  //   'sagyo_id',
  //   'kizai_id',
  // ] as const;

  // const allKeys = Object.keys(data) as (keyof typeof data)[];

  // const updateKeys = allKeys.filter((key) => !(whereKeys as readonly string[]).includes(key));

  // if (updateKeys.length === 0) {
  //   throw new Error('No columns to update.');
  // }

  // const allValues: (string | number | null | undefined)[] = [];
  // let placeholderIndex = 1;

  // const setClause = updateKeys
  //   .map((key) => {
  //     allValues.push(data[key]);
  //     return `${key} = $${placeholderIndex++}`;
  //   })
  //   .join(', ');

  // const whereClause = whereKeys
  //   .map((key) => {
  //     allValues.push(data[key]);
  //     return `${key} = $${placeholderIndex++}`;
  //   })
  //   .join(' AND ');

  // const query = `
  //     UPDATE
  //       ${SCHEMA}.t_nyushuko_den
  //     SET
  //       ${setClause}
  //     WHERE
  //       ${whereClause}
  //   `;
  try {
    const supabase = await createClient();
    return await supabase
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
    throw new Error('[updateResultAdjQty] DBエラー:', { cause: e });
  }
};

export const deleteNyushukoDenFromOrder = async (
  juchuHeadId: number,
  juchuKizaiHeadId: number,
  connection: PoolClient
) => {
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
    throw new Error('[deleteNyushukoDenFromOrder] DBエラー:', { cause: e });
  }
};
