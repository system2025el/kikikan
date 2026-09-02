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
 * この関数は移動明細の保存のたびに呼ばれるため、書き込みが要らないケースを
 * SQL側で弾いている。
 *
 * - 空メモで行が無いとき … 何もしない（メモを書いていない移動の行を作らない）
 * - メモの内容が変わっていないとき … UPDATEしない（移動数だけ直した人が
 *   メモの最終更新者として記録されてしまうのを防ぐ）
 * - 既存行を更新するとき … add_dat / add_user は書き換えない
 *
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
  // INSERT ... SELECT はパラメータの型推論が効かないので明示的にキャストする
  const query = `
    INSERT INTO ${SCHEMA}.t_ido_mem
      (sagyo_den_dat, sagyo_siji_id, mem, add_dat, add_user, upd_dat, upd_user)
    SELECT $1::date, $2::integer, $3::varchar, $4::timestamptz, $5::varchar, $4::timestamptz, $5::varchar
    WHERE $3::varchar <> ''
       OR EXISTS (
         SELECT 1 FROM ${SCHEMA}.t_ido_mem
         WHERE sagyo_den_dat = $1::date AND sagyo_siji_id = $2::integer
       )
    ON CONFLICT (sagyo_den_dat, sagyo_siji_id)
    DO UPDATE SET
      mem = EXCLUDED.mem,
      upd_dat = EXCLUDED.upd_dat,
      upd_user = EXCLUDED.upd_user
    WHERE t_ido_mem.mem IS DISTINCT FROM EXCLUDED.mem
  `;

  const values = [sagyoDenDat, sagyoSijiId, mem, new Date().toISOString(), userNam];

  try {
    return await connection.query(query, values);
  } catch (e) {
    throw new Error('[upsertIdoMem] DBエラー:', { cause: e });
  }
};
