'use server';

import { PoolClient } from 'pg';

import { SCHEMA, supabase } from '../supabase';
import { SeikyuHead } from '../types/t-seikyu-head-type';

/**
 * 請求ヘッダをt_seikyu_headに挿入する関数
 * @param data 登録する請求データ
 * @param connection トランザクション
 * @returns 新規登録した請求ヘッダID
 */
export const insertBillHead = async (data: SeikyuHead, connection: PoolClient) => {
  console.log('請求ヘッド新規：', data);
  if (!data || Object.keys(data).length === 0) {
    throw new Error('請求ヘッダーが空です。');
  }
  const quotHeadCols = Object.keys(data);
  const quotValues = Object.values(data);
  const placeholders = quotValues.map((_, i) => `$${i + 1}`).join(', ');

  const query = `
      INSERT INTO
        ${SCHEMA}.t_seikyu_head (${quotHeadCols.join(',')})
      VALUES 
        (${placeholders})
      RETURNING seikyu_head_id;
    `;
  try {
    return await connection.query(query, quotValues);
  } catch (e) {
    throw e;
  }
};

/**
 * t_seikyu_headのseikyu_head_idが一致する請求ヘッダを更新する
 * @param {SeikyuHead} data 更新するデータ
 * @param connection トランザクション
 * @returns 更新した請求のヘッドID
 */
export const updateBillHead = async (data: SeikyuHead, connection: PoolClient) => {
  if (!data || Object.keys(data).length === 0) {
    throw new Error('請求ヘッダーが空です。');
  }
  const quotHeadCols = Object.keys(data);
  console.log(quotHeadCols);
  const quotValues = Object.values(data);
  console.log(quotValues);
  const placeholders = quotValues.map((_, i) => `$${i + 1}`).join(', ');
  const upsetValues = quotHeadCols.filter((i) => i !== 'seikyu_head_id').map((col) => `${col} = EXCLUDED.${col}`);

  const updateQuery = `
    INSERT INTO ${SCHEMA}.t_seikyu_head (${quotHeadCols.join(',')})
    VALUES (${placeholders})
    ON CONFLICT (seikyu_head_id)
    DO UPDATE SET ${upsetValues}
    RETURNING seikyu_head_id;
  `;
  try {
    return await connection.query(updateQuery, quotValues);
  } catch (e) {
    throw e;
  }
};

/**
 * 選択されたseikyu_head_idの請求をt_seikyu_headから取得する
 * @param id 選択された請求ヘッドID
 * @returns 請求ヘッド情報
 */
export const selectChosenSeikyu = async (id: number) => {
  try {
    return await supabase
      .schema(SCHEMA)
      .from('t_seikyu_head')
      .select(
        `
        seikyu_head_id, seikyu_sts, seikyu_dat, kokyaku_id, seikyu_head_nam,
        kokyaku_nam, adr_post, adr_shozai, adr_tatemono, adr_sonota,
        nyuryoku_user, zei_rat
        `
      )
      .eq('seikyu_head_id', id)
      .single();
  } catch (e) {
    throw e;
  }
};
