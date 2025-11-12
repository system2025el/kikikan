'use server';

import pool from '@/app/_lib/db/postgres';
import { supabase } from '@/app/_lib/db/supabase';
import { toJapanTimeStampString } from '@/app/(main)/_lib/date-conversion';

export const getTimeTest = async (data: {
  id: number | null;
  created: Date | null;
  shuko: Date | null;
}): Promise<{ id: number; created: Date | null; shuko: Date | null }[]> => {
  let query = `
        SELECT id, created_at as "created", shuko_dat as "shuko" from test_takahashi.time_test WHERE id IS NOT NULL`;
  if (data.id) {
    query += ` AND id = ${data.id}`;
  }
  if (data.created) {
    query += ` AND created_at >= '${toJapanTimeStampString(data.created)}' `;
  }
  if (data.shuko) {
    query += ` AND shuko_dat = '${toJapanTimeStampString(data.shuko)}' `;
  }
  console.log(query);
  return (await pool.query(query)).rows;
};
