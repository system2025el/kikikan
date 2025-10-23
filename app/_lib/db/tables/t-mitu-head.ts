'use server';
import { PoolClient } from 'pg';

import { SCHEMA, supabase } from '../supabase';
import { MituHead } from '../types/t-mitu-head-types';

/**
 * 見積ヘッダをt_mitu_headに挿入する関数
 * @param data 登録する見積データ
 * @param connection トランザクション
 * @returns 新規登録した見積ヘッダID
 */
export const insertQuotHead = async (data: MituHead, connection: PoolClient) => {
  console.log('見積ヘッド新規：', data);
  if (!data || Object.keys(data).length === 0) {
    throw new Error('見積ヘッダーが空です。');
  }
  const quotHeadCols = Object.keys(data);
  const quotValues = Object.values(data);
  const placeholders = quotValues.map((_, i) => `$${i + 1}`).join(', ');

  const query = `
      INSERT INTO
        ${SCHEMA}.t_mitu_head (${quotHeadCols.join(',')})
      VALUES 
        (${placeholders})
      RETURNING mitu_head_id;
    `;
  try {
    return await connection.query(query, quotValues);
  } catch (e) {
    throw e;
  }
};

/**
 * t_mitu_headのmitu_head_idが一致する見積ヘッダを更新する
 * @param {MituHead} data 更新するデータ
 * @param connection トランザクション
 * @returns 更新した見積のヘッドID
 */
export const updateQuotHead = async (data: MituHead, connection: PoolClient) => {
  if (!data || Object.keys(data).length === 0) {
    throw new Error('見積ヘッダーが空です。');
  }
  const quotHeadCols = Object.keys(data);
  console.log(quotHeadCols);
  const quotValues = Object.values(data);
  console.log(quotValues);
  const placeholders = quotValues.map((_, i) => `$${i + 1}`).join(', ');
  const upsetValues = quotHeadCols.filter((i) => i !== 'mitu_head_id').map((col) => `${col} = EXCLUDED.${col}`);

  const updateQuery = `
    INSERT INTO ${SCHEMA}.t_mitu_head (${quotHeadCols.join(',')})
    VALUES (${placeholders})
    ON CONFLICT (mitu_head_id)
    DO UPDATE SET ${upsetValues}
    RETURNING mitu_head_id;
  `;
  try {
    return await connection.query(updateQuery, quotValues);
  } catch (e) {
    throw e;
  }
};

/**
 * 選択されたmitu_head_idの見積をt_mitu_headから取得する
 * @param id 選択された見積ヘッドID
 * @returns 見積ヘッド情報
 */
export const selectChosenMitu = async (id: number) => {
  try {
    return await supabase
      .schema(SCHEMA)
      .from('t_mitu_head')
      .select(
        `
        mitu_head_id, juchu_head_id, mitu_sts, mitu_dat, mitu_head_nam, kokyaku_nam,
        nyuryoku_user, mitu_str_dat, mitu_end_dat, kokyaku_tanto_nam, koen_nam, koenbasho_nam,
        mitu_honbanbi_qty, biko, comment, chukei_mei, kizai_chukei_mei, toku_nebiki_amt, toku_nebiki_mei, zei_amt, zei_rat, gokei_mei, gokei_amt
        `
      )
      .eq('mitu_head_id', id)
      .single();
  } catch (e) {
    console.error(e);
    throw e;
  }
};

/**
 * t_mitu_headのdel_flgを1にする関数
 * @param {number[]}ids 見積ヘッダIDの配列
 */
export const updQuotHeadDelFlg = async (ids: number[]) => {
  try {
    await supabase.schema(SCHEMA).from('t_mitu_head').update({ del_flg: 1 }).in('mitu_head_id', ids);
  } catch (e) {
    throw e;
  }
};
