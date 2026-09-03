'use server';

import { PoolClient } from 'pg';

import { SCHEMA } from '../schema';
import { createClient } from '../supabase-server';
import { JuchuHead } from '../types/t-juchu-head-type';

/**
 * 受注ヘッダーid最大値取得
 * @returns 受注ヘッダーid最大値
 */
export const selectMaxId = async () => {
  const supabase = await createClient();
  try {
    return await supabase
      .schema(SCHEMA)
      .from('t_juchu_head')
      .select('juchu_head_id')
      .order('juchu_head_id', {
        ascending: false,
      })
      .limit(1)
      .single();
  } catch (e) {
    throw new Error('[selectMaxId] DBエラー:', { cause: e });
  }
};

/**
 * 受注ヘッダー取得
 * @param juchuHeadId 受注ヘッダーID
 * @returns 受注ヘッダーデータ
 */
export const selectJuchuHead = async (juchuHeadId: number) => {
  const supabase = await createClient();
  try {
    return await supabase
      .schema(SCHEMA)
      .from('t_juchu_head')
      .select(
        'juchu_head_id, del_flg, juchu_sts, juchu_dat, juchu_str_dat, juchu_end_dat, nyuryoku_user, koen_nam, koenbasho_nam, kokyaku_id, kokyaku_tanto_nam, mem, nebiki_amt, zei_kbn'
      )
      .eq('juchu_head_id', juchuHeadId)
      .eq('del_flg', 0)
      .single();
  } catch (e) {
    throw new Error('[selectJuchuHead] DBエラー:', { cause: e });
  }
};

/**
 * 受注ヘッダー情報新規追加
 * @param juchuHeadId 受注ヘッダーid
 */
export const insertJuchuHead = async (data: JuchuHead) => {
  const supabase = await createClient();
  try {
    return await supabase.schema(SCHEMA).from('t_juchu_head').insert(data);
  } catch (e) {
    throw new Error('[insertJuchuHead] DBエラー:', { cause: e });
  }
};

/**
 * 受注ヘッダー情報更新
 * @param data 受注ヘッダーデータ
 * @returns 正誤
 */
export const updateJuchuHead = async (data: JuchuHead) => {
  const supabase = await createClient();
  try {
    return await supabase.schema(SCHEMA).from('t_juchu_head').update(data).eq('juchu_head_id', data.juchu_head_id);
  } catch (e) {
    throw new Error('[updateJuchuHead] DBエラー:', { cause: e });
  }
};

/**
 * 受注ヘッダー情報更新（トランザクション用）
 * 呼び出し元のトランザクションに参加させたい場合はこちらを使う。
 * Supabase版と同じく、dataに含まれるキーだけを更新する。
 * @param data 受注ヘッダーデータ
 * @param connection コネクション
 */
export const updateJuchuHeadWithTran = async (data: JuchuHead, connection: PoolClient) => {
  const updateKeys = (Object.keys(data) as (keyof JuchuHead)[]).filter((key) => key !== 'juchu_head_id');

  if (updateKeys.length === 0) {
    throw new Error('No columns to update.');
  }

  const values: (string | number | null | undefined)[] = [];
  let placeholderIndex = 1;

  const setClause = updateKeys
    .map((key) => {
      values.push(data[key]);
      return `${key} = $${placeholderIndex++}`;
    })
    .join(', ');

  values.push(data.juchu_head_id);

  const query = `
    UPDATE
      ${SCHEMA}.t_juchu_head
    SET
      ${setClause}
    WHERE
      juchu_head_id = $${placeholderIndex}
  `;

  try {
    await connection.query(query, values);
  } catch (e) {
    throw new Error('[updateJuchuHeadWithTran] DBエラー:', { cause: e });
  }
};
