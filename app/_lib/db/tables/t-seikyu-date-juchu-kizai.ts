'use server';

import { connect } from 'http2';
import { PoolClient } from 'pg';

import pool from '../postgres';
import { SCHEMA, supabase } from '../supabase';
import { SeikyuDatJuchuKizai } from '../types/t-seikyu-date-juchu-kizai-type';

/**
 * 受注請求完了日テーブル t_seikyu_date_juchu_kizai を更新する関数
 * @param {SeikyuDatJuchuKizai} newData t_seikyu_date_juchu_kizaiの型
 */
export const upsertSeikyuDat = async (newData: SeikyuDatJuchuKizai) => {
  const connection = await pool.connect();
  try {
    console.log('できてますか？', newData);
    await supabase
      .schema(SCHEMA)
      .from('t_seikyu_date_juchu_kizai')
      .delete()
      .eq('juchu_head_id', newData.juchu_head_id)
      .eq('juchu_kizai_head_id', newData.juchu_kizai_head_id);

    await supabase.schema(SCHEMA).from('t_seikyu_date_juchu_kizai').insert(newData);
  } catch (e) {
    throw e;
  }
};

/**
 * トランザクション用：受注請求完了日テーブル t_seikyu_date_juchu_kizai を更新する関数
 * @param {SeikyuDatJuchuKizai} newData t_seikyu_date_juchu_kizaiの型
 */
export const delAndInsertSeikyuDat = async (data: SeikyuDatJuchuKizai[], connection: PoolClient) => {
  console.log('受注請求日時リスト', data);
  if (!data || Object.keys(data).length === 0) {
    throw new Error('受注請求日時リストが空です。');
  }
  console.log('請求完了日を更新するよ');
  // select準備
  const selectPlaceholders = data
    .map((_, index) => {
      const start = index * 2 + 1;
      return `($${start}, $${start + 1})`;
    })
    .join(',');
  const selectValues = data.flatMap((v) => [v.juchu_head_id, v.juchu_kizai_head_id]);
  const selectQuery = `
  SELECT
    juchu_head_id, juchu_kizai_head_id, seikyu_dat
  FROM
    ${SCHEMA}.t_seikyu_date_juchu_kizai
  WHERE
    (juchu_head_id, juchu_kizai_head_id) IN (${selectPlaceholders})`;

  try {
    // もともとある場合の請求完了日を取得
    const { rows } = await connection.query(selectQuery, selectValues);
    console.log('もともとの請求日情報', rows);
    const insertData = data.filter((d) => {
      const match = rows.find(
        (r) => d.juchu_head_id === r.juchu_head_id && d.juchu_kizai_head_id === r.juchu_kizai_head_id
      );
      return !match || new Date(d.seikyu_dat) > new Date(match.seikyu_dat);
    });
    console.log('挿入する予定の請求日情報', insertData);

    if (insertData.length === 0) {
      return;
    }
    const deletePlaceholders = insertData
      .map((_, index) => {
        const start = index * 2 + 1;
        return `($${start}, $${start + 1})`;
      })
      .join(',');
    const deleteValues = insertData.flatMap((v) => [v.juchu_head_id, v.juchu_kizai_head_id]);
    const deleteQuery = `
    DELETE FROM
      ${SCHEMA}.t_seikyu_date_juchu_kizai
    WHERE
      (juchu_head_id, juchu_kizai_head_id) IN (${deletePlaceholders})
  `;
    // 削除処理実行
    await connection.query(deleteQuery, deleteValues);

    const insertCols = Object.keys(insertData[0]);
    const insertValues = insertData.flatMap((d) => Object.values(d).map((value) => value ?? null));
    const insertPlaceholders = insertData
      .map((_, rowIndex) => {
        const start = rowIndex * insertCols.length + 1;
        const group = Array.from({ length: insertCols.length }, (_, colIndex) => `$${start + colIndex}`);
        return `(${group.join(',')})`;
      })
      .join(',');

    const insertQuery = `
        INSERT INTO
          ${SCHEMA}.t_seikyu_date_juchu_kizai (${insertCols.join(',')})
        VALUES 
          ${insertPlaceholders}
      `;
    // 実行
    await connection.query(insertQuery, insertValues);
  } catch (e) {
    throw e;
  }
};
