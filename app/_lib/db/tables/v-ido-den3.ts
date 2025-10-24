'use server';

import { toJapanDateString } from '@/app/(main)/_lib/date-conversion';

import pool from '../postgres';
import { SCHEMA, supabase } from '../supabase';

/**
 * 作業日指定移動リスト取得
 * @param sagyoDenDat 作業日
 * @param sagyoSijiId 作業指示id
 * @returns
 */
export const selectFilteredIdoList = async (sagyoDenDat: string, sagyoSijiId: number) => {
  console.log(sagyoDenDat);
  const query = `
    SELECT 
        distinct 
        den3.sagyo_siji_id,
        den3.nyushuko_dat,
        -- 出庫チェック  
        den3.schk_sagyo_sts_id,
        den3.schk_sagyo_sts_nam_short,
        -- 入庫チェック
        den3.nchk_sagyo_sts_id,
        den3.nchk_sagyo_sts_nam_short,
        -- 出発
        den3.shuko_fix_flg,  --1の場合は行グレーに
        -- 到着
        den3.nyuko_fix_flg
    FROM
        --入出庫伝票テーブル主のビュー
        ${SCHEMA}.v_ido_den3 as den3

    WHERE
        den3.nyushuko_dat = '${sagyoDenDat}' --その日だけ抽出
        AND den3.sagyo_siji_id = ${sagyoSijiId}

    ORDER BY
        den3.nyushuko_dat
  `;
  try {
    return (await pool.query(query)).rows;
  } catch (e) {
    throw e;
  }
};
