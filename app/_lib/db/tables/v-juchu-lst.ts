import 'server-only';

import pool from '../postgres';
import { SCHEMA } from '../schema';
import { createClient } from '../supabase-server';

/**
 *
 * @param id
 * @returns
 */
export const selectJuchu = async (id: number) => {
  const supabase = await createClient();
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
    throw new Error('[selectJuchu] DBエラー:', { cause: e });
  }
};

export const selectJuchuHeadIds = async (strDat: string) => {
  try {
    const query = `
      select
          v_juchu_lst.juchu_head_id as "juchuHeadId"
      from
          ${SCHEMA}.v_juchu_lst
      where
          -- ①出庫日がスケジュール終了日より小さい、且つ、
          v_juchu_lst.shuko_dat <= cast($1 as date) + cast( '90 days' as INTERVAL ) --【変数】
          and
          -- ②入庫日がスケジュール開始日より大きい
          v_juchu_lst.nyuko_dat >= $1   --【変数】
      `;

    const values = [strDat];

    return await pool.query(query, values);
  } catch (e) {
    throw new Error('[selectJuchuHeadIds] DBエラー:', { cause: e });
  }
};

export const selectPdfJuchuHead = async (juchuHeadId: number) => {
  const supabase = await createClient();
  try {
    return await supabase
      .schema(SCHEMA)
      .from('v_juchu_lst')
      .select('juchu_head_id, koen_nam, koenbasho_nam, kokyaku_id, kokyaku_nam, nyuryoku_user, kokyaku_tanto_nam')
      .eq('juchu_head_id', juchuHeadId)
      .single();
  } catch (e) {
    throw new Error('[selectPdfJuchuHead] DBエラー:', { cause: e });
  }
};
