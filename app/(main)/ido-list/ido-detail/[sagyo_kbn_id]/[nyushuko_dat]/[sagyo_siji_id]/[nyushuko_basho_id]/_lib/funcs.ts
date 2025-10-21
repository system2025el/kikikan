'use server';

import { selectActiveBumons } from '@/app/_lib/db/tables/m-bumon';
import { selectBundledEqptIds } from '@/app/_lib/db/tables/m-kizai-set';

import { IdoEqptSelection } from './types';

export const getIdoDetail = async (sagyoKbnId: number) => {
  try {
  } catch (e) {
    console.error(e);
    throw e;
  }
};

/**
 * 移動機材選択で使う部門リストを取得する関数
 * @returns 無効化フラグなし、表示順部門の配列
 */
export const getIdoBumonsForEqptSelection = async () => {
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
export const checkSetoptions = async (idList: number[]) => {
  try {
    const setIdList = await selectBundledEqptIds(idList);
    console.log('setId List : ', setIdList.rows);
    const setIdListSet = new Set(setIdList.rows);
    const setIdListArray = [...setIdListSet]
      .map((l) => l.set_kizai_id)
      .filter((kizai_id) => !idList.includes(kizai_id));
    console.log('setIdListArray : ', setIdListArray);
    // セットオプションリストが空なら空配列を返して終了
    if (setIdListArray.length === 0) return [];
    // const data = await selectBundledEqpts(setIdListArray);
    // console.log('set options : ', data.rows);
    // if (!data || data.rowCount === 0) {
    //   return [];
    // }
    // return data.rows;
    return [];
  } catch (e) {
    console.error('例外が発生しました:', e);
    throw e;
  }
};

/**
 * 移動機材選択に表示するための機材リスト
 * @param query 検索キーワード
 * @returns
 */
export const getIdoEqptsForEqptSelection = async (query: string = ''): Promise<IdoEqptSelection[] | undefined> => {
  try {
    // const data = await selectActiveEqpts(query);
    // if (!data || data.rowCount === 0) {
    //   return [];
    // }
    // return data.rows;
    return [];
  } catch (e) {
    console.error('例外が発生しました:', e);
    throw e;
  }
};

/**
 * 最終的に選ばれたすべの機材IDから、機材の配列を取得する関数
 * @param idList 最終的に選ばれたすべの機材IDの配列
 * @returns {IdoEqptSelection[]} 表に渡す機材の配列
 */
export const getIdoSelectedEqpts = async (idList: number[]) => {
  try {
    // const { data, error } = await selectChosenEqptsDetails(idList);
    // if (error) {
    //   console.error('DB情報取得エラー', error.message, error.cause, error.hint);
    //   throw error;
    // }
    // if (!data) return [];
    // const selectedEqpts: IdoEqptSelection[] = data.map((d) => ({
    //   kizaiId: d.kizai_id,
    //   kizaiNam: d.kizai_nam,
    //   shozokuId: d.shozoku_id,
    //   shozokuNam: d.shozoku_nam,
    //   bumonId: d.bumon_id,
    //   kizaiGrpCod: d.kizai_grp_cod,
    //   kicsKizaiQty: d.kics_kizai_qty,
    //   yardKizaiQty: d.yard_kizai_qty,
    //   ctnFlg: d.ctn_flg,
    // }));
    // return selectedEqpts;
    return [];
  } catch (e) {
    console.error('例外が発生しました:', e);
    throw e;
  }
};
