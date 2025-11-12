'use server';

import pool from '@/app/_lib/db/postgres';
import { supabase } from '@/app/_lib/db/supabase';
import { toJapanTimeStampString, toJapanYMDString } from '@/app/(main)/_lib/date-conversion';

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

export const insertTimeTest = async (data: { id: number; created: Date | null; shuko: Date | null }): Promise<void> => {
  const query = `
    INSERT INTO test_takahashi.time_test VALUES(${data.id}, ${data.created ? `'${data.created.toISOString()}'` : null}, ${data.shuko ? `'${toJapanYMDString(data.shuko)}'` : null})`;
  console.log(query);
  await pool.query(query);
};
