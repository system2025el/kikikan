'use server';

import { toJapanTimeString } from '@/app/(main)/_lib/date-conversion';
import { DaibumonsMasterDialogValues } from '@/app/(main)/(masters)/daibumons-master/_lib/types';

import pool from '../postgres';
import { SCHEMA, supabase } from '../supabase';

/**
 * 大部門マスタから有効な大部門を取得する関数
 * @returns 有効な大部門の配列
 */
export const selectActiveDaibumons = async () => {
  try {
    const { data, error } = await supabase
      .schema('dev2')
      .from('m_dai_bumon')
      .select('dai_bumon_id, dai_bumon_nam')
      .neq('del_flg', 1);

    if (!error) {
      return data;
    }
    console.error('DB情報取得エラー', error.message, error.cause, error.hint);
    return [];
  } catch (e) {
    throw e;
  }
};

/**
 * 大部門マスタからデータ取得する関数
 * @param {string} query 大部門名検索キーワード
 * @returns 検索済みの大部門マスタの配列
 */
export const selectFilteredDaibumons = async (query: string) => {
  const builder = supabase
    .schema(SCHEMA)
    .from('m_dai_bumon')
    .select('dai_bumon_id, dai_bumon_nam, mem, del_flg') // テーブルに表示するカラム
    .order('dsp_ord_num'); // 並び順
  // 検索キーワードあれば
  if (query && query.trim() !== '') {
    builder.ilike('dai_bumon_nam', `%${query}%`);
  }
  try {
    return await builder;
  } catch (e) {
    throw e;
  }
};

/**
 * 大部門マスタからidが一致する一つのデータを取得
 * @param {number} id dai_bumon_id
 * @returns 1つの大部門のオブジェクト
 */
export const selectOneDaibumon = async (id: number) => {
  try {
    return await supabase
      .schema(SCHEMA)
      .from('m_dai_bumon')
      .select('dai_bumon_nam, del_flg, mem')
      .eq('dai_bumon_id', id)
      .single();
  } catch (e) {
    throw e;
  }
};

/**
 * 大部門マスタにデータを挿入する関数
 * @param {{DaibumonsMasterDialogValues}} data  挿入する大部門マスタの情報
 */
export const insertNewDaibumon = async (data: DaibumonsMasterDialogValues) => {
  const query = `
    INSERT INTO m_dai_bumon (
      dai_bumon_id, dai_bumon_nam, del_flg, dsp_ord_num,
      mem, add_dat, add_user
    )
    VALUES (
      (SELECT coalesce(max(dai_bumon_id),0) + 1 FROM m_dai_bumon),
      $1, $2,
      (SELECT coalesce(max(dsp_ord_num),0) + 1 FROM m_dai_bumon),
      $3, $4, $5
    );
  `;
  const date = toJapanTimeString();
  try {
    // insert実行
    await pool.query(query, [data.daibumonNam, Number(data.delFlg), data.mem, date, 'shigasan']);
  } catch (e) {
    throw e;
  }
};

export const updateDaibumon = async (
  data: {
    dai_bumon_nam: string;
    del_flg: number;
    mem: string | undefined;
    upd_dat: string;
    upd_user: string;
  },
  id: number
) => {
  try {
    const { error: updateError } = await supabase
      .schema(SCHEMA)
      .from('m_dai_bumon')
      .update(data)
      .eq('dai_bumon_id', id);
    return updateError;
  } catch (e) {
    throw e;
  }
};
