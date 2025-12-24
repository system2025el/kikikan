import { Pool } from 'pg';

import { SCHEMA } from './supabase';

// const pool = new Pool({
//   connectionString: process.env.DATABASE_URL,
// });

// export default pool;

const globalForPool = global as unknown as { pool?: Pool };

export const pool =
  globalForPool.pool ??
  (globalForPool.pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  }));

export default pool;

/**
 * マテリアライズドビューのv_rfidを更新する関数
 */
export const refreshVRfid = async () => {
  try {
    // await をつけて確実に実行を待つ
    await pool.query(`refresh materialized view ${SCHEMA}.v_rfid;`);
    console.log('ーーーーーリフレッシュ完了ーーーーー');
  } catch (error) {
    // ログだけ残して、エラーは投げない（握り潰す）
    console.error('Materialized Viewの更新に失敗しました:', error);
  }
};
