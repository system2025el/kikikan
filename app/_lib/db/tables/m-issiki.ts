'use server';

import { toJapanTimeStampString, toJapanTimeString } from '@/app/(main)/_lib/date-conversion';
import { IsshikisMasterDialogValues } from '@/app/(main)/(masters)/isshiki-master/_lib/types';

import pool from '../postgres';
import { SCHEMA, supabase } from '../supabase';
import { MIsshikiDBValues } from '../types/m-issiki-type';

/**
 * DBから有効な一式を取得する関数
 * @returns 有効な一式のidと名前の配列
 */
export const selectActiveIsshikis = async () => {
  try {
    return await supabase
      .schema(SCHEMA)
      .from('m_issiki')
      .select('issiki_id, issiki_nam')
      .neq('del_flg', 1)
      .order('issiki_nam');
  } catch (e) {
    throw e;
  }
};

/**
 * issiki_namが一致する一式を取得する関数
 * @param {string} query 一式名
 * @returns issiki_nameで検索された一式マスタの配列 検索無しなら全件
 */
export const selectFilteredIsshikis = async () => {
  const builder = supabase
    .schema(SCHEMA)
    .from('m_issiki')
    .select('issiki_id, issiki_nam, reg_amt, mem, del_flg') // テーブルに表示するカラム
    .order('issiki_nam'); // 並び順

  try {
    return await builder;
  } catch (e) {
    throw e;
  }
};

/**
 * issiki_idが一致する一式を取得する関数
 * @param id 探すissiki_id
 * @returns issiki_idが一致する一式
 */
export const selectOneIsshiki = async (id: number) => {
  try {
    return await supabase
      .schema(SCHEMA)
      .from('m_issiki')
      .select('issiki_nam, del_flg, mem, reg_amt')
      .eq('issiki_id', id)
      .single();
  } catch (e) {
    throw e;
  }
};

/**
 * 一式マスタに新規挿入する関数
 * @param data 挿入するデータ
 */
export const insertNewIsshiki = async (data: IsshikisMasterDialogValues, user: string) => {
  const query = `
          INSERT INTO ${SCHEMA}.m_issiki (
            issiki_id, issiki_nam, del_flg, dsp_ord_num, reg_amt,
            mem, add_dat, add_user
          )
          VALUES (
            (SELECT coalesce(max(issiki_id),0) + 1 FROM ${SCHEMA}.m_issiki),
            $1, $2,
            (SELECT coalesce(max(dsp_ord_num),0) + 1 FROM ${SCHEMA}.m_issiki),
            $3, $4, $5, $6
          );
        `;
  const date = toJapanTimeStampString();
  const values = [data.isshikiNam, Number(data.delFlg), data.regAmt, data.mem, date, user];

  try {
    await pool.query(query, values);
  } catch (e) {
    throw e;
  }
};

/**
 * 一式マスタを更新する関数
 * @param data 更新するデータ
 * @param id 更新する一式のissiki_id
 */
export const updateIsshikiDB = async (data: MIsshikiDBValues) => {
  try {
    await supabase
      .schema(SCHEMA)
      .from('m_issiki')
      .update({ ...data })
      .eq('issiki_id', data.issiki_id);
  } catch (e) {
    throw e;
  }
};
