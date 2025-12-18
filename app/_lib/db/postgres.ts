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
export const refreshVRfid = () => {
  pool.query(`refresh materialized view ${SCHEMA}.v_rfid;`);
};
