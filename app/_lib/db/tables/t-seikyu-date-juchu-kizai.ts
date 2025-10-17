'use server';

import { PoolClient } from 'pg';

import { SCHEMA, supabase } from '../supabase';
import { SeikyuDatJuchuKizai } from '../types/t-seikyu-date-juchu-kizai-type';

/**
 * 受注請求完了日テーブル t_seikyu_date_juchu_kizai を更新する関数
 * @param {SeikyuDatJuchuKizai} newData t_seikyu_date_juchu_kizaiの型
 */
export const upsertSeikyuDat = async (newData: SeikyuDatJuchuKizai) => {
  try {
    console.log('できてますか？', newData);
    const { data, error } = await supabase
      .schema(SCHEMA)
      .from('t_seikyu_date_juchu_kizai')
      .select('*')
      .eq('juchu_head_id', newData.juchu_head_id)
      .eq('juchu_kizai_head_id', newData.juchu_kizai_head_id);

    if (error) {
      console.error(error);
      throw error;
    }

    if (!data || data.length === 0) {
      const { upd_dat, upd_user, ...rest } = newData;
      console.log('新規です', rest);
      //
      await supabase.schema(SCHEMA).from('t_seikyu_date_juchu_kizai').insert(rest);
    } else {
      const { add_dat, add_user, ...rest } = newData;
      console.log('更新です', rest);
      await supabase
        .schema(SCHEMA)
        .from('t_seikyu_date_juchu_kizai')
        .update(rest)
        .eq('juchu_head_id', rest.juchu_head_id)
        .eq('juchu_kizai_head_id', rest.juchu_kizai_head_id)
        .select('*');
    }
  } catch (e) {
    throw e;
  }
};

/**
 * トランザクション用：受注請求完了日テーブル t_seikyu_date_juchu_kizai を更新する関数
 * @param {SeikyuDatJuchuKizai} newData t_seikyu_date_juchu_kizaiの型
 */
export const upsertPgSeikyuDat = async (data: SeikyuDatJuchuKizai[], connection: PoolClient) => {
  console.log('受注請求日時リスト', data);
  if (!data || Object.keys(data).length === 0) {
    throw new Error('受注請求日時リストが空です。');
  }

  // 存在確認用
  const values = data.flatMap((d) => [d.juchu_head_id, d.juchu_kizai_head_id].map((value) => value ?? null));
  const placeholders = data.map((_, i) => `($${i * 2 + 1}, $${i * 2 + 2})`).join(', ');
  const query = `
    SELECT juchu_head_id, juchu_kizai_head_id, seikyu_dat
    FROM ${SCHEMA}.t_seikyu_date_juchu_kizai
    WHERE (juchu_head_id, juchu_kizai_head_id) IN (${placeholders})
`;
  try {
    // 既存の請求済み受注を探す
    const { rows } = await connection.query(query, values);
    if (!rows) {
      console.error('例外が発生、請求完了テーブルt_seikyu_date_juchu_kizai');
      throw new Error('例外が発生、請求完了テーブルt_seikyu_date_juchu_kizai');
    }

    const existingMap = new Map(
      rows.map((r) => [`${r.juchu_head_id}::${r.juchu_kizai_head_id}`, new Date(r.seikyu_dat)])
    );
    const updList = data
      .map(({ add_dat, add_user, ...rest }) => rest)
      .filter((r) => {
        const key = `${r.juchu_head_id}::${r.juchu_kizai_head_id}`;
        const existingDate = existingMap.get(key);
        return existingDate && new Date(r.seikyu_dat) > existingDate;
      });
    const insertList = data
      .map(({ upd_dat, upd_user, ...rest }) => rest)
      .filter((r) => !existingMap.has(`${r.juchu_head_id}::${r.juchu_kizai_head_id}`));
    console.log('更新用；', updList, ' 新規用：', insertList);

    if (insertList && insertList.length > 0) {
      // 新規
      const insertCols = Object.keys(insertList[0]) as Array<keyof (typeof insertList)[0]>;
      const insertValues = insertList.flatMap((d) => Object.values(d).map((value) => value ?? null));
      const insertPlaceholders = insertList
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
    }
    if (updList && updList.length > 0) {
      // 更新
      const jsonData = JSON.stringify(updList);
      const columnDefs =
        'juchu_head_id INT, juchu_kizai_head_id INT, seikyu_dat DATE, upd_dat TIMESTAMP, upd_user TEXT';
      const updQuery = `
        UPDATE ${SCHEMA}.t_seikyu_date_juchu_kizai AS t
        SET
          seikyu_dat = d.seikyu_dat,
          upd_dat = d.upd_dat,
          upd_user = d.upd_user
        FROM jsonb_to_recordset($1::jsonb) AS d(${columnDefs})
        WHERE t.juchu_head_id = d.juchu_head_id
        AND t.juchu_kizai_head_id = d.juchu_kizai_head_id;
      `;
      await connection.query(updQuery, [jsonData]);
    }
  } catch (e) {
    throw e;
  }
};

// const updQuery = `
// UPDATE your_table AS t
// SET
//   seikyu_dat = d.seikyu_dat,
//   upd_dat = d.upd_dat,
//   upd_user = d.upd_user
// FROM jsonb_to_recordset($1::jsonb) AS d(${columnDefs})
// WHERE t.juchu_head_id = d.juchu_head_id
// AND t.juchu_kizai_head_id = d.juchu_kizai_head_id;
// `;
