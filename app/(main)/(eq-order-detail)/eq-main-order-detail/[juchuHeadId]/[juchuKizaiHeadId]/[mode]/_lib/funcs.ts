'use server';

import { revalidatePath } from 'next/cache';
import { PoolClient } from 'pg';

import pool from '@/app/_lib/db/postgres';
import { selectBundledEqpts, selectMeisaiEqts, selectOneEqpt } from '@/app/_lib/db/tables/m-kizai';
import { selectBundledEqptIds, selectSetOptions } from '@/app/_lib/db/tables/m-kizai-set';
import {
  deleteIdoDenJuchu,
  insertIdoDenJuchu,
  selectIdoDenJuchuMaxId,
  updateIdoDenJuchu,
} from '@/app/_lib/db/tables/t-ido-den-juchu';
import {
  deleteJuchuContainerMeisai,
  insertJuchuContainerMeisai,
  updateJuchuContainerMeisai,
} from '@/app/_lib/db/tables/t-juchu-ctn-meisai';
import {
  insertJuchuKizaiHead,
  selectJuchuKizaiHead,
  updateJuchuKizaiHead,
} from '@/app/_lib/db/tables/t-juchu-kizai-head';
import {
  deleteHonbanbi,
  insertHonbanbi,
  selectHonbanbi,
  selectHonbanbiConfirm,
  updateHonbanbi,
  updateNyushukoHonbanbi,
} from '@/app/_lib/db/tables/t-juchu-kizai-honbanbi';
import {
  deleteJuchuKizaiMeisai,
  insertJuchuKizaiMeisai,
  selectJuchuKizaiMeisaiKizaiTanka,
  updateJuchuKizaiMeisai,
} from '@/app/_lib/db/tables/t-juchu-kizai-meisai';
import {
  deleteAllNyushukoDen,
  deleteContainerNyushukoDen,
  deleteNyushukoDen,
  insertNyushukoDen,
  selectContainerNyushukoDenConfirm,
  updateNyushukoDen,
  updateNyushukoDenFromKizaiMeisai,
  upsertNyushukoDen,
} from '@/app/_lib/db/tables/t-nyushuko-den';
import {
  deleteNyushukoFix,
  insertNyushukoFix,
  selectNyushukoFixConfirm,
  updateNyushukoFix,
} from '@/app/_lib/db/tables/t-nyushuko-fix';
import { deleteKizaiIdNyushukoResult } from '@/app/_lib/db/tables/t-nyushuko-result';
import { selectActiveBumons } from '@/app/_lib/db/tables/v_bumon_lst';
import { selectJuchuKizaiMeisai } from '@/app/_lib/db/tables/v-juchu-kizai-meisai';
import { selectIdoJuchuKizaiMeisai } from '@/app/_lib/db/tables/v-juchu-kizai-meisai-sum';
import { selectActiveEqpts, selectChosenEqptsDetails } from '@/app/_lib/db/tables/v-kizai-list';
import { JuchuCtnMeisai } from '@/app/_lib/db/types/t_juchu_ctn_meisai-type';
import { IdoDenJuchu } from '@/app/_lib/db/types/t-ido-den-juchu-type';
import { IdoDen } from '@/app/_lib/db/types/t-ido-den-type';
import { IdoFix } from '@/app/_lib/db/types/t-ido-fix-type';
import { JuchuKizaiHead } from '@/app/_lib/db/types/t-juchu-kizai-head-type';
import { JuchuKizaiHonbanbi } from '@/app/_lib/db/types/t-juchu-kizai-honbanbi-type';
import { JuchuKizaiMeisai } from '@/app/_lib/db/types/t-juchu-kizai-meisai-type';
import { NyushukoDen } from '@/app/_lib/db/types/t-nyushuko-den-type';
import { NyushukoFix } from '@/app/_lib/db/types/t-nyushuko-fix-type';
import { toJapanYMDString } from '@/app/(main)/_lib/date-conversion';
import {
  addAllHonbanbi,
  addJuchuKizaiNyushuko,
  delAllNyushukoDen,
  delAllNyushukoResult,
  delNyushukoCtnResult,
  delSiyouHonbanbi,
  getJuchuContainerMeisaiMaxId,
  getJuchuKizaiHeadMaxId,
  getJuchuKizaiMeisaiMaxId,
  getJuchuKizaiNyushuko,
  updJuchuKizaiNyushuko,
} from '@/app/(main)/(eq-order-detail)/_lib/funcs';
import { IdoList } from '@/app/(main)/ido-list/_ui/ido-list';

import {
  EqptSelection,
  IdoJuchuKizaiMeisaiValues,
  JuchuContainerMeisaiValues,
  JuchuKizaiHeadValues,
  JuchuKizaiHonbanbiValues,
  JuchuKizaiMeisaiValues,
  SelectedEqptsValues,
} from './types';

/**
 * 新規受注機材ヘッダー保存
 * @param data 受注機材ヘッダーデータ
 * @param updateShukoDate 更新後出庫日
 * @param updateNyukoDate 更新後入庫日
 * @param updateDateRange 更新後出庫日から入庫日
 * @param userNam ユーザー名
 */
export const saveNewJuchuKizaiHead = async (
  data: JuchuKizaiHeadValues,
  updateShukoDate: Date,
  updateNyukoDate: Date,
  updateDateRange: string[],
  userNam: string
) => {
  const connection = await pool.connect();

  const maxId = await getJuchuKizaiHeadMaxId(data.juchuHeadId);
  const newJuchuKizaiHeadId = maxId ? maxId.juchu_kizai_head_id + 1 : 1;

  try {
    await connection.query('BEGIN');

    // 受注機材ヘッダー追加
    const headResult = await addJuchuKizaiHead(newJuchuKizaiHeadId, data, 1, userNam, connection);
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
    console.log('受注機材入出庫追加', nyushukoResult);
    // 受注機材本番日(入出庫、使用中)追加
    const addJuchuSiyouHonbanbiData: JuchuKizaiHonbanbiValues[] = updateDateRange.map((d) => ({
      juchuHeadId: data.juchuHeadId,
      juchuKizaiHeadId: newJuchuKizaiHeadId,
      juchuHonbanbiShubetuId: 1,
      juchuHonbanbiDat: new Date(d),
      mem: '',
      juchuHonbanbiAddQty: 0,
    }));
    const addJuchuHonbanbiData: JuchuKizaiHonbanbiValues[] = [
      {
        juchuHeadId: data.juchuHeadId,
        juchuKizaiHeadId: newJuchuKizaiHeadId,
        juchuHonbanbiShubetuId: 2,
        juchuHonbanbiDat: updateShukoDate,
        mem: '',
        juchuHonbanbiAddQty: 0,
      },
      {
        juchuHeadId: data.juchuHeadId,
        juchuKizaiHeadId: newJuchuKizaiHeadId,
        juchuHonbanbiShubetuId: 3,
        juchuHonbanbiDat: updateNyukoDate,
        mem: '',
        juchuHonbanbiAddQty: 0,
      },
    ];
    const mergeHonbanbiData: JuchuKizaiHonbanbiValues[] = [...addJuchuSiyouHonbanbiData, ...addJuchuHonbanbiData];
    const addHonbanbiResult = await addAllHonbanbi(
      data.juchuHeadId,
      newJuchuKizaiHeadId,
      mergeHonbanbiData,
      userNam,
      connection
    );
    console.log('入出庫、使用本番日追加', addHonbanbiResult);

    await connection.query('COMMIT');

    await revalidatePath('/eqpt-order-list');

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
 * 受注機材ヘッダー保存
 * @param checkJuchuKizaiHead
 * @param checkJuchuHonbanbi
 * @param checkJuchuKizaiMeisai
 * @param checkJuchuContainerMeisai
 * @param data
 * @param updateShukoDate
 * @param updateNyukoDate
 * @param updateDateRange
 * @param juchuHonbanbiList
 * @param juchuHonbanbiDeleteList
 * @param juchuKizaiMeisaiList
 * @param juchuContainerMeisaiList
 * @param userNam
 * @returns
 */
export const saveJuchuKizai = async (
  checkJuchuKizaiHead: boolean,
  checkKicsDat: boolean,
  checkYardDat: boolean,
  checkJuchuHonbanbi: boolean,
  checkJuchuKizaiMeisai: boolean,
  checkIdoJuchuKizaiMeisai: boolean,
  checkJuchuContainerMeisai: boolean,
  originKicsShukoDat: Date | null | undefined,
  originYardShukoDat: Date | null | undefined,
  data: JuchuKizaiHeadValues,
  updateShukoDate: Date,
  updateNyukoDate: Date,
  updateDateRange: string[],
  juchuHonbanbiList: JuchuKizaiHonbanbiValues[],
  juchuHonbanbiDeleteList: JuchuKizaiHonbanbiValues[],
  juchuKizaiMeisaiList: JuchuKizaiMeisaiValues[],
  idoJuchuKizaiMeisaiList: IdoJuchuKizaiMeisaiValues[],
  juchuContainerMeisaiList: JuchuContainerMeisaiValues[],
  userNam: string
) => {
  const connection = await pool.connect();

  try {
    await connection.query('BEGIN');

    // 受注機材ヘッダー関係更新
    if (checkJuchuKizaiHead) {
      // 受注機材ヘッダー更新
      const headResult = await updJuchuKizaiHead(data, userNam, connection);
      console.log('受注機材ヘッダー更新', headResult);

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
      console.log('受注機材入出庫更新', nyushukoResult);

      // 受注機材本番日(使用中)更新
      const addJuchuSiyouHonbanbiData: JuchuKizaiHonbanbiValues[] = updateDateRange.map((d) => ({
        juchuHeadId: data.juchuHeadId,
        juchuKizaiHeadId: data.juchuKizaiHeadId,
        juchuHonbanbiShubetuId: 1,
        juchuHonbanbiDat: new Date(d),
        mem: '',
        juchuHonbanbiAddQty: 0,
      }));
      console.log('受注機材本番日(使用中)更新データ', addJuchuSiyouHonbanbiData);
      const deleteSiyouHonbanbiResult = await delSiyouHonbanbi(data.juchuHeadId, data.juchuKizaiHeadId, connection);
      console.log('受注機材本番日(使用日)削除', deleteSiyouHonbanbiResult);
      const addSiyouHonbanbiResult = await addAllHonbanbi(
        data.juchuHeadId,
        data.juchuKizaiHeadId,
        addJuchuSiyouHonbanbiData,
        userNam,
        connection
      );
      console.log('受注機材本番日(使用日)更新', addSiyouHonbanbiResult);

      // 受注機材本番日(出庫、入庫)更新
      const updateNyushukoHonbanbiData: JuchuKizaiHonbanbiValues[] = [
        {
          juchuHeadId: data.juchuHeadId,
          juchuKizaiHeadId: data.juchuKizaiHeadId,
          juchuHonbanbiShubetuId: 2,
          juchuHonbanbiDat: updateShukoDate,
          mem: '',
          juchuHonbanbiAddQty: 0,
        },
        {
          juchuHeadId: data.juchuHeadId,
          juchuKizaiHeadId: data.juchuKizaiHeadId,
          juchuHonbanbiShubetuId: 3,
          juchuHonbanbiDat: updateNyukoDate,
          mem: '',
          juchuHonbanbiAddQty: 0,
        },
      ];
      for (const item of updateNyushukoHonbanbiData) {
        const nyushukoHonbanbiResult = await updNyushukoHonbanbi(
          data.juchuHeadId,
          data.juchuKizaiHeadId,
          item,
          userNam,
          connection
        );
        console.log('入出庫本番日更新', nyushukoHonbanbiResult);
      }
    }

    // 受注機材本番日更新
    if (checkJuchuHonbanbi) {
      for (const item of juchuHonbanbiDeleteList) {
        const deleteHonbanbiResult = await delHonbanbi(
          data.juchuHeadId,
          data.juchuKizaiHeadId,
          item.juchuHonbanbiShubetuId,
          item.juchuHonbanbiDat,
          connection
        );
        console.log('受注機材本番日削除', deleteHonbanbiResult);
      }

      for (const item of juchuHonbanbiList) {
        const confirm = await confirmHonbanbi(
          data.juchuHeadId,
          data.juchuKizaiHeadId,
          item.juchuHonbanbiShubetuId,
          item.juchuHonbanbiDat
        );
        if (confirm) {
          const updateHonbanbiResult = await updHonbanbi(
            data.juchuHeadId,
            data.juchuKizaiHeadId,
            item,
            userNam,
            connection
          );
          console.log('受注機材本番日更新', updateHonbanbiResult);
        } else {
          const addHonbanbiResult = await addHonbanbi(
            data.juchuHeadId,
            data.juchuKizaiHeadId,
            item,
            userNam,
            connection
          );
          console.log('受注機材本番日追加', addHonbanbiResult);
        }
      }
    }

    let dspOrdNum = 1;
    // 受注明細、入出庫伝票、入出庫実績
    if (checkKicsDat || checkYardDat || checkJuchuKizaiMeisai || checkJuchuContainerMeisai) {
      // 受注機材明細id最大値
      const juchuKizaiMeisaiMaxId = await getJuchuKizaiMeisaiMaxId(data.juchuHeadId, data.juchuKizaiHeadId);
      let newJuchuKizaiMeisaiId = juchuKizaiMeisaiMaxId ? juchuKizaiMeisaiMaxId.juchu_kizai_meisai_id + 1 : 1;
      // 機材の並び順設定
      const updKizaiDspOrdNum = juchuKizaiMeisaiList.map((data) =>
        !data.delFlag ? { ...data, dspOrdNum: dspOrdNum++ } : data
      );
      // 新規機材に明細id割り振り
      const newJuchuKizaiMeisaiData = updKizaiDspOrdNum.map((data) =>
        data.juchuKizaiMeisaiId === 0 && !data.delFlag ? { ...data, juchuKizaiMeisaiId: newJuchuKizaiMeisaiId++ } : data
      );

      // 追加明細
      const addJuchuKizaiMeisaiData = newJuchuKizaiMeisaiData.filter((data) => !data.delFlag && !data.saveFlag);
      // 更新明細
      const updateJuchuKizaiMeisaiData = newJuchuKizaiMeisaiData.filter((data) => !data.delFlag && data.saveFlag);
      // 削除明細
      const deleteJuchuKizaiMeisaiData = newJuchuKizaiMeisaiData.filter((data) => data.delFlag && data.saveFlag);
      // 削除
      if (deleteJuchuKizaiMeisaiData.length > 0) {
        console.log('deleteJuchuKizaiMeisaiData', deleteJuchuKizaiMeisaiData);
        const deleteMeisaiResult = await delJuchuKizaiMeisai(deleteJuchuKizaiMeisaiData, connection);
        console.log('受注機材明細削除', deleteMeisaiResult);
      }
      // 追加
      if (addJuchuKizaiMeisaiData.length > 0) {
        const addMeisaiResult = await addJuchuKizaiMeisai(addJuchuKizaiMeisaiData, userNam, connection);
        console.log('受注機材明細追加', addMeisaiResult);
      }
      // 更新
      if (updateJuchuKizaiMeisaiData.length > 0) {
        const updateMeisaiResult = await updJuchuKizaiMeisai(updateJuchuKizaiMeisaiData, userNam, connection);
        console.log('受注機材明細更新', updateMeisaiResult);
      }

      // 受注コンテナ明細id最大値
      const juchuContainerMeisaiMaxId = await getJuchuContainerMeisaiMaxId(data.juchuHeadId, data.juchuKizaiHeadId);
      let newJuchuContainerMeisaiId = juchuContainerMeisaiMaxId
        ? juchuContainerMeisaiMaxId.juchu_kizai_meisai_id + 1
        : 1;
      // コンテナの並び順設定
      const updCtnDspOrdNum = juchuContainerMeisaiList.map((data) =>
        !data.delFlag ? { ...data, dspOrdNum: dspOrdNum++ } : data
      );
      // 新規コンテナに明細id割り振り
      const newJuchuContainerMeisaiData = updCtnDspOrdNum.map((data) =>
        data.juchuKizaiMeisaiId === 0 && !data.delFlag
          ? { ...data, juchuKizaiMeisaiId: newJuchuContainerMeisaiId++ }
          : data
      );

      // 追加コンテナ
      const addJuchuContainerMeisaiData = newJuchuContainerMeisaiData.filter((data) => !data.delFlag && !data.saveFlag);
      // 更新コンテナ
      const updateJuchuContainerMeisaiData = newJuchuContainerMeisaiData.filter(
        (data) => !data.delFlag && data.saveFlag
      );
      // 削除コンテナ
      const deleteJuchuContainerMeisaiData = newJuchuContainerMeisaiData.filter(
        (data) => data.delFlag && data.saveFlag
      );
      // 削除
      if (deleteJuchuContainerMeisaiData.length > 0) {
        const deleteKizaiiIds = deleteJuchuContainerMeisaiData.map((data) => data.kizaiId);
        const deleteCtnMeisaiResult = await delJuchuContainerMeisai(
          data.juchuHeadId,
          data.juchuKizaiHeadId,
          deleteKizaiiIds,
          connection
        );
        console.log('受注コンテナ明細削除', deleteCtnMeisaiResult);
      }
      // 追加
      if (addJuchuContainerMeisaiData.length > 0) {
        const addCtnMeisaiResult = await addJuchuContainerMeisai(addJuchuContainerMeisaiData, userNam, connection);
        console.log('受注コンテナ明細追加', addCtnMeisaiResult);
      }
      // 更新
      if (updateJuchuContainerMeisaiData.length > 0) {
        const updateContainerMeisaiResult = await updJuchuContainerMeisai(
          updateJuchuContainerMeisaiData,
          userNam,
          connection
        );
        console.log('受注コンテナ明細更新', updateContainerMeisaiResult);
      }

      // 入出庫伝票
      // 日付に変更があった場合は全削除後追加
      if (checkKicsDat || checkYardDat) {
        const deleteAllNyushukoDenResult = await delAllNyushukoDen(data.juchuHeadId, data.juchuKizaiHeadId, connection);
        console.log('入出庫伝票全削除', deleteAllNyushukoDenResult);

        // 削除されていない機材明細
        const filterNewJuchuKizaiMeisai = newJuchuKizaiMeisaiData.filter((d) => !d.delFlag);
        const addNyushukoDenResult = await addNyushukoDen(data, filterNewJuchuKizaiMeisai, userNam, connection);
        console.log('入出庫伝票追加', addNyushukoDenResult);

        // 削除されていないコンテナ明細
        const filterNewJuchuCntMeisai = newJuchuContainerMeisaiData.filter((d) => !d.delFlag);
        if (data.kicsShukoDat && data.kicsNyukoDat) {
          const addCtnNyushukoDenResult = await addCtnNyushukoDen(
            filterNewJuchuCntMeisai,
            data.kicsShukoDat,
            data.kicsNyukoDat,
            1,
            userNam,
            connection
          );
          console.log('KICSコンテナ入出庫伝票追加', addCtnNyushukoDenResult);
        }
        if (data.yardShukoDat && data.yardNyukoDat) {
          const addCtnNyushukoDenResult = await addCtnNyushukoDen(
            filterNewJuchuCntMeisai,
            data.yardShukoDat,
            data.yardNyukoDat,
            2,
            userNam,
            connection
          );
          console.log('YARDコンテナ入出庫伝票追加', addCtnNyushukoDenResult);
        }
      } else {
        // 機材入出庫伝票削除
        if (deleteJuchuKizaiMeisaiData.length > 0) {
          const deleteNyushukoDenResult = await delNyushukoDen(deleteJuchuKizaiMeisaiData, connection);
          console.log('入出庫伝票削除', deleteNyushukoDenResult);
        }
        // 機材入出庫伝票追加
        if (addJuchuKizaiMeisaiData.length > 0) {
          const addNyushukoDenResult = await addNyushukoDen(data, addJuchuKizaiMeisaiData, userNam, connection);
          console.log('入出庫伝票追加', addNyushukoDenResult);
        }
        // 機材入出庫伝票更新
        if (updateJuchuKizaiMeisaiData.length > 0) {
          const updateNyushukoDenResult = await updNyushukoDen(data, updateJuchuKizaiMeisaiData, userNam, connection);
          console.log('入出庫伝票更新', updateNyushukoDenResult);
        }

        // コンテナ入出庫伝票削除
        if (deleteJuchuContainerMeisaiData.length > 0) {
          const deleteCtnNyushukoDenResult = await delCtnNyushukoDen(deleteJuchuContainerMeisaiData, connection);
          console.log('コンテナ入出庫伝票削除', deleteCtnNyushukoDenResult);
        }
        // コンテナ入出庫伝票追加
        if (addJuchuContainerMeisaiData.length > 0) {
          if (data.kicsShukoDat && data.kicsNyukoDat) {
            const addCtnNyushukoDenResult = await addCtnNyushukoDen(
              addJuchuContainerMeisaiData,
              data.kicsShukoDat,
              data.kicsNyukoDat,
              1,
              userNam,
              connection
            );
            console.log('KICSコンテナ入出庫伝票追加', addCtnNyushukoDenResult);
          }
          if (data.yardShukoDat && data.yardNyukoDat) {
            const addCtnNyushukoDenResult = await addCtnNyushukoDen(
              addJuchuContainerMeisaiData,
              data.yardShukoDat,
              data.yardNyukoDat,
              2,
              userNam,
              connection
            );
            console.log('YARDコンテナ入出庫伝票追加', addCtnNyushukoDenResult);
          }
        }
        // コンテナ入出庫伝票更新
        if (updateJuchuContainerMeisaiData.length > 0) {
          if (data.kicsShukoDat && data.kicsNyukoDat) {
            const updCtnNyushukoDenResult = await updCtnNyushukoDen(
              updateJuchuContainerMeisaiData,
              data.kicsShukoDat,
              data.kicsNyukoDat,
              1,
              userNam,
              connection
            );
            console.log('KICSコンテナ入出庫伝票更新', updCtnNyushukoDenResult);
          }
          if (data.yardShukoDat && data.yardNyukoDat) {
            const updCtnNyushukoDenResult = await updCtnNyushukoDen(
              updateJuchuContainerMeisaiData,
              data.yardShukoDat,
              data.yardNyukoDat,
              2,
              userNam,
              connection
            );
            console.log('YARDコンテナ入出庫伝票更新', updCtnNyushukoDenResult);
          }
        }
      }

      // 入出庫実績削除
      if (checkKicsDat && originKicsShukoDat) {
        const delKicsNyushukoDenResult = await delAllNyushukoResult(
          data.juchuHeadId,
          data.juchuKizaiHeadId,
          1,
          connection
        );
        console.log('KICS入出庫実績全削除', delKicsNyushukoDenResult);
      }
      if (checkYardDat && originYardShukoDat) {
        const delYardNyushukoDenResult = await delAllNyushukoResult(
          data.juchuHeadId,
          data.juchuKizaiHeadId,
          2,
          connection
        );
        console.log('YARD入出庫実績全削除', delYardNyushukoDenResult);
      }

      if (deleteJuchuKizaiMeisaiData.length > 0) {
        const deleteNyushukoResultResult = await delNyushukoResult(deleteJuchuKizaiMeisaiData, connection);
        console.log('削除機材入出庫実績削除', deleteNyushukoResultResult);
      }

      const deleteIds = deleteJuchuContainerMeisaiData.map((d) => d.kizaiId);
      if (deleteIds.length > 0) {
        const deleteKicsContainerNyushukoResultResult = await delNyushukoCtnResult(
          data.juchuHeadId,
          data.juchuKizaiHeadId,
          deleteIds,
          connection
        );
        console.log('削除コンテナ入出庫実績削除', deleteKicsContainerNyushukoResultResult);
      }
    }

    // 移動伝票更新
    if (checkIdoJuchuKizaiMeisai) {
      const addIdoKizaiData = idoJuchuKizaiMeisaiList.filter(
        (data) => !data.idoDenId && data.sagyoDenDat && !data.delFlag
      );
      const updateIdoKizaiData = idoJuchuKizaiMeisaiList.filter(
        (data) => data.idoDenId && data.sagyoDenDat && !data.delFlag
      );
      const deleteIdoKizaiData = idoJuchuKizaiMeisaiList.filter(
        (data) => data.idoDenId && (!data.sagyoDenDat || data.delFlag)
      );
      // 削除
      if (deleteIdoKizaiData.length > 0) {
        const deleteIdoDenIds = deleteIdoKizaiData.map((data) => data.idoDenId);
        const deleteIdoDenResult = await delIdoDenJuchu(deleteIdoDenIds as number[], connection);
        console.log('移動伝票受注削除', deleteIdoDenResult);
      }
      // 追加
      if (addIdoKizaiData.length > 0) {
        const idoDenMaxId = await getIdoDenJuchuMaxId();
        const newIdoDenId = idoDenMaxId ? idoDenMaxId + 1 : 1;
        const addIdoDenResult = await addIdoDenJuchu(newIdoDenId, addIdoKizaiData, userNam, connection);
        console.log('移動伝票受注追加', addIdoDenResult);
      }
      // 更新
      if (updateIdoKizaiData.length > 0) {
        const updateIdoDenResult = await updIdoDenJuchu(updateIdoKizaiData, userNam, connection);
        console.log('移動伝票受注更新', updateIdoDenResult);
      }
    }

    await connection.query('COMMIT');

    await revalidatePath('/eqpt-order-list');
    await revalidatePath('/ido-list');
    await revalidatePath('/shuko-list');
    await revalidatePath('/nyuko-list');

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
 * メイン受注機材ヘッダー取得
 * @param juchuHeadId 受注ヘッダーid
 * @param juchuKizaiHeadId 受注機材ヘッダーid
 * @returns 受注機材ヘッダーデータ
 */
export const getJuchuKizaiHead = async (juchuHeadId: number, juchuKizaiHeadId: number) => {
  try {
    const juchuKizaiHeadData = await selectJuchuKizaiHead(juchuHeadId, juchuKizaiHeadId);

    if (juchuKizaiHeadData.error) {
      console.error('GetEqHeader juchuKizaiHead error : ', juchuKizaiHeadData.error);
      throw juchuKizaiHeadData.error;
    }

    const juchuDate = await getJuchuKizaiNyushuko(juchuHeadId, juchuKizaiHeadId);

    if (!juchuDate) throw new Error('受注機材入出庫日が存在しません');

    const jucuKizaiHeadData: JuchuKizaiHeadValues = {
      juchuHeadId: juchuKizaiHeadData.data.juchu_head_id,
      juchuKizaiHeadId: juchuKizaiHeadData.data.juchu_kizai_head_id,
      juchuKizaiHeadKbn: juchuKizaiHeadData.data.juchu_kizai_head_kbn,
      juchuHonbanbiQty: juchuKizaiHeadData.data.juchu_honbanbi_qty,
      nebikiAmt: juchuKizaiHeadData.data.nebiki_amt,
      nebikiRat: juchuKizaiHeadData.data.nebiki_rat ?? 0,
      mem: juchuKizaiHeadData.data.mem ? juchuKizaiHeadData.data.mem : '',
      headNam: juchuKizaiHeadData.data.head_nam ?? '',
      kicsShukoDat: juchuDate.kicsShukoDat ? new Date(juchuDate.kicsShukoDat) : null,
      kicsNyukoDat: juchuDate.kicsNyukoDat ? new Date(juchuDate.kicsNyukoDat) : null,
      yardShukoDat: juchuDate.yardShukoDat ? new Date(juchuDate.yardShukoDat) : null,
      yardNyukoDat: juchuDate.yardNyukoDat ? new Date(juchuDate.yardNyukoDat) : null,
    };
    return jucuKizaiHeadData;
  } catch (e) {
    console.error(e);
    throw e;
  }
};

/**
 * メイン受注機材ヘッダー新規追加
 * @param juchuKizaiHeadId 受注機材ヘッダーid
 * @param juchuKizaiHeadData 受注機材ヘッダーデータ
 * @param dspOrdNum 表示順
 * @param userNam ユーザー名
 * @returns
 */
export const addJuchuKizaiHead = async (
  juchuKizaiHeadId: number,
  juchuKizaiHeadData: JuchuKizaiHeadValues,
  juchuKizaiHeadKbn: number,
  userNam: string,
  connection: PoolClient
) => {
  const newData: JuchuKizaiHead = {
    juchu_head_id: juchuKizaiHeadData.juchuHeadId,
    juchu_kizai_head_id: juchuKizaiHeadId,
    juchu_kizai_head_kbn: juchuKizaiHeadKbn,
    juchu_honbanbi_qty: juchuKizaiHeadData.juchuHonbanbiQty,
    nebiki_amt: juchuKizaiHeadData.nebikiAmt,
    nebiki_rat: juchuKizaiHeadData.nebikiRat,
    mem: juchuKizaiHeadData.mem,
    head_nam: juchuKizaiHeadData.headNam,
    oya_juchu_kizai_head_id: null,
    ht_kbn: 0,
    add_dat: new Date().toISOString(),
    add_user: userNam,
  };
  try {
    await insertJuchuKizaiHead(newData, connection);

    console.log('New juchuKizaiHead added successfully:', newData);
    return true;
  } catch (e) {
    console.error('Error adding new juchuKizaiHead:', e);
    throw e;
  }
};

/**
 * メイン受注機材ヘッダー更新
 * @param juchuKizaiHeadData 受注機材ヘッダーデータ
 * @param userNam ユーザー名
 * @returns
 */
export const updJuchuKizaiHead = async (
  juchuKizaiHeadData: JuchuKizaiHeadValues,
  userNam: string,
  connection: PoolClient
) => {
  const updateData: JuchuKizaiHead = {
    juchu_head_id: juchuKizaiHeadData.juchuHeadId,
    juchu_kizai_head_id: juchuKizaiHeadData.juchuKizaiHeadId,
    juchu_kizai_head_kbn: juchuKizaiHeadData.juchuKizaiHeadKbn,
    juchu_honbanbi_qty: juchuKizaiHeadData.juchuHonbanbiQty,
    nebiki_amt: juchuKizaiHeadData.nebikiAmt,
    nebiki_rat: juchuKizaiHeadData.nebikiRat,
    mem: juchuKizaiHeadData.mem,
    head_nam: juchuKizaiHeadData.headNam,
    oya_juchu_kizai_head_id: null,
    ht_kbn: 0,
    upd_dat: new Date().toISOString(),
    upd_user: userNam,
  };

  try {
    await updateJuchuKizaiHead(updateData, connection);
    console.log('juchu kizai head updated successfully');
    return true;
  } catch (e) {
    throw e;
  }
};

/**
 * メイン受注機材明細取得
 * @param juchuHeadId 受注ヘッダーid
 * @param juchuKizaiHeadId 受注機材ヘッダーid
 * @returns
 */
export const getJuchuKizaiMeisai = async (juchuHeadId: number, juchuKizaiHeadId: number) => {
  try {
    const /*{ data: eqList, error: eqListError }*/ eqList = await selectJuchuKizaiMeisai(juchuHeadId, juchuKizaiHeadId);
    // if (eqListError) {
    //   console.error('getJuchuKizaiMeisai eqList error : ', eqListError);
    //   throw eqListError;
    // }
    const uniqueIds = new Set();
    const uniqueEqList = eqList.filter((item) => {
      if (uniqueIds.has(item.juchu_kizai_meisai_id)) {
        return false;
      }
      uniqueIds.add(item.juchu_kizai_meisai_id);
      return true;
    });

    const eqIds = [...new Set(eqList.map((data) => data.kizai_id))];

    const { data: mKizai, error: mKizaiError } = await selectMeisaiEqts(eqIds);

    if (mKizaiError) {
      console.error('GetEqList eqShozokuId error : ', mKizaiError);
      throw mKizaiError;
    }

    const { data: eqTanka, error: eqTankaError } = await selectJuchuKizaiMeisaiKizaiTanka(
      juchuHeadId,
      juchuKizaiHeadId
    );
    if (eqTankaError) {
      console.error('GetEqHeader eqTanka error : ', eqTankaError);
      throw eqTankaError;
    }

    const juchuKizaiMeisaiData: JuchuKizaiMeisaiValues[] = uniqueEqList.map((d, i) => ({
      juchuHeadId: d.juchu_head_id,
      juchuKizaiHeadId: d.juchu_kizai_head_id,
      juchuKizaiMeisaiId: d.juchu_kizai_meisai_id,
      mShozokuId: mKizai.find((data) => data.kizai_id === d.kizai_id)?.shozoku_id ?? 0,
      shozokuId: d.shozoku_id,
      mem: d.mem,
      mem2: d.mem2,
      kizaiId: d.kizai_id,
      kizaiTankaAmt: eqTanka.find((t) => t.kizai_id === d.kizai_id)?.kizai_tanka_amt || 0,
      kizaiNam: d.kizai_nam ?? '',
      planKizaiQty: d.plan_kizai_qty ?? 0,
      planYobiQty: d.plan_yobi_qty ?? 0,
      planQty: d.plan_qty ?? 0,
      dspOrdNum: d.dsp_ord_num ?? 0,
      indentNum: d.indent_num ?? 0,
      delFlag: false,
      saveFlag: true,
    }));
    return juchuKizaiMeisaiData;
  } catch (e) {
    console.error(e);
    throw e;
  }
};

/**
 * メイン移動受注機材明細リスト取得
 * @param juchuHeadId 受注ヘッダーid
 * @param juchuKizaiHeadId 受注機材ヘッダーid
 * @returns 受注機材明細リスト
 */
export const getIdoJuchuKizaiMeisai = async (juchuHeadId: number, juchuKizaiHeadId: number) => {
  try {
    const /*{ data: eqList, error: eqListError }*/ eqList = await selectIdoJuchuKizaiMeisai(
        juchuHeadId,
        juchuKizaiHeadId
      );
    // if (eqListError) {
    //   console.error('GetEqList eqList error : ', eqListError);
    //   throw eqListError;
    // }

    const uniqueIds = new Set();
    const uniqueEqList = eqList.filter((item) => {
      if (uniqueIds.has(item.kizai_id)) {
        return false;
      }
      uniqueIds.add(item.kizai_id);
      return true;
    });

    const eqIds = uniqueEqList.map((data) => data.kizai_id).filter((id) => id !== null);

    const { data: mKizai, error: mKizaiError } = await selectMeisaiEqts(eqIds);

    if (mKizaiError) {
      console.error('GetEqList eqShozokuId error : ', mKizaiError);
      throw mKizaiError;
    }

    const juchuKizaiMeisaiData: IdoJuchuKizaiMeisaiValues[] = uniqueEqList.map((d) => ({
      juchuHeadId: d.juchu_head_id ?? 0,
      juchuKizaiHeadId: d.juchu_kizai_head_id ?? 0,
      idoDenId: d.ido_den_id,
      sagyoDenDat: d.sagyo_den_dat ? new Date(d.sagyo_den_dat) : null,
      sagyoSijiId: d.sagyo_siji_id === 'K→Y' ? 1 : d.sagyo_siji_id === 'Y→K' ? 2 : null,
      mShozokuId: mKizai.find((data) => data.kizai_id === d.kizai_id)?.shozoku_id ?? 0,
      shozokuId: d.shozoku_id ?? 0,
      shozokuNam: d.shozoku_nam ?? '',
      kizaiId: d.kizai_id ?? 0,
      kizaiNam: d.kizai_nam ?? '',
      kizaiQty: d.kizai_qty ?? 0,
      planKizaiQty: d.plan_kizai_qty ?? 0,
      planYobiQty: d.plan_yobi_qty ?? 0,
      planQty: d.plan_qty ?? 0,
      delFlag: false,
      saveFlag: true,
    }));
    return juchuKizaiMeisaiData;
  } catch (e) {
    console.error(e);
    throw e;
  }
};

/**
 * メイン受注機材明細新規追加
 * @param juchuKizaiMeisaiData 受注機材明細データ
 * @param userNam ユーザー名
 * @returns
 */
export const addJuchuKizaiMeisai = async (
  juchuKizaiMeisaiData: JuchuKizaiMeisaiValues[],
  userNam: string,
  connection: PoolClient
) => {
  const newData: JuchuKizaiMeisai[] = juchuKizaiMeisaiData.map((d) => ({
    juchu_head_id: d.juchuHeadId,
    juchu_kizai_head_id: d.juchuKizaiHeadId,
    juchu_kizai_meisai_id: d.juchuKizaiMeisaiId,
    kizai_id: d.kizaiId,
    kizai_tanka_amt: d.kizaiTankaAmt,
    plan_kizai_qty: d.planKizaiQty,
    plan_yobi_qty: d.planYobiQty,
    mem: d.mem,
    mem2: d.mem2,
    keep_qty: null,
    add_dat: new Date().toISOString(),
    add_user: userNam,
    shozoku_id: d.shozokuId,
    dsp_ord_num: d.dspOrdNum,
    indent_num: d.indentNum,
  }));

  try {
    await insertJuchuKizaiMeisai(newData, connection);

    console.log('kizai meisai added successfully:', newData);
    return true;
  } catch (e) {
    console.error('Exception while adding kizai meisai:', e);
    throw e;
  }
};

/**
 * メイン受注機材明細更新
 * @param juchuKizaiMeisaiData 受注機材明細データ
 * @param userNam ユーザー名
 * @returns
 */
export const updJuchuKizaiMeisai = async (
  juchuKizaiMeisaiData: JuchuKizaiMeisaiValues[],
  userNam: string,
  connection: PoolClient
) => {
  const updateData: JuchuKizaiMeisai[] = juchuKizaiMeisaiData.map((d) => ({
    juchu_head_id: d.juchuHeadId,
    juchu_kizai_head_id: d.juchuKizaiHeadId,
    juchu_kizai_meisai_id: d.juchuKizaiMeisaiId,
    kizai_id: d.kizaiId,
    kizai_tanka_amt: d.kizaiTankaAmt,
    plan_kizai_qty: d.planKizaiQty,
    plan_yobi_qty: d.planYobiQty,
    mem: d.mem,
    mem2: d.mem2,
    keep_qty: null,
    upd_dat: new Date().toISOString(),
    upd_user: userNam,
    shozoku_id: d.shozokuId,
    dsp_ord_num: d.dspOrdNum,
    indent_num: d.indentNum,
  }));

  try {
    for (const data of updateData) {
      await updateJuchuKizaiMeisai(data, connection);
      console.log('juchu kizai meisai updated successfully:', data);
    }
    return true;
  } catch (e) {
    console.error('Exception while updating juchu kizai meisai:', e);
    throw e;
  }
};

/**
 * メイン受注機材明細削除
 * @param juchuHeadId 受注ヘッダーid
 * @param juchuKizaiHeadId 受注機材ヘッダーid
 * @param juchuKizaiMeisaiIds 受注機材明細id
 */
export const delJuchuKizaiMeisai = async (juchuKizaiMeisaiData: JuchuKizaiMeisaiValues[], connection: PoolClient) => {
  const deleteData = juchuKizaiMeisaiData.map((d) => ({
    juchu_head_id: d.juchuHeadId,
    juchu_kizai_head_id: d.juchuKizaiHeadId,
    juchu_kizai_meisai_id: d.juchuKizaiMeisaiId,
    kizai_id: d.kizaiId,
  }));

  try {
    for (const data of deleteData) {
      await deleteJuchuKizaiMeisai(data, connection);
    }
    console.log('juchu kizai meisai delete successfully:', deleteData);
    return true;
  } catch (e) {
    throw e;
  }
};

/**
 * 受注コンテナ明細新規追加
 * @param juchuContainerMeisaiData 受注コンテナ明細データ
 * @param userNam ユーザー名
 * @returns
 */
export const addJuchuContainerMeisai = async (
  juchuContainerMeisaiData: JuchuContainerMeisaiValues[],
  userNam: string,
  connection: PoolClient
) => {
  const newKicsData: JuchuCtnMeisai[] = juchuContainerMeisaiData.map((d) => ({
    juchu_head_id: d.juchuHeadId,
    juchu_kizai_head_id: d.juchuKizaiHeadId,
    juchu_kizai_meisai_id: d.juchuKizaiMeisaiId,
    kizai_id: d.kizaiId,
    plan_kizai_qty: d.planKicsKizaiQty,
    shozoku_id: 1,
    mem: d.mem,
    dsp_ord_num: d.dspOrdNum,
    indent_num: d.indentNum,
    add_dat: new Date().toISOString(),
    add_user: userNam,
  }));

  const newYardData: JuchuCtnMeisai[] = juchuContainerMeisaiData.map((d) => ({
    juchu_head_id: d.juchuHeadId,
    juchu_kizai_head_id: d.juchuKizaiHeadId,
    juchu_kizai_meisai_id: d.juchuKizaiMeisaiId,
    kizai_id: d.kizaiId,
    plan_kizai_qty: d.planYardKizaiQty,
    shozoku_id: 2,
    mem: d.mem,
    dsp_ord_num: d.dspOrdNum,
    indent_num: d.indentNum,
    add_dat: new Date().toISOString(),
    add_user: userNam,
  }));

  const mergeData = [...newKicsData, ...newYardData];

  try {
    await insertJuchuContainerMeisai(mergeData, connection);
    console.log('container meisai added successfully:', mergeData);
    return true;
  } catch (e) {
    console.error('Exception while adding container meisai:', e);
    throw e;
  }
};

/**
 * 受注コンテナ明細更新
 * @param juchuContainerMeisaiData 受注コンテナ明細データ
 * @param userNam ユーザー名
 * @returns
 */
export const updJuchuContainerMeisai = async (
  juchuContainerMeisaiData: JuchuContainerMeisaiValues[],
  userNam: string,
  connection: PoolClient
) => {
  const updateKicsData: JuchuCtnMeisai[] = juchuContainerMeisaiData.map((d) => ({
    juchu_head_id: d.juchuHeadId,
    juchu_kizai_head_id: d.juchuKizaiHeadId,
    juchu_kizai_meisai_id: d.juchuKizaiMeisaiId,
    kizai_id: d.kizaiId,
    plan_kizai_qty: d.planKicsKizaiQty,
    shozoku_id: 1,
    mem: d.mem,
    dsp_ord_num: d.dspOrdNum,
    indent_num: d.indentNum,
    upd_dat: new Date().toISOString(),
    upd_user: userNam,
  }));

  const updateYardData: JuchuCtnMeisai[] = juchuContainerMeisaiData.map((d) => ({
    juchu_head_id: d.juchuHeadId,
    juchu_kizai_head_id: d.juchuKizaiHeadId,
    juchu_kizai_meisai_id: d.juchuKizaiMeisaiId,
    kizai_id: d.kizaiId,
    plan_kizai_qty: d.planYardKizaiQty,
    shozoku_id: 2,
    mem: d.mem,
    dsp_ord_num: d.dspOrdNum,
    indent_num: d.indentNum,
    upd_dat: new Date().toISOString(),
    upd_user: userNam,
  }));

  const mergeData = [...updateKicsData, ...updateYardData];

  try {
    for (const data of mergeData) {
      await updateJuchuContainerMeisai(data, connection);
      console.log('juchu container meisai updated successfully:', data);
    }
    return true;
  } catch (e) {
    console.error('Exception while updating juchu container meisai:', e);
    throw e;
  }
};

/**
 * 受注コンテナ明細削除
 * @param juchuHeadId 受注ヘッダーid
 * @param juchuKizaiHeadId 受注機材ヘッダーid
 * @param kizaiId 機材id
 */
export const delJuchuContainerMeisai = async (
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
 * 入出庫伝票新規追加
 * @param juchuKizaiHeadData 受注機材ヘッダーデータ
 * @param juchuKizaiMeisaiData 受注機材明細データ
 * @param userNam ユーザー名
 * @returns
 */
export const addNyushukoDen = async (
  juchuKizaiHeadData: JuchuKizaiHeadValues,
  juchuKizaiMeisaiData: JuchuKizaiMeisaiValues[],
  userNam: string,
  connection: PoolClient
) => {
  const newShukoStandbyData: NyushukoDen[] = juchuKizaiMeisaiData.map((d) => ({
    juchu_head_id: d.juchuHeadId,
    juchu_kizai_head_id: d.juchuKizaiHeadId,
    juchu_kizai_meisai_id: d.juchuKizaiMeisaiId,
    sagyo_kbn_id: 10,
    sagyo_den_dat:
      d.shozokuId === 1
        ? juchuKizaiHeadData.kicsShukoDat!.toISOString()
        : juchuKizaiHeadData.yardShukoDat!.toISOString(),
    sagyo_id: d.shozokuId,
    kizai_id: d.kizaiId,
    plan_qty: d.planQty,
    dsp_ord_num: d.dspOrdNum,
    indent_num: d.indentNum,
    add_dat: new Date().toISOString(),
    add_user: userNam,
  }));

  const newShukoCheckData: NyushukoDen[] = juchuKizaiMeisaiData.map((d) => ({
    juchu_head_id: d.juchuHeadId,
    juchu_kizai_head_id: d.juchuKizaiHeadId,
    juchu_kizai_meisai_id: d.juchuKizaiMeisaiId,
    sagyo_kbn_id: 20,
    sagyo_den_dat:
      d.shozokuId === 1
        ? juchuKizaiHeadData.kicsShukoDat!.toISOString()
        : juchuKizaiHeadData.yardShukoDat!.toISOString(),
    sagyo_id: d.shozokuId,
    kizai_id: d.kizaiId,
    plan_qty: d.planQty,
    dsp_ord_num: d.dspOrdNum,
    indent_num: d.indentNum,
    add_dat: new Date().toISOString(),
    add_user: userNam,
  }));

  const newNyukoCheckData: NyushukoDen[] = juchuKizaiMeisaiData.map((d) => ({
    juchu_head_id: d.juchuHeadId,
    juchu_kizai_head_id: d.juchuKizaiHeadId,
    juchu_kizai_meisai_id: d.juchuKizaiMeisaiId,
    sagyo_kbn_id: 30,
    sagyo_den_dat:
      d.shozokuId === 1
        ? juchuKizaiHeadData.kicsNyukoDat!.toISOString()
        : juchuKizaiHeadData.yardNyukoDat!.toISOString(),
    sagyo_id: d.shozokuId,
    kizai_id: d.kizaiId,
    plan_qty: d.planQty,
    dsp_ord_num: d.dspOrdNum,
    indent_num: d.indentNum,
    add_dat: new Date().toISOString(),
    add_user: userNam,
  }));

  const mergeData = [...newShukoStandbyData, ...newShukoCheckData, ...newNyukoCheckData];

  try {
    await insertNyushukoDen(mergeData, connection);

    console.log('nyushuko den added successfully:', mergeData);
    return true;
  } catch (e) {
    console.error('Exception while adding nyushuko den:', e);
    throw e;
  }
};

/**
 * 入出庫伝票更新
 * @param juchuKizaiHeadData 受注機材ヘッダーデータ
 * @param juchuKizaiMeisaiData 受注機材明細データ
 * @param userNam ユーザー名
 * @returns
 */
export const updNyushukoDen = async (
  juchuKizaiHeadData: JuchuKizaiHeadValues,
  juchuKizaiMeisaiData: JuchuKizaiMeisaiValues[],
  userNam: string,
  connection: PoolClient
) => {
  const updateShukoStandbyData: NyushukoDen[] = juchuKizaiMeisaiData.map((d) => ({
    juchu_head_id: d.juchuHeadId,
    juchu_kizai_head_id: d.juchuKizaiHeadId,
    juchu_kizai_meisai_id: d.juchuKizaiMeisaiId,
    sagyo_kbn_id: 10,
    sagyo_den_dat:
      d.shozokuId === 1
        ? juchuKizaiHeadData.kicsShukoDat!.toISOString()
        : juchuKizaiHeadData.yardShukoDat!.toISOString(),
    sagyo_id: d.shozokuId,
    kizai_id: d.kizaiId,
    plan_qty: d.planQty,
    dsp_ord_num: d.dspOrdNum,
    indent_num: d.indentNum,
    upd_dat: new Date().toISOString(),
    upd_user: userNam,
  }));

  const updateShukoCheckData: NyushukoDen[] = juchuKizaiMeisaiData.map((d) => ({
    juchu_head_id: d.juchuHeadId,
    juchu_kizai_head_id: d.juchuKizaiHeadId,
    juchu_kizai_meisai_id: d.juchuKizaiMeisaiId,
    sagyo_kbn_id: 20,
    sagyo_den_dat:
      d.shozokuId === 1
        ? juchuKizaiHeadData.kicsShukoDat!.toISOString()
        : juchuKizaiHeadData.yardShukoDat!.toISOString(),
    sagyo_id: d.shozokuId,
    kizai_id: d.kizaiId,
    plan_qty: d.planQty,
    dsp_ord_num: d.dspOrdNum,
    indent_num: d.indentNum,
    upd_dat: new Date().toISOString(),
    upd_user: userNam,
  }));

  const updateNyukoCheckData: NyushukoDen[] = juchuKizaiMeisaiData.map((d) => ({
    juchu_head_id: d.juchuHeadId,
    juchu_kizai_head_id: d.juchuKizaiHeadId,
    juchu_kizai_meisai_id: d.juchuKizaiMeisaiId,
    sagyo_kbn_id: 30,
    sagyo_den_dat:
      d.shozokuId === 1
        ? juchuKizaiHeadData.kicsNyukoDat!.toISOString()
        : juchuKizaiHeadData.yardNyukoDat!.toISOString(),
    sagyo_id: d.shozokuId,
    kizai_id: d.kizaiId,
    plan_qty: d.planQty,
    dsp_ord_num: d.dspOrdNum,
    indent_num: d.indentNum,
    upd_dat: new Date().toISOString(),
    upd_user: userNam,
  }));

  const mergeData = [...updateShukoStandbyData, ...updateShukoCheckData, ...updateNyukoCheckData];

  try {
    for (const data of mergeData) {
      await updateNyushukoDenFromKizaiMeisai(data, connection);
    }
    console.log('nyushuko den updated successfully:', mergeData);
    return true;
  } catch (e) {
    console.error('Exception while updating nyushuko den:', e);
    throw e;
  }
};

/**
 * 入出庫伝票削除
 * @param juchuHeadId 受注ヘッダーid
 * @param juchuKizaiHeadId 受注機材ヘッダーid
 * @param kizaiId 機材id
 */
export const delNyushukoDen = async (juchuKizaiMeisaiData: JuchuKizaiMeisaiValues[], connection: PoolClient) => {
  const deleteData = juchuKizaiMeisaiData.map((d) => ({
    juchu_head_id: d.juchuHeadId,
    juchu_kizai_head_id: d.juchuKizaiHeadId,
    juchu_kizai_meisai_id: d.juchuKizaiMeisaiId,
    kizai_id: d.kizaiId,
  }));

  try {
    for (const data of deleteData) {
      await deleteNyushukoDen(data, connection);
    }
    console.log('nyushuko den delete successfully:', deleteData);
    return true;
  } catch (e) {
    throw e;
  }
};

/**
 * コンテナ入出庫伝票新規追加
 * @param juchuCtnMeisaiData 受注コンテナ明細データ
 * @param shukoDat 出庫日
 * @param nyukoDat 入庫日
 * @param sagyoId 作業id
 * @param userNam ユーザー名
 * @param connection
 * @returns
 */
export const addCtnNyushukoDen = async (
  juchuCtnMeisaiData: JuchuContainerMeisaiValues[],
  shukoDat: Date,
  nyukoDat: Date,
  sagyoId: number,
  userNam: string,
  connection: PoolClient
) => {
  const newCtnShukoStandbyData: NyushukoDen[] = juchuCtnMeisaiData.map((d) => ({
    juchu_head_id: d.juchuHeadId,
    juchu_kizai_head_id: d.juchuKizaiHeadId,
    juchu_kizai_meisai_id: d.juchuKizaiMeisaiId,
    sagyo_kbn_id: 10,
    sagyo_den_dat: shukoDat.toISOString(),
    sagyo_id: sagyoId,
    kizai_id: d.kizaiId,
    plan_qty: sagyoId === 1 ? d.planKicsKizaiQty : d.planYardKizaiQty,
    dsp_ord_num: d.dspOrdNum,
    indent_num: d.indentNum,
    add_dat: new Date().toISOString(),
    add_user: userNam,
  }));

  const newCtnShukoCheckData: NyushukoDen[] = juchuCtnMeisaiData.map((d) => ({
    juchu_head_id: d.juchuHeadId,
    juchu_kizai_head_id: d.juchuKizaiHeadId,
    juchu_kizai_meisai_id: d.juchuKizaiMeisaiId,
    sagyo_kbn_id: 20,
    sagyo_den_dat: shukoDat.toISOString(),
    sagyo_id: sagyoId,
    kizai_id: d.kizaiId,
    plan_qty: sagyoId === 1 ? d.planKicsKizaiQty : d.planYardKizaiQty,
    dsp_ord_num: d.dspOrdNum,
    indent_num: d.indentNum,
    add_dat: new Date().toISOString(),
    add_user: userNam,
  }));

  const newCtnNyukoCheckData: NyushukoDen[] = juchuCtnMeisaiData.map((d) => ({
    juchu_head_id: d.juchuHeadId,
    juchu_kizai_head_id: d.juchuKizaiHeadId,
    juchu_kizai_meisai_id: d.juchuKizaiMeisaiId,
    sagyo_kbn_id: 30,
    sagyo_den_dat: nyukoDat.toISOString(),
    sagyo_id: sagyoId,
    kizai_id: d.kizaiId,
    plan_qty: sagyoId === 1 ? d.planKicsKizaiQty : d.planYardKizaiQty,
    dsp_ord_num: d.dspOrdNum,
    indent_num: d.indentNum,
    add_dat: new Date().toISOString(),
    add_user: userNam,
  }));

  const mergeData = [...newCtnShukoStandbyData, ...newCtnShukoCheckData, ...newCtnNyukoCheckData];

  try {
    await insertNyushukoDen(mergeData, connection);

    console.log('ctn nyushuko den added successfully:', mergeData);
    return true;
  } catch (e) {
    console.error('Exception while adding ctn nyushuko den:', e);
    throw e;
  }
};

/**
 * コンテナ入出庫伝票更新
 * @param juchuCtnMeisaiData 受注コンテナ明細データ
 * @param shukoDat 出庫日
 * @param nyukoDat 入庫日
 * @param sagyoId 作業id
 * @param userNam ユーザー名
 * @param connection
 */
export const updCtnNyushukoDen = async (
  juchuCtnMeisaiData: JuchuContainerMeisaiValues[],
  shukoDat: Date,
  nyukoDat: Date,
  sagyoId: number,
  userNam: string,
  connection: PoolClient
) => {
  const updCtnShukoStandbyData: NyushukoDen[] = juchuCtnMeisaiData.map((d) => ({
    juchu_head_id: d.juchuHeadId,
    juchu_kizai_head_id: d.juchuKizaiHeadId,
    juchu_kizai_meisai_id: d.juchuKizaiMeisaiId,
    sagyo_kbn_id: 10,
    sagyo_den_dat: shukoDat.toISOString(),
    sagyo_id: sagyoId,
    kizai_id: d.kizaiId,
    plan_qty: sagyoId === 1 ? d.planKicsKizaiQty : d.planYardKizaiQty,
    dsp_ord_num: d.dspOrdNum,
    indent_num: d.indentNum,
    add_dat: new Date().toISOString(),
    add_user: userNam,
  }));

  const updCtnShukoCheckData: NyushukoDen[] = juchuCtnMeisaiData.map((d) => ({
    juchu_head_id: d.juchuHeadId,
    juchu_kizai_head_id: d.juchuKizaiHeadId,
    juchu_kizai_meisai_id: d.juchuKizaiMeisaiId,
    sagyo_kbn_id: 20,
    sagyo_den_dat: shukoDat.toISOString(),
    sagyo_id: sagyoId,
    kizai_id: d.kizaiId,
    plan_qty: sagyoId === 1 ? d.planKicsKizaiQty : d.planYardKizaiQty,
    dsp_ord_num: d.dspOrdNum,
    indent_num: d.indentNum,
    add_dat: new Date().toISOString(),
    add_user: userNam,
  }));

  const updCtnNyukoCheckData: NyushukoDen[] = juchuCtnMeisaiData.map((d) => ({
    juchu_head_id: d.juchuHeadId,
    juchu_kizai_head_id: d.juchuKizaiHeadId,
    juchu_kizai_meisai_id: d.juchuKizaiMeisaiId,
    sagyo_kbn_id: 30,
    sagyo_den_dat: nyukoDat.toISOString(),
    sagyo_id: sagyoId,
    kizai_id: d.kizaiId,
    plan_qty: sagyoId === 1 ? d.planKicsKizaiQty : d.planYardKizaiQty,
    dsp_ord_num: d.dspOrdNum,
    indent_num: d.indentNum,
    add_dat: new Date().toISOString(),
    add_user: userNam,
  }));

  const mergeData = [...updCtnShukoStandbyData, ...updCtnShukoCheckData, ...updCtnNyukoCheckData];

  try {
    for (const data of mergeData) {
      await updateNyushukoDen(data, connection);
    }
    console.log('ctn nyushuko den updated successfully:', mergeData);
    return true;
  } catch (e) {
    console.error('Exception while updating ctn nyushuko den:', e);
    throw e;
  }
};

/**
 * コンテナ入出庫伝票削除
 * @param juchuContainerMeisaiData 受注コンテナ明細データ
 * @param connection
 * @returns
 */
export const delCtnNyushukoDen = async (
  juchuContainerMeisaiData: JuchuContainerMeisaiValues[],
  connection: PoolClient
) => {
  const deleteData = juchuContainerMeisaiData.map((d) => ({
    juchu_head_id: d.juchuHeadId,
    juchu_kizai_head_id: d.juchuKizaiHeadId,
    juchu_kizai_meisai_id: d.juchuKizaiMeisaiId,
    kizai_id: d.kizaiId,
  }));

  try {
    for (const data of deleteData) {
      await deleteNyushukoDen(data, connection);
    }
    console.log('ctn nyushuko den delete successfully:', deleteData);
    return true;
  } catch (e) {
    throw e;
  }
};

/**
 * 入出庫実績削除
 * @param juchuKizaiMeisaiData 受注機材明細データ
 * @param connection
 * @returns
 */
export const delNyushukoResult = async (juchuKizaiMeisaiData: JuchuKizaiMeisaiValues[], connection: PoolClient) => {
  const deleteData = juchuKizaiMeisaiData.map((d) => ({
    juchuHeadId: d.juchuHeadId,
    juchuKizaiHeadId: d.juchuKizaiHeadId,
    juchuKizaiMeisaiId: d.juchuKizaiMeisaiId,
    kizaiId: d.kizaiId,
  }));
  try {
    for (const data of deleteData) {
      await deleteKizaiIdNyushukoResult(
        data.juchuHeadId,
        data.juchuKizaiHeadId,
        data.juchuKizaiMeisaiId,
        data.kizaiId,
        connection
      );
    }
    return true;
  } catch (e) {
    throw e;
  }
};

/**
 * 移動伝票受注id最大値取得
 * @returns 移動伝票受注id最大値
 */
export const getIdoDenJuchuMaxId = async () => {
  try {
    const { data, error } = await selectIdoDenJuchuMaxId();
    if (error) {
      if (error.code === 'PGRST116') {
        return null;
      }
      throw error;
    }
    console.log('getIdoDenJuchuMaxId: ', data);
    return data.ido_den_id;
  } catch (e) {
    console.error(e);
    throw e;
  }
};

/**
 * 移動伝票受注新規追加
 * @param newIdoDenId 新規移動伝票受注id
 * @param idoKizaiData 移動伝票受注データ
 * @param userNam ユーザー名
 * @returns
 */
export const addIdoDenJuchu = async (
  newIdoDenId: number,
  idoKizaiData: IdoJuchuKizaiMeisaiValues[],
  userNam: string,
  connection: PoolClient
) => {
  const newLoadData: IdoDenJuchu[] = idoKizaiData.map((d, index) => ({
    ido_den_id: newIdoDenId + index,
    sagyo_den_dat: toJapanYMDString(d.sagyoDenDat as Date, '-'),
    sagyo_siji_id: d.mShozokuId,
    sagyo_id: d.mShozokuId,
    sagyo_kbn_id: 40,
    kizai_id: d.kizaiId,
    plan_qty: d.planQty,
    juchu_head_id: d.juchuHeadId,
    juchu_kizai_head_id: d.juchuKizaiHeadId,
    add_dat: new Date().toISOString(),
    add_user: userNam,
  }));

  const newUnloadData: IdoDenJuchu[] = idoKizaiData.map((d, index) => ({
    ido_den_id: newIdoDenId + index,
    sagyo_den_dat: toJapanYMDString(d.sagyoDenDat as Date, '-'),
    sagyo_siji_id: d.mShozokuId,
    sagyo_id: d.mShozokuId === 1 ? 2 : 1,
    sagyo_kbn_id: 50,
    kizai_id: d.kizaiId,
    plan_qty: d.planQty,
    juchu_head_id: d.juchuHeadId,
    juchu_kizai_head_id: d.juchuKizaiHeadId,
    add_dat: new Date().toISOString(),
    add_user: userNam,
  }));

  const mergeData = [...newLoadData, ...newUnloadData];

  try {
    await insertIdoDenJuchu(mergeData, connection);
    console.log('ido den added successfully:', mergeData);
    return true;
  } catch (e) {
    console.error('Exception while adding ido den:', e);
    throw e;
  }
};

/**
 * 移動伝票受注更新
 * @param idoKizaiData 移動伝票受注データ
 * @param userNam ユーザー名
 * @returns
 */
export const updIdoDenJuchu = async (
  idoKizaiData: IdoJuchuKizaiMeisaiValues[],
  userNam: string,
  connection: PoolClient
) => {
  const updateLoadData: IdoDenJuchu[] = idoKizaiData.map((d) => {
    if (!d.idoDenId) {
      throw new Error();
    }
    return {
      ido_den_id: d.idoDenId,
      sagyo_den_dat: toJapanYMDString(d.sagyoDenDat as Date, '-'),
      sagyo_siji_id: d.mShozokuId,
      sagyo_id: d.mShozokuId,
      sagyo_kbn_id: 40,
      kizai_id: d.kizaiId,
      plan_qty: d.planQty,
      juchu_head_id: d.juchuHeadId,
      juchu_kizai_head_id: d.juchuKizaiHeadId,
      upd_dat: new Date().toISOString(),
      upd_user: userNam,
    };
  });

  const updateUnloadData: IdoDenJuchu[] = idoKizaiData.map((d) => {
    if (!d.idoDenId) {
      throw new Error();
    }
    return {
      ido_den_id: d.idoDenId,
      sagyo_den_dat: toJapanYMDString(d.sagyoDenDat as Date, '-'),
      sagyo_siji_id: d.mShozokuId,
      sagyo_id: d.mShozokuId === 1 ? 2 : 1,
      sagyo_kbn_id: 50,
      kizai_id: d.kizaiId,
      plan_qty: d.planQty,
      juchu_head_id: d.juchuHeadId,
      juchu_kizai_head_id: d.juchuKizaiHeadId,
      upd_dat: new Date().toISOString(),
      upd_user: userNam,
    };
  });

  const updateData = [...updateLoadData, ...updateUnloadData];
  try {
    for (const data of updateData) {
      await updateIdoDenJuchu(data, connection);
    }
    console.log('ido den updated successfully:', updateData);
    return true;
  } catch (e) {
    console.error('Exception while updating ido den:', e);
    throw e;
  }
};

/**
 * 移動伝票受注削除
 * @param idoDenIds 移動伝票受注id
 */
export const delIdoDenJuchu = async (idoDenIds: number[], connection: PoolClient) => {
  try {
    await deleteIdoDenJuchu(idoDenIds, connection);
  } catch (e) {
    throw e;
  }
};

/**
 * 受注機材本番日取得
 * @param juchuHeadId 受注ヘッダーid
 * @param juchuKizaiHeadId 受注機材ヘッダーid
 * @returns 受注機材本番日
 */
export const getHonbanbi = async (juchuHeadId: number, juchuKizaiHeadId: number) => {
  try {
    const { data, error } = await selectHonbanbi(juchuHeadId, juchuKizaiHeadId);
    if (error) {
      console.error('GetHonbanbi honbanbi error : ', error);
      throw error;
    }

    const juchuKizaiHonbanbiData: JuchuKizaiHonbanbiValues[] = data.map((d) => ({
      juchuHeadId: d.juchu_head_id,
      juchuKizaiHeadId: d.juchu_kizai_head_id,
      juchuHonbanbiShubetuId: d.juchu_honbanbi_shubetu_id,
      juchuHonbanbiDat: new Date(d.juchu_honbanbi_dat),
      mem: d.mem,
      juchuHonbanbiAddQty: d.juchu_honbanbi_add_qty,
    }));

    return juchuKizaiHonbanbiData;
  } catch (e) {
    console.error(e);
    throw e;
  }
};

/**
 * 受注機材本番日データの存在確認
 * @param juchuHeadId 受注ヘッダーid
 * @param juchuKizaiHeadId 受注機材ヘッダーid
 * @param juchuHonbanbiData 受注機材本番日データ
 * @returns あり：true　なし：false
 */
export const confirmHonbanbi = async (
  juchuHeadId: number,
  juchuKizaiHeadId: number,
  juchuHonbanbiShubetuId: number,
  juchuHonbanbiDat: Date
) => {
  try {
    const { error } = await selectHonbanbiConfirm(
      juchuHeadId,
      juchuKizaiHeadId,
      juchuHonbanbiShubetuId,
      toJapanYMDString(juchuHonbanbiDat, '-')
    );
    if (error) {
      if (error.code === 'PGRST116') {
        return false;
      }
      throw error;
    }
    return true;
  } catch (e) {
    throw e;
  }
};

/**
 * 受注機材本番日新規追加(1件)
 * @param juchuHeadId 受注ヘッダーid
 * @param juchuKizaiHeadId 受注機材ヘッダーid
 * @param juchuHonbanbiData 受注機材本番日データ
 * @param userNam ユーザー名
 * @returns
 */
export const addHonbanbi = async (
  juchuHeadId: number,
  juchuKizaiHeadId: number,
  juchuHonbanbiData: JuchuKizaiHonbanbiValues,
  userNam: string,
  connection: PoolClient
) => {
  const newData: JuchuKizaiHonbanbi = {
    juchu_head_id: juchuHeadId,
    juchu_kizai_head_id: juchuKizaiHeadId,
    juchu_honbanbi_shubetu_id: juchuHonbanbiData.juchuHonbanbiShubetuId,
    juchu_honbanbi_dat: toJapanYMDString(juchuHonbanbiData.juchuHonbanbiDat, '-'),
    mem: juchuHonbanbiData.mem ? juchuHonbanbiData.mem : null,
    juchu_honbanbi_add_qty: juchuHonbanbiData.juchuHonbanbiAddQty,
    add_dat: new Date().toISOString(),
    add_user: userNam,
  };
  try {
    await insertHonbanbi(newData, connection);
    console.log('honbanbi add successfully:', newData);
    return true;
  } catch (e) {
    throw e;
  }
};

/**
 * 受注機材入出庫本番日更新
 * @param juchuHeadId 受注ヘッダーid
 * @param juchuKizaiHeadId 受注機材ヘッダーid
 * @param juchuHonbanbiData 受注機材本番日データ
 * @param userNam ユーザー名
 * @returns
 */
export const updNyushukoHonbanbi = async (
  juchuHeadId: number,
  juchuKizaiHeadId: number,
  juchuHonbanbiData: JuchuKizaiHonbanbiValues,
  userNam: string,
  connection: PoolClient
) => {
  const updateData: JuchuKizaiHonbanbi = {
    juchu_head_id: juchuHeadId,
    juchu_kizai_head_id: juchuKizaiHeadId,
    juchu_honbanbi_shubetu_id: juchuHonbanbiData.juchuHonbanbiShubetuId,
    juchu_honbanbi_dat: toJapanYMDString(juchuHonbanbiData.juchuHonbanbiDat, '-'),
    mem: juchuHonbanbiData.mem ? juchuHonbanbiData.mem : null,
    juchu_honbanbi_add_qty: juchuHonbanbiData.juchuHonbanbiAddQty,
    upd_dat: new Date().toISOString(),
    upd_user: userNam,
  };

  try {
    await updateNyushukoHonbanbi(updateData, connection);
    console.log('honbanbi updated successfully:', updateData);
    return true;
  } catch (e) {
    throw e;
  }
};

/**
 * 受注機材本番日更新
 * @param juchuHeadId 受注ヘッダーid
 * @param juchuKizaiHeadId 受注機材ヘッダーid
 * @param juchuHonbanbiData 受注機材本番日データ
 * @param userNam ユーザー名
 * @returns
 */
export const updHonbanbi = async (
  juchuHeadId: number,
  juchuKizaiHeadId: number,
  juchuHonbanbiData: JuchuKizaiHonbanbiValues,
  userNam: string,
  connection: PoolClient
) => {
  const updateData: JuchuKizaiHonbanbi = {
    juchu_head_id: juchuHeadId,
    juchu_kizai_head_id: juchuKizaiHeadId,
    juchu_honbanbi_shubetu_id: juchuHonbanbiData.juchuHonbanbiShubetuId,
    juchu_honbanbi_dat: toJapanYMDString(juchuHonbanbiData.juchuHonbanbiDat, '-'),
    mem: juchuHonbanbiData.mem ? juchuHonbanbiData.mem : null,
    juchu_honbanbi_add_qty: juchuHonbanbiData.juchuHonbanbiAddQty,
    upd_dat: new Date().toISOString(),
    upd_user: userNam,
  };

  try {
    await updateHonbanbi(updateData, connection);
    console.log('honbanbi updated successfully:', updateData);
    return true;
  } catch (e) {
    throw e;
  }
};

/**
 * 受注機材本番日削除
 * @param juchuHeadId 受注ヘッダーid
 * @param juchuKizaiHeadId 受注機材ヘッダーid
 * @param juchuHonbanbiData 受注機材本番日データ
 */
export const delHonbanbi = async (
  juchuHeadId: number,
  juchuKizaiHeadId: number,
  juchuHonbanbiShubetuId: number,
  juchuHonbanbiDat: Date,
  connection: PoolClient
) => {
  try {
    await deleteHonbanbi(
      juchuHeadId,
      juchuKizaiHeadId,
      juchuHonbanbiShubetuId,
      toJapanYMDString(juchuHonbanbiDat, '-'),
      connection
    );
  } catch (e) {
    throw e;
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
      id: d.bumon_id!,
      label: d.bumon_nam ?? '',
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
 * セットオプションを持つ機材のIDの配列を取得する関数
 * @param idList 選ばれた機材たちの機材IDリスト
 * @returns セットオプション付きの機材の配列、なかった場合は空配列を返す
 */
export const checkSetoptions = async (idList: number[]): Promise<number[]> => {
  try {
    // const { data: setIdList, error: setIdListError } = await selectBundledEqptIds(idList);
    const { rows: setIdList } = await selectBundledEqptIds(idList);
    // if (setIdError) {
    //   console.error('例外発生', setIdError);
    //   throw setIdError;
    // }
    console.log(setIdList);
    if (!setIdList || setIdList.length === 0) return [];
    // return setIdList.map((d) => d.kizai_id);
    return Array.from(new Set(setIdList.map((d) => d.kizai_id)));
  } catch (e) {
    console.error('例外が発生しました:', e);
    throw e;
  }
};

/**
 * 機材選択に表示するための機材リスト
 * @param query 検索キーワード
 * @returns
 */
export const getEqptsForEqptSelection = async (query: string = ''): Promise<EqptSelection[] | undefined> => {
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
 * @param rank 顧客ランク
 * @returns {SelectedEqptsValues[]} 表に渡す機材の配列
 */
export const getSelectedEqpts = async (idList: number[] /* rank: number*/) => {
  // const rankParse = (rank: number) => {};
  try {
    const { data, error } = await selectChosenEqptsDetails(idList);
    if (error) {
      console.error('DB情報取得エラー', error.message, error.cause, error.hint);
      throw error;
    }
    if (!data) return [];
    const selectedEqpts: SelectedEqptsValues[] = data.map((d) => ({
      kizaiId: d.kizai_id ?? 0,
      kizaiNam: d.kizai_nam ?? '',
      shozokuId: d.shozoku_id ?? 0,
      shozokuNam: d.shozoku_nam ?? '',
      kizaiGrpCod: d.kizai_grp_cod ?? '',
      dspOrdNum: d.dsp_ord_num ?? 0,
      regAmt: d.reg_amt ?? 0,
      // rankAmt:
      //   rank === 1
      //     ? (d.rank_amt_1 ?? 0)
      //     : rank === 2
      //       ? (d.rank_amt_2 ?? 0)
      //       : rank === 3
      //         ? (d.rank_amt_3 ?? 0)
      //         : rank === 4
      //           ? (d.rank_amt_4 ?? 0)
      //           : rank === 5
      //             ? (d.rank_amt_5 ?? 0)
      //             : 0,
      kizaiQty: d.kizai_qty ?? 0,
      ctnFlg: d.ctn_flg === 1 ? true : false,
      indentNum: 0,
    }));
    return selectedEqpts;
  } catch (e) {
    console.error('例外が発生しました:', e);
    throw e;
  }
};

/**
 * セットオプション選択画面に表示する配列
 * @param {number} kizaiId 親機材のID
 * @returns {EqptSelection[]} セットオプションの配列
 */
export const getSetOptions = async (kizaiId: number) => {
  try {
    let setList: EqptSelection[];

    const [setOptions, eqptNam] = await Promise.all([selectSetOptions(kizaiId), selectOneEqpt(kizaiId)]);
    if (!setOptions || eqptNam.error) {
      throw new Error('セットオプション取得時エラー');
    }
    if (!setOptions.rows || setOptions.rowCount === 0) {
      setList = [];
    }
    setList = setOptions.rows.map((d) => ({
      kizaiId: d.set_kizai_id,
      kizaiNam: d.kizai_nam,
      shozokuNam: d.shozoku_nam,
      bumonId: d.bumon_id,
      kizaiGrpCod: d.kizai_grp_cod,
      ctnFlg: d.ctn_flg,
    }));

    return { setList: setList, eqptNam: eqptNam.data.kizai_nam ?? '' };
  } catch (e) {
    console.error(e);
    throw e;
  }
};

/**
 * コピー
 * @param juchuKizaiHeadData 受注機材ヘッダーデータ
 * @param shukoDate 出庫日
 * @param nyukoDate 入庫日
 * @param dateRange 出庫日から入庫日
 * @param selectEq 選択機材
 * @param selectCtn 選択コンテナ
 * @param idoList 移動データ
 * @param juchuHonbanbiList 受注本番日データ
 * @param userNam ユーザー名
 * @returns
 */
export const juchuMeisaiCopy = async (
  juchuKizaiHeadData: JuchuKizaiHeadValues,
  shukoDate: Date,
  nyukoDate: Date,
  dateRange: string[],
  selectEq: JuchuKizaiMeisaiValues[],
  selectCtn: JuchuContainerMeisaiValues[],
  idoList: IdoJuchuKizaiMeisaiValues[],
  juchuHonbanbiList: JuchuKizaiHonbanbiValues[],
  userNam: string
) => {
  const connection = await pool.connect();

  try {
    await connection.query('BEGIN');

    // 受注機材ヘッダーid最大値
    const JuchuKizaiHeadMaxId = await getJuchuKizaiHeadMaxId(juchuKizaiHeadData.juchuHeadId);
    // 受注機材ヘッダーid
    const newJuchuKizaiHeadId = JuchuKizaiHeadMaxId ? JuchuKizaiHeadMaxId.juchu_kizai_head_id + 1 : 1;

    // 受注機材ヘッダー追加
    const headResult = await addJuchuKizaiHead(newJuchuKizaiHeadId, juchuKizaiHeadData, 1, userNam, connection);
    console.log('受注機材ヘッダー追加', headResult);

    // 受注機材入出庫追加
    const nyushukoResult = await addJuchuKizaiNyushuko(
      juchuKizaiHeadData.juchuHeadId,
      newJuchuKizaiHeadId,
      juchuKizaiHeadData.kicsShukoDat,
      juchuKizaiHeadData.yardShukoDat,
      juchuKizaiHeadData.kicsNyukoDat,
      juchuKizaiHeadData.yardNyukoDat,
      userNam,
      connection
    );
    console.log('受注機材入出庫追加', nyushukoResult);

    // 受注機材本番日(入出庫、使用中)追加
    const addJuchuSiyouHonbanbiData: JuchuKizaiHonbanbiValues[] = dateRange.map((d) => ({
      juchuHeadId: juchuKizaiHeadData.juchuHeadId,
      juchuKizaiHeadId: newJuchuKizaiHeadId,
      juchuHonbanbiShubetuId: 1,
      juchuHonbanbiDat: new Date(d),
      mem: '',
      juchuHonbanbiAddQty: 0,
    }));
    const addJuchuHonbanbiData: JuchuKizaiHonbanbiValues[] = [
      {
        juchuHeadId: juchuKizaiHeadData.juchuHeadId,
        juchuKizaiHeadId: newJuchuKizaiHeadId,
        juchuHonbanbiShubetuId: 2,
        juchuHonbanbiDat: shukoDate,
        mem: '',
        juchuHonbanbiAddQty: 0,
      },
      {
        juchuHeadId: juchuKizaiHeadData.juchuHeadId,
        juchuKizaiHeadId: newJuchuKizaiHeadId,
        juchuHonbanbiShubetuId: 3,
        juchuHonbanbiDat: nyukoDate,
        mem: '',
        juchuHonbanbiAddQty: 0,
      },
    ];
    const mergeHonbanbiData: JuchuKizaiHonbanbiValues[] = [...addJuchuSiyouHonbanbiData, ...addJuchuHonbanbiData];
    const addHonbanbiResult = await addAllHonbanbi(
      juchuKizaiHeadData.juchuHeadId,
      newJuchuKizaiHeadId,
      mergeHonbanbiData,
      userNam,
      connection
    );
    console.log('入出庫、使用本番日追加', addHonbanbiResult);

    // 並び順
    let dspOrdNum = 1;

    // 受注機材明細
    if (selectEq.length > 0) {
      // 受注機材明細id
      let newJuchuKizaiMeisaiId = 1;

      const newJuchuKizaiMeisai = selectEq.map((d) => ({
        ...d,
        juchuKizaiHeadId: newJuchuKizaiHeadId,
        juchuKizaiMeisaiId: newJuchuKizaiMeisaiId++,
        dspOrdNum: dspOrdNum++,
      }));

      // 受注機材明細追加
      const addMeisaiResult = await addJuchuKizaiMeisai(newJuchuKizaiMeisai, userNam, connection);
      console.log('受注機材明細追加', addMeisaiResult);

      // 機材入出庫伝票追加
      const addNyushukoDenResult = await addNyushukoDen(juchuKizaiHeadData, newJuchuKizaiMeisai, userNam, connection);
      console.log('入出庫伝票追加', addNyushukoDenResult);
    }

    // 受注コンテナ明細
    if (selectCtn.length > 0) {
      // 受注コンテナ明細id
      let newJuchuContainerMeisaiId = 1;

      const newJuchuCtnMeisai = selectCtn.map((d) => ({
        ...d,
        juchuKizaiHeadId: newJuchuKizaiHeadId,
        juchuKizaiMeisaiId: newJuchuContainerMeisaiId++,
        dspOrdNum: dspOrdNum++,
      }));

      // 受注コンテナ明細追加
      const addCtnMeisaiResult = await addJuchuContainerMeisai(newJuchuCtnMeisai, userNam, connection);
      console.log('受注コンテナ明細追加', addCtnMeisaiResult);

      // コンテナ入出庫伝票追加
      if (juchuKizaiHeadData.kicsShukoDat && juchuKizaiHeadData.kicsNyukoDat) {
        const addCtnNyushukoDenResult = await addCtnNyushukoDen(
          newJuchuCtnMeisai,
          juchuKizaiHeadData.kicsShukoDat,
          juchuKizaiHeadData.kicsNyukoDat,
          1,
          userNam,
          connection
        );
        console.log('KICSコンテナ入出庫伝票追加', addCtnNyushukoDenResult);
      }
      if (juchuKizaiHeadData.yardShukoDat && juchuKizaiHeadData.yardNyukoDat) {
        const addCtnNyushukoDenResult = await addCtnNyushukoDen(
          newJuchuCtnMeisai,
          juchuKizaiHeadData.yardShukoDat,
          juchuKizaiHeadData.yardNyukoDat,
          2,
          userNam,
          connection
        );
        console.log('YARDコンテナ入出庫伝票追加', addCtnNyushukoDenResult);
      }
    }

    // 移動受注機材明細
    if (idoList.length > 0) {
      const idoDenMaxId = await getIdoDenJuchuMaxId();
      const newIdoDenId = idoDenMaxId ? idoDenMaxId + 1 : 1;

      const newIdoList = idoList.map((d) => ({ ...d, juchuKizaiHeadId: newJuchuKizaiHeadId }));

      // 移動受注機材明細追加
      const addIdoDenResult = await addIdoDenJuchu(newIdoDenId, newIdoList, userNam, connection);
      console.log('移動伝票受注追加', addIdoDenResult);
    }

    // 受注本番日追加
    if (juchuHonbanbiList.length > 0) {
      for (const data of juchuHonbanbiList) {
        const addHonbanbiResult = await addHonbanbi(
          juchuKizaiHeadData.juchuHeadId,
          newJuchuKizaiHeadId,
          data,
          userNam,
          connection
        );
        console.log('受注機材本番日追加', addHonbanbiResult);
      }
    }

    await connection.query('COMMIT');

    await revalidatePath('/eqpt-order-list');
    await revalidatePath('/ido-list');
    await revalidatePath('/shuko-list');
    await revalidatePath('/nyuko-list');

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
 * 分離
 * @param juchuKizaiHeadData
 * @param shukoDate
 * @param nyukoDate
 * @param dateRange
 * @param selectEq
 * @param selectCtn
 * @param idoList
 * @param updateEq
 * @param updateCtn
 * @param updateIdoList
 * @param juchuHonbanbiList
 * @param userNam
 * @returns
 */
export const juchuMeisaiseparation = async (
  juchuKizaiHeadData: JuchuKizaiHeadValues,
  shukoDate: Date,
  nyukoDate: Date,
  dateRange: string[],
  selectEq: JuchuKizaiMeisaiValues[],
  selectCtn: JuchuContainerMeisaiValues[],
  idoList: IdoJuchuKizaiMeisaiValues[],
  updateEq: JuchuKizaiMeisaiValues[],
  updateCtn: JuchuContainerMeisaiValues[],
  updateIdoList: IdoJuchuKizaiMeisaiValues[],
  juchuHonbanbiList: JuchuKizaiHonbanbiValues[],
  userNam: string
) => {
  const connection = await pool.connect();

  try {
    await connection.query('BEGIN');

    // 受注機材ヘッダーid最大値
    const JuchuKizaiHeadMaxId = await getJuchuKizaiHeadMaxId(juchuKizaiHeadData.juchuHeadId);
    // 受注機材ヘッダーid
    const newJuchuKizaiHeadId = JuchuKizaiHeadMaxId ? JuchuKizaiHeadMaxId.juchu_kizai_head_id + 1 : 1;

    // 受注機材ヘッダー追加
    const headResult = await addJuchuKizaiHead(newJuchuKizaiHeadId, juchuKizaiHeadData, 1, userNam, connection);
    console.log('受注機材ヘッダー追加', headResult);

    // 受注機材入出庫追加
    const nyushukoResult = await addJuchuKizaiNyushuko(
      juchuKizaiHeadData.juchuHeadId,
      newJuchuKizaiHeadId,
      juchuKizaiHeadData.kicsShukoDat,
      juchuKizaiHeadData.yardShukoDat,
      juchuKizaiHeadData.kicsNyukoDat,
      juchuKizaiHeadData.yardNyukoDat,
      userNam,
      connection
    );
    console.log('受注機材入出庫追加', nyushukoResult);

    // 受注機材本番日(入出庫、使用中)追加
    const addJuchuSiyouHonbanbiData: JuchuKizaiHonbanbiValues[] = dateRange.map((d) => ({
      juchuHeadId: juchuKizaiHeadData.juchuHeadId,
      juchuKizaiHeadId: newJuchuKizaiHeadId,
      juchuHonbanbiShubetuId: 1,
      juchuHonbanbiDat: new Date(d),
      mem: '',
      juchuHonbanbiAddQty: 0,
    }));
    const addJuchuHonbanbiData: JuchuKizaiHonbanbiValues[] = [
      {
        juchuHeadId: juchuKizaiHeadData.juchuHeadId,
        juchuKizaiHeadId: newJuchuKizaiHeadId,
        juchuHonbanbiShubetuId: 2,
        juchuHonbanbiDat: shukoDate,
        mem: '',
        juchuHonbanbiAddQty: 0,
      },
      {
        juchuHeadId: juchuKizaiHeadData.juchuHeadId,
        juchuKizaiHeadId: newJuchuKizaiHeadId,
        juchuHonbanbiShubetuId: 3,
        juchuHonbanbiDat: nyukoDate,
        mem: '',
        juchuHonbanbiAddQty: 0,
      },
    ];
    const mergeHonbanbiData: JuchuKizaiHonbanbiValues[] = [...addJuchuSiyouHonbanbiData, ...addJuchuHonbanbiData];
    const addHonbanbiResult = await addAllHonbanbi(
      juchuKizaiHeadData.juchuHeadId,
      newJuchuKizaiHeadId,
      mergeHonbanbiData,
      userNam,
      connection
    );
    console.log('入出庫、使用本番日追加', addHonbanbiResult);

    // 並び順
    let dspOrdNum = 1;

    // 受注機材明細
    if (selectEq.length > 0) {
      // 受注機材明細id
      let newJuchuKizaiMeisaiId = 1;

      const newJuchuKizaiMeisai = selectEq.map((d) => ({
        ...d,
        juchuKizaiHeadId: newJuchuKizaiHeadId,
        juchuKizaiMeisaiId: newJuchuKizaiMeisaiId++,
        dspOrdNum: dspOrdNum++,
      }));

      // 受注機材明細追加
      const addMeisaiResult = await addJuchuKizaiMeisai(newJuchuKizaiMeisai, userNam, connection);
      console.log('受注機材明細追加', addMeisaiResult);

      // 機材入出庫伝票追加
      const addNyushukoDenResult = await addNyushukoDen(juchuKizaiHeadData, newJuchuKizaiMeisai, userNam, connection);
      console.log('入出庫伝票追加', addNyushukoDenResult);

      // 元受注機材明細更新
      await updJuchuKizaiMeisai(updateEq, userNam, connection);

      // 元機材入出庫伝票更新
      await updNyushukoDen(juchuKizaiHeadData, updateEq, userNam, connection);
    }

    // 受注コンテナ明細
    if (selectCtn.length > 0) {
      // 受注コンテナ明細id
      let newJuchuContainerMeisaiId = 1;

      const newJuchuCtnMeisai = selectCtn.map((d) => ({
        ...d,
        juchuKizaiHeadId: newJuchuKizaiHeadId,
        juchuKizaiMeisaiId: newJuchuContainerMeisaiId++,
        dspOrdNum: dspOrdNum++,
      }));

      // 受注コンテナ明細追加
      const addCtnMeisaiResult = await addJuchuContainerMeisai(newJuchuCtnMeisai, userNam, connection);
      console.log('受注コンテナ明細追加', addCtnMeisaiResult);

      // 元受注コンテナ明細更新
      await updJuchuContainerMeisai(updateCtn, userNam, connection);

      if (juchuKizaiHeadData.kicsShukoDat && juchuKizaiHeadData.kicsNyukoDat) {
        // コンテナ入出庫伝票追加(KICS)
        const addCtnNyushukoDenResult = await addCtnNyushukoDen(
          newJuchuCtnMeisai,
          juchuKizaiHeadData.kicsShukoDat,
          juchuKizaiHeadData.kicsNyukoDat,
          1,
          userNam,
          connection
        );
        console.log('KICSコンテナ入出庫伝票追加', addCtnNyushukoDenResult);

        // 元コンテナ入出庫伝票更新(KICS)
        await updCtnNyushukoDen(
          updateCtn,
          juchuKizaiHeadData.kicsShukoDat,
          juchuKizaiHeadData.kicsNyukoDat,
          1,
          userNam,
          connection
        );
      }
      if (juchuKizaiHeadData.yardShukoDat && juchuKizaiHeadData.yardNyukoDat) {
        // コンテナ入出庫伝票追加(YARD)
        const addCtnNyushukoDenResult = await addCtnNyushukoDen(
          newJuchuCtnMeisai,
          juchuKizaiHeadData.yardShukoDat,
          juchuKizaiHeadData.yardNyukoDat,
          2,
          userNam,
          connection
        );
        console.log('YARDコンテナ入出庫伝票追加', addCtnNyushukoDenResult);

        // 元コンテナ入出庫伝票更新(YARD)
        await updCtnNyushukoDen(
          updateCtn,
          juchuKizaiHeadData.yardShukoDat,
          juchuKizaiHeadData.yardNyukoDat,
          2,
          userNam,
          connection
        );
      }
    }

    // 移動受注機材明細
    if (idoList.length > 0) {
      const idoDenMaxId = await getIdoDenJuchuMaxId();
      const newIdoDenId = idoDenMaxId ? idoDenMaxId + 1 : 1;

      const newIdoList = idoList.map((d) => ({ ...d, juchuKizaiHeadId: newJuchuKizaiHeadId }));

      // 移動受注機材明細追加
      const addIdoDenResult = await addIdoDenJuchu(newIdoDenId, newIdoList, userNam, connection);
      console.log('移動伝票受注追加', addIdoDenResult);

      // 元移動受注機材明細更新
      await updIdoDenJuchu(updateIdoList, userNam, connection);
    }

    // 受注本番日追加
    if (juchuHonbanbiList.length > 0) {
      for (const data of juchuHonbanbiList) {
        const addHonbanbiResult = await addHonbanbi(
          juchuKizaiHeadData.juchuHeadId,
          newJuchuKizaiHeadId,
          data,
          userNam,
          connection
        );
        console.log('受注機材本番日追加', addHonbanbiResult);
      }
    }

    await connection.query('COMMIT');

    await revalidatePath('/eqpt-order-list');
    await revalidatePath('/ido-list');
    await revalidatePath('/shuko-list');
    await revalidatePath('/nyuko-list');

    return newJuchuKizaiHeadId;
  } catch (e) {
    console.error(e);
    await connection.query('ROLLBACK');
    return null;
  } finally {
    connection.release();
  }
};
