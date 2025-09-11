'use server';

import { toISOString } from '@/app/(main)/_lib/date-conversion';
import { ShukoListSearchValues } from '@/app/(main)/shuko-list/_lib/types';

import pool from '../postgres';
import { SCHEMA, supabase } from '../supabase';

/**
 *
 * @param id
 * @returns
 */
export const selectJuchu = async (id: number) => {
  try {
    return await supabase
      .schema(SCHEMA)
      .from('v_juchu_lst')
      .select(
        'juchu_head_id, juchu_sts_nam, juchu_dat, juchu_str_dat, juchu_end_dat, nyuryoku_user, koen_nam, koenbasho_nam, kokyaku_id, kokyaku_nam, kokyaku_tanto_nam, mem, nebiki_amt, zei_nam'
      )
      .eq('juchu_head_id', id)
      .single();
  } catch (e) {
    throw e;
  }
};

/**
 *
 * @param queries 検索クエリ(受注ヘッダーid、出庫日時、出庫場所)
 * @returns
 */
export const selectFilteredJuchuList = async (queries: ShukoListSearchValues) => {
  const builder = supabase.schema(SCHEMA).from('v_juchu_lst').select('juchu_head_id, koen_nam, kokyaku_nam, shuko_dat');

  if (queries.juchuHeadId) {
    builder.eq('juchu_head_id', queries.juchuHeadId);
  }
  if (queries.shukoDat) {
    builder.eq('shuko_dat', toISOString(queries.shukoDat));
  }

  try {
    return await builder;
  } catch (e) {
    throw e;
  }
};

export const selectJuchuHeadIds = async (strDat: string) => {
  try {
    await pool.query(` SET search_path TO ${SCHEMA};`);
    return await pool.query(`
      select 
          v_juchu_lst.juchu_head_id as "juchuHeadId"
      from 
          v_juchu_lst
      where
          -- ①出庫日がスケジュール終了日より小さい、且つ、
          v_juchu_lst.shuko_dat <= cast('${strDat}' as date) + cast( '90 days' as INTERVAL ) --【変数】
          and
          -- ②入庫日がスケジュール開始日より大きい
          v_juchu_lst.nyuko_dat >= '${strDat}'   --【変数】
      `);
  } catch (e) {
    throw e;
  }
};
