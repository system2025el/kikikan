'use server';

import { PoolClient } from 'pg';

import { SCHEMA, supabase } from '../supabase';

/**
 * 移動伝票取得
 * @param sagyoKbnId 作業区分id
 * @param sagyoSijiId 作業指示id
 * @param sagyoDenDat 作業日時
 * @param sagyoId 作業id
 * @returns
 */
export const selectIdoDen = async (sagyoKbnId: number, sagyoSijiId: number, sagyoDenDat: string, sagyoId: number) => {
  try {
    return await supabase
      .schema(SCHEMA)
      .from('v_ido_den3_lst')
      .select(
        'ido_flg, juchu_flg, kizai_id, kizai_nam, kizai_shozoku_id, rfid_yard_qty, rfid_kics_qty, plan_juchu_qty, plan_low_qty, plan_qty, result_qty, result_adj_qty, diff_qty, ctn_flg'
      )
      .eq('sagyo_kbn_id', sagyoKbnId)
      .eq('sagyo_siji_id', sagyoSijiId)
      .eq('nyushuko_dat', sagyoDenDat)
      .eq('nyushuko_basho_id', sagyoId);
  } catch (e) {
    throw new Error('[selectIdoDen] DBエラー:', { cause: e });
  }
};

export const selectIdoDenOne = async (
  sagyoKbnId: number,
  sagyoSijiId: number,
  sagyoDenDat: string,
  sagyoId: number,
  kizaiId: number
) => {
  try {
    return await supabase
      .schema(SCHEMA)
      .from('v_ido_den3_lst')
      .select(
        'kizai_id, kizai_nam, plan_qty, result_qty, result_adj_qty, ctn_flg, bld_cod, tana_cod, eda_cod, kizai_mem'
      )
      .eq('sagyo_kbn_id', sagyoKbnId)
      .eq('sagyo_siji_id', sagyoSijiId)
      .eq('nyushuko_dat', sagyoDenDat)
      .eq('nyushuko_basho_id', sagyoId)
      .eq('kizai_id', kizaiId)
      .single();
  } catch (e) {
    throw new Error('[selectIdoDenOne] DBエラー:', { cause: e });
  }
};

/**
 * 移動伝票確認
 * @param sagyoKbnId
 * @param sagyoSijiId
 * @param sagyoDenDat
 * @param sagyoId
 * @param kizaiId
 * @param connection
 * @returns
 */
export const selectConfirmIdoDen = async (
  sagyoKbnId: number,
  sagyoSijiId: number,
  sagyoDenDat: string,
  sagyoId: number,
  kizaiId: number,
  connection: PoolClient
) => {
  const query = `
    SELECT
      ido_den_id
    FROM
      ${SCHEMA}.t_ido_den
    WHERE
      sagyo_kbn_id = $1 
      AND sagyo_siji_id = $2
      AND sagyo_den_dat = $3 
      AND sagyo_id = $4 
      AND kizai_id = $5
  `;

  const values = [sagyoKbnId, sagyoSijiId, sagyoDenDat, sagyoId, kizaiId];

  try {
    const result = await connection.query(query, values);
    return result.rows;
  } catch (e) {
    throw new Error('[selectConfirmIdoDen] DBエラー:', { cause: e });
  }
};
