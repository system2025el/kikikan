'use server';

import { PoolClient } from 'pg';

import { SCHEMA } from '../schema';
import { createClient } from '../supabase-server';

/**
 * 移動メモ取得
 *
 * t_ido_mem の主キーは (sagyo_den_dat, sagyo_siji_id) の2列で、作業区分（移動出庫/移動入庫）や
 * 作業場所は含まない。そのため同じ日付・同じ移動指示なら出庫画面と入庫画面で同じメモになる。
 * @param sagyoDenDat 移動予定日
 * @param sagyoSijiId 作業指示id
 * @returns
 */
export const selectIdoMem = async (sagyoDenDat: string, sagyoSijiId: number) => {
  const supabase = await createClient();
  try {
    return await supabase
      .schema(SCHEMA)
      .from('t_ido_mem')
      .select('mem')
      .eq('sagyo_den_dat', sagyoDenDat)
      .eq('sagyo_siji_id', sagyoSijiId)
      .maybeSingle();
  } catch (e) {
    throw new Error('[selectIdoMem] DBエラー:', { cause: e });
  }
};

/**
 * 移動メモ登録・更新
 *
 * 行の有無を呼び出し側で判定しなくて済むよう ON CONFLICT で upsert する。
 * 既存行を更新する場合は add_dat / add_user を書き換えない。
 * @param sagyoDenDat 移動予定日
 * @param sagyoSijiId 作業指示id
 * @param mem メモ
 * @param userNam ユーザー名
 * @param connection
 * @returns
 */
export const upsertIdoMem = async (
  sagyoDenDat: string,
  sagyoSijiId: number,
  mem: string,
  userNam: string,
  connection: PoolClient
) => {
  const query = `
    INSERT INTO ${SCHEMA}.t_ido_mem
      (sagyo_den_dat, sagyo_siji_id, mem, add_dat, add_user, upd_dat, upd_user)
    VALUES
      ($1, $2, $3, $4, $5, $4, $5)
    ON CONFLICT (sagyo_den_dat, sagyo_siji_id)
    DO UPDATE SET
      mem = EXCLUDED.mem,
      upd_dat = EXCLUDED.upd_dat,
      upd_user = EXCLUDED.upd_user
  `;

  const values = [sagyoDenDat, sagyoSijiId, mem, new Date().toISOString(), userNam];

  try {
    return await connection.query(query, values);
  } catch (e) {
    throw new Error('[upsertIdoMem] DBエラー:', { cause: e });
  }
};
