'use server';

import { PoolClient } from 'pg';

import pool from '@/app/_lib/db/postgres';
import {
  deleteJuchuContainerMeisai,
  insertJuchuContainerMeisai,
  updateJuchuContainerMeisai,
} from '@/app/_lib/db/tables/t-juchu-ctn-meisai';
import {
  insertReturnJuchuKizaiHead,
  selectJuchuHonbanbiQty,
  selectReturnJuchuKizaiHead,
  updateReturnJuchuKizaiHead,
} from '@/app/_lib/db/tables/t-juchu-kizai-head';
import {
  deleteJuchuKizaiMeisai,
  insertJuchuKizaiMeisai,
  selectJuchuKizaiMeisaiKizaiTanka,
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
import { selectJuchuContainerMeisai } from '@/app/_lib/db/tables/v-juchu-ctn-meisai';
import { selectOyaJuchuKizaiMeisai, selectReturnJuchuKizaiMeisai } from '@/app/_lib/db/tables/v-juchu-kizai-meisai';
import { JuchuCtnMeisai } from '@/app/_lib/db/types/t_juchu_ctn_meisai-type';
import { JuchuKizaiHead } from '@/app/_lib/db/types/t-juchu-kizai-head-type';
import { JuchuKizaiMeisai } from '@/app/_lib/db/types/t-juchu-kizai-meisai-type';
import { NyushukoDen } from '@/app/_lib/db/types/t-nyushuko-den-type';
import { NyushukoFix } from '@/app/_lib/db/types/t-nyushuko-fix-type';
import { toISOString, toJapanTimeString } from '@/app/(main)/_lib/date-conversion';
import {
  addAllHonbanbi,
  addJuchuKizaiNyushuko,
  delSiyouHonbanbi,
  getJuchuContainerMeisaiMaxId,
  getJuchuKizaiHeadMaxId,
  getJuchuKizaiMeisaiMaxId,
  getJuchuKizaiNyushuko,
  updJuchuKizaiNyushuko,
} from '@/app/(main)/(eq-order-detail)/_lib/funcs';
import { JuchuKizaiHonbanbiValues } from '@/app/(main)/(eq-order-detail)/eq-main-order-detail/[juchu_head_id]/[juchu_kizai_head_id]/[mode]/_lib/types';

import { ReturnJuchuContainerMeisaiValues, ReturnJuchuKizaiHeadValues, ReturnJuchuKizaiMeisaiValues } from './types';

/**
 * 新規返却受注機材ヘッダー保存
 * @param data
 * @param updateDateRange
 * @param userNam
 * @returns
 */
export const saveNewReturnJuchuKizaiHead = async (
  data: ReturnJuchuKizaiHeadValues,
  updateDateRange: string[],
  userNam: string
) => {
  const connection = await pool.connect();

  const maxId = await getJuchuKizaiHeadMaxId(data.juchuHeadId);
  const newJuchuKizaiHeadId = maxId ? maxId.juchu_kizai_head_id + 1 : 1;

  try {
    await connection.query('BEGIN');

    // 受注機材ヘッダー追加
    const headResult = await addReturnJuchuKizaiHead(newJuchuKizaiHeadId, data, userNam, connection);
    console.log('返却受注機材ヘッダー追加', headResult);
    // 受注機材入出庫追加
    const nyushukoResult = await addJuchuKizaiNyushuko(
      data.juchuHeadId,
      newJuchuKizaiHeadId,
      null,
      null,
      data.kicsNyukoDat,
      data.yardNyukoDat,
      userNam,
      connection
    );
    console.log('返却受注機材入出庫追加', nyushukoResult);

    // 返却受注機材本番日(使用中)追加
    const addReturnJuchuSiyouHonbanbiData: JuchuKizaiHonbanbiValues[] = updateDateRange.map((d) => ({
      juchuHeadId: data.juchuHeadId,
      juchuKizaiHeadId: newJuchuKizaiHeadId,
      juchuHonbanbiShubetuId: 1,
      juchuHonbanbiDat: new Date(d),
      mem: '',
      juchuHonbanbiAddQty: 0,
    }));
    const addReturnHonbanbiResult = await addAllHonbanbi(
      data.juchuHeadId,
      newJuchuKizaiHeadId,
      addReturnJuchuSiyouHonbanbiData,
      userNam,
      connection
    );
    console.log('使用中本番日追加', addReturnHonbanbiResult);

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
 * 返却受注機材ヘッダー保存
 * @param checkJuchuKizaiHead
 * @param checkJuchuKizaiMeisai
 * @param checkJuchuContainerMeisai
 * @param data
 * @param updateNyukoDate
 * @param updateDateRange
 * @param returnJuchuKizaiMeisaiList
 * @param returnJuchuContainerMeisaiList
 * @param userNam
 * @returns
 */
export const saveReturnJuchuKizai = async (
  checkJuchuKizaiHead: boolean,
  checkJuchuKizaiMeisai: boolean,
  checkJuchuContainerMeisai: boolean,
  data: ReturnJuchuKizaiHeadValues,
  updateNyukoDate: Date,
  updateDateRange: string[],
  returnJuchuKizaiMeisaiList: ReturnJuchuKizaiMeisaiValues[],
  returnJuchuContainerMeisaiList: ReturnJuchuContainerMeisaiValues[],
  userNam: string
) => {
  const connection = await pool.connect();

  try {
    await connection.query('BEGIN');

    // 受注機材ヘッダー関係更新
    if (checkJuchuKizaiHead) {
      // 受注機材ヘッド更新
      const headResult = await updReturnJuchuKizaiHead(data, userNam, connection);
      console.log('受注機材ヘッダー更新', headResult);

      // 受注機材入出庫更新
      const nyushukoResult = await updJuchuKizaiNyushuko(
        data.juchuHeadId,
        data.juchuKizaiHeadId,
        null,
        null,
        data.kicsNyukoDat,
        data.yardNyukoDat,
        userNam,
        connection
      );
      console.log('返却受注機材入出庫更新', nyushukoResult);

      // 受注機材本番日(使用中)更新
      const addReturnJuchuSiyouHonbanbiData: JuchuKizaiHonbanbiValues[] = updateDateRange.map((d) => ({
        juchuHeadId: data.juchuHeadId,
        juchuKizaiHeadId: data.juchuKizaiHeadId,
        juchuHonbanbiShubetuId: 1,
        juchuHonbanbiDat: new Date(d),
        mem: '',
        juchuHonbanbiAddQty: 0,
      }));
      console.log('受注機材本番日(使用中)更新データ', addReturnJuchuSiyouHonbanbiData);
      const deleteReturnSiyouHonbanbiResult = await delSiyouHonbanbi(
        data.juchuHeadId,
        data.juchuKizaiHeadId,
        connection
      );
      console.log('受注機材本番日(使用日)削除', deleteReturnSiyouHonbanbiResult);
      const addReturnSiyouHonbanbiResult = await addAllHonbanbi(
        data.juchuHeadId,
        data.juchuKizaiHeadId,
        addReturnJuchuSiyouHonbanbiData,
        userNam,
        connection
      );
      console.log('受注機材本番日(使用日)更新', addReturnSiyouHonbanbiResult);
    }

    // 受注機材明細関係更新
    if (checkJuchuKizaiHead || checkJuchuKizaiMeisai) {
      //const copyReturnJuchuKizaiMeisaiData = [...returnJuchuKizaiMeisaiList];
      const juchuKizaiMeisaiMaxId = await getJuchuKizaiMeisaiMaxId(data.juchuHeadId, data.juchuKizaiHeadId);
      let newReturnJuchuKizaiMeisaiId = juchuKizaiMeisaiMaxId ? juchuKizaiMeisaiMaxId.juchu_kizai_meisai_id + 1 : 1;

      const newReturnJuchuKizaiMeisaiData = returnJuchuKizaiMeisaiList.map((data) =>
        data.juchuKizaiMeisaiId === 0 && !data.delFlag
          ? { ...data, juchuKizaiMeisaiId: newReturnJuchuKizaiMeisaiId++ }
          : data
      );

      // 受注機材明細更新
      const addReturnJuchuKizaiMeisaiData = newReturnJuchuKizaiMeisaiData.filter(
        (data) => !data.delFlag && !data.saveFlag
      );
      const updateReturnJuchuKizaiMeisaiData = newReturnJuchuKizaiMeisaiData.filter(
        (data) => !data.delFlag && data.saveFlag
      );
      const deleteReturnJuchuKizaiMeisaiData = newReturnJuchuKizaiMeisaiData.filter(
        (data) => data.delFlag && data.saveFlag
      );
      // 削除
      if (deleteReturnJuchuKizaiMeisaiData.length > 0) {
        const deleteKizaiIds = deleteReturnJuchuKizaiMeisaiData.map((data) => data.kizaiId);
        const deleteMeisaiResult = await delReturnJuchuKizaiMeisai(
          data.juchuHeadId,
          data.juchuKizaiHeadId,
          deleteKizaiIds,
          connection
        );
        console.log('受注機材明細削除', deleteMeisaiResult);

        const deleteNyushukoDenResult = await delReturnNyushukoDen(
          data.juchuHeadId,
          data.juchuKizaiHeadId,
          deleteKizaiIds,
          connection
        );
        console.log('返却入出庫伝票削除', deleteNyushukoDenResult);
      }
      // 追加
      if (addReturnJuchuKizaiMeisaiData.length > 0) {
        const addMeisaiResult = await addReturnJuchuKizaiMeisai(addReturnJuchuKizaiMeisaiData, userNam, connection);
        console.log('受注機材明細追加', addMeisaiResult);

        const addNyushukoDenResult = await addReturnNyushukoDen(
          data,
          addReturnJuchuKizaiMeisaiData,
          userNam,
          connection
        );
        console.log('返却入出庫伝票追加', addNyushukoDenResult);
      }
      // 更新
      if (updateReturnJuchuKizaiMeisaiData.length > 0) {
        const updateMeisaiResult = await updReturnJuchuKizaiMeisai(
          updateReturnJuchuKizaiMeisaiData,
          userNam,
          connection
        );
        console.log('受注機材明細更新', updateMeisaiResult);

        const updateNyushukoDenResult = await updReturnNyushukoDen(
          data,
          updateReturnJuchuKizaiMeisaiData,
          userNam,
          connection
        );
        console.log('返却入出庫伝票更新', updateNyushukoDenResult);
      }
    }

    // 受注コンテナ明細更新
    if (checkJuchuKizaiHead || checkJuchuContainerMeisai) {
      // const copyReturnJuchuContainerMeisaiData = [...returnJuchuContainerMeisaiList];
      const juchuContainerMeisaiMaxId = await getJuchuContainerMeisaiMaxId(data.juchuHeadId, data.juchuKizaiHeadId);
      let newReturnJuchuContainerMeisaiId = juchuContainerMeisaiMaxId
        ? juchuContainerMeisaiMaxId.juchu_kizai_meisai_id + 1
        : 1;

      const newReturnJuchuContainerMeisaiData = returnJuchuContainerMeisaiList.map((data) =>
        data.juchuKizaiMeisaiId === 0 && !data.delFlag
          ? { ...data, juchuKizaiMeisaiId: newReturnJuchuContainerMeisaiId++ }
          : data
      );

      // 受注コンテナ明細更新
      const addReturnJuchuContainerMeisaiData = newReturnJuchuContainerMeisaiData.filter(
        (data) => !data.delFlag && !data.saveFlag
      );
      const updateReturnJuchuContainerMeisaiData = newReturnJuchuContainerMeisaiData.filter(
        (data) => !data.delFlag && data.saveFlag
      );
      const deleteReturnJuchuContainerMeisaiData = newReturnJuchuContainerMeisaiData.filter(
        (data) => data.delFlag && data.saveFlag
      );
      // 削除
      if (deleteReturnJuchuContainerMeisaiData.length > 0) {
        const deleteKizaiIds = deleteReturnJuchuContainerMeisaiData.map((data) => data.kizaiId);
        const deleteContainerMeisaiResult = await delReturnJuchuContainerMeisai(
          data.juchuHeadId,
          data.juchuKizaiHeadId,
          deleteKizaiIds,
          connection
        );
        console.log('返却受注コンテナ明細削除', deleteContainerMeisaiResult);
      }
      // 追加
      if (addReturnJuchuContainerMeisaiData.length > 0) {
        const addContainerMeisaiResult = await addReturnJuchuContainerMeisai(
          addReturnJuchuContainerMeisaiData,
          userNam,
          connection
        );
        console.log('返却受注コンテナ明細追加', addContainerMeisaiResult);
      }
      // 更新
      if (updateReturnJuchuContainerMeisaiData.length > 0) {
        const updateContainerMeisaiResult = await updReturnJuchuContainerMeisai(
          updateReturnJuchuContainerMeisaiData,
          userNam,
          connection
        );
        console.log('返却受注コンテナ明細更新', updateContainerMeisaiResult);
      }

      // 返却コンテナ入出庫伝票更新
      if (newReturnJuchuContainerMeisaiData.length > 0) {
        const containerNyushukoDenResult = await updReturnContainerNyushukoDen(
          data,
          newReturnJuchuContainerMeisaiData,
          userNam,
          connection
        );
        console.log('返却コンテナ入出庫伝票更新', containerNyushukoDenResult);
      }
    }

    // 入出庫確定更新
    if (returnJuchuKizaiMeisaiList.length > 0 || returnJuchuContainerMeisaiList.length > 0) {
      const kics =
        returnJuchuKizaiMeisaiList.filter((d) => d.shozokuId === 1 && !d.delFlag).length > 0 ||
        returnJuchuContainerMeisaiList.filter((d) => d.planKicsKizaiQty && !d.delFlag).length > 0
          ? true
          : false;
      const yard =
        returnJuchuKizaiMeisaiList.filter((d) => d.shozokuId === 2 && !d.delFlag).length > 0 ||
        returnJuchuContainerMeisaiList.filter((d) => d.planYardKizaiQty && !d.delFlag).length > 0
          ? true
          : false;

      const nyushukoFixResult = await updReturnNyushukoFix(data, kics, yard, userNam, connection);
      console.log('返却入出庫確定更新', nyushukoFixResult);
    }

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
 * 親受注機材本番日数取得
 * @param juchuHeadId 受注ヘッダーid
 * @param juchuKizaiHeadId 受注機材ヘッダーid
 * @returns
 */
export const getJuchuHonbanbiQty = async (juchuHeadId: number, juchuKizaiHeadId: number) => {
  try {
    const { data, error } = await selectJuchuHonbanbiQty(juchuHeadId, juchuKizaiHeadId);
    if (error) {
      console.error('getJuchuHonbanbiQty error : ', error);
      return null;
    }

    return data.juchu_honbanbi_qty;
  } catch (e) {
    console.error(e);
    return null;
  }
};

/**
 * 返却受注機材ヘッダー取得
 * @param juchuHeadId 受注ヘッダーid
 * @param juchuKizaiHeadId 受注機材ヘッダーid
 * @returns 受注機材ヘッダーデータ
 */
export const getReturnJuchuKizaiHead = async (juchuHeadId: number, juchuKizaiHeadId: number) => {
  try {
    const { data, error } = await selectReturnJuchuKizaiHead(juchuHeadId, juchuKizaiHeadId);
    if (error || data?.oya_juchu_kizai_head_id === null) {
      console.error('GetEqHeader juchuKizaiHead error : ', error);
      return null;
    }

    const juchuDate = await getJuchuKizaiNyushuko(juchuHeadId, juchuKizaiHeadId);

    if (!juchuDate) throw new Error('受注機材入出庫日が存在しません');

    const returnJucuKizaiHeadData: ReturnJuchuKizaiHeadValues = {
      juchuHeadId: data.juchu_head_id,
      juchuKizaiHeadId: data.juchu_kizai_head_id,
      juchuKizaiHeadKbn: data.juchu_kizai_head_kbn,
      juchuHonbanbiQty: data.juchu_honbanbi_qty,
      nebikiAmt: data.nebiki_amt,
      mem: data.mem ? data.mem : '',
      headNam: data.head_nam ?? '',
      oyaJuchuKizaiHeadId: data.oya_juchu_kizai_head_id,
      kicsNyukoDat: juchuDate.kicsNyukoDat ? new Date(juchuDate.kicsNyukoDat) : null,
      yardNyukoDat: juchuDate.yardNyukoDat ? new Date(juchuDate.yardNyukoDat) : null,
    };

    console.log('returnJucuKizaiHeadData', returnJucuKizaiHeadData);
    return returnJucuKizaiHeadData;
  } catch (e) {
    console.error(e);
  }
};

/**
 * 返却受注機材ヘッダー新規追加
 * @param returnJuchuKizaiHeadId 受注機材ヘッダーid
 * @param returnJuchuKizaiHeadData 受注機材ヘッダーデータ
 * @param userNam ユーザー名
 * @returns
 */
export const addReturnJuchuKizaiHead = async (
  returnJuchuKizaiHeadId: number,
  returnJuchuKizaiHeadData: ReturnJuchuKizaiHeadValues,
  userNam: string,
  connection: PoolClient
) => {
  const newData: JuchuKizaiHead = {
    juchu_head_id: returnJuchuKizaiHeadData.juchuHeadId,
    juchu_kizai_head_id: returnJuchuKizaiHeadId,
    juchu_kizai_head_kbn: 2,
    juchu_honbanbi_qty: returnJuchuKizaiHeadData.juchuHonbanbiQty,
    nebiki_amt: returnJuchuKizaiHeadData.nebikiAmt,
    mem: returnJuchuKizaiHeadData.mem,
    head_nam: returnJuchuKizaiHeadData.headNam,
    oya_juchu_kizai_head_id: returnJuchuKizaiHeadData.oyaJuchuKizaiHeadId,
    ht_kbn: 0,
    add_dat: toJapanTimeString(),
    add_user: userNam,
  };
  try {
    await insertReturnJuchuKizaiHead(newData, connection);
    console.log('New juchuKizaiHead added successfully:', newData);
    return true;
  } catch (e) {
    console.error(e);
    throw e;
  }
};

/**
 * 返却受注機材ヘッダー更新
 * @param juchuKizaiHeadData 受注機材ヘッダーデータ
 * @param userNam ユーザー名
 * @returns
 */
export const updReturnJuchuKizaiHead = async (
  juchuKizaiHeadData: ReturnJuchuKizaiHeadValues,
  userNam: string,
  connection: PoolClient
) => {
  const updateData: JuchuKizaiHead = {
    juchu_head_id: juchuKizaiHeadData.juchuHeadId,
    juchu_kizai_head_id: juchuKizaiHeadData.juchuKizaiHeadId,
    juchu_kizai_head_kbn: juchuKizaiHeadData.juchuKizaiHeadKbn,
    juchu_honbanbi_qty: juchuKizaiHeadData.juchuHonbanbiQty,
    nebiki_amt: juchuKizaiHeadData.nebikiAmt,
    mem: juchuKizaiHeadData.mem,
    head_nam: juchuKizaiHeadData.headNam,
    oya_juchu_kizai_head_id: juchuKizaiHeadData.oyaJuchuKizaiHeadId,
    ht_kbn: 0,
    upd_dat: toJapanTimeString(),
    upd_user: userNam,
  };

  try {
    await updateReturnJuchuKizaiHead(updateData, connection);
    console.log('juchu kizai head updated successfully:', updateData);
    return true;
  } catch (e) {
    console.error('Exception while updating juchu kizai head:', e);
    throw e;
  }
};

/**
 * 返却受注機材明細リスト取得
 * @param juchuHeadId 受注ヘッダーid
 * @param juchuKizaiHeadId 受注機材ヘッダーid
 * @returns 返却受注機材明細
 */
export const getReturnJuchuKizaiMeisai = async (
  juchuHeadId: number,
  juchuKizaiHeadId: number,
  oyaJuchuKizaiHeadId: number
) => {
  try {
    const { data: returnData, error: returnError } = await selectReturnJuchuKizaiMeisai(juchuHeadId, juchuKizaiHeadId);
    if (returnError) {
      console.error('GetKeeoEqList keep eqList error : ', returnError);
      return [];
    }

    const { data: eqTanka, error: eqTankaError } = await selectJuchuKizaiMeisaiKizaiTanka(
      juchuHeadId,
      juchuKizaiHeadId
    );
    if (eqTankaError) {
      console.error('GetEqHeader eqTanka error : ', eqTankaError);
      return [];
    }

    const { data: oyaData, error: oyaError } = await selectOyaJuchuKizaiMeisai(juchuHeadId, oyaJuchuKizaiHeadId);
    if (oyaError) {
      console.error('GetKeeoEqList oya eqList error : ', oyaError);
      return [];
    }

    const returnJuchuKizaiMeisaiData: ReturnJuchuKizaiMeisaiValues[] = returnData.map((d) => ({
      juchuHeadId: d.juchu_head_id,
      juchuKizaiHeadId: d.juchu_kizai_head_id,
      juchuKizaiMeisaiId: d.juchu_kizai_meisai_id,
      shozokuId: d.shozoku_id,
      shozokuNam: d.shozoku_nam ?? '',
      mem: d.mem,
      kizaiId: d.kizai_id,
      kizaiTankaAmt: eqTanka.find((t) => t.kizai_id === d.kizai_id)?.kizai_tanka_amt || 0,
      kizaiNam: d.kizai_nam ?? '',
      oyaPlanKizaiQty: oyaData.find((oya) => oya.kizai_id === d.kizai_id)?.plan_kizai_qty ?? 0,
      oyaPlanYobiQty: oyaData.find((oya) => oya.kizai_id === d.kizai_id)?.plan_yobi_qty ?? 0,
      planKizaiQty: d.plan_kizai_qty ? -1 * d.plan_kizai_qty : d.plan_kizai_qty,
      planYobiQty: d.plan_yobi_qty ? -1 * d.plan_yobi_qty : d.plan_yobi_qty,
      planQty: d.plan_qty ? -1 * d.plan_qty : d.plan_qty,
      delFlag: false,
      saveFlag: true,
    }));
    return returnJuchuKizaiMeisaiData;
  } catch (e) {
    console.error(e);
  }
};

/**
 * 返却受注機材明細新規追加
 * @param returnJuchuKizaiMeisaiData 返却受注機材明細データ
 * @param userNam ユーザー名
 * @returns
 */
export const addReturnJuchuKizaiMeisai = async (
  returnJuchuKizaiMeisaiData: ReturnJuchuKizaiMeisaiValues[],
  userNam: string,
  connection: PoolClient
) => {
  const newData: JuchuKizaiMeisai[] = returnJuchuKizaiMeisaiData.map((d) => ({
    juchu_head_id: d.juchuHeadId,
    juchu_kizai_head_id: d.juchuKizaiHeadId,
    juchu_kizai_meisai_id: d.juchuKizaiMeisaiId,
    kizai_id: d.kizaiId,
    kizai_tanka_amt: d.kizaiTankaAmt,
    plan_kizai_qty: d.planKizaiQty ? -1 * d.planKizaiQty : d.planKizaiQty,
    plan_yobi_qty: d.planYobiQty ? -1 * d.planYobiQty : d.planYobiQty,
    mem: d.mem,
    add_dat: toJapanTimeString(),
    add_user: userNam,
    shozoku_id: d.shozokuId,
  }));
  try {
    await insertJuchuKizaiMeisai(newData, connection);
    console.log('return kizai meisai added successfully:', newData);
    return true;
  } catch (e) {
    console.error('Exception while adding return kizai meisai:', e);
    throw e;
  }
};

/**
 * 返却受注機材明細更新
 * @param returnJuchuKizaiMeisaiData 返却受注機材明細データ
 * @param userNam ユーザー名
 * @returns
 */
export const updReturnJuchuKizaiMeisai = async (
  returnJuchuKizaiMeisaiData: ReturnJuchuKizaiMeisaiValues[],
  userNam: string,
  connection: PoolClient
) => {
  const updateData: JuchuKizaiMeisai[] = returnJuchuKizaiMeisaiData.map((d) => ({
    juchu_head_id: d.juchuHeadId,
    juchu_kizai_head_id: d.juchuKizaiHeadId,
    juchu_kizai_meisai_id: d.juchuKizaiMeisaiId,
    kizai_id: d.kizaiId,
    kizai_tanka_amt: d.kizaiTankaAmt,
    plan_kizai_qty: d.planKizaiQty ? -1 * d.planKizaiQty : d.planKizaiQty,
    plan_yobi_qty: d.planYobiQty ? -1 * d.planYobiQty : d.planYobiQty,
    mem: d.mem,
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
 * 返却受注機材明細削除
 * @param juchuHeadId 受注ヘッダーid
 * @param juchuKizaiHeadId 受注機材ヘッダーid
 * @param kizaiId 機材id
 */
export const delReturnJuchuKizaiMeisai = async (
  juchuHeadId: number,
  juchuKizaiHeadId: number,
  kizaiId: number[],
  connection: PoolClient
) => {
  try {
    await deleteJuchuKizaiMeisai(juchuHeadId, juchuKizaiHeadId, kizaiId, connection);
  } catch (e) {
    throw e;
  }
};

/**
 * 返却受注コンテナ明細データ取得
 * @param juchuHeadId 受注ヘッダーid
 * @param juchuKizaiHeadId 受注機材ヘッダーid
 * @param oyaJuchuKizaiHeadId 親受注機材ヘッダーid
 * @returns 返却受注コンテナ明細データ
 */
export const getReturnJuchuContainerMeisai = async (
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
      console.error('GetReturnContainerList return containerList error : ', containerError);
      return [];
    }

    const { data: oyaData, error: oyaError } = await selectJuchuContainerMeisai(juchuHeadId, oyaJuchuKizaiHeadId);
    if (oyaError) {
      console.error('GetReturnCOntainerList oya containerList error : ', oyaError);
      return [];
    }

    const returnJuchuContainerMeisaiData: ReturnJuchuContainerMeisaiValues[] = containerData.map((d) => ({
      juchuHeadId: d.juchu_head_id,
      juchuKizaiHeadId: d.juchu_kizai_head_id,
      juchuKizaiMeisaiId: d.juchu_kizai_meisai_id,
      mem: d.mem,
      kizaiId: d.kizai_id,
      kizaiNam: d.kizai_nam ?? '',
      oyaPlanKicsKizaiQty: oyaData.find((oya) => oya.kizai_id === d.kizai_id)?.kics_plan_kizai_qty ?? 0,
      oyaPlanYardKizaiQty: oyaData.find((oya) => oya.kizai_id === d.kizai_id)?.yard_plan_kizai_qty ?? 0,
      planKicsKizaiQty: d.kics_plan_kizai_qty ? -1 * d.kics_plan_kizai_qty : d.kics_plan_kizai_qty,
      planYardKizaiQty: d.yard_plan_kizai_qty ? -1 * d.yard_plan_kizai_qty : d.yard_plan_kizai_qty,
      planQty: -1 * (d.kics_plan_kizai_qty + d.yard_plan_kizai_qty),
      delFlag: false,
      saveFlag: true,
    }));
    return returnJuchuContainerMeisaiData;
  } catch (e) {
    console.error(e);
  }
};

/**
 * 返却受注コンテナ明細新規追加
 * @param returnJuchuContainerMeisaiData 返却受注コンテナ明細データ
 * @param userNam ユーザー名
 * @returns
 */
export const addReturnJuchuContainerMeisai = async (
  returnJuchuContainerMeisaiData: ReturnJuchuContainerMeisaiValues[],
  userNam: string,
  connection: PoolClient
) => {
  const newKicsData: JuchuCtnMeisai[] = returnJuchuContainerMeisaiData.map((d) => ({
    juchu_head_id: d.juchuHeadId,
    juchu_kizai_head_id: d.juchuKizaiHeadId,
    juchu_kizai_meisai_id: d.juchuKizaiMeisaiId,
    kizai_id: d.kizaiId,
    plan_kizai_qty: d.planKicsKizaiQty ? -1 * d.planKicsKizaiQty : d.planKicsKizaiQty,
    shozoku_id: 1,
    mem: d.mem,
    add_dat: toJapanTimeString(),
    add_user: userNam,
  }));

  const newYardData: JuchuCtnMeisai[] = returnJuchuContainerMeisaiData.map((d) => ({
    juchu_head_id: d.juchuHeadId,
    juchu_kizai_head_id: d.juchuKizaiHeadId,
    juchu_kizai_meisai_id: d.juchuKizaiMeisaiId,
    kizai_id: d.kizaiId,
    plan_kizai_qty: d.planYardKizaiQty ? -1 * d.planYardKizaiQty : d.planYardKizaiQty,
    shozoku_id: 2,
    mem: d.mem,
    add_dat: toJapanTimeString(),
    add_user: userNam,
  }));

  const mergeData = [...newKicsData, ...newYardData];

  try {
    await insertJuchuContainerMeisai(mergeData, connection);
    console.log('return container meisai added successfully:', mergeData);
    return true;
  } catch (e) {
    console.error('Exception while adding return container meisai:', e);
    throw e;
  }
};

/**
 * 返却受注コンテナ明細更新
 * @param returnJuchuContainerMeisaiData 返却受注コンテナ明細データ
 * @param userNam ユーザー名
 * @returns
 */
export const updReturnJuchuContainerMeisai = async (
  returnJuchuContainerMeisaiData: ReturnJuchuContainerMeisaiValues[],
  userNam: string,
  connection: PoolClient
) => {
  const updateKicsData: JuchuCtnMeisai[] = returnJuchuContainerMeisaiData.map((d) => ({
    juchu_head_id: d.juchuHeadId,
    juchu_kizai_head_id: d.juchuKizaiHeadId,
    juchu_kizai_meisai_id: d.juchuKizaiMeisaiId,
    kizai_id: d.kizaiId,
    plan_kizai_qty: d.planKicsKizaiQty ? -1 * d.planKicsKizaiQty : d.planKicsKizaiQty,
    shozoku_id: 1,
    mem: d.mem,
    upd_dat: toJapanTimeString(),
    upd_user: userNam,
  }));

  const updateYardData: JuchuCtnMeisai[] = returnJuchuContainerMeisaiData.map((d) => ({
    juchu_head_id: d.juchuHeadId,
    juchu_kizai_head_id: d.juchuKizaiHeadId,
    juchu_kizai_meisai_id: d.juchuKizaiMeisaiId,
    kizai_id: d.kizaiId,
    plan_kizai_qty: d.planYardKizaiQty ? -1 * d.planYardKizaiQty : d.planYardKizaiQty,
    shozoku_id: 2,
    mem: d.mem,
    upd_dat: toJapanTimeString(),
    upd_user: userNam,
  }));

  const mergeData = [...updateKicsData, ...updateYardData];

  try {
    for (const data of mergeData) {
      await updateJuchuContainerMeisai(data, connection);
      console.log('return juchu container meisai updated successfully:', data);
    }
    return true;
  } catch (e) {
    console.error('Exception while updating return juchu container meisai:', e);
    throw e;
  }
};

/**
 * 返却受注コンテナ明細削除
 * @param juchuHeadId 受注ヘッダーid
 * @param juchuKizaiHeadId 受注機材ヘッダーid
 * @param deleteJuchuContainerMeisaiIds 受注コンテナ明細id
 */
export const delReturnJuchuContainerMeisai = async (
  juchuHeadId: number,
  juchuKizaiHeadId: number,
  kizaiId: number[],
  connection: PoolClient
) => {
  try {
    await deleteJuchuContainerMeisai(juchuHeadId, juchuKizaiHeadId, kizaiId, connection);
  } catch (e) {
    throw e;
  }
};

/**
 * 返却入出庫伝票新規追加
 * @param juchuKizaiHeadData 返却受注機材ヘッダーデータ
 * @param juchuKizaiMeisaiData 返却受注機材明細データ
 * @param userNam ユーザー名
 * @returns
 */
export const addReturnNyushukoDen = async (
  returnJuchuKizaiHeadData: ReturnJuchuKizaiHeadValues,
  returnJuchuKizaiMeisaiData: ReturnJuchuKizaiMeisaiValues[],
  userNam: string,
  connection: PoolClient
) => {
  const newReturnNyukoCheckData: NyushukoDen[] = returnJuchuKizaiMeisaiData.map((d) => ({
    juchu_head_id: d.juchuHeadId,
    juchu_kizai_head_id: d.juchuKizaiHeadId,
    juchu_kizai_meisai_id: d.juchuKizaiMeisaiId,
    sagyo_kbn_id: 30,
    sagyo_den_dat:
      d.shozokuId === 1
        ? toISOString(returnJuchuKizaiHeadData.kicsNyukoDat as Date)
        : toISOString(returnJuchuKizaiHeadData.yardNyukoDat as Date),
    sagyo_id: d.shozokuId,
    kizai_id: d.kizaiId,
    plan_qty: d.planQty,
    add_dat: toJapanTimeString(),
    add_user: userNam,
  }));

  try {
    await insertNyushukoDen(newReturnNyukoCheckData, connection);
    console.log('return nyushuko den added successfully:', newReturnNyukoCheckData);
    return true;
  } catch (e) {
    console.error('Exception while adding return nyushuko den:', e);
    throw e;
  }
};

/**
 * 返却入出庫伝票更新
 * @param returnJuchuKizaiHeadData 返却受注機材ヘッダーデータ
 * @param returnJuchuKizaiMeisaiData 返却受注機材明細データ
 * @param userNam ユーザー名
 * @returns
 */
export const updReturnNyushukoDen = async (
  returnJuchuKizaiHeadData: ReturnJuchuKizaiHeadValues,
  returnJuchuKizaiMeisaiData: ReturnJuchuKizaiMeisaiValues[],
  userNam: string,
  connection: PoolClient
) => {
  const updateReturnNyukoCheckData: NyushukoDen[] = returnJuchuKizaiMeisaiData.map((d) => ({
    juchu_head_id: d.juchuHeadId,
    juchu_kizai_head_id: d.juchuKizaiHeadId,
    juchu_kizai_meisai_id: d.juchuKizaiMeisaiId,
    sagyo_kbn_id: 30,
    sagyo_den_dat:
      d.shozokuId === 1
        ? toISOString(returnJuchuKizaiHeadData.kicsNyukoDat as Date)
        : toISOString(returnJuchuKizaiHeadData.yardNyukoDat as Date),
    sagyo_id: d.shozokuId,
    kizai_id: d.kizaiId,
    plan_qty: d.planQty,
    add_dat: toJapanTimeString(),
    add_user: userNam,
  }));

  try {
    for (const data of updateReturnNyukoCheckData) {
      await updateNyushukoDen(data, connection);
    }
    console.log('return nyushuko den updated successfully:', updateReturnNyukoCheckData);
    return true;
  } catch (e) {
    console.error('Exception while updating return nyushuko den:', e);
    throw e;
  }
};

/**
 * 返却入出庫伝票削除
 * @param juchuHeadId 受注ヘッダーid
 * @param juchuKizaiHeadId 受注機材ヘッダーid
 * @param kizaiId 機材id
 */
export const delReturnNyushukoDen = async (
  juchuHeadId: number,
  juchuKizaiHeadId: number,
  kizaiId: number[],
  connection: PoolClient
) => {
  try {
    await deleteNyushukoDen(juchuHeadId, juchuKizaiHeadId, kizaiId, connection);
  } catch (e) {
    throw e;
  }
};

/**
 * 返却コンテナ入出庫伝票更新
 * @param returnJuchuKizaiHeadData 返却受注機材ヘッダーデータ
 * @param returnJuchuContainerMeisaiData 返却受注コンテナ明細データ
 * @param userNam ユーザー名
 */
export const updReturnContainerNyushukoDen = async (
  returnJuchuKizaiHeadData: ReturnJuchuKizaiHeadValues,
  returnJuchuContainerMeisaiData: ReturnJuchuContainerMeisaiValues[],
  userNam: string,
  connection: PoolClient
) => {
  for (const data of returnJuchuContainerMeisaiData) {
    const kicsData =
      !data.delFlag && data.planKicsKizaiQty
        ? {
            juchu_head_id: data.juchuHeadId,
            juchu_kizai_head_id: data.juchuKizaiHeadId,
            juchu_kizai_meisai_id: data.juchuKizaiMeisaiId,
            sagyo_kbn_id: 30,
            sagyo_den_dat: toISOString(returnJuchuKizaiHeadData.kicsNyukoDat as Date),
            sagyo_id: 1,
            kizai_id: data.kizaiId,
            plan_qty: data.planKicsKizaiQty,
          }
        : null;
    const yardData =
      !data.delFlag && data.planYardKizaiQty
        ? {
            juchu_head_id: data.juchuHeadId,
            juchu_kizai_head_id: data.juchuKizaiHeadId,
            juchu_kizai_meisai_id: data.juchuKizaiMeisaiId,
            sagyo_kbn_id: 30,
            sagyo_den_dat: toISOString(returnJuchuKizaiHeadData.yardNyukoDat as Date),
            sagyo_id: 2,
            kizai_id: data.kizaiId,
            plan_qty: data.planYardKizaiQty,
          }
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
        await updateNyushukoDen(
          {
            ...kicsData,
            upd_dat: toJapanTimeString(),
            upd_user: userNam,
          },
          connection
        );
      } else if (kicsConfirmResult.data && kicsConfirmResult.data.length > 0 && !kicsData) {
        await deleteContainerNyushukoDen(kicsConfirmData, connection);
      } else if (kicsConfirmResult!.data && kicsData) {
        await insertNyushukoDen(
          [
            {
              ...kicsData,
              add_dat: toJapanTimeString(),
              add_user: userNam,
            },
          ],
          connection
        );
      }
      if (yardConfirmResult.data && yardConfirmResult.data.length > 0 && yardData) {
        await updateNyushukoDen(
          {
            ...yardData,
            upd_dat: toJapanTimeString(),
            upd_user: userNam,
          },
          connection
        );
      } else if (yardConfirmResult.data && yardConfirmResult.data.length > 0 && !yardData) {
        await deleteContainerNyushukoDen(yardConfirmData, connection);
      } else if (yardConfirmResult!.data && yardData) {
        await insertNyushukoDen(
          [
            {
              ...yardData,
              add_dat: toJapanTimeString(),
              add_user: userNam,
            },
          ],
          connection
        );
      }
      console.log('return container nyushuko den updated successfully:', data);
    } catch (e) {
      throw e;
    }
  }
  return true;
};

/**
 * 返却入出庫確定更新
 * @param data 返却受注機材ヘッダーデータ
 * @param kics KICS機材判定
 * @param yard YARD機材判定
 * @param userNam ユーザー名
 * @returns
 */
export const updReturnNyushukoFix = async (
  data: ReturnJuchuKizaiHeadValues,
  kics: boolean,
  yard: boolean,
  userNam: string,
  connection: PoolClient
) => {
  const kicsData: NyushukoFix = {
    juchu_head_id: data.juchuHeadId,
    juchu_kizai_head_id: data.juchuKizaiHeadId,
    sagyo_kbn_id: 70,
    sagyo_den_dat: toISOString(data.kicsNyukoDat as Date),
    sagyo_id: 1,
  };
  const yardData: NyushukoFix = {
    juchu_head_id: data.juchuHeadId,
    juchu_kizai_head_id: data.juchuKizaiHeadId,
    sagyo_kbn_id: 70,
    sagyo_den_dat: toISOString(data.yardNyukoDat as Date),
    sagyo_id: 2,
  };
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
      await updateNyushukoFix(
        {
          ...kicsData,
          upd_dat: toJapanTimeString(),
          upd_user: userNam,
        },
        connection
      );

      // KICS削除
    } else if (kicsConfirmResult.data && kicsConfirmResult.data.length > 0 && !kics) {
      await deleteNyushukoFix(kicsConfirmData, connection);
      // KICS追加
    } else if (kicsConfirmResult!.data && kics) {
      await insertNyushukoFix(
        [
          {
            ...kicsData,
            sagyo_fix_flg: 0,
            add_dat: toJapanTimeString(),
            add_user: userNam,
          },
        ],
        connection
      );
    }

    // YARD更新
    if (yardConfirmResult.data && yardConfirmResult.data.length > 0 && yard) {
      await updateNyushukoFix(
        {
          ...yardData,
          upd_dat: toJapanTimeString(),
          upd_user: userNam,
        },
        connection
      );

      // YARD削除
    } else if (yardConfirmResult.data && yardConfirmResult.data.length > 0 && !yard) {
      await deleteNyushukoFix(yardConfirmData, connection);
      // YARD追加
    } else if (yardConfirmResult!.data && yard) {
      await insertNyushukoFix(
        [
          {
            ...yardData,
            sagyo_fix_flg: 0,
            add_dat: toJapanTimeString(),
            add_user: userNam,
          },
        ],
        connection
      );
    }
    console.log('return nyushuko fix updated successfully:', data);
    return true;
  } catch (e) {
    console.error(e);
    throw e;
  }
};
