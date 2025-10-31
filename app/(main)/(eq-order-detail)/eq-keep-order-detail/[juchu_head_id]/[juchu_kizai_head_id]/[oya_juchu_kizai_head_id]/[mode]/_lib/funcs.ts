'use server';

import { PoolClient } from 'pg';

import pool from '@/app/_lib/db/postgres';
import {
  deleteJuchuContainerMeisai,
  insertJuchuContainerMeisai,
  updateJuchuContainerMeisai,
} from '@/app/_lib/db/tables/t-juchu-ctn-meisai';
import {
  insertKeepJuchuKizaiHead,
  selectKeepJuchuKizaiHead,
  updateKeepJuchuKizaiHead,
} from '@/app/_lib/db/tables/t-juchu-kizai-head';
import {
  deleteJuchuKizaiMeisai,
  insertJuchuKizaiMeisai,
  updateJuchuKizaiMeisai,
} from '@/app/_lib/db/tables/t-juchu-kizai-meisai';
import {
  deleteContainerNyushukoDen,
  deleteNyushukoDen,
  insertNyushukoDen,
  selectContainerNyushukoDenConfirm,
  updateNyushukoDen,
} from '@/app/_lib/db/tables/t-nyushuko-den';
import {
  deleteNyushukoFix,
  insertNyushukoFix,
  selectNyushukoFixConfirm,
  updateNyushukoFix,
} from '@/app/_lib/db/tables/t-nyushuko-fix';
import { deleteKizaiIdNyushukoResult } from '@/app/_lib/db/tables/t-nyushuko-result';
import { selectJuchuContainerMeisai } from '@/app/_lib/db/tables/v-juchu-ctn-meisai';
import { selectKeepJuchuKizaiMeisai, selectOyaJuchuKizaiMeisai } from '@/app/_lib/db/tables/v-juchu-kizai-meisai';
import { JuchuCtnMeisai } from '@/app/_lib/db/types/t_juchu_ctn_meisai-type';
import { JuchuKizaiHead } from '@/app/_lib/db/types/t-juchu-kizai-head-type';
import { JuchuKizaiMeisai } from '@/app/_lib/db/types/t-juchu-kizai-meisai-type';
import { NyushukoDen } from '@/app/_lib/db/types/t-nyushuko-den-type';
import { NyushukoFix } from '@/app/_lib/db/types/t-nyushuko-fix-type';
import { Database } from '@/app/_lib/db/types/types';
import { toISOString, toJapanTimeString } from '@/app/(main)/_lib/date-conversion';
import {
  addJuchuKizaiNyushuko,
  delAllNyushukoResult,
  delNyushukoCtnResult,
  getJuchuContainerMeisaiMaxId,
  getJuchuKizaiHeadMaxId,
  getJuchuKizaiMeisaiMaxId,
  getJuchuKizaiNyushuko,
  updJuchuKizaiNyushuko,
} from '@/app/(main)/(eq-order-detail)/_lib/funcs';

import { KeepJuchuContainerMeisaiValues, KeepJuchuKizaiHeadValues, KeepJuchuKizaiMeisaiValues } from './types';

/**
 * 新規キープ受注機材ヘッダー保存
 * @param data
 * @param userNam
 * @returns
 */
export const saveNewKeepJuchuKizaiHead = async (data: KeepJuchuKizaiHeadValues, userNam: string) => {
  const connection = await pool.connect();

  try {
    await connection.query('BEGIN');

    const maxId = await getJuchuKizaiHeadMaxId(data.juchuHeadId);
    const newJuchuKizaiHeadId = maxId ? maxId.juchu_kizai_head_id + 1 : 1;
    // 受注機材ヘッダー追加
    const headResult = await addKeepJuchuKizaiHead(newJuchuKizaiHeadId, data, userNam, connection);
    console.log('受注機材ヘッダー追加', headResult);
    // 受注機材入出庫追加
    const nyushukoResult = await addJuchuKizaiNyushuko(
      data.juchuHeadId,
      newJuchuKizaiHeadId,
      data.kicsShukoDat,
      data.yardShukoDat,
      data.kicsNyukoDat,
      data.yardNyukoDat,
      userNam,
      connection
    );
    console.log('キープ受注機材入出庫追加', nyushukoResult);

    await connection.query('COMMIT');
    return newJuchuKizaiHeadId;
  } catch (e) {
    console.error(e);
    await connection.query('ROLLBACK');
    return null;
  } finally {
    connection.release();
  }
};

/**
 * キープ受注機材ヘッダー保存
 * @param checkJuchuKizaiHead
 * @param checkJuchuKizaiMeisai
 * @param checkJuchuContainerMeisai
 * @param data
 * @param updateShukoDate
 * @param updateNyukoDate
 * @param keepJuchuKizaiMeisaiList
 * @param keepJuchuContainerMeisaiList
 * @param userNam
 */
export const saveKeepJuchuKizai = async (
  checkJuchuKizaiHead: boolean,
  checkKicsDat: boolean,
  checkYardDat: boolean,
  checkJuchuKizaiMeisai: boolean,
  checkJuchuContainerMeisai: boolean,
  originKicsShukoDat: Date | null | undefined,
  originYardShukoDat: Date | null | undefined,
  data: KeepJuchuKizaiHeadValues,
  updateShukoDate: Date,
  updateNyukoDate: Date,
  keepJuchuKizaiMeisaiList: KeepJuchuKizaiMeisaiValues[],
  keepJuchuContainerMeisaiList: KeepJuchuContainerMeisaiValues[],
  userNam: string
) => {
  const connection = await pool.connect();

  try {
    await connection.query('BEGIN');

    // 受注機材ヘッダー関係更新
    if (checkJuchuKizaiHead) {
      // 受注機材ヘッド更新
      const headResult = await updKeepJuchuKizaiHead(data, userNam, connection);
      console.log('キープ受注機材ヘッダー更新', headResult);

      // 受注機材入出庫更新
      const nyushukoResult = await updJuchuKizaiNyushuko(
        data.juchuHeadId,
        data.juchuKizaiHeadId,
        data.kicsShukoDat,
        data.yardShukoDat,
        data.kicsNyukoDat,
        data.yardNyukoDat,
        userNam,
        connection
      );
      console.log('キープ受注機材入出庫更新', nyushukoResult);
    }

    // 入出庫実績削除
    let kicsDelFlg = false;
    let yardDelFlg = false;
    if (checkKicsDat && originKicsShukoDat) {
      kicsDelFlg = await delAllNyushukoResult(
        data.juchuHeadId,
        data.juchuKizaiHeadId,
        toJapanTimeString(originKicsShukoDat, '-'),
        1,
        connection
      );
      console.log('KICS入出庫実績削除', kicsDelFlg);
    }
    if (checkKicsDat && originYardShukoDat) {
      yardDelFlg = await delAllNyushukoResult(
        data.juchuHeadId,
        data.juchuKizaiHeadId,
        toJapanTimeString(originYardShukoDat, '-'),
        2,
        connection
      );
      console.log('YARD入出庫実績削除', yardDelFlg);
    }

    // 受注機材明細関係更新
    if (checkKicsDat || checkYardDat || checkJuchuKizaiMeisai) {
      //const copyKeepJuchuKizaiMeisaiData = [...keepJuchuKizaiMeisaiList];
      const juchuKizaiMeisaiMaxId = await getJuchuKizaiMeisaiMaxId(data.juchuHeadId, data.juchuKizaiHeadId);
      let newKeepJuchuKizaiMeisaiId = juchuKizaiMeisaiMaxId ? juchuKizaiMeisaiMaxId.juchu_kizai_meisai_id + 1 : 1;

      const newKeepJuchuKizaiMeisaiData = keepJuchuKizaiMeisaiList.map((data) =>
        data.juchuKizaiMeisaiId === 0 && !data.delFlag
          ? { ...data, juchuKizaiMeisaiId: newKeepJuchuKizaiMeisaiId++ }
          : data
      );

      // 受注機材明細、入出庫伝票
      const addKeepJuchuKizaiMeisaiData = newKeepJuchuKizaiMeisaiData.filter((data) => !data.delFlag && !data.saveFlag);
      const updateKeepJuchuKizaiMeisaiData = newKeepJuchuKizaiMeisaiData.filter(
        (data) => !data.delFlag && data.saveFlag
      );
      const deleteKeepJuchuKizaiMeisaiData = newKeepJuchuKizaiMeisaiData.filter(
        (data) => data.delFlag && data.saveFlag
      );
      // 削除
      if (deleteKeepJuchuKizaiMeisaiData.length > 0) {
        const deleteMeisaiResult = await delKeepJuchuKizaiMeisai(deleteKeepJuchuKizaiMeisaiData, connection);
        console.log('キープ受注機材明細削除', deleteMeisaiResult);

        const deleteNyushukoDenResult = await delKeepNyushukoDen(deleteKeepJuchuKizaiMeisaiData, connection);
        console.log('キープ入出庫伝票削除', deleteNyushukoDenResult);
      }
      // 追加
      if (addKeepJuchuKizaiMeisaiData.length > 0) {
        const addMeisaiResult = await addKeepJuchuKizaiMeisai(addKeepJuchuKizaiMeisaiData, userNam, connection);
        console.log('キープ受注機材明細追加', addMeisaiResult);

        const addNyushukoDenResult = await addKeepNyushukoDen(data, addKeepJuchuKizaiMeisaiData, userNam, connection);
        console.log('キープ入出庫伝票追加', addNyushukoDenResult);
      }
      // 更新
      if (updateKeepJuchuKizaiMeisaiData.length > 0) {
        const updateMeisaiResult = await updKeepJuchuKizaiMeisai(updateKeepJuchuKizaiMeisaiData, userNam, connection);
        console.log('キープ受注機材明細更新', updateMeisaiResult);

        const updateNyushukoDenResult = await updKeepNyushukoDen(
          data,
          updateKeepJuchuKizaiMeisaiData,
          userNam,
          connection
        );
        console.log('キープ入出庫伝票更新', updateNyushukoDenResult);
      }

      const kicsKizaiMeisaiData = deleteKeepJuchuKizaiMeisaiData.filter((d) => d.shozokuId === 1);
      const yardKizaiMeisaiData = deleteKeepJuchuKizaiMeisaiData.filter((d) => d.shozokuId === 2);
      if (kicsKizaiMeisaiData.length > 0 && originKicsShukoDat && !kicsDelFlg) {
        const deleteKicsNyushukoResultResult = await delNyushukoResult(
          kicsKizaiMeisaiData,
          toJapanTimeString(originKicsShukoDat, '-'),
          connection
        );
        console.log('KICS入出庫実績削除', deleteKicsNyushukoResultResult);
      }
      if (yardKizaiMeisaiData.length > 0 && originYardShukoDat && !yardDelFlg) {
        const deleteYardNyushukoResultResult = await delNyushukoResult(
          yardKizaiMeisaiData,
          toJapanTimeString(originYardShukoDat, '-'),
          connection
        );
        console.log('YARD入出庫実績削除', deleteYardNyushukoResultResult);
      }
    }

    // 受注コンテナ明細更新
    if (checkKicsDat || checkYardDat || checkJuchuContainerMeisai) {
      // const copyKeepJuchuContainerMeisaiData = [...keepJuchuContainerMeisaiList];
      const juchuContainerMeisaiMaxId = await getJuchuContainerMeisaiMaxId(data.juchuHeadId, data.juchuKizaiHeadId);
      let newKeepJuchuContainerMeisaiId = juchuContainerMeisaiMaxId
        ? juchuContainerMeisaiMaxId.juchu_kizai_meisai_id + 1
        : 1;

      const newKeepJuchuContainerMeisaiData = keepJuchuContainerMeisaiList.map((data) =>
        data.juchuKizaiMeisaiId === 0 && !data.delFlag
          ? { ...data, juchuKizaiMeisaiId: newKeepJuchuContainerMeisaiId++ }
          : data
      );

      // 受注コンテナ明細更新
      const addKeepJuchuContainerMeisaiData = newKeepJuchuContainerMeisaiData.filter(
        (data) => !data.delFlag && !data.saveFlag
      );
      const updateKeepJuchuContainerMeisaiData = newKeepJuchuContainerMeisaiData.filter(
        (data) => !data.delFlag && data.saveFlag
      );
      const deleteKeepJuchuContainerMeisaiData = newKeepJuchuContainerMeisaiData.filter(
        (data) => data.delFlag && data.saveFlag
      );
      // 削除
      if (deleteKeepJuchuContainerMeisaiData.length > 0) {
        const deleteKizaiIds = deleteKeepJuchuContainerMeisaiData.map((data) => data.kizaiId);
        const deleteContainerMeisaiResult = await delKeepJuchuContainerMeisai(
          data.juchuHeadId,
          data.juchuKizaiHeadId,
          deleteKizaiIds,
          connection
        );
        console.log('キープ受注コンテナ明細削除', deleteContainerMeisaiResult);
      }
      // 追加
      if (addKeepJuchuContainerMeisaiData.length > 0) {
        const addContainerMeisaiResult = await addKeepJuchuContainerMeisai(
          addKeepJuchuContainerMeisaiData,
          userNam,
          connection
        );
        console.log('キープ受注コンテナ明細追加', addContainerMeisaiResult);
      }
      // 更新
      if (updateKeepJuchuContainerMeisaiData.length > 0) {
        const updateContainerMeisaiResult = await updKeepJuchuContainerMeisai(
          updateKeepJuchuContainerMeisaiData,
          userNam,
          connection
        );
        console.log('キープ受注コンテナ明細更新', updateContainerMeisaiResult);
      }

      // キープコンテナ入出庫伝票更新
      if (newKeepJuchuContainerMeisaiData.length > 0) {
        const containerNyushukoDenResult = await updKeepContainerNyushukoDen(
          data,
          newKeepJuchuContainerMeisaiData,
          userNam,
          connection
        );
        console.log('キープコンテナ入出庫伝票更新', containerNyushukoDenResult);
      }

      const existingContainerMeisai = keepJuchuContainerMeisaiList.filter((d) => d.saveFlag && !d.delFlag);
      const deleteIds = keepJuchuContainerMeisaiList.filter((d) => d.delFlag && d.saveFlag).map((d) => d.kizaiId);
      const deleteKicsIds: number[] = [];
      const deleteYardIds: number[] = [];
      if (existingContainerMeisai.length > 0) {
        const kicsContainerIds = existingContainerMeisai.filter((d) => d.kicsKeepQty === 0).map((d) => d.kizaiId);
        const yardContainerIds = existingContainerMeisai.filter((d) => d.yardKeepQty === 0).map((d) => d.kizaiId);
        deleteKicsIds.push(...deleteIds, ...kicsContainerIds);
        deleteYardIds.push(...deleteIds, ...yardContainerIds);
      }
      if (originKicsShukoDat && deleteKicsIds.length > 0 && !kicsDelFlg) {
        const deleteKicsContainerNyushukoResultResult = await delNyushukoCtnResult(
          data.juchuHeadId,
          data.juchuKizaiHeadId,
          toJapanTimeString(originKicsShukoDat, '-'),
          1,
          deleteKicsIds,
          connection
        );
        console.log('KICSコンテナ入出庫実績削除', deleteKicsContainerNyushukoResultResult);
      }
      if (originYardShukoDat && deleteYardIds.length > 0 && !yardDelFlg) {
        const deleteYardContainerNyushukoResultResult = await delNyushukoCtnResult(
          data.juchuHeadId,
          data.juchuKizaiHeadId,
          toJapanTimeString(originYardShukoDat, '-'),
          2,
          deleteYardIds,
          connection
        );
        console.log('YARDコンテナ入出庫実績削除', deleteYardContainerNyushukoResultResult);
      }
    }

    // // 入出庫確定更新
    // if (keepJuchuKizaiMeisaiList.length > 0 || keepJuchuContainerMeisaiList.length > 0) {
    //   const kics =
    //     keepJuchuKizaiMeisaiList.filter((d) => d.shozokuId === 1 && !d.delFlag).length > 0 ||
    //     keepJuchuContainerMeisaiList.filter((d) => d.kicsKeepQty && !d.delFlag).length > 0
    //       ? true
    //       : false;
    //   const yard =
    //     keepJuchuKizaiMeisaiList.filter((d) => d.shozokuId === 2 && !d.delFlag).length > 0 ||
    //     keepJuchuContainerMeisaiList.filter((d) => d.yardKeepQty && !d.delFlag).length > 0
    //       ? true
    //       : false;

    //   const nyushukoFixResult = await updKeepNyushukoFix(data, kics, yard, userNam, connection);
    //   console.log('キープ入出庫確定更新', nyushukoFixResult);
    // }

    await connection.query('COMMIT');
    return true;
  } catch (e) {
    console.error(e);
    await connection.query('ROLLBACK');
    return false;
  } finally {
    connection.release();
  }
};

/**
 * キープ受注機材ヘッダー取得
 * @param juchuHeadId 受注ヘッダーid
 * @param juchuKizaiHeadId 受注機材ヘッダーid
 * @returns 受注機材ヘッダーデータ
 */
export const getKeepJuchuKizaiHead = async (juchuHeadId: number, juchuKizaiHeadId: number) => {
  try {
    const { data, error } = await selectKeepJuchuKizaiHead(juchuHeadId, juchuKizaiHeadId);
    if (error || data?.oya_juchu_kizai_head_id === null) {
      console.error('GetEqHeader juchuKizaiHead error : ', error);
      throw error;
    }

    const juchuDate = await getJuchuKizaiNyushuko(juchuHeadId, juchuKizaiHeadId);

    if (!juchuDate) throw new Error('受注機材入出庫日が存在しません');

    const keepJucuKizaiHeadData: KeepJuchuKizaiHeadValues = {
      juchuHeadId: data.juchu_head_id,
      juchuKizaiHeadId: data.juchu_kizai_head_id,
      juchuKizaiHeadKbn: data.juchu_kizai_head_kbn,
      mem: data.mem ? data.mem : '',
      headNam: data.head_nam ?? '',
      oyaJuchuKizaiHeadId: data.oya_juchu_kizai_head_id,
      kicsShukoDat: juchuDate.kicsShukoDat ? new Date(juchuDate.kicsShukoDat) : null,
      kicsNyukoDat: juchuDate.kicsNyukoDat ? new Date(juchuDate.kicsNyukoDat) : null,
      yardShukoDat: juchuDate.yardShukoDat ? new Date(juchuDate.yardShukoDat) : null,
      yardNyukoDat: juchuDate.yardNyukoDat ? new Date(juchuDate.yardNyukoDat) : null,
    };

    console.log('keepJucuKizaiHeadData', keepJucuKizaiHeadData);
    return keepJucuKizaiHeadData;
  } catch (e) {
    console.error(e);
  }
};

/**
 * キープ受注機材ヘッダー新規追加
 * @param juchuKizaiHeadId 受注機材ヘッダーid
 * @param juchuKizaiHeadData 受注機材ヘッダーデータ
 * @param dspOrdNum 表示順
 * @param userNam ユーザー名
 * @returns
 */
export const addKeepJuchuKizaiHead = async (
  keepJuchuKizaiHeadId: number,
  keepJuchuKizaiHeadData: KeepJuchuKizaiHeadValues,
  userNam: string,
  connection: PoolClient
) => {
  const newData: JuchuKizaiHead = {
    juchu_head_id: keepJuchuKizaiHeadData.juchuHeadId,
    juchu_kizai_head_id: keepJuchuKizaiHeadId,
    juchu_kizai_head_kbn: 3,
    mem: keepJuchuKizaiHeadData.mem,
    head_nam: keepJuchuKizaiHeadData.headNam,
    oya_juchu_kizai_head_id: keepJuchuKizaiHeadData.oyaJuchuKizaiHeadId,
    ht_kbn: 0,
    add_dat: toJapanTimeString(),
    add_user: userNam,
  };
  try {
    await insertKeepJuchuKizaiHead(newData, connection);
    console.log('New juchuKizaiHead added successfully:', newData);
    return true;
  } catch (e) {
    console.error(e);
    throw e;
  }
};

/**
 * キープ受注機材ヘッダー更新
 * @param juchuKizaiHeadData 受注機材ヘッダーデータ
 * @param userNam ユーザー名
 * @returns
 */
export const updKeepJuchuKizaiHead = async (
  juchuKizaiHeadData: KeepJuchuKizaiHeadValues,
  userNam: string,
  connection: PoolClient
) => {
  const updateData: JuchuKizaiHead = {
    juchu_head_id: juchuKizaiHeadData.juchuHeadId,
    juchu_kizai_head_id: juchuKizaiHeadData.juchuKizaiHeadId,
    juchu_kizai_head_kbn: juchuKizaiHeadData.juchuKizaiHeadKbn,
    mem: juchuKizaiHeadData.mem,
    head_nam: juchuKizaiHeadData.headNam,
    oya_juchu_kizai_head_id: juchuKizaiHeadData.oyaJuchuKizaiHeadId,
    ht_kbn: 0,
    upd_dat: toJapanTimeString(),
    upd_user: userNam,
  };

  try {
    await updateKeepJuchuKizaiHead(updateData, connection);
    console.log('juchu kizai head updated successfully:', updateData);
    return true;
  } catch (e) {
    console.error('Exception while updating juchu kizai head:', e);
    throw e;
  }
};

/**
 * キープ受注機材明細リスト取得
 * @param juchuHeadId 受注ヘッダーid
 * @param juchuKizaiHeadId 受注機材ヘッダーid
 * @returns キープ受注機材明細
 */
export const getKeepJuchuKizaiMeisai = async (
  juchuHeadId: number,
  juchuKizaiHeadId: number,
  oyaJuchuKizaiHeadId: number
) => {
  try {
    const { data: keepData, error: keepError } = await selectKeepJuchuKizaiMeisai(juchuHeadId, juchuKizaiHeadId);
    if (keepError) {
      console.error('GetKeeoEqList keep eqList error : ', keepError);
      throw keepError;
    }

    const { data: oyaData, error: oyaError } = await selectOyaJuchuKizaiMeisai(juchuHeadId, oyaJuchuKizaiHeadId);
    if (oyaError) {
      console.error('GetKeeoEqList oya eqList error : ', oyaError);
      throw oyaError;
    }

    const keepJuchuKizaiMeisaiData: KeepJuchuKizaiMeisaiValues[] = keepData.map((d) => ({
      juchuHeadId: d.juchu_head_id,
      juchuKizaiHeadId: d.juchu_kizai_head_id,
      juchuKizaiMeisaiId: d.juchu_kizai_meisai_id,
      shozokuId: d.shozoku_id,
      shozokuNam: d.shozoku_nam ?? '',
      mem: d.mem,
      kizaiId: d.kizai_id,
      kizaiNam: d.kizai_nam ?? '',
      oyaPlanKizaiQty: oyaData.find((oya) => oya.kizai_id === d.kizai_id)?.plan_kizai_qty ?? 0,
      oyaPlanYobiQty: oyaData.find((oya) => oya.kizai_id === d.kizai_id)?.plan_yobi_qty ?? 0,
      keepQty: d.keep_qty,
      dspOrdNum: d.dsp_ord_num,
      indentNum: d.indent_num,
      delFlag: false,
      saveFlag: true,
    }));
    return keepJuchuKizaiMeisaiData;
  } catch (e) {
    console.error(e);
  }
};

/**
 * キープ受注機材明細新規追加
 * @param juchuKizaiMeisaiData 受注機材明細データ
 * @param userNam ユーザー名
 * @returns
 */
export const addKeepJuchuKizaiMeisai = async (
  keepJuchuKizaiMeisaiData: KeepJuchuKizaiMeisaiValues[],
  userNam: string,
  connection: PoolClient
) => {
  const newData: JuchuKizaiMeisai[] = keepJuchuKizaiMeisaiData.map((d) => ({
    juchu_head_id: d.juchuHeadId,
    juchu_kizai_head_id: d.juchuKizaiHeadId,
    juchu_kizai_meisai_id: d.juchuKizaiMeisaiId,
    kizai_id: d.kizaiId,
    mem: d.mem,
    keep_qty: d.keepQty,
    dspOrdNum: d.dspOrdNum,
    indentNum: d.indentNum,
    add_dat: toJapanTimeString(),
    add_user: userNam,
    shozoku_id: d.shozokuId,
  }));

  try {
    await insertJuchuKizaiMeisai(newData, connection);
    console.log('keep kizai meisai added successfully:', newData);
    return true;
  } catch (e) {
    console.error('Exception while adding keep kizai meisai:', e);
    throw e;
  }
};

/**
 * キープ受注機材明細更新
 * @param juchuKizaiMeisaiData 受注機材明細データ
 * @param userNam ユーザー名
 * @returns
 */
export const updKeepJuchuKizaiMeisai = async (
  juchuKizaiMeisaiData: KeepJuchuKizaiMeisaiValues[],
  userNam: string,
  connection: PoolClient
) => {
  const updateData: JuchuKizaiMeisai[] = juchuKizaiMeisaiData.map((d) => ({
    juchu_head_id: d.juchuHeadId,
    juchu_kizai_head_id: d.juchuKizaiHeadId,
    juchu_kizai_meisai_id: d.juchuKizaiMeisaiId,
    kizai_id: d.kizaiId,
    mem: d.mem,
    keep_qty: d.keepQty,
    dspOrdNum: d.dspOrdNum,
    indentNum: d.indentNum,
    upd_dat: toJapanTimeString(),
    upd_user: userNam,
    shozoku_id: d.shozokuId,
  }));

  try {
    for (const data of updateData) {
      await updateJuchuKizaiMeisai(data, connection);
      console.log('keep juchu kizai meisai updated successfully:', data);
    }
    return true;
  } catch (e) {
    console.error('Exception while updating keep juchu kizai meisai:', e);
    throw e;
  }
};

/**
 * キープ受注機材明細削除
 * @param juchuHeadId 受注ヘッダーid
 * @param juchuKizaiHeadId 受注機材ヘッダーid
 * @param kizaiId 機材id
 */
export const delKeepJuchuKizaiMeisai = async (
  keepJuchuKizaiMeisaiData: KeepJuchuKizaiMeisaiValues[],
  connection: PoolClient
) => {
  const deleteData = keepJuchuKizaiMeisaiData.map((d) => ({
    juchu_head_id: d.juchuHeadId,
    juchu_kizai_head_id: d.juchuKizaiHeadId,
    juchu_kizai_meisai_id: d.juchuKizaiMeisaiId,
    kizai_id: d.kizaiId,
  }));
  try {
    for (const data of deleteData) {
      await deleteJuchuKizaiMeisai(data, connection);
    }
    console.log('keep juchu kizai meisai delete successfully:', deleteData);
    return true;
  } catch (e) {
    throw e;
  }
};

/**
 * キープ受注コンテナ明細取得
 * @param juchuHeadId 受注ヘッダーid
 * @param juchuKizaiHeadId 受注機材ヘッダーid
 * @param oyaJuchuKizaiHeadId 親受注機材ヘッダーid
 * @returns
 */
export const getKeepJuchuContainerMeisai = async (
  juchuHeadId: number,
  juchuKizaiHeadId: number,
  oyaJuchuKizaiHeadId: number
) => {
  try {
    const { data: containerData, error: containerError } = await selectJuchuContainerMeisai(
      juchuHeadId,
      juchuKizaiHeadId
    );
    if (containerError) {
      console.error('GetKeepContainerList keep containerList error : ', containerError);
      throw containerError;
    }

    const { data: oyaData, error: oyaError } = await selectJuchuContainerMeisai(juchuHeadId, oyaJuchuKizaiHeadId);
    if (oyaError) {
      console.error('GetKeepCOntainerList oya containerList error : ', oyaError);
      throw oyaError;
    }

    const keepJuchuContainerMeisaiData: KeepJuchuContainerMeisaiValues[] = containerData.map((d) => ({
      juchuHeadId: d.juchu_head_id,
      juchuKizaiHeadId: d.juchu_kizai_head_id,
      juchuKizaiMeisaiId: d.juchu_kizai_meisai_id,
      mem: d.mem,
      kizaiId: d.kizai_id,
      kizaiNam: d.kizai_nam ?? '',
      oyaPlanKicsKizaiQty: oyaData.find((oya) => oya.kizai_id === d.kizai_id)?.kics_plan_kizai_qty ?? 0,
      oyaPlanYardKizaiQty: oyaData.find((oya) => oya.kizai_id === d.kizai_id)?.yard_plan_kizai_qty ?? 0,
      kicsKeepQty: d.kics_keep_qty,
      yardKeepQty: d.yard_keep_qty,
      dspOrdNum: d.dsp_ord_num,
      indentNum: 0,
      delFlag: false,
      saveFlag: true,
    }));
    return keepJuchuContainerMeisaiData;
  } catch (e) {
    console.error(e);
  }
};

/**
 * キープ受注コンテナ明細新規追加
 * @param juchuKizaiMeisaiData 受注機材明細データ
 * @param userNam ユーザー名
 * @returns
 */
export const addKeepJuchuContainerMeisai = async (
  juchuContainerMeisaiData: KeepJuchuContainerMeisaiValues[],
  userNam: string,
  connection: PoolClient
) => {
  const newKicsData: JuchuCtnMeisai[] = juchuContainerMeisaiData.map((d) => ({
    juchu_head_id: d.juchuHeadId,
    juchu_kizai_head_id: d.juchuKizaiHeadId,
    juchu_kizai_meisai_id: d.juchuKizaiMeisaiId,
    kizai_id: d.kizaiId,
    keep_qty: d.kicsKeepQty,
    shozoku_id: 1,
    mem: d.mem,
    dspOrdNum: d.dspOrdNum,
    indentNum: d.indentNum,
    add_dat: toJapanTimeString(),
    add_user: userNam,
  }));

  const newYardData: JuchuCtnMeisai[] = juchuContainerMeisaiData.map((d) => ({
    juchu_head_id: d.juchuHeadId,
    juchu_kizai_head_id: d.juchuKizaiHeadId,
    juchu_kizai_meisai_id: d.juchuKizaiMeisaiId,
    kizai_id: d.kizaiId,
    keep_qty: d.yardKeepQty,
    shozoku_id: 2,
    mem: d.mem,
    dspOrdNum: d.dspOrdNum,
    indentNum: d.indentNum,
    add_dat: toJapanTimeString(),
    add_user: userNam,
  }));

  const mergeData = [...newKicsData, ...newYardData];

  try {
    await insertJuchuContainerMeisai(mergeData, connection);
    console.log('keep container meisai added successfully:', mergeData);
    return true;
  } catch (e) {
    console.error('Exception while adding keep container meisai:', e);
    throw e;
  }
};

/**
 * キープ受注コンテナ明細更新
 * @param juchuContainerMeisaiData 受注コンテナ明細データ
 * @param userNam ユーザー名
 * @returns
 */
export const updKeepJuchuContainerMeisai = async (
  juchuContainerMeisaiData: KeepJuchuContainerMeisaiValues[],
  userNam: string,
  connection: PoolClient
) => {
  const updateKicsData: JuchuCtnMeisai[] = juchuContainerMeisaiData.map((d) => ({
    juchu_head_id: d.juchuHeadId,
    juchu_kizai_head_id: d.juchuKizaiHeadId,
    juchu_kizai_meisai_id: d.juchuKizaiMeisaiId,
    kizai_id: d.kizaiId,
    keep_qty: d.kicsKeepQty,
    shozoku_id: 1,
    mem: d.mem,
    dspOrdNum: d.dspOrdNum,
    indentNum: d.indentNum,
    upd_dat: toJapanTimeString(),
    upd_user: userNam,
  }));

  const updateYardData: JuchuCtnMeisai[] = juchuContainerMeisaiData.map((d) => ({
    juchu_head_id: d.juchuHeadId,
    juchu_kizai_head_id: d.juchuKizaiHeadId,
    juchu_kizai_meisai_id: d.juchuKizaiMeisaiId,
    kizai_id: d.kizaiId,
    keep_qty: d.yardKeepQty,
    shozoku_id: 2,
    mem: d.mem,
    dspOrdNum: d.dspOrdNum,
    indentNum: d.indentNum,
    upd_dat: toJapanTimeString(),
    upd_user: userNam,
  }));

  const mergeData = [...updateKicsData, ...updateYardData];

  try {
    for (const data of mergeData) {
      await updateJuchuContainerMeisai(data, connection);
      console.log('keep juchu container meisai updated successfully:', data);
    }
    return true;
  } catch (e) {
    console.error('Exception while updating keep juchu container meisai:', e);
    throw e;
  }
};

/**
 * キープ受注コンテナ明細削除
 * @param juchuHeadId 受注ヘッダーid
 * @param juchuKizaiHeadId 受注機材ヘッダーid
 * @param deleteJuchuContainerMeisaiIds 受注コンテナ明細id
 */
export const delKeepJuchuContainerMeisai = async (
  juchuHeadId: number,
  juchuKizaiHeadId: number,
  deleteJuchuContainerMeisaiIds: number[],
  connection: PoolClient
) => {
  try {
    await deleteJuchuContainerMeisai(juchuHeadId, juchuKizaiHeadId, deleteJuchuContainerMeisaiIds, connection);
  } catch (e) {
    throw e;
  }
};

/**
 * キープ入出庫伝票新規追加
 * @param keepJuchuKizaiHeadData キープ受注機材ヘッダーデータ
 * @param keepJuchuKizaiMeisaiData キープ受注機材明細データ
 * @param userNam ユーザー名
 * @returns
 */
export const addKeepNyushukoDen = async (
  keepJuchuKizaiHeadData: KeepJuchuKizaiHeadValues,
  keepJuchuKizaiMeisaiData: KeepJuchuKizaiMeisaiValues[],
  userNam: string,
  connection: PoolClient
) => {
  const newKeepShukoStandbyData: NyushukoDen[] = keepJuchuKizaiMeisaiData.map((d) => ({
    juchu_head_id: d.juchuHeadId,
    juchu_kizai_head_id: d.juchuKizaiHeadId,
    juchu_kizai_meisai_id: d.juchuKizaiMeisaiId,
    sagyo_kbn_id: 10,
    sagyo_den_dat:
      d.shozokuId === 1
        ? toISOString(keepJuchuKizaiHeadData.kicsShukoDat as Date)
        : toISOString(keepJuchuKizaiHeadData.yardShukoDat as Date),
    sagyo_id: d.shozokuId,
    kizai_id: d.kizaiId,
    plan_qty: d.keepQty,
    dspOrdNum: d.dspOrdNum,
    indentNum: d.indentNum,
    add_dat: toJapanTimeString(),
    add_user: userNam,
  }));

  const newKeepShukoCheckData: NyushukoDen[] = keepJuchuKizaiMeisaiData.map((d) => ({
    juchu_head_id: d.juchuHeadId,
    juchu_kizai_head_id: d.juchuKizaiHeadId,
    juchu_kizai_meisai_id: d.juchuKizaiMeisaiId,
    sagyo_kbn_id: 20,
    sagyo_den_dat:
      d.shozokuId === 1
        ? toISOString(keepJuchuKizaiHeadData.kicsShukoDat as Date)
        : toISOString(keepJuchuKizaiHeadData.yardShukoDat as Date),
    sagyo_id: d.shozokuId,
    kizai_id: d.kizaiId,
    plan_qty: d.keepQty,
    dspOrdNum: d.dspOrdNum,
    indentNum: d.indentNum,
    add_dat: toJapanTimeString(),
    add_user: userNam,
  }));

  const newKeepNyukoCheckData: NyushukoDen[] = keepJuchuKizaiMeisaiData.map((d) => ({
    juchu_head_id: d.juchuHeadId,
    juchu_kizai_head_id: d.juchuKizaiHeadId,
    juchu_kizai_meisai_id: d.juchuKizaiMeisaiId,
    sagyo_kbn_id: 30,
    sagyo_den_dat:
      d.shozokuId === 1
        ? toISOString(keepJuchuKizaiHeadData.kicsNyukoDat as Date)
        : toISOString(keepJuchuKizaiHeadData.yardNyukoDat as Date),
    sagyo_id: d.shozokuId,
    kizai_id: d.kizaiId,
    plan_qty: d.keepQty,
    dspOrdNum: d.dspOrdNum,
    indentNum: d.indentNum,
    add_dat: toJapanTimeString(),
    add_user: userNam,
  }));

  const mergeData = [...newKeepShukoStandbyData, ...newKeepShukoCheckData, ...newKeepNyukoCheckData];

  try {
    await insertNyushukoDen(mergeData, connection);
    console.log('keep nyushuko den added successfully:', mergeData);
    return true;
  } catch (e) {
    console.error('Exception while adding keep nyushuko den:', e);
    throw e;
  }
};

/**
 * キープ入出庫伝票更新
 * @param keepJuchuKizaiHeadData キープ受注機材ヘッダーデータ
 * @param keepJuchuKizaiMeisaiData キープ受注機材明細データ
 * @param userNam ユーザー名
 * @returns
 */
export const updKeepNyushukoDen = async (
  keepJuchuKizaiHeadData: KeepJuchuKizaiHeadValues,
  keepJuchuKizaiMeisaiData: KeepJuchuKizaiMeisaiValues[],
  userNam: string,
  connection: PoolClient
) => {
  const updateKeepShukoStandbyData: NyushukoDen[] = keepJuchuKizaiMeisaiData.map((d) => ({
    juchu_head_id: d.juchuHeadId,
    juchu_kizai_head_id: d.juchuKizaiHeadId,
    juchu_kizai_meisai_id: d.juchuKizaiMeisaiId,
    sagyo_kbn_id: 10,
    sagyo_den_dat:
      d.shozokuId === 1
        ? toISOString(keepJuchuKizaiHeadData.kicsShukoDat as Date)
        : toISOString(keepJuchuKizaiHeadData.yardShukoDat as Date),
    sagyo_id: d.shozokuId,
    kizai_id: d.kizaiId,
    plan_qty: d.keepQty,
    dspOrdNum: d.dspOrdNum,
    indentNum: d.indentNum,
    add_dat: toJapanTimeString(),
    add_user: userNam,
  }));

  const updateKeepShukoCheckData: NyushukoDen[] = keepJuchuKizaiMeisaiData.map((d) => ({
    juchu_head_id: d.juchuHeadId,
    juchu_kizai_head_id: d.juchuKizaiHeadId,
    juchu_kizai_meisai_id: d.juchuKizaiMeisaiId,
    sagyo_kbn_id: 20,
    sagyo_den_dat:
      d.shozokuId === 1
        ? toISOString(keepJuchuKizaiHeadData.kicsShukoDat as Date)
        : toISOString(keepJuchuKizaiHeadData.yardShukoDat as Date),
    sagyo_id: d.shozokuId,
    kizai_id: d.kizaiId,
    plan_qty: d.keepQty,
    dspOrdNum: d.dspOrdNum,
    indentNum: d.indentNum,
    add_dat: toJapanTimeString(),
    add_user: userNam,
  }));

  const updateKeepNyukoCheckData: NyushukoDen[] = keepJuchuKizaiMeisaiData.map((d) => ({
    juchu_head_id: d.juchuHeadId,
    juchu_kizai_head_id: d.juchuKizaiHeadId,
    juchu_kizai_meisai_id: d.juchuKizaiMeisaiId,
    sagyo_kbn_id: 30,
    sagyo_den_dat:
      d.shozokuId === 1
        ? toISOString(keepJuchuKizaiHeadData.kicsNyukoDat as Date)
        : toISOString(keepJuchuKizaiHeadData.yardNyukoDat as Date),
    sagyo_id: d.shozokuId,
    kizai_id: d.kizaiId,
    plan_qty: d.keepQty,
    dspOrdNum: d.dspOrdNum,
    indentNum: d.indentNum,
    add_dat: toJapanTimeString(),
    add_user: userNam,
  }));

  const mergeData = [...updateKeepShukoStandbyData, ...updateKeepShukoCheckData, ...updateKeepNyukoCheckData];

  try {
    for (const data of mergeData) {
      await updateNyushukoDen(data, connection);
    }
    console.log('keep nyushuko den updated successfully:', mergeData);
    return true;
  } catch (e) {
    console.error('Exception while updating keep nyushuko den:', e);
    throw e;
  }
};

/**
 * キープ入出庫伝票削除
 * @param juchuHeadId 受注ヘッダーid
 * @param juchuKizaiHeadId 受注機材ヘッダーid
 * @param juchuKizaiMeisaiIds 受注機材明細id
 */
export const delKeepNyushukoDen = async (
  keepJuchuKizaiMeisaiData: KeepJuchuKizaiMeisaiValues[],
  connection: PoolClient
) => {
  const deleteData = keepJuchuKizaiMeisaiData.map((d) => ({
    juchu_head_id: d.juchuHeadId,
    juchu_kizai_head_id: d.juchuKizaiHeadId,
    juchu_kizai_meisai_id: d.juchuKizaiMeisaiId,
    kizai_id: d.kizaiId,
  }));
  try {
    for (const data of deleteData) {
      await deleteNyushukoDen(data, connection);
    }
    console.log('keep nyushuko den delete successfully:', deleteData);
    return true;
  } catch (e) {
    throw e;
  }
};

/**
 * キープコンテナ入出庫伝票更新
 * @param keepJuchuKizaiHeadData キープ受注機材ヘッダーデータ
 * @param keepJuchuContainerMeisaiData キープ受注コンテナ明細データ
 * @param userNam ユーザー名
 */
export const updKeepContainerNyushukoDen = async (
  keepJuchuKizaiHeadData: KeepJuchuKizaiHeadValues,
  keepJuchuContainerMeisaiData: KeepJuchuContainerMeisaiValues[],
  userNam: string,
  connection: PoolClient
) => {
  for (const data of keepJuchuContainerMeisaiData) {
    const kicsData =
      !data.delFlag && data.kicsKeepQty
        ? [
            {
              juchu_head_id: data.juchuHeadId,
              juchu_kizai_head_id: data.juchuKizaiHeadId,
              juchu_kizai_meisai_id: data.juchuKizaiMeisaiId,
              sagyo_kbn_id: 10,
              sagyo_den_dat: toISOString(keepJuchuKizaiHeadData.kicsShukoDat as Date),
              sagyo_id: 1,
              kizai_id: data.kizaiId,
              plan_qty: data.kicsKeepQty,
              dspOrdNum: data.dspOrdNum,
              indentNum: data.indentNum,
            },
            {
              juchu_head_id: data.juchuHeadId,
              juchu_kizai_head_id: data.juchuKizaiHeadId,
              juchu_kizai_meisai_id: data.juchuKizaiMeisaiId,
              sagyo_kbn_id: 20,
              sagyo_den_dat: toISOString(keepJuchuKizaiHeadData.kicsShukoDat as Date),
              sagyo_id: 1,
              kizai_id: data.kizaiId,
              plan_qty: data.kicsKeepQty,
              dspOrdNum: data.dspOrdNum,
              indentNum: data.indentNum,
            },
            {
              juchu_head_id: data.juchuHeadId,
              juchu_kizai_head_id: data.juchuKizaiHeadId,
              juchu_kizai_meisai_id: data.juchuKizaiMeisaiId,
              sagyo_kbn_id: 30,
              sagyo_den_dat: toISOString(keepJuchuKizaiHeadData.kicsNyukoDat as Date),
              sagyo_id: 1,
              kizai_id: data.kizaiId,
              plan_qty: data.kicsKeepQty,
              dspOrdNum: data.dspOrdNum,
              indentNum: data.indentNum,
            },
          ]
        : null;
    const yardData =
      !data.delFlag && data.yardKeepQty
        ? [
            {
              juchu_head_id: data.juchuHeadId,
              juchu_kizai_head_id: data.juchuKizaiHeadId,
              juchu_kizai_meisai_id: data.juchuKizaiMeisaiId,
              sagyo_kbn_id: 10,
              sagyo_den_dat: toISOString(keepJuchuKizaiHeadData.yardShukoDat as Date),
              sagyo_id: 2,
              kizai_id: data.kizaiId,
              plan_qty: data.yardKeepQty,
              dspOrdNum: data.dspOrdNum,
              indentNum: data.indentNum,
            },
            {
              juchu_head_id: data.juchuHeadId,
              juchu_kizai_head_id: data.juchuKizaiHeadId,
              juchu_kizai_meisai_id: data.juchuKizaiMeisaiId,
              sagyo_kbn_id: 20,
              sagyo_den_dat: toISOString(keepJuchuKizaiHeadData.yardShukoDat as Date),
              sagyo_id: 2,
              kizai_id: data.kizaiId,
              plan_qty: data.yardKeepQty,
              dspOrdNum: data.dspOrdNum,
              indentNum: data.indentNum,
            },
            {
              juchu_head_id: data.juchuHeadId,
              juchu_kizai_head_id: data.juchuKizaiHeadId,
              juchu_kizai_meisai_id: data.juchuKizaiMeisaiId,
              sagyo_kbn_id: 30,
              sagyo_den_dat: toISOString(keepJuchuKizaiHeadData.yardNyukoDat as Date),
              sagyo_id: 2,
              kizai_id: data.kizaiId,
              plan_qty: data.yardKeepQty,
              dspOrdNum: data.dspOrdNum,
              indentNum: data.indentNum,
            },
          ]
        : null;
    const kicsConfirmData = {
      juchu_head_id: data.juchuHeadId,
      juchu_kizai_head_id: data.juchuKizaiHeadId,
      juchu_kizai_meisai_id: data.juchuKizaiMeisaiId,
      kizai_id: data.kizaiId,
      sagyo_id: 1,
    };
    const yardConfirmData = {
      juchu_head_id: data.juchuHeadId,
      juchu_kizai_head_id: data.juchuKizaiHeadId,
      juchu_kizai_meisai_id: data.juchuKizaiMeisaiId,
      kizai_id: data.kizaiId,
      sagyo_id: 2,
    };

    try {
      const kicsConfirmResult = await selectContainerNyushukoDenConfirm(kicsConfirmData);
      const yardConfirmResult = await selectContainerNyushukoDenConfirm(yardConfirmData);

      if (kicsConfirmResult.data && kicsConfirmResult.data.length > 0 && kicsData) {
        for (const data of kicsData) {
          await updateNyushukoDen(
            {
              ...data,
              upd_dat: toJapanTimeString(),
              upd_user: userNam,
            },
            connection
          );
        }
      } else if (kicsConfirmResult.data && kicsConfirmResult.data.length > 0 && !kicsData) {
        await deleteContainerNyushukoDen(kicsConfirmData, connection);
      } else if (kicsConfirmResult!.data && kicsData) {
        await insertNyushukoDen(
          kicsData.map((d) => ({
            ...d,
            add_dat: toJapanTimeString(),
            add_user: userNam,
          })),
          connection
        );
      }
      if (yardConfirmResult.data && yardConfirmResult.data.length > 0 && yardData) {
        for (const data of yardData) {
          await updateNyushukoDen(
            {
              ...data,
              upd_dat: toJapanTimeString(),
              upd_user: userNam,
            },
            connection
          );
        }
      } else if (yardConfirmResult.data && yardConfirmResult.data.length > 0 && !yardData) {
        await deleteContainerNyushukoDen(yardConfirmData, connection);
      } else if (yardConfirmResult!.data && yardData) {
        await insertNyushukoDen(
          yardData.map((d) => ({
            ...d,
            add_dat: toJapanTimeString(),
            add_user: userNam,
          })),
          connection
        );
      }
      console.log('keep container nyushuko den updated successfully:', data);
    } catch (e) {
      throw e;
    }
  }
  return true;
};

/**
 * キープ入出庫確定更新
 * @param data キープ受注機材ヘッダーデータ
 * @param kics KICS機材判定
 * @param yard YARD機材判定
 * @param userNam ユーザー名
 * @returns
 */
export const updKeepNyushukoFix = async (
  data: KeepJuchuKizaiHeadValues,
  kics: boolean,
  yard: boolean,
  userNam: string,
  connection: PoolClient
) => {
  const kicsData: NyushukoFix[] = [
    {
      juchu_head_id: data.juchuHeadId,
      juchu_kizai_head_id: data.juchuKizaiHeadId,
      sagyo_kbn_id: 60,
      sagyo_den_dat: toISOString(data.kicsShukoDat as Date),
      sagyo_id: 1,
    },
    {
      juchu_head_id: data.juchuHeadId,
      juchu_kizai_head_id: data.juchuKizaiHeadId,
      sagyo_kbn_id: 70,
      sagyo_den_dat: toISOString(data.kicsNyukoDat as Date),
      sagyo_id: 1,
    },
  ];
  const yardData: NyushukoFix[] = [
    {
      juchu_head_id: data.juchuHeadId,
      juchu_kizai_head_id: data.juchuKizaiHeadId,
      sagyo_kbn_id: 60,
      sagyo_den_dat: toISOString(data.yardShukoDat as Date),
      sagyo_id: 2,
    },
    {
      juchu_head_id: data.juchuHeadId,
      juchu_kizai_head_id: data.juchuKizaiHeadId,
      sagyo_kbn_id: 70,
      sagyo_den_dat: toISOString(data.yardNyukoDat as Date),
      sagyo_id: 2,
    },
  ];

  const kicsConfirmData = {
    juchu_head_id: data.juchuHeadId,
    juchu_kizai_head_id: data.juchuKizaiHeadId,
    sagyo_id: 1,
  };
  const yardConfirmData = {
    juchu_head_id: data.juchuHeadId,
    juchu_kizai_head_id: data.juchuKizaiHeadId,
    sagyo_id: 2,
  };

  try {
    const kicsConfirmResult = await selectNyushukoFixConfirm(kicsConfirmData);
    const yardConfirmResult = await selectNyushukoFixConfirm(yardConfirmData);

    // KICS更新
    if (kicsConfirmResult.data && kicsConfirmResult.data.length > 0 && kics) {
      for (const data of kicsData) {
        await updateNyushukoFix(
          {
            ...data,
            upd_dat: toJapanTimeString(),
            upd_user: userNam,
          },
          connection
        );
      }
      // KICS削除
    } else if (kicsConfirmResult.data && kicsConfirmResult.data.length > 0 && !kics) {
      await deleteNyushukoFix(kicsConfirmData, connection);
      // KICS追加
    } else if (kicsConfirmResult!.data && kics) {
      await insertNyushukoFix(
        kicsData.map((d) => ({
          ...d,
          sagyo_fix_flg: 0,
          add_dat: toJapanTimeString(),
          add_user: userNam,
        })),
        connection
      );
    }

    // YARD更新
    if (yardConfirmResult.data && yardConfirmResult.data.length > 0 && yard) {
      for (const data of yardData) {
        await updateNyushukoFix(
          {
            ...data,
            upd_dat: toJapanTimeString(),
            upd_user: userNam,
          },
          connection
        );
      }
      // YARD削除
    } else if (yardConfirmResult.data && yardConfirmResult.data.length > 0 && !yard) {
      await deleteNyushukoFix(yardConfirmData, connection);
      // YARD追加
    } else if (yardConfirmResult!.data && yard) {
      await insertNyushukoFix(
        yardData.map((d) => ({
          ...d,
          sagyo_fix_flg: 0,
          add_dat: toJapanTimeString(),
          add_user: userNam,
        })),
        connection
      );
    }
    console.log('keep nyushuko fix updated successfully:', data);
    return true;
  } catch (e) {
    console.error(e);
    throw e;
  }
};

/**
 * キープ入出庫実績削除
 * @param juchuHeadId 受注ヘッダーid
 * @param sagyoDenDat 作業日時
 * @param sagyoId 作業id
 * @param kizaiIds 機材id
 * @param connection
 */
export const delNyushukoResult = async (
  juchuKizaiMeisaiData: KeepJuchuKizaiMeisaiValues[],
  sagyoDenDat: string,
  connection: PoolClient
) => {
  const deleteData = juchuKizaiMeisaiData.map((d) => ({
    juchuHeadId: d.juchuHeadId,
    juchuKizaiHeadId: d.juchuKizaiHeadId,
    juchuKizaiMeisaiId: d.juchuKizaiMeisaiId,
    sagyoDenDat: sagyoDenDat,
    sagyoId: d.shozokuId,
    kizaiId: d.kizaiId,
  }));
  try {
    for (const data of deleteData) {
      await deleteKizaiIdNyushukoResult(
        data.juchuHeadId,
        data.juchuKizaiHeadId,
        data.juchuKizaiMeisaiId,
        data.sagyoDenDat,
        data.sagyoId,
        data.kizaiId,
        connection
      );
    }
    return true;
  } catch (e) {
    throw e;
  }
};
