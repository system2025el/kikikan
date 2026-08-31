'use server';

import { PoolClient } from 'pg';

import { JUCHU_KIZAI_HEAD_KBN } from '@/app/_lib/constants';
import { KeepJuchuKizaiHeadValues } from '@/app/(main)/(eq-order-detail)/eq-keep-order-detail/[juchuHeadId]/[juchuKizaiHeadId]/[oyaJuchuKizaiHeadId]/[mode]/_lib/types';
import { JuchuKizaiHeadValues } from '@/app/(main)/(eq-order-detail)/eq-main-order-detail/[juchuHeadId]/[juchuKizaiHeadId]/[mode]/_lib/types';

import pool from '../postgres';
import { SCHEMA } from '../schema';
import { createClient } from '../supabase-server';
import { JuchuKizaiHead } from '../types/t-juchu-kizai-head-type';

/**
 * 受注機材ヘッダーid最大値取得
 * @returns 受注機材ヘッダーid最大値
 */
export const selectJuchuKizaiHeadMaxId = async (juchuHeadId: number) => {
  const supabase = await createClient();
  try {
    return await supabase
      .schema(SCHEMA)
      .from('t_juchu_kizai_head')
      .select('juchu_kizai_head_id')
      .eq('juchu_head_id', juchuHeadId)
      .order('juchu_kizai_head_id', {
        ascending: false,
      })
      .limit(1)
      .single();
  } catch (e) {
    throw new Error('[selectJuchuKizaiHeadMaxId] DBエラー:', { cause: e });
  }
};

/**
 * 受注機材ヘッダー取得
 * @param juchuHeadId 受注ヘッダーid
 * @param juchuKizaiHeadId 受注機材ヘッダーid
 * @returns 受注機材ヘッダーデータ
 */
export const selectJuchuKizaiHead = async (juchuHeadId: number, juchuKizaiHeadId: number) => {
  const supabase = await createClient();
  try {
    return await supabase
      .schema(SCHEMA)
      .from('t_juchu_kizai_head')
      .select(
        'juchu_head_id, juchu_kizai_head_id, juchu_kizai_head_kbn, juchu_honbanbi_qty, nebiki_amt, mem, head_nam, nebiki_rat'
      )
      .eq('juchu_head_id', juchuHeadId)
      .eq('juchu_kizai_head_id', juchuKizaiHeadId)
      .single();
  } catch (e) {
    throw new Error('[selectJuchuKizaiHead] DBエラー:', { cause: e });
  }
};

/**
 * キープ受注機材ヘッダー取得
 * @param juchuHeadId 受注ヘッダーid
 * @param juchuKizaiHeadId 受注機材ヘッダーid
 * @returns 受注機材ヘッダーデータ
 */
export const selectKeepJuchuKizaiHead = async (juchuHeadId: number, juchuKizaiHeadId: number) => {
  const supabase = await createClient();
  try {
    return await supabase
      .schema(SCHEMA)
      .from('t_juchu_kizai_head')
      .select('juchu_head_id, juchu_kizai_head_id, juchu_kizai_head_kbn, mem, head_nam, oya_juchu_kizai_head_id')
      .eq('juchu_head_id', juchuHeadId)
      .eq('juchu_kizai_head_id', juchuKizaiHeadId)
      .single();
  } catch (e) {
    throw new Error('[selectKeepJuchuKizaiHead] DBエラー:', { cause: e });
  }
};

/**
 * 返却受注機材ヘッダー取得
 * @param juchuHeadId 受注ヘッダーid
 * @param juchuKizaiHeadId 受注機材ヘッダーid
 * @returns 受注機材ヘッダーデータ
 */
export const selectReturnJuchuKizaiHead = async (juchuHeadId: number, juchuKizaiHeadId: number) => {
  const supabase = await createClient();
  try {
    return await supabase
      .schema(SCHEMA)
      .from('t_juchu_kizai_head')
      .select(
        'juchu_head_id, juchu_kizai_head_id, juchu_kizai_head_kbn, juchu_honbanbi_qty, nebiki_amt, mem, head_nam, oya_juchu_kizai_head_id'
      )
      .eq('juchu_head_id', juchuHeadId)
      .eq('juchu_kizai_head_id', juchuKizaiHeadId)
      .single();
  } catch (e) {
    throw new Error('[selectReturnJuchuKizaiHead] DBエラー:', { cause: e });
  }
};

/**
 * 子受注機材ヘッダー確認
 * @param juchuHeadId 受注ヘッダーid
 * @returns
 */
export const selectChildJuchuKizaiHeadConfirm = async (juchuHeadId: number, juchuKizaiHeadIdv: number[]) => {
  const supabase = await createClient();
  try {
    return await supabase
      .schema(SCHEMA)
      .from('t_juchu_kizai_head')
      .select('*', { count: 'exact', head: true })
      .eq('juchu_head_id', juchuHeadId)
      .in('oya_juchu_kizai_head_id', juchuKizaiHeadIdv)
      .neq('juchu_kizai_head_kbn', JUCHU_KIZAI_HEAD_KBN.normal);
  } catch (e) {
    throw new Error('[selectChildJuchuKizaiHeadConfirm] DBエラー:', { cause: e });
  }
};

/**
 * 受注本番日数取得
 * @param juchuHeadId 受注ヘッダーid
 * @param juchuKizaiHeadId 受注機材ヘッダーid
 * @returns
 */
export const selectJuchuHonbanbiQty = async (juchuHeadId: number, juchuKizaiHeadId: number) => {
  const supabase = await createClient();
  try {
    return await supabase
      .schema(SCHEMA)
      .from('t_juchu_kizai_head')
      .select('juchu_honbanbi_qty')
      .eq('juchu_head_id', juchuHeadId)
      .eq('juchu_kizai_head_id', juchuKizaiHeadId)
      .single();
  } catch (e) {
    throw new Error('[selectJuchuHonbanbiQty] DBエラー:', { cause: e });
  }
};

/**
 * 受注本番日最大値取得
 * @param juchuId 受注ヘッダーid
 * @returns
 */
export const selectMaxJuchuHonbanbiQty = async (juchuId: number) => {
  const supabase = await createClient();
  try {
    return await supabase
      .schema(SCHEMA)
      .from('t_juchu_kizai_head')
      .select('juchu_honbanbi_qty')
      .eq('juchu_head_id', juchuId)
      .order('juchu_honbanbi_qty', { ascending: false, nullsFirst: false });
  } catch (e) {
    throw new Error('[selectMaxJuchuHonbanbiQty] DBエラー:', { cause: e });
  }
};

/**
 * 通常の受注機材ヘッダーと、その出庫日〜入庫日を取得
 * KICS/YARDのうち出庫は最も早い日、入庫は最も遅い日を採る（getShukoDate/getNyukoDateと同じ考え方）。
 * @param juchuHeadId 受注ヘッダーid
 * @param connection コネクション
 * @returns 受注機材ヘッダーidと出庫日・入庫日
 */
export const selectNormalKizaiHeadRanges = async (juchuHeadId: number, connection: PoolClient) => {
  const query = `
    SELECT
      k.juchu_kizai_head_id AS "juchuKizaiHeadId",
      min(s.nyushuko_dat)::date AS "shukoDat",
      max(n.nyushuko_dat)::date AS "nyukoDat"
    FROM
      ${SCHEMA}.t_juchu_kizai_head k
    LEFT JOIN
      ${SCHEMA}.t_juchu_kizai_nyushuko s
      ON s.juchu_head_id = k.juchu_head_id AND s.juchu_kizai_head_id = k.juchu_kizai_head_id
      AND s.nyushuko_shubetu_id = 1
    LEFT JOIN
      ${SCHEMA}.t_juchu_kizai_nyushuko n
      ON n.juchu_head_id = k.juchu_head_id AND n.juchu_kizai_head_id = k.juchu_kizai_head_id
      AND n.nyushuko_shubetu_id = 2
    WHERE
      k.juchu_head_id = $1
      AND k.juchu_kizai_head_kbn = $2
    GROUP BY
      k.juchu_kizai_head_id
    ORDER BY
      k.juchu_kizai_head_id
  `;

  const values = [juchuHeadId, JUCHU_KIZAI_HEAD_KBN.normal];

  try {
    return await connection.query<{ juchuKizaiHeadId: number; shukoDat: Date | null; nyukoDat: Date | null }>(
      query,
      values
    );
  } catch (e) {
    throw new Error('[selectNormalKizaiHeadRanges] DBエラー:', { cause: e });
  }
};

/**
 * 受注機材ヘッダーの本番日数のみ更新
 * 受注本番日テンプレートを展開し直した際に、金額算出用の本番日数を合わせるために使う。
 * @param juchuHeadId 受注ヘッダーid
 * @param juchuKizaiHeadId 受注機材ヘッダーid
 * @param juchuHonbanbiQty 本番日数
 * @param userNam ユーザー名
 * @param connection コネクション
 */
export const updateJuchuHonbanbiQty = async (
  juchuHeadId: number,
  juchuKizaiHeadId: number,
  juchuHonbanbiQty: number,
  userNam: string,
  connection: PoolClient
) => {
  const query = `
    UPDATE
      ${SCHEMA}.t_juchu_kizai_head
    SET
      juchu_honbanbi_qty = $3,
      upd_dat = $4,
      upd_user = $5
    WHERE
      juchu_head_id = $1
      AND juchu_kizai_head_id = $2
  `;

  const values = [juchuHeadId, juchuKizaiHeadId, juchuHonbanbiQty, new Date().toISOString(), userNam];

  try {
    await connection.query(query, values);
  } catch (e) {
    throw new Error('[updateJuchuHonbanbiQty] DBエラー:', { cause: e });
  }
};

/**
 * 受注機材ヘッダー新規追加
 * @param juchuKizaiHeadId 受注機材ヘッダーid
 * @param juchuKizaiHeadData 受注機材ヘッダーデータ
 * @param dspOrdNum 表示順
 * @param userNam ユーザー名
 * @returns
 */
export const insertJuchuKizaiHead = async (data: JuchuKizaiHead, connection: PoolClient) => {
  const cols = Object.keys(data);
  const values = Object.values(data);
  const placeholders = values.map((_, i) => `$${i + 1}`).join(', ');

  const query = `
      INSERT INTO
        ${SCHEMA}.t_juchu_kizai_head (${cols.join(',')})
      VALUES 
        (${placeholders})
    `;
  try {
    await connection.query(query, values);
  } catch (e) {
    throw new Error('[insertJuchuKizaiHead] DBエラー:', { cause: e });
  }
};

/**
 * キープ受注機材ヘッダー新規追加
 * @param data キープ受注機材ヘッダーデータ
 * @returns
 */
export const insertKeepJuchuKizaiHead = async (data: JuchuKizaiHead, connection: PoolClient) => {
  const cols = Object.keys(data);
  const values = Object.values(data);
  const placeholders = values.map((_, i) => `$${i + 1}`).join(', ');

  const query = `
      INSERT INTO
        ${SCHEMA}.t_juchu_kizai_head (${cols.join(',')})
      VALUES 
        (${placeholders})
    `;

  try {
    await connection.query(query, values);
  } catch (e) {
    throw new Error('[insertKeepJuchuKizaiHead] DBエラー:', { cause: e });
  }
};

/**
 * 返却受注機材ヘッダー新規追加
 * @param data 返却受注機材ヘッダーデータ
 * @returns
 */
export const insertReturnJuchuKizaiHead = async (data: JuchuKizaiHead, connection: PoolClient) => {
  const cols = Object.keys(data);
  const values = Object.values(data);
  const placeholders = values.map((_, i) => `$${i + 1}`).join(', ');

  const query = `
      INSERT INTO
        ${SCHEMA}.t_juchu_kizai_head (${cols.join(',')})
      VALUES 
        (${placeholders})
    `;

  try {
    await connection.query(query, values);
  } catch (e) {
    throw new Error('[insertReturnJuchuKizaiHead] DBエラー:', { cause: e });
  }
};

/**
 * 受注機材ヘッダー更新
 * @param juchuKizaiHeadData 受注機材ヘッダーデータ
 * @param userNam ユーザー名
 * @returns
 */
export const updateJuchuKizaiHead = async (data: JuchuKizaiHead, connection: PoolClient) => {
  const whereKeys = ['juchu_head_id', 'juchu_kizai_head_id'] as const;

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
        ${SCHEMA}.t_juchu_kizai_head
      SET
        ${setClause}
      WHERE
        ${whereClause}
    `;
  try {
    await connection.query(query, allValues);
  } catch (e) {
    throw new Error('[updateJuchuKizaiHead] DBエラー:', { cause: e });
  }
};

/**
 * キープ受注機材ヘッダー更新
 * @param juchuKizaiHeadData 受注機材ヘッダーデータ
 * @param userNam ユーザー名
 * @returns
 */
export const updateKeepJuchuKizaiHead = async (data: JuchuKizaiHead, connection: PoolClient) => {
  const whereKeys = ['juchu_head_id', 'juchu_kizai_head_id', 'juchu_kizai_head_kbn'] as const;

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
        ${SCHEMA}.t_juchu_kizai_head
      SET
        ${setClause}
      WHERE
        ${whereClause}
    `;
  try {
    await connection.query(query, allValues);
  } catch (e) {
    throw new Error('[updateKeepJuchuKizaiHead] DBエラー:', { cause: e });
  }
};

/**
 * 返却受注機材ヘッダー更新
 * @param juchuKizaiHeadData 受注機材ヘッダーデータ
 * @param userNam ユーザー名
 * @returns
 */
export const updateReturnJuchuKizaiHead = async (data: JuchuKizaiHead, connection: PoolClient) => {
  const whereKeys = ['juchu_head_id', 'juchu_kizai_head_id', 'juchu_kizai_head_kbn'] as const;

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
        ${SCHEMA}.t_juchu_kizai_head
      SET
        ${setClause}
      WHERE
        ${whereClause}
    `;
  try {
    await connection.query(query, allValues);
  } catch (e) {
    throw new Error('[updateReturnJuchuKizaiHead] DBエラー:', { cause: e });
  }
};

/**
 * 受注機材ヘッダー削除
 * @param juchuHeadId 受注ヘッダーid
 * @param juchuKizaiHeadId 受注機材ヘッダーid
 * @param connection
 */
export const deleteJuchuKizaiHead = async (juchuHeadId: number, juchuKizaiHeadId: number, connection: PoolClient) => {
  const query = `
    DELETE FROM
      ${SCHEMA}.t_juchu_kizai_head
    WHERE
      juchu_head_id = $1
      AND juchu_kizai_head_id = $2
  `;

  const values = [juchuHeadId, juchuKizaiHeadId];

  try {
    await connection.query(query, values);
  } catch (e) {
    throw new Error('[deleteJuchuKizaiHead] DBエラー:', { cause: e });
  }
};
