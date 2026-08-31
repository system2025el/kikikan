'use server';

import { PoolClient } from 'pg';

import { HONBANBI_SHUBETU_ID } from '@/app/_lib/constants';

import { SCHEMA } from '../schema';
import { createClient } from '../supabase-server';
import { JuchuHonbanbi } from '../types/t-juchu-honbanbi-type';

/**
 * 受注ヘッダー単位の本番日テンプレート。
 *
 * 現在は専用テーブルを持たず、t_juchu_kizai_honbanbi に juchu_kizai_head_id = 0 で相乗りしている。
 * 専用テーブル（t_juchu_honbanbi）へ移す場合、変更はこのファイルの中だけで完結するよう、
 * TEMPLATE_KIZAI_HEAD_ID をこのファイルの外に出さないこと。
 */
const TEMPLATE_KIZAI_HEAD_ID = 0;

/** テンプレートが扱う本番日種別（仕込・RH・GP・本番） */
const TEMPLATE_SHUBETU_IDS = [
  HONBANBI_SHUBETU_ID.shikomi,
  HONBANBI_SHUBETU_ID.rh,
  HONBANBI_SHUBETU_ID.gp,
  HONBANBI_SHUBETU_ID.honban,
];

/**
 * 受注本番日テンプレート取得
 * @param juchuHeadId 受注ヘッダーid
 * @returns 受注本番日テンプレート
 */
export const selectJuchuHonbanbi = async (juchuHeadId: number) => {
  const supabase = await createClient();
  try {
    return await supabase
      .schema(SCHEMA)
      .from('t_juchu_kizai_honbanbi')
      .select('juchu_head_id, juchu_honbanbi_shubetu_id, juchu_honbanbi_dat, mem, juchu_honbanbi_add_qty')
      .eq('juchu_head_id', juchuHeadId)
      .eq('juchu_kizai_head_id', TEMPLATE_KIZAI_HEAD_ID)
      .in('juchu_honbanbi_shubetu_id', TEMPLATE_SHUBETU_IDS)
      .order('juchu_honbanbi_dat');
  } catch (e) {
    throw new Error('[selectJuchuHonbanbi] DBエラー:', { cause: e });
  }
};

/**
 * 受注本番日テンプレート全削除
 * @param juchuHeadId 受注ヘッダーid
 * @param connection コネクション
 */
export const deleteJuchuHonbanbi = async (juchuHeadId: number, connection: PoolClient) => {
  const query = `
    DELETE FROM
      ${SCHEMA}.t_juchu_kizai_honbanbi
    WHERE
      juchu_head_id = $1
      AND juchu_kizai_head_id = $2
      AND juchu_honbanbi_shubetu_id = ANY($3)
  `;

  const values = [juchuHeadId, TEMPLATE_KIZAI_HEAD_ID, TEMPLATE_SHUBETU_IDS];

  try {
    await connection.query(query, values);
  } catch (e) {
    throw new Error('[deleteJuchuHonbanbi] DBエラー:', { cause: e });
  }
};

/**
 * 受注本番日テンプレート新規追加(複数件)
 * @param data 受注本番日テンプレートデータ
 * @param connection コネクション
 */
export const insertAllJuchuHonbanbi = async (data: JuchuHonbanbi[], connection: PoolClient) => {
  if (data.length === 0) return;

  const cols = Object.keys(data[0]) as (keyof (typeof data)[0])[];
  const allCols = [...cols, 'juchu_kizai_head_id'];

  const values: (string | number | null | undefined)[] = [];
  let placeholderIndex = 1;
  const placeholders = data
    .map((row) => {
      const rowValues = [...cols.map((col) => row[col] ?? null), TEMPLATE_KIZAI_HEAD_ID];
      values.push(...rowValues);
      return `(${rowValues.map(() => `$${placeholderIndex++}`).join(', ')})`;
    })
    .join(', ');

  const query = `
    INSERT INTO
      ${SCHEMA}.t_juchu_kizai_honbanbi (${allCols.join(',')})
    VALUES
      ${placeholders}
  `;

  try {
    await connection.query(query, values);
  } catch (e) {
    throw new Error('[insertAllJuchuHonbanbi] DBエラー:', { cause: e });
  }
};
