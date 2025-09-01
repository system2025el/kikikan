'use server';

import pool from '@/app/_lib/db/postgres';
import { SCHEMA, supabase } from '@/app/_lib/db/supabase';
import { selectActiveBumons } from '@/app/_lib/db/tables/m-bumon';
import { selectActiveDaibumons } from '@/app/_lib/db/tables/m-daibumon';
import { selectBundledEqpts } from '@/app/_lib/db/tables/m-kizai';
import { selectBundledEqptIds } from '@/app/_lib/db/tables/m-kizai-set';
import { selectActiveCustomer } from '@/app/_lib/db/tables/m-kokyaku';
import { selectActiveShozokus } from '@/app/_lib/db/tables/m-shozoku';
import { selectActiveShukeibumons } from '@/app/_lib/db/tables/m-shukeibumon';
import { SelectTypes } from '@/app/(main)/_ui/form-box';

/**
 * 選択肢に使う大部門リストを取得する関数
 * @returns {SelectTypes[]} 大部門のidと大部門名のlabelを持ったオブジェクトの配列、エラーの場合空配列
 */
export const getDaibumonsSelection = async () => {
  try {
    const { data, error } = await selectActiveDaibumons();
    if (error) {
      console.error('DB情報取得エラー', error.message, error.cause, error.hint);
      throw error;
    }
    if (!data || data.length === 0) {
      return [];
    }
    // 選択肢の型に成型する
    const selectElements: SelectTypes[] = data.map((d) => ({
      id: d.dai_bumon_id,
      label: d.dai_bumon_nam,
    }));
    console.log('大部門が', selectElements.length, '件');
    return selectElements;
  } catch (e) {
    console.error('例外が発生しました:', e);
    throw e;
  }
};

/**
 * 選択肢に使う集計部門リストを取得する関数
 * @returns {SelectTypes[]} 集計部門のidと集計部門名のlabelを持ったオブジェクトの配列、エラーの場合空配列
 */
export const getShukeibumonsSelection = async () => {
  try {
    const { data, error } = await selectActiveShukeibumons();
    if (error) {
      console.error('DB情報取得エラー', error.message, error.cause, error.hint);
      throw error;
    }
    if (!data || data.length === 0) {
      return [];
    }
    // 選択肢の型に成型
    const selectElements: SelectTypes[] = data.map((d) => ({
      id: d.shukei_bumon_id,
      label: d.shukei_bumon_nam,
    }));
    console.log('集計部門が', selectElements.length, '件');
    return selectElements;
  } catch (e) {
    console.error('例外が発生しました:', e);
    throw e;
  }
};

/**
 * 選択肢に使う部門リストを取得する関数
 * @returns {SelectTypes[]} 部門のidと部門名のlabelを持ったオブジェクトの配列、エラーの場合空配列
 */
export const getBumonsSelection = async () => {
  try {
    const { data, error } = await selectActiveBumons();
    if (error) {
      console.error('DB情報取得エラー', error.message, error.cause, error.hint);
      throw error;
    }
    if (!data || data.length === 0) {
      return [];
    }
    // 選択肢の型に成型
    const selectElements: SelectTypes[] = data.map((d) => ({
      id: d.bumon_id,
      label: d.bumon_nam,
    }));
    console.log('部門が', selectElements.length, '件');
    return selectElements;
  } catch (e) {
    console.error('例外が発生しました:', e);
    throw e;
  }
};

/**
 * 選択肢に使う所属リストを取得する関数
 * @returns {SelectTypes[]} 所属のidと所属名のlabelを持ったオブジェクトの配列、エラーの場合空配列
 */
export const getShozokuSelection = async () => {
  try {
    const { data, error } = await selectActiveShozokus();
    if (error) {
      console.error('DB情報取得エラー', error.message, error.cause, error.hint);
      throw error;
    }
    if (!data || data.length === 0) {
      return [];
    }
    const selectElements: SelectTypes[] = data.map((d) => ({
      id: d.shozoku_id,
      label: d.shozoku_nam,
    }));
    console.log('所属', selectElements.length, '件');
    return selectElements;
  } catch (e) {
    console.error('例外が発生しました:', e);
    throw e;
  }
};

/**
 * 全選択肢をまとめて取得する関数
 * @returns {{SelectTypes[]}} 0:大部門, 1:集計部門, 2:部門, 3:所属
 */
export const getAllSelections = async (): Promise<{
  d: SelectTypes[];
  s: SelectTypes[];
  b: SelectTypes[];
  shozoku: SelectTypes[];
}> => {
  try {
    const [daibumons, shukeibumons, bumons, shozoku] = await Promise.all([
      getDaibumonsSelection(),
      getShukeibumonsSelection(),
      getBumonsSelection(),
      getShozokuSelection(),
    ]);
    return { d: daibumons!, s: shukeibumons!, b: bumons!, shozoku: shozoku! };
  } catch (error) {
    console.error('Error fetching all selections:', error);
    return { d: [], s: [], b: [], shozoku: [] };
  }
};

/**
 * 全部門の選択肢をまとめて取得する関数
 * @returns {{SelectTypes[]}} d:大部門, s:集計部門, b:部門
 */
export const getAllBumonSelections = async (): Promise<{
  d: SelectTypes[];
  s: SelectTypes[];
  b: SelectTypes[];
}> => {
  try {
    const [daibumons, shukeibumons, bumons] = await Promise.all([
      getDaibumonsSelection(),
      getShukeibumonsSelection(),
      getBumonsSelection(),
    ]);

    return { d: daibumons!, s: shukeibumons!, b: bumons! };
  } catch (error) {
    console.error('Error fetching all selections:', error);
    return { d: [], s: [], b: [] };
  }
};

/**
 * 大部門と集計部門の選択肢をまとめて取得する関数
 * @returns {{SelectTypes[]}} d:大部門, s:集計部門
 */
export const getAllBumonDSSelections = async (): Promise<{
  d: SelectTypes[];
  s: SelectTypes[];
}> => {
  try {
    const [daibumons, shukeibumons] = await Promise.all([getDaibumonsSelection(), getShukeibumonsSelection()]);

    return { d: daibumons!, s: shukeibumons! };
  } catch (error) {
    console.error('Error fetching all selections:', error);
    return { d: [], s: [] };
  }
};

/**
 * 機材選択で使う部門リストを取得する関数
 * @returns 無効化フラグなし、表示順部門の配列
 */
export const getBumonsForEqptSelection = async () => {
  try {
    const { data, error } = await selectActiveBumons();
    if (error) {
      console.error('DB情報取得エラー', error.message, error.cause, error.hint);
      throw error;
    }
    if (!data || data.length === 0) {
      return [];
    }
    const selectElements = data.map((d, index) => ({
      id: d.bumon_id,
      label: d.bumon_nam,
      tblDspNum: index,
    }));
    console.log('部門が', selectElements.length, '件');
    return selectElements;
  } catch (e) {
    console.error('例外が発生しました:', e);
    throw e;
  }
};

/**
 * 選ばれた機材に対するセットオプションを確認する関数
 * @param idList 選ばれた機材たちの機材IDリスト
 * @returns セットオプションの機材の配列、もともと選ばれていたり、なかった場合はから配列を返す
 */
export const CheckSetoptions = async (idList: number[]) => {
  try {
    const setIdList = await selectBundledEqptIds(idList);
    console.log('setId List : ', setIdList.rows);
    const setIdListSet = new Set(setIdList.rows);
    const setIdListArray = [...setIdListSet].map((l) => l.kizai_id).filter((kizai_id) => !idList.includes(kizai_id));
    console.log('setIdListArray : ', setIdListArray);
    // セットオプションリストが空なら空配列を返して終了
    if (setIdListArray.length === 0) return [];
    const data = await selectBundledEqpts(setIdListArray);
    console.log('set options : ', data.rows);
    if (!data || data.rowCount === 0) {
      return [];
    }
    return data.rows;
  } catch (e) {
    console.error('例外が発生しました:', e);
    throw e;
  }
};

/**
 * 選択肢に使う顧客リストを取得する関数
 * @returns 選択肢に使う顧客リスト
 */
export const getCustomerSelection = async (): Promise<{ kokyakuId: number; kokyakuNam: string }[]> => {
  try {
    const { data, error } = await selectActiveCustomer();
    if (error) {
      console.error('DB情報取得エラー', error.message, error.cause, error.hint);
      throw error;
    }
    if (!data || data.length === 0) {
      return [];
    }
    const selectElements = data.map((d) => ({
      kokyakuId: d.kokyaku_id,
      kokyakuNam: d.kokyaku_nam,
    }));
    console.log('顧客が', selectElements.length, '件');
    return selectElements;
  } catch (e) {
    console.error('例外が発生', e);
    throw e;
  }
};
