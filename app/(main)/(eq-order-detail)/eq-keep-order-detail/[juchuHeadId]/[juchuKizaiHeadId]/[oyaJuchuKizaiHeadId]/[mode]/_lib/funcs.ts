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
  deleteAllNyukoDen,
  deleteAllShukoDen,
  deleteContainerNyushukoDen,
  deleteNyukoDen,
  deleteNyushukoDen,
  deleteShukoDen,
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
import {
  deleteKizaiIdNyukoResult,
  deleteKizaiIdNyushukoResult,
  deleteKizaiIdShukoResult,
} from '@/app/_lib/db/tables/t-nyushuko-result';
import { selectJuchuContainerMeisai } from '@/app/_lib/db/tables/v-juchu-ctn-meisai';
import { selectKeepJuchuKizaiMeisai, selectOyaJuchuKizaiMeisai } from '@/app/_lib/db/tables/v-juchu-kizai-meisai';
import { JuchuCtnMeisai } from '@/app/_lib/db/types/t_juchu_ctn_meisai-type';
import { JuchuKizaiHead } from '@/app/_lib/db/types/t-juchu-kizai-head-type';
import { JuchuKizaiMeisai } from '@/app/_lib/db/types/t-juchu-kizai-meisai-type';
import { NyushukoDen } from '@/app/_lib/db/types/t-nyushuko-den-type';
import { NyushukoFix } from '@/app/_lib/db/types/t-nyushuko-fix-type';
import { Database } from '@/app/_lib/db/types/types';
import { toJapanTimeStampString, toJapanTimeString } from '@/app/(main)/_lib/date-conversion';
import {
  addDummyNyushukoDen,
  addJuchuKizaiNyushuko,
  delAllNyukoResult,
  delAllNyushukoResult,
  delAllShukoResult,
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

    // ダミー入庫伝票追加
    if (data.kicsNyukoDat) {
      await addDummyNyushukoDen(data.juchuHeadId, newJuchuKizaiHeadId, data.kicsNyukoDat, 1, userNam, connection);
    }
    if (data.yardNyukoDat) {
      await addDummyNyushukoDen(data.juchuHeadId, newJuchuKizaiHeadId, data.yardNyukoDat, 2, userNam, connection);
    }

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
  checkKicsShukoDat: boolean,
  checkKicsNyukoDat: boolean,
  checkYardShukoDat: boolean,
  checkYardNyukoDat: boolean,
  checkJuchuKizaiMeisai: boolean,
  checkJuchuContainerMeisai: boolean,
  originKicsShukoDat: Date | null | undefined,
  originKicsNyukoDat: Date | null | undefined,
  originYardShukoDat: Date | null | undefined,
  originYardNyukoDat: Date | null | undefined,
  data: KeepJuchuKizaiHeadValues,
  updateShukoDate: Date | null,
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

    // 受注機材、コンテナ明細、入出庫伝票、入出庫実績
    if (
      checkKicsShukoDat ||
      checkKicsNyukoDat ||
      checkYardShukoDat ||
      checkYardNyukoDat ||
      checkJuchuKizaiMeisai ||
      checkJuchuContainerMeisai
    ) {
      // 受注機材明細id最大値
      const juchuKizaiMeisaiMaxId = await getJuchuKizaiMeisaiMaxId(data.juchuHeadId, data.juchuKizaiHeadId);
      let newKeepJuchuKizaiMeisaiId = juchuKizaiMeisaiMaxId ? juchuKizaiMeisaiMaxId.juchu_kizai_meisai_id + 1 : 1;
      // 新規機材に明細id割り振り
      const newKeepJuchuKizaiMeisaiData = keepJuchuKizaiMeisaiList.map((data) =>
        data.juchuKizaiMeisaiId === 0 && !data.delFlag
          ? { ...data, juchuKizaiMeisaiId: newKeepJuchuKizaiMeisaiId++ }
          : data
      );

      // 追加機材
      const addKeepJuchuKizaiMeisaiData = newKeepJuchuKizaiMeisaiData.filter((data) => !data.delFlag && !data.saveFlag);
      // 更新機材
      const updateKeepJuchuKizaiMeisaiData = newKeepJuchuKizaiMeisaiData.filter(
        (data) => !data.delFlag && data.saveFlag
      );
      // 削除機材
      const deleteKeepJuchuKizaiMeisaiData = newKeepJuchuKizaiMeisaiData.filter(
        (data) => data.delFlag && data.saveFlag
      );
      // 削除
      if (deleteKeepJuchuKizaiMeisaiData.length > 0) {
        const deleteMeisaiResult = await delKeepJuchuKizaiMeisai(deleteKeepJuchuKizaiMeisaiData, connection);
        console.log('キープ受注機材明細削除', deleteMeisaiResult);
      }
      // 追加
      if (addKeepJuchuKizaiMeisaiData.length > 0) {
        const addMeisaiResult = await addKeepJuchuKizaiMeisai(addKeepJuchuKizaiMeisaiData, userNam, connection);
        console.log('キープ受注機材明細追加', addMeisaiResult);
      }
      // 更新
      if (updateKeepJuchuKizaiMeisaiData.length > 0) {
        const updateMeisaiResult = await updKeepJuchuKizaiMeisai(updateKeepJuchuKizaiMeisaiData, userNam, connection);
        console.log('キープ受注機材明細更新', updateMeisaiResult);
      }

      // 受注コンテナ明細id最大値
      const juchuContainerMeisaiMaxId = await getJuchuContainerMeisaiMaxId(data.juchuHeadId, data.juchuKizaiHeadId);
      let newKeepJuchuContainerMeisaiId = juchuContainerMeisaiMaxId
        ? juchuContainerMeisaiMaxId.juchu_kizai_meisai_id + 1
        : 1;
      // 新規コンテナに明細id割り振り
      const newKeepJuchuContainerMeisaiData = keepJuchuContainerMeisaiList.map((data) =>
        data.juchuKizaiMeisaiId === 0 && !data.delFlag
          ? { ...data, juchuKizaiMeisaiId: newKeepJuchuContainerMeisaiId++ }
          : data
      );

      // 追加コンテナ
      const addKeepJuchuContainerMeisaiData = newKeepJuchuContainerMeisaiData.filter(
        (data) => !data.delFlag && !data.saveFlag
      );
      // 更新コンテナ
      const updateKeepJuchuContainerMeisaiData = newKeepJuchuContainerMeisaiData.filter(
        (data) => !data.delFlag && data.saveFlag
      );
      // 削除コンテナ
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

      // 入庫伝票
      if (checkKicsNyukoDat || checkYardNyukoDat) {
        const deleteNyukoDenResult = await delAllNyukoDen(data.juchuHeadId, data.juchuKizaiHeadId, connection);
        console.log('入庫伝票全削除', deleteNyukoDenResult);

        // ダミー入庫伝票追加
        if (data.kicsNyukoDat) {
          await addDummyNyushukoDen(data.juchuHeadId, data.juchuKizaiHeadId, data.kicsNyukoDat, 1, userNam, connection);
        }
        if (data.yardNyukoDat) {
          await addDummyNyushukoDen(data.juchuHeadId, data.juchuKizaiHeadId, data.yardNyukoDat, 2, userNam, connection);
        }

        // 削除されていない機材明細
        const filterNewKeepJuchuKizaiMeisai = newKeepJuchuKizaiMeisaiData.filter((d) => !d.delFlag);
        const addNyukoDenResult = await addNyukoDen(data, filterNewKeepJuchuKizaiMeisai, userNam, connection);
        console.log('入庫伝票追加', addNyukoDenResult);

        // 削除されていないコンテナ明細
        const filterNewJuchuCntMeisai = newKeepJuchuContainerMeisaiData.filter((d) => !d.delFlag);
        if (data.kicsNyukoDat) {
          const addCtnNyukoDenResult = await addCtnNyukoDen(
            filterNewJuchuCntMeisai,
            data.kicsNyukoDat,
            1,
            userNam,
            connection
          );
          console.log('KICSコンテナ入出庫伝票追加', addCtnNyukoDenResult);
        }
        if (data.yardNyukoDat) {
          const addCtnNyukoDenResult = await addCtnNyukoDen(
            filterNewJuchuCntMeisai,
            data.yardNyukoDat,
            2,
            userNam,
            connection
          );
          console.log('YARDコンテナ入出庫伝票追加', addCtnNyukoDenResult);
        }
      } else {
        // 機材入庫伝票削除
        if (deleteKeepJuchuKizaiMeisaiData.length > 0) {
          const deleteNyukoDenResult = await delNyukoDen(deleteKeepJuchuKizaiMeisaiData, connection);
          console.log('入庫伝票削除', deleteNyukoDenResult);
        }
        // 機材入庫伝票追加
        if (addKeepJuchuKizaiMeisaiData.length > 0) {
          const addNyukoDenResult = await addNyukoDen(data, addKeepJuchuKizaiMeisaiData, userNam, connection);
          console.log('入庫伝票追加', addNyukoDenResult);
        }
        // 機材入庫伝票更新
        if (updateKeepJuchuKizaiMeisaiData.length > 0) {
          const updateNyukoDenResult = await updNyukoDen(data, updateKeepJuchuKizaiMeisaiData, userNam, connection);
          console.log('入庫伝票更新', updateNyukoDenResult);
        }

        // コンテナ入庫伝票削除
        if (deleteKeepJuchuContainerMeisaiData.length > 0) {
          const deleteCtnNyukoDenResult = await delCtnNyukoDen(deleteKeepJuchuContainerMeisaiData, connection);
          console.log('コンテナ入庫伝票削除', deleteCtnNyukoDenResult);
        }
        // コンテナ入庫伝票追加
        if (addKeepJuchuContainerMeisaiData.length > 0) {
          if (data.kicsShukoDat && data.kicsNyukoDat) {
            const addCtnNyukoDenResult = await addCtnNyukoDen(
              addKeepJuchuContainerMeisaiData,
              data.kicsNyukoDat,
              1,
              userNam,
              connection
            );
            console.log('KICSコンテナ入庫伝票追加', addCtnNyukoDenResult);
          }
          if (data.yardShukoDat && data.yardNyukoDat) {
            const addCtnNyukoDenResult = await addCtnNyukoDen(
              addKeepJuchuContainerMeisaiData,
              data.yardNyukoDat,
              2,
              userNam,
              connection
            );
            console.log('YARDコンテナ入庫伝票追加', addCtnNyukoDenResult);
          }
        }
        // コンテナ入庫伝票更新
        if (updateKeepJuchuContainerMeisaiData.length > 0) {
          if (data.kicsShukoDat && data.kicsNyukoDat) {
            const updCtnNyushukoDenResult = await updCtnNyukoDen(
              updateKeepJuchuContainerMeisaiData,
              data.kicsNyukoDat,
              1,
              userNam,
              connection
            );
            console.log('KICSコンテナ入庫伝票更新', updCtnNyushukoDenResult);
          }
          if (data.yardShukoDat && data.yardNyukoDat) {
            const updCtnNyukoDenResult = await updCtnNyukoDen(
              updateKeepJuchuContainerMeisaiData,
              data.yardNyukoDat,
              2,
              userNam,
              connection
            );
            console.log('YARDコンテナ入庫伝票更新', updCtnNyukoDenResult);
          }
        }
      }

      // 出庫伝票
      if (checkKicsShukoDat || checkYardShukoDat) {
        const deleteShukoDenResult = await delAllShukoDen(data.juchuHeadId, data.juchuKizaiHeadId, connection);
        console.log('出庫伝票全削除', deleteShukoDenResult);

        // 削除されていないKICS機材明細
        const filterNewKicsJuchuKizaiMeisai = newKeepJuchuKizaiMeisaiData.filter(
          (d) => !d.delFlag && d.shozokuId === 1
        );
        // 削除されていないYARD機材明細
        const filterNewYardJuchuKizaiMeisai = newKeepJuchuKizaiMeisaiData.filter(
          (d) => !d.delFlag && d.shozokuId === 2
        );
        // 削除されていないコンテナ明細
        const filterNewJuchuCntMeisai = newKeepJuchuContainerMeisaiData.filter((d) => !d.delFlag);
        if (data.kicsShukoDat) {
          const addKicsShukoDenResult = await addShukoDen(
            filterNewKicsJuchuKizaiMeisai,
            data.kicsShukoDat,
            1,
            userNam,
            connection
          );
          console.log('KICS出庫伝票追加', addKicsShukoDenResult);

          const addCtnShukoDenResult = await addCtnShukoDen(
            filterNewJuchuCntMeisai,
            data.kicsShukoDat,
            1,
            userNam,
            connection
          );
          console.log('KICSコンテナ出庫伝票追加', addCtnShukoDenResult);
        }
        if (data.yardShukoDat) {
          const addYardShukoDenResult = await addShukoDen(
            filterNewYardJuchuKizaiMeisai,
            data.yardShukoDat,
            2,
            userNam,
            connection
          );
          console.log('YARD出庫伝票追加', addYardShukoDenResult);

          const addCtnShukoDenResult = await addCtnShukoDen(
            filterNewJuchuCntMeisai,
            data.yardShukoDat,
            2,
            userNam,
            connection
          );
          console.log('YARDコンテナ出庫伝票追加', addCtnShukoDenResult);
        }
      } else {
        // 機材出庫伝票削除
        if (deleteKeepJuchuKizaiMeisaiData.length > 0) {
          const deleteShukoDenResult = await delShukoDen(deleteKeepJuchuKizaiMeisaiData, connection);
          console.log('出庫伝票削除', deleteShukoDenResult);
        }
        // 機材出庫伝票追加
        if (addKeepJuchuKizaiMeisaiData.length > 0) {
          const addKicsKeepJuchuKizaiMeisaiData = addKeepJuchuKizaiMeisaiData.filter((d) => d.shozokuId === 1);
          const addYardKeepJuchuKizaiMeisaiData = addKeepJuchuKizaiMeisaiData.filter((d) => d.shozokuId === 2);
          if (data.kicsShukoDat) {
            const addKicsShukoDenResult = await addShukoDen(
              addKicsKeepJuchuKizaiMeisaiData,
              data.kicsShukoDat,
              1,
              userNam,
              connection
            );
            console.log('KICS出庫伝票追加', addKicsShukoDenResult);
          }

          if (data.yardShukoDat) {
            const addYardShukoDenResult = await addShukoDen(
              addYardKeepJuchuKizaiMeisaiData,
              data.yardShukoDat,
              2,
              userNam,
              connection
            );
            console.log('YARD出庫伝票追加', addYardShukoDenResult);
          }
        }
        // 機材出庫伝票更新
        if (updateKeepJuchuKizaiMeisaiData.length > 0) {
          const updKicsKeepJuchuKizaiMeisaiData = updateKeepJuchuKizaiMeisaiData.filter((d) => d.shozokuId === 1);
          const updYardKeepJuchuKizaiMeisaiData = updateKeepJuchuKizaiMeisaiData.filter((d) => d.shozokuId === 2);
          if (data.kicsShukoDat) {
            const updateKicsShukoDenResult = await updShukoDen(
              updKicsKeepJuchuKizaiMeisaiData,
              data.kicsShukoDat,
              1,
              userNam,
              connection
            );
            console.log('KICS出庫伝票更新', updateKicsShukoDenResult);
          }

          if (data.yardShukoDat) {
            const updateYardShukoDenResult = await updShukoDen(
              updYardKeepJuchuKizaiMeisaiData,
              data.yardShukoDat,
              2,
              userNam,
              connection
            );
            console.log('YARD出庫伝票更新', updateYardShukoDenResult);
          }
        }

        // コンテナ出庫伝票削除
        if (deleteKeepJuchuContainerMeisaiData.length > 0) {
          const deleteCtnShushukoDenResult = await delCtnShukoDen(deleteKeepJuchuContainerMeisaiData, connection);
          console.log('コンテナ出庫伝票削除', deleteCtnShushukoDenResult);
        }
        // コンテナ出庫伝票追加
        if (addKeepJuchuContainerMeisaiData.length > 0) {
          if (data.kicsShukoDat) {
            const addCtnShukoDenResult = await addCtnShukoDen(
              addKeepJuchuContainerMeisaiData,
              data.kicsShukoDat,
              1,
              userNam,
              connection
            );
            console.log('KICSコンテナ出庫伝票追加', addCtnShukoDenResult);
          }
          if (data.yardShukoDat) {
            const addCtnShukoDenResult = await addCtnShukoDen(
              addKeepJuchuContainerMeisaiData,
              data.yardShukoDat,
              2,
              userNam,
              connection
            );
            console.log('YARDコンテナ出庫伝票追加', addCtnShukoDenResult);
          }
        }
        // コンテナ出庫伝票更新
        if (updateKeepJuchuContainerMeisaiData.length > 0) {
          if (data.kicsShukoDat) {
            const updCtnShukoDenResult = await updCtnShukoDen(
              updateKeepJuchuContainerMeisaiData,
              data.kicsShukoDat,
              1,
              userNam,
              connection
            );
            console.log('KICSコンテナ出庫伝票更新', updCtnShukoDenResult);
          }
          if (data.yardShukoDat) {
            const updCtnShukoDenResult = await updCtnNyukoDen(
              updateKeepJuchuContainerMeisaiData,
              data.yardShukoDat,
              2,
              userNam,
              connection
            );
            console.log('YARDコンテナ出庫伝票更新', updCtnShukoDenResult);
          }
        }
      }

      // 入出庫実績削除
      if (checkKicsNyukoDat && originKicsNyukoDat) {
        const delKicsNyukoDenResult = await delAllNyukoResult(data.juchuHeadId, data.juchuKizaiHeadId, 1, connection);
        console.log('KICS入庫実績全削除', delKicsNyukoDenResult);
      }
      if (checkYardNyukoDat && originYardNyukoDat) {
        const delYardNyukoDenResult = await delAllNyukoResult(data.juchuHeadId, data.juchuKizaiHeadId, 2, connection);
        console.log('YARD入庫実績全削除', delYardNyukoDenResult);
      }
      if (checkKicsShukoDat && originKicsShukoDat) {
        const delKicsShukoDenResult = await delAllShukoResult(data.juchuHeadId, data.juchuKizaiHeadId, 1, connection);
        console.log('KICS出庫実績全削除', delKicsShukoDenResult);
      }
      if (checkYardShukoDat && originYardShukoDat) {
        const delYardShukoDenResult = await delAllShukoResult(data.juchuHeadId, data.juchuKizaiHeadId, 1, connection);
        console.log('YARD出庫実績全削除', delYardShukoDenResult);
      }

      if (deleteKeepJuchuKizaiMeisaiData.length > 0) {
        const deleteNyushukoResultResult = await delNyushukoResult(deleteKeepJuchuKizaiMeisaiData, connection);
        console.log('削除機材入出庫実績削除', deleteNyushukoResultResult);
      }

      const deleteIds = deleteKeepJuchuContainerMeisaiData.map((d) => d.kizaiId);
      if (deleteIds.length > 0) {
        const deleteKicsContainerNyushukoResultResult = await delNyushukoCtnResult(
          data.juchuHeadId,
          data.juchuKizaiHeadId,
          deleteIds,
          connection
        );
        console.log('削除コンテナ入出庫実績削除', deleteKicsContainerNyushukoResultResult);
      }

      // const kicsKizaiMeisaiData = deleteKeepJuchuKizaiMeisaiData.filter((d) => d.shozokuId === 1);
      // const yardKizaiMeisaiData = deleteKeepJuchuKizaiMeisaiData.filter((d) => d.shozokuId === 2);
      // if (kicsKizaiMeisaiData.length > 0 && originKicsShukoDat && !kicsDelFlg) {
      //   const deleteKicsNyushukoResultResult = await delNyushukoResult(
      //     kicsKizaiMeisaiData,
      //     toJapanTimeString(originKicsShukoDat, '-'),
      //     connection
      //   );
      //   console.log('KICS入出庫実績削除', deleteKicsNyushukoResultResult);
      // }
      // if (yardKizaiMeisaiData.length > 0 && originYardShukoDat && !yardDelFlg) {
      //   const deleteYardNyushukoResultResult = await delNyushukoResult(
      //     yardKizaiMeisaiData,
      //     toJapanTimeString(originYardShukoDat, '-'),
      //     connection
      //   );
      //   console.log('YARD入出庫実績削除', deleteYardNyushukoResultResult);
      // }
    }

    // // 受注コンテナ明細更新
    // if (checkKicsDat || checkYardDat || checkJuchuContainerMeisai) {
    //   const juchuContainerMeisaiMaxId = await getJuchuContainerMeisaiMaxId(data.juchuHeadId, data.juchuKizaiHeadId);
    //   let newKeepJuchuContainerMeisaiId = juchuContainerMeisaiMaxId
    //     ? juchuContainerMeisaiMaxId.juchu_kizai_meisai_id + 1
    //     : 1;

    //   const newKeepJuchuContainerMeisaiData = keepJuchuContainerMeisaiList.map((data) =>
    //     data.juchuKizaiMeisaiId === 0 && !data.delFlag
    //       ? { ...data, juchuKizaiMeisaiId: newKeepJuchuContainerMeisaiId++ }
    //       : data
    //   );

    //   // 受注コンテナ明細更新
    //   const addKeepJuchuContainerMeisaiData = newKeepJuchuContainerMeisaiData.filter(
    //     (data) => !data.delFlag && !data.saveFlag
    //   );
    //   const updateKeepJuchuContainerMeisaiData = newKeepJuchuContainerMeisaiData.filter(
    //     (data) => !data.delFlag && data.saveFlag
    //   );
    //   const deleteKeepJuchuContainerMeisaiData = newKeepJuchuContainerMeisaiData.filter(
    //     (data) => data.delFlag && data.saveFlag
    //   );
    //   // 削除
    //   if (deleteKeepJuchuContainerMeisaiData.length > 0) {
    //     const deleteKizaiIds = deleteKeepJuchuContainerMeisaiData.map((data) => data.kizaiId);
    //     const deleteContainerMeisaiResult = await delKeepJuchuContainerMeisai(
    //       data.juchuHeadId,
    //       data.juchuKizaiHeadId,
    //       deleteKizaiIds,
    //       connection
    //     );
    //     console.log('キープ受注コンテナ明細削除', deleteContainerMeisaiResult);
    //   }
    //   // 追加
    //   if (addKeepJuchuContainerMeisaiData.length > 0) {
    //     const addContainerMeisaiResult = await addKeepJuchuContainerMeisai(
    //       addKeepJuchuContainerMeisaiData,
    //       userNam,
    //       connection
    //     );
    //     console.log('キープ受注コンテナ明細追加', addContainerMeisaiResult);
    //   }
    //   // 更新
    //   if (updateKeepJuchuContainerMeisaiData.length > 0) {
    //     const updateContainerMeisaiResult = await updKeepJuchuContainerMeisai(
    //       updateKeepJuchuContainerMeisaiData,
    //       userNam,
    //       connection
    //     );
    //     console.log('キープ受注コンテナ明細更新', updateContainerMeisaiResult);
    //   }

    //   // キープコンテナ入出庫伝票更新
    //   if (newKeepJuchuContainerMeisaiData.length > 0) {
    //     const containerNyushukoDenResult = await updKeepContainerNyushukoDen(
    //       data,
    //       newKeepJuchuContainerMeisaiData,
    //       userNam,
    //       connection
    //     );
    //     console.log('キープコンテナ入出庫伝票更新', containerNyushukoDenResult);
    //   }

    //   const existingContainerMeisai = keepJuchuContainerMeisaiList.filter((d) => d.saveFlag && !d.delFlag);
    //   const deleteIds = keepJuchuContainerMeisaiList.filter((d) => d.delFlag && d.saveFlag).map((d) => d.kizaiId);
    //   const deleteKicsIds: number[] = [];
    //   const deleteYardIds: number[] = [];
    //   if (existingContainerMeisai.length > 0) {
    //     const kicsContainerIds = existingContainerMeisai.filter((d) => d.kicsKeepQty === 0).map((d) => d.kizaiId);
    //     const yardContainerIds = existingContainerMeisai.filter((d) => d.yardKeepQty === 0).map((d) => d.kizaiId);
    //     deleteKicsIds.push(...deleteIds, ...kicsContainerIds);
    //     deleteYardIds.push(...deleteIds, ...yardContainerIds);
    //   }
    //   if (originKicsShukoDat && deleteKicsIds.length > 0 && !kicsDelFlg) {
    //     const deleteKicsContainerNyushukoResultResult = await delNyushukoCtnResult(
    //       data.juchuHeadId,
    //       data.juchuKizaiHeadId,
    //       toJapanTimeString(originKicsShukoDat, '-'),
    //       1,
    //       deleteKicsIds,
    //       connection
    //     );
    //     console.log('KICSコンテナ入出庫実績削除', deleteKicsContainerNyushukoResultResult);
    //   }
    //   if (originYardShukoDat && deleteYardIds.length > 0 && !yardDelFlg) {
    //     const deleteYardContainerNyushukoResultResult = await delNyushukoCtnResult(
    //       data.juchuHeadId,
    //       data.juchuKizaiHeadId,
    //       toJapanTimeString(originYardShukoDat, '-'),
    //       2,
    //       deleteYardIds,
    //       connection
    //     );
    //     console.log('YARDコンテナ入出庫実績削除', deleteYardContainerNyushukoResultResult);
    //   }
    // }

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
      oyaPlanKizaiQty: oyaData.find((oya) => oya.dsp_ord_num === d.dsp_ord_num)?.plan_kizai_qty ?? 0,
      oyaPlanYobiQty: oyaData.find((oya) => oya.dsp_ord_num === d.dsp_ord_num)?.plan_yobi_qty ?? 0,
      keepQty: d.keep_qty ?? 0,
      dspOrdNum: d.dsp_ord_num ?? 0,
      indentNum: d.indent_num ?? 0,
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
    dsp_ord_num: d.dspOrdNum,
    indent_num: d.indentNum,
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
    dsp_ord_num: d.dspOrdNum,
    indent_num: d.indentNum,
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
      juchuHeadId: d.juchu_head_id ?? 0,
      juchuKizaiHeadId: d.juchu_kizai_head_id ?? 0,
      juchuKizaiMeisaiId: d.juchu_kizai_meisai_id ?? 0,
      mem: d.mem,
      kizaiId: d.kizai_id ?? 0,
      kizaiNam: d.kizai_nam ?? '',
      oyaPlanKicsKizaiQty: oyaData.find((oya) => oya.kizai_id === d.kizai_id)?.kics_plan_kizai_qty ?? 0,
      oyaPlanYardKizaiQty: oyaData.find((oya) => oya.kizai_id === d.kizai_id)?.yard_plan_kizai_qty ?? 0,
      kicsKeepQty: d.kics_keep_qty ?? 0,
      yardKeepQty: d.yard_keep_qty ?? 0,
      dspOrdNum: d.dsp_ord_num ?? 0,
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
    dsp_ord_num: d.dspOrdNum,
    indent_num: d.indentNum,
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
    dsp_ord_num: d.dspOrdNum,
    indent_num: d.indentNum,
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
    dsp_ord_num: d.dspOrdNum,
    indent_num: d.indentNum,
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
    dsp_ord_num: d.dspOrdNum,
    indent_num: d.indentNum,
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

// /**
//  * キープ入出庫伝票新規追加
//  * @param keepJuchuKizaiHeadData キープ受注機材ヘッダーデータ
//  * @param keepJuchuKizaiMeisaiData キープ受注機材明細データ
//  * @param userNam ユーザー名
//  * @returns
//  */
// export const addKeepNyushukoDen = async (
//   keepJuchuKizaiHeadData: KeepJuchuKizaiHeadValues,
//   keepJuchuKizaiMeisaiData: KeepJuchuKizaiMeisaiValues[],
//   userNam: string,
//   connection: PoolClient
// ) => {
//   const newKeepShukoStandbyData: NyushukoDen[] =
//     keepJuchuKizaiHeadData.kicsShukoDat || keepJuchuKizaiHeadData.yardShukoDat
//       ? keepJuchuKizaiMeisaiData.map((d) => ({
//           juchu_head_id: d.juchuHeadId,
//           juchu_kizai_head_id: d.juchuKizaiHeadId,
//           juchu_kizai_meisai_id: d.juchuKizaiMeisaiId,
//           sagyo_kbn_id: 10,
//           sagyo_den_dat:
//             d.shozokuId === 1
//               ? toJapanTimeStampString(keepJuchuKizaiHeadData.kicsShukoDat as Date)
//               : toJapanTimeStampString(keepJuchuKizaiHeadData.yardShukoDat as Date),
//           sagyo_id: d.shozokuId,
//           kizai_id: d.kizaiId,
//           plan_qty: d.keepQty,
//           dspOrdNum: d.dspOrdNum,
//           indentNum: d.indentNum,
//           add_dat: toJapanTimeString(),
//           add_user: userNam,
//         }))
//       : [];

//   const newKeepShukoCheckData: NyushukoDen[] =
//     keepJuchuKizaiHeadData.kicsShukoDat || keepJuchuKizaiHeadData.yardShukoDat
//       ? keepJuchuKizaiMeisaiData.map((d) => ({
//           juchu_head_id: d.juchuHeadId,
//           juchu_kizai_head_id: d.juchuKizaiHeadId,
//           juchu_kizai_meisai_id: d.juchuKizaiMeisaiId,
//           sagyo_kbn_id: 20,
//           sagyo_den_dat:
//             d.shozokuId === 1
//               ? toJapanTimeStampString(keepJuchuKizaiHeadData.kicsShukoDat as Date)
//               : toJapanTimeStampString(keepJuchuKizaiHeadData.yardShukoDat as Date),
//           sagyo_id: d.shozokuId,
//           kizai_id: d.kizaiId,
//           plan_qty: d.keepQty,
//           dspOrdNum: d.dspOrdNum,
//           indentNum: d.indentNum,
//           add_dat: toJapanTimeString(),
//           add_user: userNam,
//         }))
//       : [];

//   const newKeepNyukoCheckData: NyushukoDen[] = keepJuchuKizaiMeisaiData.map((d) => ({
//     juchu_head_id: d.juchuHeadId,
//     juchu_kizai_head_id: d.juchuKizaiHeadId,
//     juchu_kizai_meisai_id: d.juchuKizaiMeisaiId,
//     sagyo_kbn_id: 30,
//     sagyo_den_dat:
//       d.shozokuId === 1
//         ? toJapanTimeStampString(keepJuchuKizaiHeadData.kicsNyukoDat as Date)
//         : toJapanTimeStampString(keepJuchuKizaiHeadData.yardNyukoDat as Date),
//     sagyo_id: d.shozokuId,
//     kizai_id: d.kizaiId,
//     plan_qty: d.keepQty,
//     dspOrdNum: d.dspOrdNum,
//     indentNum: d.indentNum,
//     add_dat: toJapanTimeString(),
//     add_user: userNam,
//   }));

//   const mergeData = [...newKeepShukoStandbyData, ...newKeepShukoCheckData, ...newKeepNyukoCheckData];

//   try {
//     await insertNyushukoDen(mergeData, connection);
//     console.log('keep nyushuko den added successfully:', mergeData);
//     return true;
//   } catch (e) {
//     console.error('Exception while adding keep nyushuko den:', e);
//     throw e;
//   }
// };

// /**
//  * キープ入出庫伝票更新
//  * @param keepJuchuKizaiHeadData キープ受注機材ヘッダーデータ
//  * @param keepJuchuKizaiMeisaiData キープ受注機材明細データ
//  * @param userNam ユーザー名
//  * @returns
//  */
// export const updKeepNyushukoDen = async (
//   keepJuchuKizaiHeadData: KeepJuchuKizaiHeadValues,
//   keepJuchuKizaiMeisaiData: KeepJuchuKizaiMeisaiValues[],
//   userNam: string,
//   connection: PoolClient
// ) => {
//   const updateKeepShukoStandbyData: NyushukoDen[] = keepJuchuKizaiMeisaiData.map((d) => ({
//     juchu_head_id: d.juchuHeadId,
//     juchu_kizai_head_id: d.juchuKizaiHeadId,
//     juchu_kizai_meisai_id: d.juchuKizaiMeisaiId,
//     sagyo_kbn_id: 10,
//     sagyo_den_dat:
//       d.shozokuId === 1
//         ? toJapanTimeStampString(keepJuchuKizaiHeadData.kicsShukoDat as Date)
//         : toJapanTimeStampString(keepJuchuKizaiHeadData.yardShukoDat as Date),
//     sagyo_id: d.shozokuId,
//     kizai_id: d.kizaiId,
//     plan_qty: d.keepQty,
//     dspOrdNum: d.dspOrdNum,
//     indentNum: d.indentNum,
//     add_dat: toJapanTimeString(),
//     add_user: userNam,
//   }));

//   const updateKeepShukoCheckData: NyushukoDen[] = keepJuchuKizaiMeisaiData.map((d) => ({
//     juchu_head_id: d.juchuHeadId,
//     juchu_kizai_head_id: d.juchuKizaiHeadId,
//     juchu_kizai_meisai_id: d.juchuKizaiMeisaiId,
//     sagyo_kbn_id: 20,
//     sagyo_den_dat:
//       d.shozokuId === 1
//         ? toJapanTimeStampString(keepJuchuKizaiHeadData.kicsShukoDat as Date)
//         : toJapanTimeStampString(keepJuchuKizaiHeadData.yardShukoDat as Date),
//     sagyo_id: d.shozokuId,
//     kizai_id: d.kizaiId,
//     plan_qty: d.keepQty,
//     dspOrdNum: d.dspOrdNum,
//     indentNum: d.indentNum,
//     add_dat: toJapanTimeString(),
//     add_user: userNam,
//   }));

//   const updateKeepNyukoCheckData: NyushukoDen[] = keepJuchuKizaiMeisaiData.map((d) => ({
//     juchu_head_id: d.juchuHeadId,
//     juchu_kizai_head_id: d.juchuKizaiHeadId,
//     juchu_kizai_meisai_id: d.juchuKizaiMeisaiId,
//     sagyo_kbn_id: 30,
//     sagyo_den_dat:
//       d.shozokuId === 1
//         ? toJapanTimeStampString(keepJuchuKizaiHeadData.kicsNyukoDat as Date)
//         : toJapanTimeStampString(keepJuchuKizaiHeadData.yardNyukoDat as Date),
//     sagyo_id: d.shozokuId,
//     kizai_id: d.kizaiId,
//     plan_qty: d.keepQty,
//     dspOrdNum: d.dspOrdNum,
//     indentNum: d.indentNum,
//     add_dat: toJapanTimeString(),
//     add_user: userNam,
//   }));

//   const mergeData = [...updateKeepShukoStandbyData, ...updateKeepShukoCheckData, ...updateKeepNyukoCheckData];

//   try {
//     for (const data of mergeData) {
//       await updateNyushukoDen(data, connection);
//     }
//     console.log('keep nyushuko den updated successfully:', mergeData);
//     return true;
//   } catch (e) {
//     console.error('Exception while updating keep nyushuko den:', e);
//     throw e;
//   }
// };

/**
 * 出庫伝票新規追加
 * @param juchuKizaiHeadData 受注機材ヘッダーデータ
 * @param juchuKizaiMeisaiData 受注機材明細データ
 * @param userNam ユーザー名
 * @param connection
 * @returns
 */
export const addShukoDen = async (
  juchuKizaiMeisaiData: KeepJuchuKizaiMeisaiValues[],
  shukoDat: Date,
  sagyoId: number,
  userNam: string,
  connection: PoolClient
) => {
  const newShukoStandbyData: NyushukoDen[] = juchuKizaiMeisaiData.map((d) => ({
    juchu_head_id: d.juchuHeadId,
    juchu_kizai_head_id: d.juchuKizaiHeadId,
    juchu_kizai_meisai_id: d.juchuKizaiMeisaiId,
    sagyo_kbn_id: 10,
    sagyo_den_dat: toJapanTimeStampString(shukoDat),
    sagyo_id: sagyoId,
    kizai_id: d.kizaiId,
    plan_qty: d.keepQty,
    dsp_ord_num: d.dspOrdNum,
    indent_num: d.indentNum,
    add_dat: toJapanTimeString(),
    add_user: userNam,
  }));

  const newShukoCheckData: NyushukoDen[] = juchuKizaiMeisaiData.map((d) => ({
    juchu_head_id: d.juchuHeadId,
    juchu_kizai_head_id: d.juchuKizaiHeadId,
    juchu_kizai_meisai_id: d.juchuKizaiMeisaiId,
    sagyo_kbn_id: 20,
    sagyo_den_dat: toJapanTimeStampString(shukoDat),
    sagyo_id: sagyoId,
    kizai_id: d.kizaiId,
    plan_qty: d.keepQty,
    dsp_ord_num: d.dspOrdNum,
    indent_num: d.indentNum,
    add_dat: toJapanTimeString(),
    add_user: userNam,
  }));

  const mergeData = [...newShukoStandbyData, ...newShukoCheckData];

  try {
    await insertNyushukoDen(mergeData, connection);
    console.log('keep shuko den added successfully:', mergeData);
    return true;
  } catch (e) {
    console.error('Exception while adding keep shuko den:', e);
    throw e;
  }
};

/**
 * 出庫伝票更新
 * @param juchuKizaiHeadData 受注機材ヘッダーデータ
 * @param juchuKizaiMeisaiData 受注機材明細データ
 * @param userNam ユーザー名
 * @param connection
 * @returns
 */
export const updShukoDen = async (
  juchuKizaiMeisaiData: KeepJuchuKizaiMeisaiValues[],
  shukoDat: Date,
  sagyoId: number,
  userNam: string,
  connection: PoolClient
) => {
  const newShukoStandbyData: NyushukoDen[] = juchuKizaiMeisaiData.map((d) => ({
    juchu_head_id: d.juchuHeadId,
    juchu_kizai_head_id: d.juchuKizaiHeadId,
    juchu_kizai_meisai_id: d.juchuKizaiMeisaiId,
    sagyo_kbn_id: 10,
    sagyo_den_dat: toJapanTimeStampString(shukoDat),
    sagyo_id: sagyoId,
    kizai_id: d.kizaiId,
    plan_qty: d.keepQty,
    dsp_ord_num: d.dspOrdNum,
    indent_num: d.indentNum,
    add_dat: toJapanTimeString(),
    add_user: userNam,
  }));

  const newShukoCheckData: NyushukoDen[] = juchuKizaiMeisaiData.map((d) => ({
    juchu_head_id: d.juchuHeadId,
    juchu_kizai_head_id: d.juchuKizaiHeadId,
    juchu_kizai_meisai_id: d.juchuKizaiMeisaiId,
    sagyo_kbn_id: 20,
    sagyo_den_dat: toJapanTimeStampString(shukoDat),
    sagyo_id: sagyoId,
    kizai_id: d.kizaiId,
    plan_qty: d.keepQty,
    dsp_ord_num: d.dspOrdNum,
    indent_num: d.indentNum,
    add_dat: toJapanTimeString(),
    add_user: userNam,
  }));

  const mergeData = [...newShukoStandbyData, ...newShukoCheckData];

  try {
    for (const data of mergeData) {
      await updateNyushukoDen(data, connection);
    }
    console.log('keep shuko den updated successfully:', mergeData);
    return true;
  } catch (e) {
    console.error('Exception while updating keep shuko den:', e);
    throw e;
  }
};

/**
 * 入庫伝票新規追加
 * @param juchuKizaiHeadData 受注機材ヘッダーデータ
 * @param juchuKizaiMeisaiData 受注機材明細データ
 * @param userNam ユーザー名
 * @param connection
 * @returns
 */
export const addNyukoDen = async (
  juchuKizaiHeadData: KeepJuchuKizaiHeadValues,
  juchuKizaiMeisaiData: KeepJuchuKizaiMeisaiValues[],
  userNam: string,
  connection: PoolClient
) => {
  const newData: NyushukoDen[] = juchuKizaiMeisaiData.map((d) => ({
    juchu_head_id: d.juchuHeadId,
    juchu_kizai_head_id: d.juchuKizaiHeadId,
    juchu_kizai_meisai_id: d.juchuKizaiMeisaiId,
    sagyo_kbn_id: 30,
    sagyo_den_dat:
      d.shozokuId === 1
        ? toJapanTimeStampString(juchuKizaiHeadData.kicsNyukoDat as Date)
        : toJapanTimeStampString(juchuKizaiHeadData.yardNyukoDat as Date),
    sagyo_id: d.shozokuId,
    kizai_id: d.kizaiId,
    plan_qty: d.keepQty,
    dsp_ord_num: d.dspOrdNum,
    indent_num: d.indentNum,
    add_dat: toJapanTimeString(),
    add_user: userNam,
  }));

  try {
    await insertNyushukoDen(newData, connection);
    console.log('keep nyuko den added successfully:', newData);
    return true;
  } catch (e) {
    console.error('Exception while adding keep nyuko den:', e);
    throw e;
  }
};

/**
 * 入庫伝票更新
 * @param juchuKizaiHeadData 受注機材ヘッダーデータ
 * @param juchuKizaiMeisaiData 受注機材明細データ
 * @param userNam ユーザー名
 * @param connection
 * @returns
 */
export const updNyukoDen = async (
  juchuKizaiHeadData: KeepJuchuKizaiHeadValues,
  juchuKizaiMeisaiData: KeepJuchuKizaiMeisaiValues[],
  userNam: string,
  connection: PoolClient
) => {
  const updateNyukoCheckData: NyushukoDen[] = juchuKizaiMeisaiData.map((d) => ({
    juchu_head_id: d.juchuHeadId,
    juchu_kizai_head_id: d.juchuKizaiHeadId,
    juchu_kizai_meisai_id: d.juchuKizaiMeisaiId,
    sagyo_kbn_id: 30,
    sagyo_den_dat:
      d.shozokuId === 1
        ? toJapanTimeStampString(juchuKizaiHeadData.kicsNyukoDat as Date)
        : toJapanTimeStampString(juchuKizaiHeadData.yardNyukoDat as Date),
    sagyo_id: d.shozokuId,
    kizai_id: d.kizaiId,
    plan_qty: d.keepQty,
    dsp_ord_num: d.dspOrdNum,
    indent_num: d.indentNum,
    add_dat: toJapanTimeString(),
    add_user: userNam,
  }));

  try {
    for (const data of updateNyukoCheckData) {
      await updateNyushukoDen(data, connection);
    }
    console.log('keep nyuko den updated successfully:', updateNyukoCheckData);
    return true;
  } catch (e) {
    console.error('Exception while updating keep nyuko den:', e);
    throw e;
  }
};

/**
 * コンテナ出庫伝票新規追加
 * @param juchuCtnMeisaiData 受注コンテナ明細データ
 * @param shukoDat 出庫日
 * @param sagyoId 作業id
 * @param userNam ユーザー名
 * @param connection
 * @returns
 */
export const addCtnShukoDen = async (
  juchuCtnMeisaiData: KeepJuchuContainerMeisaiValues[],
  shukoDat: Date,
  sagyoId: number,
  userNam: string,
  connection: PoolClient
) => {
  const newCtnShukoStandbyData: NyushukoDen[] = juchuCtnMeisaiData.map((d) => ({
    juchu_head_id: d.juchuHeadId,
    juchu_kizai_head_id: d.juchuKizaiHeadId,
    juchu_kizai_meisai_id: d.juchuKizaiMeisaiId,
    sagyo_kbn_id: 10,
    sagyo_den_dat: toJapanTimeStampString(shukoDat),
    sagyo_id: sagyoId,
    kizai_id: d.kizaiId,
    plan_qty: sagyoId === 1 ? d.kicsKeepQty : d.yardKeepQty,
    dsp_ord_num: d.dspOrdNum,
    indent_num: d.indentNum,
    add_dat: toJapanTimeString(),
    add_user: userNam,
  }));

  const newCtnShukoCheckData: NyushukoDen[] = juchuCtnMeisaiData.map((d) => ({
    juchu_head_id: d.juchuHeadId,
    juchu_kizai_head_id: d.juchuKizaiHeadId,
    juchu_kizai_meisai_id: d.juchuKizaiMeisaiId,
    sagyo_kbn_id: 20,
    sagyo_den_dat: toJapanTimeStampString(shukoDat),
    sagyo_id: sagyoId,
    kizai_id: d.kizaiId,
    plan_qty: sagyoId === 1 ? d.kicsKeepQty : d.yardKeepQty,
    dsp_ord_num: d.dspOrdNum,
    indent_num: d.indentNum,
    add_dat: toJapanTimeString(),
    add_user: userNam,
  }));

  const mergeData = [...newCtnShukoStandbyData, ...newCtnShukoCheckData];

  try {
    await insertNyushukoDen(mergeData, connection);

    console.log('ctn shuko den added successfully:', mergeData);
    return true;
  } catch (e) {
    console.error('Exception while adding ctn shuko den:', e);
    throw e;
  }
};

/**
 * コンテナ出庫伝票更新
 * @param juchuCtnMeisaiData 受注コンテナ明細データ
 * @param shukoDat 出庫日
 * @param sagyoId 作業id
 * @param userNam ユーザー名
 * @param connection
 * @returns
 */
export const updCtnShukoDen = async (
  juchuCtnMeisaiData: KeepJuchuContainerMeisaiValues[],
  shukoDat: Date,
  sagyoId: number,
  userNam: string,
  connection: PoolClient
) => {
  const updCtnShukoStandbyData: NyushukoDen[] = juchuCtnMeisaiData.map((d) => ({
    juchu_head_id: d.juchuHeadId,
    juchu_kizai_head_id: d.juchuKizaiHeadId,
    juchu_kizai_meisai_id: d.juchuKizaiMeisaiId,
    sagyo_kbn_id: 10,
    sagyo_den_dat: toJapanTimeStampString(shukoDat),
    sagyo_id: sagyoId,
    kizai_id: d.kizaiId,
    plan_qty: sagyoId === 1 ? d.kicsKeepQty : d.yardKeepQty,
    dsp_ord_num: d.dspOrdNum,
    indent_num: d.indentNum,
    add_dat: toJapanTimeString(),
    add_user: userNam,
  }));

  const updCtnShukoCheckData: NyushukoDen[] = juchuCtnMeisaiData.map((d) => ({
    juchu_head_id: d.juchuHeadId,
    juchu_kizai_head_id: d.juchuKizaiHeadId,
    juchu_kizai_meisai_id: d.juchuKizaiMeisaiId,
    sagyo_kbn_id: 20,
    sagyo_den_dat: toJapanTimeStampString(shukoDat),
    sagyo_id: sagyoId,
    kizai_id: d.kizaiId,
    plan_qty: sagyoId === 1 ? d.kicsKeepQty : d.yardKeepQty,
    dsp_ord_num: d.dspOrdNum,
    indent_num: d.indentNum,
    add_dat: toJapanTimeString(),
    add_user: userNam,
  }));

  const mergeData = [...updCtnShukoStandbyData, ...updCtnShukoCheckData];

  try {
    for (const data of mergeData) {
      await updateNyushukoDen(data, connection);
    }

    console.log('ctn shuko den update successfully:', mergeData);
    return true;
  } catch (e) {
    console.error('Exception while update ctn shuko den:', e);
    throw e;
  }
};

/**
 * コンテナ入庫伝票新規追加
 * @param juchuCtnMeisaiData 受注コンテナ明細データ
 * @param nyukoDat 入庫日
 * @param sagyoId 作業id
 * @param userNam ユーザー名
 * @param connection
 * @returns
 */
export const addCtnNyukoDen = async (
  juchuCtnMeisaiData: KeepJuchuContainerMeisaiValues[],
  nyukoDat: Date,
  sagyoId: number,
  userNam: string,
  connection: PoolClient
) => {
  const newCtnNyukoCheckData: NyushukoDen[] = juchuCtnMeisaiData.map((d) => ({
    juchu_head_id: d.juchuHeadId,
    juchu_kizai_head_id: d.juchuKizaiHeadId,
    juchu_kizai_meisai_id: d.juchuKizaiMeisaiId,
    sagyo_kbn_id: 30,
    sagyo_den_dat: toJapanTimeStampString(nyukoDat),
    sagyo_id: sagyoId,
    kizai_id: d.kizaiId,
    plan_qty: sagyoId === 1 ? d.kicsKeepQty : d.yardKeepQty,
    dsp_ord_num: d.dspOrdNum,
    indent_num: d.indentNum,
    add_dat: toJapanTimeString(),
    add_user: userNam,
  }));

  try {
    await insertNyushukoDen(newCtnNyukoCheckData, connection);

    console.log('ctn nyuko den added successfully:', newCtnNyukoCheckData);
    return true;
  } catch (e) {
    console.error('Exception while adding ctn nyuko den:', e);
    throw e;
  }
};

/**
 * コンテナ入庫伝票更新
 * @param juchuCtnMeisaiData 受注コンテナ明細データ
 * @param nyukoDat 入庫日
 * @param sagyoId 作業id
 * @param userNam ユーザー名
 * @param connection
 * @returns
 */
export const updCtnNyukoDen = async (
  juchuCtnMeisaiData: KeepJuchuContainerMeisaiValues[],
  nyukoDat: Date,
  sagyoId: number,
  userNam: string,
  connection: PoolClient
) => {
  const updCtnNyukoCheckData: NyushukoDen[] = juchuCtnMeisaiData.map((d) => ({
    juchu_head_id: d.juchuHeadId,
    juchu_kizai_head_id: d.juchuKizaiHeadId,
    juchu_kizai_meisai_id: d.juchuKizaiMeisaiId,
    sagyo_kbn_id: 30,
    sagyo_den_dat: toJapanTimeStampString(nyukoDat),
    sagyo_id: sagyoId,
    kizai_id: d.kizaiId,
    plan_qty: sagyoId === 1 ? d.kicsKeepQty : d.yardKeepQty,
    dsp_ord_num: d.dspOrdNum,
    indent_num: d.indentNum,
    upd_dat: toJapanTimeString(),
    upd_user: userNam,
  }));

  try {
    for (const data of updCtnNyukoCheckData) {
      await updateNyushukoDen(data, connection);
    }
    console.log('ctn nyuko den update successfully:', updCtnNyukoCheckData);
    return true;
  } catch (e) {
    console.error('Exception while update ctn nyuko den:', e);
    throw e;
  }
};

/**
 * 出庫伝票全削除
 * @param juchuHeadId 受注ヘッダーid
 * @param juchuKizaiHeadId 受注機材ヘッダーid
 * @param connection
 */
export const delAllShukoDen = async (juchuHeadId: number, juchuKizaiHeadId: number, connection: PoolClient) => {
  try {
    await deleteAllShukoDen(juchuHeadId, juchuKizaiHeadId, connection);
  } catch (e) {
    throw e;
  }
};

/**
 * 入庫伝票全削除
 * @param juchuHeadId 受注ヘッダーid
 * @param juchuKizaiHeadId 受注機材ヘッダーid
 * @param connection
 */
export const delAllNyukoDen = async (juchuHeadId: number, juchuKizaiHeadId: number, connection: PoolClient) => {
  try {
    await deleteAllNyukoDen(juchuHeadId, juchuKizaiHeadId, connection);
  } catch (e) {
    throw e;
  }
};

/**
 * 出庫伝票削除
 * @param keepJuchuKizaiMeisaiData キープ受注機材明細データ
 * @param connection
 * @returns
 */
export const delShukoDen = async (keepJuchuKizaiMeisaiData: KeepJuchuKizaiMeisaiValues[], connection: PoolClient) => {
  const deleteData = keepJuchuKizaiMeisaiData.map((d) => ({
    juchu_head_id: d.juchuHeadId,
    juchu_kizai_head_id: d.juchuKizaiHeadId,
    juchu_kizai_meisai_id: d.juchuKizaiMeisaiId,
    kizai_id: d.kizaiId,
  }));
  try {
    for (const data of deleteData) {
      await deleteShukoDen(data, connection);
    }
    console.log('keep shuko den delete successfully:', deleteData);
    return true;
  } catch (e) {
    throw e;
  }
};

/**
 * 入庫伝票削除
 * @param keepJuchuKizaiMeisaiData キープ受注機材明細データ
 * @param connection
 * @returns
 */
export const delNyukoDen = async (keepJuchuKizaiMeisaiData: KeepJuchuKizaiMeisaiValues[], connection: PoolClient) => {
  const deleteData = keepJuchuKizaiMeisaiData.map((d) => ({
    juchu_head_id: d.juchuHeadId,
    juchu_kizai_head_id: d.juchuKizaiHeadId,
    juchu_kizai_meisai_id: d.juchuKizaiMeisaiId,
    kizai_id: d.kizaiId,
  }));
  try {
    for (const data of deleteData) {
      await deleteNyukoDen(data, connection);
    }
    console.log('keep nyuko den delete successfully:', deleteData);
    return true;
  } catch (e) {
    throw e;
  }
};

/**
 * コンテナ出庫伝票削除
 * @param keepJuchuKizaiMeisaiData キープ受注機材明細データ
 * @param connection
 * @returns
 */
export const delCtnShukoDen = async (
  keepJuchuContainerMeisaiData: KeepJuchuContainerMeisaiValues[],
  connection: PoolClient
) => {
  const deleteData = keepJuchuContainerMeisaiData.map((d) => ({
    juchu_head_id: d.juchuHeadId,
    juchu_kizai_head_id: d.juchuKizaiHeadId,
    juchu_kizai_meisai_id: d.juchuKizaiMeisaiId,
    kizai_id: d.kizaiId,
  }));
  try {
    for (const data of deleteData) {
      await deleteShukoDen(data, connection);
    }
    console.log('keep ctn shuko den delete successfully:', deleteData);
    return true;
  } catch (e) {
    throw e;
  }
};

/**
 * コンテナ入庫伝票削除
 * @param keepJuchuKizaiMeisaiData キープ受注コンテナ明細データ
 * @param connection
 * @returns
 */
export const delCtnNyukoDen = async (
  keepJuchuContainerMeisaiData: KeepJuchuContainerMeisaiValues[],
  connection: PoolClient
) => {
  const deleteData = keepJuchuContainerMeisaiData.map((d) => ({
    juchu_head_id: d.juchuHeadId,
    juchu_kizai_head_id: d.juchuKizaiHeadId,
    juchu_kizai_meisai_id: d.juchuKizaiMeisaiId,
    kizai_id: d.kizaiId,
  }));
  try {
    for (const data of deleteData) {
      await deleteNyukoDen(data, connection);
    }
    console.log('keep ctn nyuko den delete successfully:', deleteData);
    return true;
  } catch (e) {
    throw e;
  }
};

// /**
//  * キープコンテナ入出庫伝票更新
//  * @param keepJuchuKizaiHeadData キープ受注機材ヘッダーデータ
//  * @param keepJuchuContainerMeisaiData キープ受注コンテナ明細データ
//  * @param userNam ユーザー名
//  */
// export const updKeepContainerNyushukoDen = async (
//   keepJuchuKizaiHeadData: KeepJuchuKizaiHeadValues,
//   keepJuchuContainerMeisaiData: KeepJuchuContainerMeisaiValues[],
//   userNam: string,
//   connection: PoolClient
// ) => {
//   for (const data of keepJuchuContainerMeisaiData) {
//     const kicsData =
//       !data.delFlag && data.kicsKeepQty
//         ? [
//             {
//               juchu_head_id: data.juchuHeadId,
//               juchu_kizai_head_id: data.juchuKizaiHeadId,
//               juchu_kizai_meisai_id: data.juchuKizaiMeisaiId,
//               sagyo_kbn_id: 10,
//               sagyo_den_dat: toJapanTimeStampString(keepJuchuKizaiHeadData.kicsShukoDat as Date),
//               sagyo_id: 1,
//               kizai_id: data.kizaiId,
//               plan_qty: data.kicsKeepQty,
//               dspOrdNum: data.dspOrdNum,
//               indentNum: data.indentNum,
//             },
//             {
//               juchu_head_id: data.juchuHeadId,
//               juchu_kizai_head_id: data.juchuKizaiHeadId,
//               juchu_kizai_meisai_id: data.juchuKizaiMeisaiId,
//               sagyo_kbn_id: 20,
//               sagyo_den_dat: toJapanTimeStampString(keepJuchuKizaiHeadData.kicsShukoDat as Date),
//               sagyo_id: 1,
//               kizai_id: data.kizaiId,
//               plan_qty: data.kicsKeepQty,
//               dspOrdNum: data.dspOrdNum,
//               indentNum: data.indentNum,
//             },
//             {
//               juchu_head_id: data.juchuHeadId,
//               juchu_kizai_head_id: data.juchuKizaiHeadId,
//               juchu_kizai_meisai_id: data.juchuKizaiMeisaiId,
//               sagyo_kbn_id: 30,
//               sagyo_den_dat: toJapanTimeStampString(keepJuchuKizaiHeadData.kicsNyukoDat as Date),
//               sagyo_id: 1,
//               kizai_id: data.kizaiId,
//               plan_qty: data.kicsKeepQty,
//               dspOrdNum: data.dspOrdNum,
//               indentNum: data.indentNum,
//             },
//           ]
//         : null;
//     const yardData =
//       !data.delFlag && data.yardKeepQty
//         ? [
//             {
//               juchu_head_id: data.juchuHeadId,
//               juchu_kizai_head_id: data.juchuKizaiHeadId,
//               juchu_kizai_meisai_id: data.juchuKizaiMeisaiId,
//               sagyo_kbn_id: 10,
//               sagyo_den_dat: toJapanTimeStampString(keepJuchuKizaiHeadData.yardShukoDat as Date),
//               sagyo_id: 2,
//               kizai_id: data.kizaiId,
//               plan_qty: data.yardKeepQty,
//               dspOrdNum: data.dspOrdNum,
//               indentNum: data.indentNum,
//             },
//             {
//               juchu_head_id: data.juchuHeadId,
//               juchu_kizai_head_id: data.juchuKizaiHeadId,
//               juchu_kizai_meisai_id: data.juchuKizaiMeisaiId,
//               sagyo_kbn_id: 20,
//               sagyo_den_dat: toJapanTimeStampString(keepJuchuKizaiHeadData.yardShukoDat as Date),
//               sagyo_id: 2,
//               kizai_id: data.kizaiId,
//               plan_qty: data.yardKeepQty,
//               dspOrdNum: data.dspOrdNum,
//               indentNum: data.indentNum,
//             },
//             {
//               juchu_head_id: data.juchuHeadId,
//               juchu_kizai_head_id: data.juchuKizaiHeadId,
//               juchu_kizai_meisai_id: data.juchuKizaiMeisaiId,
//               sagyo_kbn_id: 30,
//               sagyo_den_dat: toJapanTimeStampString(keepJuchuKizaiHeadData.yardNyukoDat as Date),
//               sagyo_id: 2,
//               kizai_id: data.kizaiId,
//               plan_qty: data.yardKeepQty,
//               dspOrdNum: data.dspOrdNum,
//               indentNum: data.indentNum,
//             },
//           ]
//         : null;
//     const kicsConfirmData = {
//       juchu_head_id: data.juchuHeadId,
//       juchu_kizai_head_id: data.juchuKizaiHeadId,
//       juchu_kizai_meisai_id: data.juchuKizaiMeisaiId,
//       kizai_id: data.kizaiId,
//       sagyo_id: 1,
//     };
//     const yardConfirmData = {
//       juchu_head_id: data.juchuHeadId,
//       juchu_kizai_head_id: data.juchuKizaiHeadId,
//       juchu_kizai_meisai_id: data.juchuKizaiMeisaiId,
//       kizai_id: data.kizaiId,
//       sagyo_id: 2,
//     };

//     try {
//       const kicsConfirmResult = await selectContainerNyushukoDenConfirm(kicsConfirmData);
//       const yardConfirmResult = await selectContainerNyushukoDenConfirm(yardConfirmData);

//       if (kicsConfirmResult.data && kicsConfirmResult.data.length > 0 && kicsData) {
//         for (const data of kicsData) {
//           await updateNyushukoDen(
//             {
//               ...data,
//               upd_dat: toJapanTimeString(),
//               upd_user: userNam,
//             },
//             connection
//           );
//         }
//       } else if (kicsConfirmResult.data && kicsConfirmResult.data.length > 0 && !kicsData) {
//         await deleteContainerNyushukoDen(kicsConfirmData, connection);
//       } else if (kicsConfirmResult!.data && kicsData) {
//         await insertNyushukoDen(
//           kicsData.map((d) => ({
//             ...d,
//             add_dat: toJapanTimeString(),
//             add_user: userNam,
//           })),
//           connection
//         );
//       }
//       if (yardConfirmResult.data && yardConfirmResult.data.length > 0 && yardData) {
//         for (const data of yardData) {
//           await updateNyushukoDen(
//             {
//               ...data,
//               upd_dat: toJapanTimeString(),
//               upd_user: userNam,
//             },
//             connection
//           );
//         }
//       } else if (yardConfirmResult.data && yardConfirmResult.data.length > 0 && !yardData) {
//         await deleteContainerNyushukoDen(yardConfirmData, connection);
//       } else if (yardConfirmResult!.data && yardData) {
//         await insertNyushukoDen(
//           yardData.map((d) => ({
//             ...d,
//             add_dat: toJapanTimeString(),
//             add_user: userNam,
//           })),
//           connection
//         );
//       }
//       console.log('keep container nyushuko den updated successfully:', data);
//     } catch (e) {
//       throw e;
//     }
//   }
//   return true;
// };

// /**
//  * キープ入出庫確定更新
//  * @param data キープ受注機材ヘッダーデータ
//  * @param kics KICS機材判定
//  * @param yard YARD機材判定
//  * @param userNam ユーザー名
//  * @returns
//  */
// export const updKeepNyushukoFix = async (
//   data: KeepJuchuKizaiHeadValues,
//   kics: boolean,
//   yard: boolean,
//   userNam: string,
//   connection: PoolClient
// ) => {
//   const kicsData: NyushukoFix[] = [
//     {
//       juchu_head_id: data.juchuHeadId,
//       juchu_kizai_head_id: data.juchuKizaiHeadId,
//       sagyo_kbn_id: 60,
//       sagyo_den_dat: toJapanTimeStampString(data.kicsShukoDat as Date),
//       sagyo_id: 1,
//     },
//     {
//       juchu_head_id: data.juchuHeadId,
//       juchu_kizai_head_id: data.juchuKizaiHeadId,
//       sagyo_kbn_id: 70,
//       sagyo_den_dat: toJapanTimeStampString(data.kicsNyukoDat as Date),
//       sagyo_id: 1,
//     },
//   ];
//   const yardData: NyushukoFix[] = [
//     {
//       juchu_head_id: data.juchuHeadId,
//       juchu_kizai_head_id: data.juchuKizaiHeadId,
//       sagyo_kbn_id: 60,
//       sagyo_den_dat: toJapanTimeStampString(data.yardShukoDat as Date),
//       sagyo_id: 2,
//     },
//     {
//       juchu_head_id: data.juchuHeadId,
//       juchu_kizai_head_id: data.juchuKizaiHeadId,
//       sagyo_kbn_id: 70,
//       sagyo_den_dat: toJapanTimeStampString(data.yardNyukoDat as Date),
//       sagyo_id: 2,
//     },
//   ];

//   const kicsConfirmData = {
//     juchu_head_id: data.juchuHeadId,
//     juchu_kizai_head_id: data.juchuKizaiHeadId,
//     sagyo_id: 1,
//   };
//   const yardConfirmData = {
//     juchu_head_id: data.juchuHeadId,
//     juchu_kizai_head_id: data.juchuKizaiHeadId,
//     sagyo_id: 2,
//   };

//   try {
//     const kicsConfirmResult = await selectNyushukoFixConfirm(kicsConfirmData);
//     const yardConfirmResult = await selectNyushukoFixConfirm(yardConfirmData);

//     // KICS更新
//     if (kicsConfirmResult.data && kicsConfirmResult.data.length > 0 && kics) {
//       for (const data of kicsData) {
//         await updateNyushukoFix(
//           {
//             ...data,
//             upd_dat: toJapanTimeString(),
//             upd_user: userNam,
//           },
//           connection
//         );
//       }
//       // KICS削除
//     } else if (kicsConfirmResult.data && kicsConfirmResult.data.length > 0 && !kics) {
//       await deleteNyushukoFix(kicsConfirmData, connection);
//       // KICS追加
//     } else if (kicsConfirmResult!.data && kics) {
//       await insertNyushukoFix(
//         kicsData.map((d) => ({
//           ...d,
//           sagyo_fix_flg: 0,
//           add_dat: toJapanTimeString(),
//           add_user: userNam,
//         })),
//         connection
//       );
//     }

//     // YARD更新
//     if (yardConfirmResult.data && yardConfirmResult.data.length > 0 && yard) {
//       for (const data of yardData) {
//         await updateNyushukoFix(
//           {
//             ...data,
//             upd_dat: toJapanTimeString(),
//             upd_user: userNam,
//           },
//           connection
//         );
//       }
//       // YARD削除
//     } else if (yardConfirmResult.data && yardConfirmResult.data.length > 0 && !yard) {
//       await deleteNyushukoFix(yardConfirmData, connection);
//       // YARD追加
//     } else if (yardConfirmResult!.data && yard) {
//       await insertNyushukoFix(
//         yardData.map((d) => ({
//           ...d,
//           sagyo_fix_flg: 0,
//           add_dat: toJapanTimeString(),
//           add_user: userNam,
//         })),
//         connection
//       );
//     }
//     console.log('keep nyushuko fix updated successfully:', data);
//     return true;
//   } catch (e) {
//     console.error(e);
//     throw e;
//   }
// };

/**
 * 入出庫実績削除
 * @param juchuKizaiMeisaiData 受注機材明細データ
 * @param connection
 * @returns
 */
export const delNyushukoResult = async (juchuKizaiMeisaiData: KeepJuchuKizaiMeisaiValues[], connection: PoolClient) => {
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
