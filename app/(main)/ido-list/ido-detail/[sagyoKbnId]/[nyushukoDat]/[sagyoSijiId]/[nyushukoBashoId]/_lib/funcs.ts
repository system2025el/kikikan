'use server';

import { revalidatePath } from 'next/cache';
import { PoolClient } from 'pg';

import pool from '@/app/_lib/db/postgres';
import { selectActiveBumons } from '@/app/_lib/db/tables/m-bumon';
import { selectActiveEqpts, selectBundledEqpts } from '@/app/_lib/db/tables/m-kizai';
import { selectBundledEqptIds } from '@/app/_lib/db/tables/m-kizai-set';
import { deleteIdoDen, insertIdoDen, selectIdoDenMaxId, updateIdoDen } from '@/app/_lib/db/tables/t-ido-den';
import { deleteIdoFix, insertIdoFix, selectIdoFix, selectIdoFixMaxId } from '@/app/_lib/db/tables/t-ido-fix';
import { selectIdoDen } from '@/app/_lib/db/tables/v-ido-den3-lst';
import { selectChosenIdoEqptsDetails } from '@/app/_lib/db/tables/v-kizai-list';
import { IdoDen } from '@/app/_lib/db/types/t-ido-den-type';
import { IdoFix } from '@/app/_lib/db/types/t-ido-fix-type';
import { toJapanTimeString } from '@/app/(main)/_lib/date-conversion';

import { IdoDetailTableValues, IdoEqptSelection, SelectedIdoEqptsValues } from './types';

/**
 * 移動伝票id最大値取得
 * @returns
 */
export const getIdoDenMaxId = async () => {
  try {
    const { data, error } = await selectIdoDenMaxId();
    if (error) {
      if (error.code === 'PGRST116') {
        return 0;
      }
      throw error;
    }
    console.log('getIdoDenMaxId : ', data);
    return data.ido_den_id;
  } catch (e) {
    console.error(e);
    throw e;
  }
};

/**
 * 移動伝票取得
 * @param sagyoKbnId 作業区分id
 * @param sagyoSijiId 作業指示id
 * @param sagyoDenDat 作業日時
 * @param sagyoId 作業id
 * @returns
 */
export const getIdoDen = async (sagyoKbnId: number, sagyoSijiId: number, sagyoDenDat: string, sagyoId: number) => {
  try {
    const { data, error } = await selectIdoDen(sagyoKbnId, sagyoSijiId, sagyoDenDat, sagyoId);
    if (error) {
      console.error('getIdoDen error : ', error);
      throw error;
    }

    const idoDetailTableList: IdoDetailTableValues[] = data.map((d) => ({
      idoDenId: d.ido_den_id ?? 0,
      sagyoKbnId: sagyoKbnId,
      nyushukoDat: sagyoDenDat,
      sagyosijiId: sagyoSijiId,
      nyushukoBashoId: sagyoId,
      juchuFlg: d.juchu_flg ?? 0,
      kizaiId: d.kizai_id ?? 0,
      kizaiNam: d.kizai_nam ?? '',
      shozokuId: sagyoId,
      rfidYardQty: d.rfid_yard_qty ?? 0,
      rfidKicsQty: d.rfid_kics_qty ?? 0,
      planJuchuQty: d.plan_juchu_qty ?? 0,
      planLowQty: d.plan_low_qty ?? 0,
      planQty: d.plan_qty ?? 0,
      resultAdjQty: d.result_adj_qty ?? 0,
      resultQty: d.result_qty ?? 0,
      diffQty: d.diff_qty ?? 0,
      ctnFlg: d.ctn_flg === 1 ? true : false,
      delFlag: false,
      saveFlag: d.ido_den_id !== null ? true : false,
    }));

    return idoDetailTableList;
  } catch (e) {
    console.error(e);
    throw e;
  }
};

/**
 * 移動伝票新規追加
 * @param addIdoDenData 追加移動伝票データ
 * @param userNam ユーザー名
 * @param connection
 */
export const addIdoDen = async (addIdoDenData: IdoDetailTableValues[], userNam: string, connection: PoolClient) => {
  const newIdoShukoData: IdoDen[] = addIdoDenData.map((d) => ({
    ido_den_id: d.idoDenId,
    kizai_id: d.kizaiId,
    plan_qty: d.planQty,
    sagyo_den_dat: d.nyushukoDat,
    sagyo_id: d.nyushukoBashoId,
    sagyo_kbn_id: 40,
    sagyo_siji_id: d.sagyosijiId,
    add_dat: toJapanTimeString(),
    add_user: userNam,
  }));

  const newIdoNyukoData: IdoDen[] = addIdoDenData.map((d) => ({
    ido_den_id: d.idoDenId,
    kizai_id: d.kizaiId,
    plan_qty: d.planQty,
    sagyo_den_dat: d.nyushukoDat,
    sagyo_id: d.sagyosijiId === 1 ? 2 : 1,
    sagyo_kbn_id: 50,
    sagyo_siji_id: d.sagyosijiId,
    add_dat: toJapanTimeString(),
    add_user: userNam,
  }));

  const mergeData = [...newIdoShukoData, ...newIdoNyukoData];

  try {
    await insertIdoDen(mergeData, connection);
  } catch (e) {
    throw e;
  }
};

/**
 * 移動伝票更新
 * @param updIdoDenData 更新移動伝票データ
 * @param userNam ユーザー名
 * @param connection
 */
export const updIdoDen = async (updIdoDenData: IdoDetailTableValues[], userNam: string, connection: PoolClient) => {
  const updateIdoShukoData: IdoDen[] = updIdoDenData.map((d) => ({
    ido_den_id: 0,
    kizai_id: d.kizaiId,
    plan_qty: d.planQty,
    sagyo_den_dat: d.nyushukoDat,
    sagyo_id: d.nyushukoBashoId,
    sagyo_kbn_id: 40,
    sagyo_siji_id: d.sagyosijiId,
    upd_dat: toJapanTimeString(),
    upd_user: userNam,
  }));

  const updateIdoNyukoData: IdoDen[] = updIdoDenData.map((d) => ({
    ido_den_id: 0,
    kizai_id: d.kizaiId,
    plan_qty: d.planQty,
    sagyo_den_dat: d.nyushukoDat,
    sagyo_id: d.sagyosijiId === 1 ? 2 : 1,
    sagyo_kbn_id: 50,
    sagyo_siji_id: d.sagyosijiId,
    upd_dat: toJapanTimeString(),
    upd_user: userNam,
  }));

  const mergeData = [...updateIdoShukoData, ...updateIdoNyukoData];

  try {
    for (const data of mergeData) {
      await updateIdoDen(data, connection);
    }
  } catch (e) {
    throw e;
  }
};

/**
 * 移動伝票削除
 * @param deleteIds 削除移動伝票id
 * @param connection
 */
export const delIdoDen = async (deleteIds: number[], connection: PoolClient) => {
  try {
    await deleteIdoDen(deleteIds, connection);
  } catch (e) {
    throw e;
  }
};

/**
 * 移動確定id最大値取得
 * @returns
 */
export const getIdoFixMaxId = async () => {
  try {
    const { data, error } = await selectIdoFixMaxId();
    if (error) {
      if (error.code === 'PGRST116') {
        return 0;
      }
      throw error;
    }
    console.log('getIdoFixMaxId : ', data);
    return data.ido_den_id;
  } catch (e) {
    console.error(e);
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
export const getIdoFix = async (sagyoKbnId: number, sagyoSijiId: number, sagyoDenDatDat: string, sagyoId: number) => {
  try {
    const { error } = await selectIdoFix(sagyoKbnId, sagyoSijiId, sagyoDenDatDat, sagyoId);
    if (error) {
      if (error.code === 'PGRST116') {
        return false;
      }
      throw error;
    }

    return true;
  } catch (e) {
    console.error(e);
    throw e;
  }
};

/**
 * 移動確定新規追加
 * @param sagyoKbnId 作業区分id
 * @param sagyoSijiId 作業指示id
 * @param sagyoDenDatDat 作業日時
 * @param sagyoId 作業id
 * @param userNam ユーザー名
 * @returns
 */
export const addIdoFix = async (
  sagyoKbnId: number,
  sagyoSijiId: number,
  sagyoDenDatDat: string,
  sagyoId: number,
  userNam: string
) => {
  const newIdoFixId = (await getIdoFixMaxId()) + 1;

  const newData: IdoFix = {
    ido_den_id: newIdoFixId,
    sagyo_den_dat: sagyoDenDatDat,
    sagyo_fix_flg: 1,
    sagyo_id: sagyoId,
    sagyo_kbn_id: sagyoKbnId,
    sagyo_siji_id: sagyoSijiId,
    upd_dat: toJapanTimeString(),
    upd_user: userNam,
  };

  try {
    await insertIdoFix(newData);
    console.log('ido fix add successfully:', newData);
    return true;
  } catch (e) {
    console.error(e);
    return false;
  }
};

/**
 * 移動確定削除
 * @param sagyoKbnId 作業区分id
 * @param sagyoSijiId 作業指示id
 * @param sagyoDenDatDat 作業日時
 * @param sagyoId 作業id
 * @returns
 */
export const delIdoFix = async (sagyoKbnId: number, sagyoSijiId: number, sagyoDenDatDat: string, sagyoId: number) => {
  try {
    await deleteIdoFix(sagyoKbnId, sagyoSijiId, sagyoDenDatDat, sagyoId);
    return true;
  } catch (e) {
    console.error(e);
    return false;
  }
};

/**
 * 移動伝票保存
 * @param idoDenData 移動伝票データ
 * @param userNam ユーザー名
 * @returns
 */
export const saveIdoDen = async (idoDenData: IdoDetailTableValues[], userNam: string) => {
  const connection = await pool.connect();

  let newIdoDenId = await getIdoDenMaxId();
  const saveIdoDenData = idoDenData.map((data) =>
    data.idoDenId === 0 && !data.delFlag ? { ...data, idoDenId: ++newIdoDenId } : data
  );

  const addIdoDenData = saveIdoDenData.filter((d) => !d.saveFlag && !d.delFlag);
  const updIdoDenData = saveIdoDenData.filter((d) => d.saveFlag && !d.delFlag);
  const delIdoDenData = saveIdoDenData.filter((d) => d.saveFlag && d.delFlag);

  try {
    // 削除
    if (delIdoDenData.length > 0) {
      const deleteIds = delIdoDenData.map((data) => data.idoDenId);
      await delIdoDen(deleteIds, connection);
    }
    // 追加
    if (addIdoDenData.length > 0) {
      await addIdoDen(addIdoDenData, userNam, connection);
    }
    // 更新
    if (updIdoDenData.length > 0) {
      await updIdoDen(updIdoDenData, userNam, connection);
    }
    console.log('saveIdoDen successfully');
    await connection.query('COMMIT');

    revalidatePath('ido-list');

    const updateIdoDenData = saveIdoDenData.filter((d) => !d.delFlag).map((d) => ({ ...d, saveFlag: true }));
    return updateIdoDenData;
  } catch (e) {
    console.error(e);
    await connection.query('ROLLBACK');
    return null;
  } finally {
    connection.release();
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
    // const { data: setIdList, error: setIdListError } = await selectBundledEqptIds(idList);
    const { rows: setIdList } = await selectBundledEqptIds(idList);

    // if (setIdListError) {
    //   throw setIdListError;
    // }
    console.log('setId List : ', setIdList);
    const setIdListSet = new Set(setIdList);
    const setIdListArray = [...setIdListSet]
      .map((l) => l.set_kizai_id)
      .filter((kizai_id) => !idList.includes(kizai_id));
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
 * 移動機材選択に表示するための機材リスト
 * @param query 検索キーワード
 * @returns
 */
export const getIdoEqptsForEqptSelection = async (query: string = ''): Promise<IdoEqptSelection[] | undefined> => {
  try {
    const data = await selectActiveEqpts(query);
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
 * 最終的に選ばれたすべの機材IDから、機材の配列を取得する関数
 * @param idList 最終的に選ばれたすべの機材IDの配列
 * @returns {IdoEqptSelection[]} 表に渡す機材の配列
 */
export const getIdoSelectedEqpts = async (idList: number[]) => {
  try {
    const { data, error } = await selectChosenIdoEqptsDetails(idList);
    if (error) {
      console.error('DB情報取得エラー', error.message, error.cause, error.hint);
      throw error;
    }
    if (!data) return [];
    const selectedEqpts: SelectedIdoEqptsValues[] = data.map((d) => ({
      kizaiId: d.kizai_id,
      kizaiNam: d.kizai_nam ?? '',
      shozokuId: d.shozoku_id ?? 2,
      shozokuNam: d.shozoku_nam ?? '',
      kizaiGrpCod: d.kizai_grp_cod ?? '',
      dspOrdNum: d.dsp_ord_num ?? 0,
      rfidKicsQty: d.rfid_kics_qty ?? 0,
      rfidYardQty: d.rfid_yard_qty ?? 0,
      ctnFlg: d.ctn_flg === 1 ? true : false,
    }));
    return selectedEqpts;
  } catch (e) {
    console.error('例外が発生しました:', e);
    throw e;
  }
};
