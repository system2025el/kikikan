'use server';

import { PoolClient } from 'pg';

import { SCHEMA } from '../schema';
import { createClient } from '../supabase-server';

/**
 * 受注コンテナ明細取得（トランザクション内。同じトランザクションで変更した内容を読むため pg で取る）
 * @param juchuHeadId 受注ヘッダーid
 * @param juchuKizaiHeadId 受注機材ヘッダーid
 * @param connection
 * @returns
 */
export const selectJuchuContainerMeisaiTx = async (
  juchuHeadId: number,
  juchuKizaiHeadId: number,
  connection: PoolClient
) => {
  const query = `
    SELECT
      juchu_head_id,
      juchu_kizai_head_id,
      juchu_kizai_meisai_id,
      mem,
      kizai_id,
      kizai_nam,
      kics_plan_kizai_qty,
      yard_plan_kizai_qty,
      kics_keep_qty,
      yard_keep_qty,
      dsp_ord_num
    FROM
      ${SCHEMA}.v_juchu_ctn_meisai
    WHERE
      juchu_head_id = $1
      AND juchu_kizai_head_id = $2
      AND kizai_id IS NOT NULL
    ORDER BY
      dsp_ord_num
  `;

  try {
    return (
      await connection.query<{
        juchu_head_id: number | null;
        juchu_kizai_head_id: number | null;
        juchu_kizai_meisai_id: number | null;
        mem: string | null;
        kizai_id: number | null;
        kizai_nam: string | null;
        kics_plan_kizai_qty: number | null;
        yard_plan_kizai_qty: number | null;
        kics_keep_qty: number | null;
        yard_keep_qty: number | null;
        dsp_ord_num: number | null;
      }>(query, [juchuHeadId, juchuKizaiHeadId])
    ).rows;
  } catch (e) {
    throw new Error('[selectJuchuContainerMeisaiTx] DBエラー:', { cause: e });
  }
};

export const selectJuchuContainerMeisai = async (juchuHeadId: number, juchuKizaiHeadId: number) => {
  const supabase = await createClient();
  try {
    return await supabase
      .schema(SCHEMA)
      .from('v_juchu_ctn_meisai')
      .select(
        'juchu_head_id, juchu_kizai_head_id, juchu_kizai_meisai_id, mem, kizai_id, kizai_nam, kics_plan_kizai_qty, yard_plan_kizai_qty, kics_keep_qty, yard_keep_qty, dsp_ord_num'
      )
      .eq('juchu_head_id', juchuHeadId)
      .eq('juchu_kizai_head_id', juchuKizaiHeadId)
      .not('kizai_id', 'is', null)
      .order('dsp_ord_num');
  } catch (e) {
    throw new Error('[selectJuchuContainerMeisai] DBエラー:', { cause: e });
  }
};

export const selectOyaJuchuContainerMeisai = async (juchuHeadId: number, juchuKizaiHeadId: number) => {
  const supabase = await createClient();
  try {
    return await supabase
      .schema(SCHEMA)
      .from('v_juchu_ctn_meisai')
      .select(
        'juchu_head_id, juchu_kizai_head_id, juchu_kizai_meisai_id, mem, kizai_id, kizai_nam, kics_plan_kizai_qty, yard_plan_kizai_qty, dsp_ord_num'
      )
      .eq('juchu_head_id', juchuHeadId)
      .eq('juchu_kizai_head_id', juchuKizaiHeadId)
      .not('kizai_id', 'is', null)
      .order('dsp_ord_num');
  } catch (e) {
    throw new Error('[selectOyaJuchuContainerMeisai] DBエラー:', { cause: e });
  }
};
