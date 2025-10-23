'use server';

import { PoolClient } from 'pg';

import { SCHEMA, supabase } from '../supabase';
import { IdoFix } from '../types/t-ido-fix-type';

/**
 * 移動確定id最大値取得
 * @returns
 */
export const selectIdoFixMaxId = async () => {
  try {
    return await supabase
      .schema(SCHEMA)
      .from('t_ido_fix')
      .select('ido_den_id')
      .order('ido_den_id', {
        ascending: false,
      })
      .limit(1)
      .single();
  } catch (e) {
    throw e;
  }
};

/**
 * 移動確定取得
 * @param sagyoKbnId 作業区分id
 * @param sagyoSijiId 作業指示id
 * @param sagyoDenDatDat 作業日時
 * @param sagyoId 作業id
 * @returns
 */
export const selectIdoFix = async (
  sagyoKbnId: number,
  sagyoSijiId: number,
  sagyoDenDatDat: string,
  sagyoId: number
) => {
  try {
    return await supabase
      .schema(SCHEMA)
      .from('t_ido_fix')
      .select('ido_den_id')
      .eq('sagyo_kbn_id', sagyoKbnId)
      .eq('sagyo_siji_id', sagyoSijiId)
      .eq('sagyo_den_dat', sagyoDenDatDat)
      .eq('sagyo_id', sagyoId)
      .order('ido_den_id', {
        ascending: false,
      })
      .limit(1)
      .single();
  } catch (e) {
    throw e;
  }
};

/**
 * 移動確定新規追加
 * @param data 移動確定データ
 * @returns
 */
export const insertIdoFix = async (data: IdoFix) => {
  try {
    return await supabase.schema(SCHEMA).from('t_ido_fix').insert(data);
  } catch (e) {
    throw e;
  }
};

/**
 * 移動確定削除
 * @param idoDenIds 移動確定id
 * @returns
 */
export const deleteIdoFix = async (
  sagyoKbnId: number,
  sagyoSijiId: number,
  sagyoDenDatDat: string,
  sagyoId: number
) => {
  try {
    await supabase
      .schema(SCHEMA)
      .from('t_ido_fix')
      .delete()
      .eq('sagyo_kbn_id', sagyoKbnId)
      .eq('sagyo_siji_id', sagyoSijiId)
      .eq('sagyo_den_dat', sagyoDenDatDat)
      .eq('sagyo_id', sagyoId);
  } catch (e) {
    throw e;
  }
};
