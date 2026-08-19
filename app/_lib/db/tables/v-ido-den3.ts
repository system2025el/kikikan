'use server';

import { toJapanYMDString } from '@/app/(main)/_lib/date-conversion';

import pool from '../postgres';
import { SCHEMA } from '../schema';

/**
 * 作業日指定移動リスト取得
 * @param sagyoDenDat 作業日
 * @param sagyoSijiIds 作業指示idの配列（v_ido_den3が重いため、複数の作業指示を1回のクエリでまとめて取得する）
 * @returns
 */
export const selectFilteredIdoList = async (sagyoDenDat: string, sagyoSijiIds: number[]) => {
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
        den3.nyushuko_dat = $1::date --その日だけ抽出
        AND den3.sagyo_siji_id = ANY($2::int[])

    ORDER BY
        den3.nyushuko_dat
  `;
  const values = [sagyoDenDat, sagyoSijiIds];

  try {
    return (await pool.query(query, values)).rows;
  } catch (e) {
    throw new Error('[selectFilteredIdoList] DBエラー:', { cause: e });
  }
};
