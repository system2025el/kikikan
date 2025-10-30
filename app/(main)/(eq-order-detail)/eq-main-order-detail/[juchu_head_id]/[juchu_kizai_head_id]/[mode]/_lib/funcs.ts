'use server';

import { PoolClient } from 'pg';

import pool from '@/app/_lib/db/postgres';
import { selectActiveBumons } from '@/app/_lib/db/tables/m-bumon';
import { selectActiveEqpts, selectBundledEqpts, selectMeisaiEqts, selectOneEqpt } from '@/app/_lib/db/tables/m-kizai';
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
import { selectJuchuKizaiMeisai } from '@/app/_lib/db/tables/v-juchu-kizai-meisai';
import { selectIdoJuchuKizaiMeisai } from '@/app/_lib/db/tables/v-juchu-kizai-meisai-sum';
import { selectChosenEqptsDetails } from '@/app/_lib/db/tables/v-kizai-list';
import { JuchuCtnMeisai } from '@/app/_lib/db/types/t_juchu_ctn_meisai-type';
import { IdoDenJuchu } from '@/app/_lib/db/types/t-ido-den-juchu-type';
import { IdoDen } from '@/app/_lib/db/types/t-ido-den-type';
import { IdoFix } from '@/app/_lib/db/types/t-ido-fix-type';
import { JuchuKizaiHead } from '@/app/_lib/db/types/t-juchu-kizai-head-type';
import { JuchuKizaiHonbanbi } from '@/app/_lib/db/types/t-juchu-kizai-honbanbi-type';
import { JuchuKizaiMeisai } from '@/app/_lib/db/types/t-juchu-kizai-meisai-type';
import { NyushukoDen } from '@/app/_lib/db/types/t-nyushuko-den-type';
import { NyushukoFix } from '@/app/_lib/db/types/t-nyushuko-fix-type';
import { toISOString, toISOStringYearMonthDay, toJapanTimeString } from '@/app/(main)/_lib/date-conversion';
import {
  addAllHonbanbi,
  addJuchuKizaiNyushuko,
  delAllNyushukoCtnResult,
  delAllNyushukoResult,
  delNyushukoCtnResult,
  delSiyouHonbanbi,
  getJuchuContainerMeisaiMaxId,
  getJuchuKizaiHeadMaxId,
  getJuchuKizaiMeisaiMaxId,
  getJuchuKizaiNyushuko,
  updJuchuKizaiNyushuko,
} from '@/app/(main)/(eq-order-detail)/_lib/funcs';

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

    // 受注機材明細関係更新
    if (checkKicsDat || checkYardDat || checkJuchuKizaiMeisai) {
      //const copyJuchuKizaiMeisaiData = [...juchuKizaiMeisaiList];
      const juchuKizaiMeisaiMaxId = await getJuchuKizaiMeisaiMaxId(data.juchuHeadId, data.juchuKizaiHeadId);
      let newJuchuKizaiMeisaiId = juchuKizaiMeisaiMaxId ? juchuKizaiMeisaiMaxId.juchu_kizai_meisai_id + 1 : 1;

      const newJuchuKizaiMeisaiData = juchuKizaiMeisaiList.map((data) =>
        data.juchuKizaiMeisaiId === 0 && !data.delFlag ? { ...data, juchuKizaiMeisaiId: newJuchuKizaiMeisaiId++ } : data
      );

      // 受注機材明細、入出庫伝票
      const addJuchuKizaiMeisaiData = newJuchuKizaiMeisaiData.filter((data) => !data.delFlag && !data.saveFlag);
      const updateJuchuKizaiMeisaiData = newJuchuKizaiMeisaiData.filter((data) => !data.delFlag && data.saveFlag);
      const deleteJuchuKizaiMeisaiData = newJuchuKizaiMeisaiData.filter((data) => data.delFlag && data.saveFlag);
      // 削除
      if (deleteJuchuKizaiMeisaiData.length > 0) {
        const deleteMeisaiResult = await delJuchuKizaiMeisai(deleteJuchuKizaiMeisaiData, connection);
        console.log('受注機材明細削除', deleteMeisaiResult);

        const deleteNyushukoDenResult = await delNyushukoDen(deleteJuchuKizaiMeisaiData, connection);
        console.log('入出庫伝票削除', deleteNyushukoDenResult);
      }
      // 追加
      if (addJuchuKizaiMeisaiData.length > 0) {
        const addMeisaiResult = await addJuchuKizaiMeisai(addJuchuKizaiMeisaiData, userNam, connection);
        console.log('受注機材明細追加', addMeisaiResult);

        const addNyushukoDenResult = await addNyushukoDen(data, addJuchuKizaiMeisaiData, userNam, connection);
        console.log('入出庫伝票追加', addNyushukoDenResult);
      }
      // 更新
      if (updateJuchuKizaiMeisaiData.length > 0) {
        const updateMeisaiResult = await updJuchuKizaiMeisai(updateJuchuKizaiMeisaiData, userNam, connection);
        console.log('受注機材明細更新', updateMeisaiResult);

        const updateNyushukoDenResult = await updNyushukoDen(data, updateJuchuKizaiMeisaiData, userNam, connection);
        console.log('入出庫伝票更新', updateNyushukoDenResult);
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
      if (checkYardDat && originYardShukoDat) {
        yardDelFlg = await delAllNyushukoResult(
          data.juchuHeadId,
          data.juchuKizaiHeadId,
          toJapanTimeString(originYardShukoDat, '-'),
          2,
          connection
        );
        console.log('YARD入出庫実績削除', yardDelFlg);
      }
      const kicsKizaiMeisaiData = deleteJuchuKizaiMeisaiData.filter((d) => d.shozokuId === 1);
      const yardKizaiMeisaiData = deleteJuchuKizaiMeisaiData.filter((d) => d.shozokuId === 2);
      if (kicsKizaiMeisaiData.length > 0 && originKicsShukoDat && kicsDelFlg) {
        const deleteKicsNyushukoResultResult = await delNyushukoResult(
          kicsKizaiMeisaiData,
          toJapanTimeString(originKicsShukoDat, '-'),
          connection
        );
        console.log('KICS入出庫実績削除', deleteKicsNyushukoResultResult);
      }
      if (yardKizaiMeisaiData.length > 0 && originYardShukoDat && yardDelFlg) {
        const deleteYardNyushukoResultResult = await delNyushukoResult(
          yardKizaiMeisaiData,
          toJapanTimeString(originYardShukoDat, '-'),
          connection
        );
        console.log('YARD入出庫実績削除', deleteYardNyushukoResultResult);
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
        const newIdoDenId = idoDenMaxId ? idoDenMaxId.ido_den_id + 1 : 1;
        const addIdoDenResult = await addIdoDenJuchu(newIdoDenId, addIdoKizaiData, userNam, connection);
        console.log('移動伝票受注追加', addIdoDenResult);
      }
      // 更新
      if (updateIdoKizaiData.length > 0) {
        const updateIdoDenResult = await updIdoDenJuchu(updateIdoKizaiData, userNam, connection);
        console.log('移動伝票受注更新', updateIdoDenResult);
      }
    }

    // 受注コンテナ明細更新
    if (checkKicsDat || checkYardDat || checkJuchuContainerMeisai) {
      //const copyJuchuContainerMeisaiData = [...juchuContainerMeisaiList];
      const juchuContainerMeisaiMaxId = await getJuchuContainerMeisaiMaxId(data.juchuHeadId, data.juchuKizaiHeadId);
      let newJuchuContainerMeisaiId = juchuContainerMeisaiMaxId
        ? juchuContainerMeisaiMaxId.juchu_kizai_meisai_id + 1
        : 1;

      const newJuchuContainerMeisaiData = juchuContainerMeisaiList.map((data) =>
        data.juchuKizaiMeisaiId === 0 && !data.delFlag
          ? { ...data, juchuKizaiMeisaiId: newJuchuContainerMeisaiId++ }
          : data
      );

      // 受注コンテナ明細
      const addJuchuContainerMeisaiData = newJuchuContainerMeisaiData.filter((data) => !data.delFlag && !data.saveFlag);
      const updateJuchuContainerMeisaiData = newJuchuContainerMeisaiData.filter(
        (data) => !data.delFlag && data.saveFlag
      );
      const deleteJuchuContainerMeisaiData = newJuchuContainerMeisaiData.filter(
        (data) => data.delFlag && data.saveFlag
      );
      // 削除
      if (deleteJuchuContainerMeisaiData.length > 0) {
        const deleteKizaiiIds = deleteJuchuContainerMeisaiData.map((data) => data.kizaiId);
        const deleteContainerMeisaiResult = await delJuchuContainerMeisai(
          data.juchuHeadId,
          data.juchuKizaiHeadId,
          deleteKizaiiIds,
          connection
        );
        console.log('受注コンテナ明細削除', deleteContainerMeisaiResult);
      }
      // 追加
      if (addJuchuContainerMeisaiData.length > 0) {
        const addContainerMeisaiResult = await addJuchuContainerMeisai(
          addJuchuContainerMeisaiData,
          userNam,
          connection
        );
        console.log('受注コンテナ明細追加', addContainerMeisaiResult);
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

      // コンテナ入出庫伝票更新
      if (newJuchuContainerMeisaiData.length > 0) {
        const containerNyushukoDenResult = await updContainerNyushukoDen(
          data,
          newJuchuContainerMeisaiData,
          userNam,
          connection
        );
        console.log('コンテナ入出庫伝票更新', containerNyushukoDenResult);
      }

      // コンテナ入出庫実績削除
      let kicsDelFlg = false;
      let yardDelFlg = false;
      if (checkKicsDat && originKicsShukoDat) {
        kicsDelFlg = await delAllNyushukoCtnResult(
          data.juchuHeadId,
          data.juchuKizaiHeadId,
          toJapanTimeString(originKicsShukoDat, '-'),
          1,
          connection
        );
        console.log('KICSコンテナ入出庫実績削除', kicsDelFlg);
      }
      if (checkKicsDat && originYardShukoDat) {
        yardDelFlg = await delAllNyushukoCtnResult(
          data.juchuHeadId,
          data.juchuKizaiHeadId,
          toJapanTimeString(originYardShukoDat, '-'),
          2,
          connection
        );
        console.log('YARDコンテナ入出庫実績削除', yardDelFlg);
      }
      const existingContainerMeisai = juchuContainerMeisaiList.filter((d) => d.saveFlag && !d.delFlag);
      const deleteIds = juchuContainerMeisaiList.filter((d) => d.delFlag && d.saveFlag).map((d) => d.kizaiId);
      const deleteKicsIds: number[] = [];
      const deleteYardIds: number[] = [];
      if (existingContainerMeisai.length > 0) {
        const kicsContainerIds = existingContainerMeisai.filter((d) => d.planKicsKizaiQty === 0).map((d) => d.kizaiId);
        const yardContainerIds = existingContainerMeisai.filter((d) => d.planYardKizaiQty === 0).map((d) => d.kizaiId);
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

    // 入出庫確定更新
    if (juchuKizaiMeisaiList.length > 0 || juchuContainerMeisaiList.length > 0) {
      const kics =
        juchuKizaiMeisaiList.filter((d) => d.shozokuId === 1 && !d.delFlag).length > 0 ||
        juchuContainerMeisaiList.filter((d) => d.planKicsKizaiQty && !d.delFlag).length > 0
          ? true
          : false;
      const yard =
        juchuKizaiMeisaiList.filter((d) => d.shozokuId === 2 && !d.delFlag).length > 0 ||
        juchuContainerMeisaiList.filter((d) => d.planYardKizaiQty && !d.delFlag).length > 0
          ? true
          : false;

      const nyushukoFixResult = await updNyushukoFix(data, kics, yard, userNam, connection);
      console.log('入出庫確定更新', nyushukoFixResult);
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
    mem: juchuKizaiHeadData.mem,
    head_nam: juchuKizaiHeadData.headNam,
    oya_juchu_kizai_head_id: null,
    ht_kbn: 0,
    add_dat: toJapanTimeString(),
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
    mem: juchuKizaiHeadData.mem,
    head_nam: juchuKizaiHeadData.headNam,
    oya_juchu_kizai_head_id: null,
    ht_kbn: 0,
    upd_dat: toJapanTimeString(),
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
    const { data: eqList, error: eqListError } = await selectJuchuKizaiMeisai(juchuHeadId, juchuKizaiHeadId);
    if (eqListError) {
      console.error('getJuchuKizaiMeisai eqList error : ', eqListError);
      throw eqListError;
    }
    const uniqueIds = new Set();
    const uniqueEqList = eqList.filter((item) => {
      if (uniqueIds.has(item.juchu_kizai_meisai_id)) {
        return false;
      }
      uniqueIds.add(item.juchu_kizai_meisai_id);
      return true;
    });

    const { data: eqTanka, error: eqTankaError } = await selectJuchuKizaiMeisaiKizaiTanka(
      juchuHeadId,
      juchuKizaiHeadId
    );
    if (eqTankaError) {
      console.error('GetEqHeader eqTanka error : ', eqTankaError);
      throw eqTankaError;
    }

    const juchuKizaiMeisaiData: JuchuKizaiMeisaiValues[] = uniqueEqList.map((d) => ({
      juchuHeadId: d.juchu_head_id,
      juchuKizaiHeadId: d.juchu_kizai_head_id,
      juchuKizaiMeisaiId: d.juchu_kizai_meisai_id,
      shozokuId: d.shozoku_id,
      mem: d.mem,
      kizaiId: d.kizai_id,
      kizaiTankaAmt: eqTanka.find((t) => t.kizai_id === d.kizai_id)?.kizai_tanka_amt || 0,
      kizaiNam: d.kizai_nam ?? '',
      planKizaiQty: d.plan_kizai_qty ?? 0,
      planYobiQty: d.plan_yobi_qty ?? 0,
      planQty: d.plan_qty ?? 0,
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
    const { data: eqList, error: eqListError } = await selectIdoJuchuKizaiMeisai(juchuHeadId, juchuKizaiHeadId);
    if (eqListError) {
      console.error('GetEqList eqList error : ', eqListError);
      throw eqListError;
    }

    const eqIds = eqList.map((data) => data.kizai_id);

    const { data: mKizai, error: mKizaiError } = await selectMeisaiEqts(eqIds);

    if (mKizaiError) {
      console.error('GetEqList eqShozokuId error : ', mKizaiError);
      throw mKizaiError;
    }

    const juchuKizaiMeisaiData: IdoJuchuKizaiMeisaiValues[] = eqList.map((d) => ({
      juchuHeadId: d.juchu_head_id,
      juchuKizaiHeadId: d.juchu_kizai_head_id,
      idoDenId: d.ido_den_id,
      sagyoDenDat: d.sagyo_den_dat ? new Date(d.sagyo_den_dat) : null,
      sagyoSijiId: d.sagyo_siji_id === 'K→Y' ? 1 : d.sagyo_siji_id === 'Y→K' ? 2 : null,
      mShozokuId: mKizai.find((data) => data.kizai_id === d.kizai_id)?.shozoku_id,
      shozokuId: d.shozoku_id,
      shozokuNam: d.shozoku_nam ?? '',
      kizaiId: d.kizai_id,
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
    keep_qty: null,
    add_dat: toJapanTimeString(),
    add_user: userNam,
    shozoku_id: d.shozokuId,
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
    keep_qty: null,
    upd_dat: toJapanTimeString(),
    upd_user: userNam,
    shozoku_id: d.shozokuId,
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
    add_dat: toJapanTimeString(),
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
    add_dat: toJapanTimeString(),
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
    upd_dat: toJapanTimeString(),
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
    upd_dat: toJapanTimeString(),
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
        ? toISOString(juchuKizaiHeadData.kicsShukoDat as Date)
        : toISOString(juchuKizaiHeadData.yardShukoDat as Date),
    sagyo_id: d.shozokuId,
    kizai_id: d.kizaiId,
    plan_qty: d.planQty,
    add_dat: toJapanTimeString(),
    add_user: userNam,
  }));

  const newShukoCheckData: NyushukoDen[] = juchuKizaiMeisaiData.map((d) => ({
    juchu_head_id: d.juchuHeadId,
    juchu_kizai_head_id: d.juchuKizaiHeadId,
    juchu_kizai_meisai_id: d.juchuKizaiMeisaiId,
    sagyo_kbn_id: 20,
    sagyo_den_dat:
      d.shozokuId === 1
        ? toISOString(juchuKizaiHeadData.kicsShukoDat as Date)
        : toISOString(juchuKizaiHeadData.yardShukoDat as Date),
    sagyo_id: d.shozokuId,
    kizai_id: d.kizaiId,
    plan_qty: d.planQty,
    add_dat: toJapanTimeString(),
    add_user: userNam,
  }));

  const newNyukoCheckData: NyushukoDen[] = juchuKizaiMeisaiData.map((d) => ({
    juchu_head_id: d.juchuHeadId,
    juchu_kizai_head_id: d.juchuKizaiHeadId,
    juchu_kizai_meisai_id: d.juchuKizaiMeisaiId,
    sagyo_kbn_id: 30,
    sagyo_den_dat:
      d.shozokuId === 1
        ? toISOString(juchuKizaiHeadData.kicsNyukoDat as Date)
        : toISOString(juchuKizaiHeadData.yardNyukoDat as Date),
    sagyo_id: d.shozokuId,
    kizai_id: d.kizaiId,
    plan_qty: d.planQty,
    add_dat: toJapanTimeString(),
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
        ? toISOString(juchuKizaiHeadData.kicsShukoDat as Date)
        : toISOString(juchuKizaiHeadData.yardShukoDat as Date),
    sagyo_id: d.shozokuId,
    kizai_id: d.kizaiId,
    plan_qty: d.planQty,
    upd_dat: toJapanTimeString(),
    upd_user: userNam,
  }));

  const updateShukoCheckData: NyushukoDen[] = juchuKizaiMeisaiData.map((d) => ({
    juchu_head_id: d.juchuHeadId,
    juchu_kizai_head_id: d.juchuKizaiHeadId,
    juchu_kizai_meisai_id: d.juchuKizaiMeisaiId,
    sagyo_kbn_id: 20,
    sagyo_den_dat:
      d.shozokuId === 1
        ? toISOString(juchuKizaiHeadData.kicsShukoDat as Date)
        : toISOString(juchuKizaiHeadData.yardShukoDat as Date),
    sagyo_id: d.shozokuId,
    kizai_id: d.kizaiId,
    plan_qty: d.planQty,
    upd_dat: toJapanTimeString(),
    upd_user: userNam,
  }));

  const updateNyukoCheckData: NyushukoDen[] = juchuKizaiMeisaiData.map((d) => ({
    juchu_head_id: d.juchuHeadId,
    juchu_kizai_head_id: d.juchuKizaiHeadId,
    juchu_kizai_meisai_id: d.juchuKizaiMeisaiId,
    sagyo_kbn_id: 30,
    sagyo_den_dat:
      d.shozokuId === 1
        ? toISOString(juchuKizaiHeadData.kicsNyukoDat as Date)
        : toISOString(juchuKizaiHeadData.yardNyukoDat as Date),
    sagyo_id: d.shozokuId,
    kizai_id: d.kizaiId,
    plan_qty: d.planQty,
    upd_dat: toJapanTimeString(),
    upd_user: userNam,
  }));

  const mergeData = [...updateShukoStandbyData, ...updateShukoCheckData, ...updateNyukoCheckData];

  try {
    for (const data of mergeData) {
      await updateNyushukoDen(data, connection);
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
 * コンテナ入出庫伝票更新
 * @param juchuKizaiHeadData 受注機材ヘッダーデータ
 * @param juchuContainerMeisaiData 受注コンテナ明細データ
 * @param userNam ユーザー名
 */
export const updContainerNyushukoDen = async (
  juchuKizaiHeadData: JuchuKizaiHeadValues,
  juchuContainerMeisaiData: JuchuContainerMeisaiValues[],
  userNam: string,
  connection: PoolClient
) => {
  for (const data of juchuContainerMeisaiData) {
    const kicsData =
      !data.delFlag && data.planKicsKizaiQty
        ? [
            {
              juchu_head_id: data.juchuHeadId,
              juchu_kizai_head_id: data.juchuKizaiHeadId,
              juchu_kizai_meisai_id: data.juchuKizaiMeisaiId,
              sagyo_kbn_id: 10,
              sagyo_den_dat: toISOString(juchuKizaiHeadData.kicsShukoDat as Date),
              sagyo_id: 1,
              kizai_id: data.kizaiId,
              plan_qty: data.planKicsKizaiQty,
            },
            {
              juchu_head_id: data.juchuHeadId,
              juchu_kizai_head_id: data.juchuKizaiHeadId,
              juchu_kizai_meisai_id: data.juchuKizaiMeisaiId,
              sagyo_kbn_id: 20,
              sagyo_den_dat: toISOString(juchuKizaiHeadData.kicsShukoDat as Date),
              sagyo_id: 1,
              kizai_id: data.kizaiId,
              plan_qty: data.planKicsKizaiQty,
            },
            {
              juchu_head_id: data.juchuHeadId,
              juchu_kizai_head_id: data.juchuKizaiHeadId,
              juchu_kizai_meisai_id: data.juchuKizaiMeisaiId,
              sagyo_kbn_id: 30,
              sagyo_den_dat: toISOString(juchuKizaiHeadData.kicsNyukoDat as Date),
              sagyo_id: 1,
              kizai_id: data.kizaiId,
              plan_qty: data.planKicsKizaiQty,
            },
          ]
        : null;
    const yardData =
      !data.delFlag && data.planYardKizaiQty
        ? [
            {
              juchu_head_id: data.juchuHeadId,
              juchu_kizai_head_id: data.juchuKizaiHeadId,
              juchu_kizai_meisai_id: data.juchuKizaiMeisaiId,
              sagyo_kbn_id: 10,
              sagyo_den_dat: toISOString(juchuKizaiHeadData.yardShukoDat as Date),
              sagyo_id: 2,
              kizai_id: data.kizaiId,
              plan_qty: data.planYardKizaiQty,
            },
            {
              juchu_head_id: data.juchuHeadId,
              juchu_kizai_head_id: data.juchuKizaiHeadId,
              juchu_kizai_meisai_id: data.juchuKizaiMeisaiId,
              sagyo_kbn_id: 20,
              sagyo_den_dat: toISOString(juchuKizaiHeadData.yardShukoDat as Date),
              sagyo_id: 2,
              kizai_id: data.kizaiId,
              plan_qty: data.planYardKizaiQty,
            },
            {
              juchu_head_id: data.juchuHeadId,
              juchu_kizai_head_id: data.juchuKizaiHeadId,
              juchu_kizai_meisai_id: data.juchuKizaiMeisaiId,
              sagyo_kbn_id: 30,
              sagyo_den_dat: toISOString(juchuKizaiHeadData.yardNyukoDat as Date),
              sagyo_id: 2,
              kizai_id: data.kizaiId,
              plan_qty: data.planYardKizaiQty,
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
      console.log('container nyushuko den updated successfully:', data);
    } catch (e) {
      throw e;
    }
  }
  return true;
};

/**
 * 入出庫確定更新
 * @param data 受注機材ヘッダーデータ
 * @param kics KICS機材判定
 * @param yard YARD機材判定
 * @param userNam ユーザー名
 * @returns
 */
export const updNyushukoFix = async (
  data: JuchuKizaiHeadValues,
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
    console.log('nyushuko fix updated successfully:', data);
    return true;
  } catch (e) {
    console.error(e);
    throw e;
  }
};

/**
 * 入出庫実績削除
 * @param juchuHeadId 受注ヘッダーid
 * @param sagyoDenDat 作業日時
 * @param sagyoId 作業id
 * @param kizaiIds 機材id
 * @param connection
 */
export const delNyushukoResult = async (
  juchuKizaiMeisaiData: JuchuKizaiMeisaiValues[],
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
    return data;
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
    sagyo_den_dat: toISOStringYearMonthDay(d.sagyoDenDat as Date),
    sagyo_siji_id: d.mShozokuId,
    sagyo_id: d.mShozokuId,
    sagyo_kbn_id: 40,
    kizai_id: d.kizaiId,
    plan_qty: d.planQty,
    juchu_head_id: d.juchuHeadId,
    juchu_kizai_head_id: d.juchuKizaiHeadId,
    add_dat: toJapanTimeString(),
    add_user: userNam,
  }));

  const newUnloadData: IdoDenJuchu[] = idoKizaiData.map((d, index) => ({
    ido_den_id: newIdoDenId + index,
    sagyo_den_dat: toISOStringYearMonthDay(d.sagyoDenDat as Date),
    sagyo_siji_id: d.mShozokuId,
    sagyo_id: d.mShozokuId === 1 ? 2 : 1,
    sagyo_kbn_id: 50,
    kizai_id: d.kizaiId,
    plan_qty: d.planQty,
    juchu_head_id: d.juchuHeadId,
    juchu_kizai_head_id: d.juchuKizaiHeadId,
    add_dat: toJapanTimeString(),
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
      sagyo_den_dat: toISOStringYearMonthDay(d.sagyoDenDat as Date),
      sagyo_siji_id: d.mShozokuId,
      sagyo_id: d.mShozokuId,
      sagyo_kbn_id: 40,
      kizai_id: d.kizaiId,
      plan_qty: d.planQty,
      juchu_head_id: d.juchuHeadId,
      juchu_kizai_head_id: d.juchuKizaiHeadId,
      upd_dat: toJapanTimeString(),
      upd_user: userNam,
    };
  });

  const updateUnloadData: IdoDenJuchu[] = idoKizaiData.map((d) => {
    if (!d.idoDenId) {
      throw new Error();
    }
    return {
      ido_den_id: d.idoDenId,
      sagyo_den_dat: toISOStringYearMonthDay(d.sagyoDenDat as Date),
      sagyo_siji_id: d.mShozokuId,
      sagyo_id: d.mShozokuId === 1 ? 2 : 1,
      sagyo_kbn_id: 50,
      kizai_id: d.kizaiId,
      plan_qty: d.planQty,
      juchu_head_id: d.juchuHeadId,
      juchu_kizai_head_id: d.juchuKizaiHeadId,
      upd_dat: toJapanTimeString(),
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
      toISOStringYearMonthDay(juchuHonbanbiDat)
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
    juchu_honbanbi_dat: toISOStringYearMonthDay(juchuHonbanbiData.juchuHonbanbiDat),
    mem: juchuHonbanbiData.mem ? juchuHonbanbiData.mem : null,
    juchu_honbanbi_add_qty: juchuHonbanbiData.juchuHonbanbiAddQty,
    add_dat: toJapanTimeString(),
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
    juchu_honbanbi_dat: toISOStringYearMonthDay(juchuHonbanbiData.juchuHonbanbiDat),
    mem: juchuHonbanbiData.mem ? juchuHonbanbiData.mem : null,
    juchu_honbanbi_add_qty: juchuHonbanbiData.juchuHonbanbiAddQty,
    upd_dat: toJapanTimeString(),
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
    juchu_honbanbi_dat: toISOStringYearMonthDay(juchuHonbanbiData.juchuHonbanbiDat),
    mem: juchuHonbanbiData.mem ? juchuHonbanbiData.mem : null,
    juchu_honbanbi_add_qty: juchuHonbanbiData.juchuHonbanbiAddQty,
    upd_dat: toJapanTimeString(),
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
      toISOStringYearMonthDay(juchuHonbanbiDat),
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
 * セットオプションを持つ機材のIDの配列を取得する関数
 * @param idList 選ばれた機材たちの機材IDリスト
 * @returns セットオプション付きの機材の配列、なかった場合は空配列を返す
 */
export const checkSetoptions = async (idList: number[]): Promise<number[]> => {
  try {
    const { data: setIdList, error: setIdError } = await selectBundledEqptIds(idList);
    if (setIdError) {
      console.error('例外発生', setIdError);
      throw setIdError;
    }
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
      ctnFlg: d.ctn_flg,
      blnkQty: 0,
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
