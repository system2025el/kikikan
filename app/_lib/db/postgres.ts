import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  options: `-c search_path=${process.env.DB_SCHEMA || 'public'}`,
});

export default pool;
