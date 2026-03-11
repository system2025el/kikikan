'use server';

import { revalidatePath } from 'next/cache';
import { PoolClient } from 'pg';

import pool from '@/app/_lib/db/postgres';
import { selectMeisaiEqts } from '@/app/_lib/db/tables/m-kizai';
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
  deleteKicsOrYardNyukoDen,
  deleteNyukoDen,
  deleteNyushukoDen,
  insertNyushukoDen,
  selectContainerNyushukoDenConfirm,
  updateNyushukoDen,
  upsertNyushukoDen,
} from '@/app/_lib/db/tables/t-nyushuko-den';
import {
  deleteNyushukoFix,
  insertNyushukoFix,
  selectNyushukoFixConfirm,
  updateNyushukoFix,
} from '@/app/_lib/db/tables/t-nyushuko-fix';
import { deleteKizaiIdNyushukoResult, deleteNyukoResult } from '@/app/_lib/db/tables/t-nyushuko-result';
import { selectJuchuContainerMeisai } from '@/app/_lib/db/tables/v-juchu-ctn-meisai';
import { selectOyaJuchuKizaiMeisai, selectReturnJuchuKizaiMeisai } from '@/app/_lib/db/tables/v-juchu-kizai-meisai';
import { JuchuCtnMeisai } from '@/app/_lib/db/types/t_juchu_ctn_meisai-type';
import { JuchuKizaiHead } from '@/app/_lib/db/types/t-juchu-kizai-head-type';
import { JuchuKizaiMeisai } from '@/app/_lib/db/types/t-juchu-kizai-meisai-type';
import { NyushukoDen } from '@/app/_lib/db/types/t-nyushuko-den-type';
import {
  addAllHonbanbi,
  addDummyNyushukoDen,
  addJuchuKizaiNyushuko,
  delAllKicsOrYardNyukoDen,
  delAllNyukoResult,
  delAllNyushukoDen,
  delNyushukoCtnResult,
  delSiyouHonbanbi,
  getJuchuContainerMeisaiMaxId,
  getJuchuKizaiHeadMaxId,
  getJuchuKizaiMeisaiMaxId,
  getJuchuKizaiNyushuko,
  updJuchuKizaiNyushuko,
} from '@/app/(main)/(eq-order-detail)/_lib/funcs';
import { JuchuKizaiHonbanbiValues } from '@/app/(main)/(eq-order-detail)/eq-main-order-detail/[juchuHeadId]/[juchuKizaiHeadId]/[mode]/_lib/types';

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

    // ダミー入庫伝票追加
    if (data.kicsNyukoDat) {
      await addDummyNyushukoDen(data.juchuHeadId, newJuchuKizaiHeadId, data.kicsNyukoDat, 1, userNam, connection);
    }
    if (data.yardNyukoDat) {
      await addDummyNyushukoDen(data.juchuHeadId, newJuchuKizaiHeadId, data.yardNyukoDat, 2, userNam, connection);
    }

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
  checkKicsDat: boolean,
  checkYardDat: boolean,
  originKicsNyukoDat: Date | null | undefined,
  originYardNyukoDat: Date | null | undefined,
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

      // 受注機材本番日(使用中)更新
      const addReturnJuchuSiyouHonbanbiData: JuchuKizaiHonbanbiValues[] = updateDateRange.map((d) => ({
        juchuHeadId: data.juchuHeadId,
        juchuKizaiHeadId: data.juchuKizaiHeadId,
        juchuHonbanbiShubetuId: 1,
        juchuHonbanbiDat: new Date(d),
        mem: '',
        juchuHonbanbiAddQty: 0,
      }));
      const deleteReturnSiyouHonbanbiResult = await delSiyouHonbanbi(
        data.juchuHeadId,
        data.juchuKizaiHeadId,
        connection
      );
      const addReturnSiyouHonbanbiResult = await addAllHonbanbi(
        data.juchuHeadId,
        data.juchuKizaiHeadId,
        addReturnJuchuSiyouHonbanbiData,
        userNam,
        connection
      );
    }

    // 受注明細、入庫伝票、入庫実績
    if (checkKicsDat || checkYardDat || checkJuchuKizaiMeisai || checkJuchuContainerMeisai) {
      // 受注機材明細id最大値
      const juchuKizaiMeisaiMaxId = await getJuchuKizaiMeisaiMaxId(data.juchuHeadId, data.juchuKizaiHeadId);
      let newReturnJuchuKizaiMeisaiId = juchuKizaiMeisaiMaxId ? juchuKizaiMeisaiMaxId.juchu_kizai_meisai_id + 1 : 1;
      // 新規機材に明細id割り振り
      const newReturnJuchuKizaiMeisaiData = returnJuchuKizaiMeisaiList.map((data) =>
        data.juchuKizaiMeisaiId === 0 && !data.delFlag
          ? { ...data, juchuKizaiMeisaiId: newReturnJuchuKizaiMeisaiId++ }
          : data
      );

      // 追加明細
      const addReturnJuchuKizaiMeisaiData = newReturnJuchuKizaiMeisaiData.filter(
        (data) => !data.delFlag && !data.saveFlag
      );
      // 更新明細
      const updateReturnJuchuKizaiMeisaiData = newReturnJuchuKizaiMeisaiData.filter(
        (data) => !data.delFlag && data.saveFlag
      );
      // 削除明細
      const deleteReturnJuchuKizaiMeisaiData = newReturnJuchuKizaiMeisaiData.filter(
        (data) => data.delFlag && data.saveFlag
      );

      if (checkJuchuKizaiMeisai) {
        // 削除
        if (deleteReturnJuchuKizaiMeisaiData.length > 0) {
          const deleteMeisaiResult = await delReturnJuchuKizaiMeisai(deleteReturnJuchuKizaiMeisaiData, connection);
        }
        // 追加
        if (addReturnJuchuKizaiMeisaiData.length > 0) {
          const addMeisaiResult = await addReturnJuchuKizaiMeisai(addReturnJuchuKizaiMeisaiData, userNam, connection);
        }
        // 更新
        if (updateReturnJuchuKizaiMeisaiData.length > 0) {
          const updateMeisaiResult = await updReturnJuchuKizaiMeisai(
            updateReturnJuchuKizaiMeisaiData,
            userNam,
            connection
          );
        }
      }

      // 受注コンテナ明細id最大値
      const juchuContainerMeisaiMaxId = await getJuchuContainerMeisaiMaxId(data.juchuHeadId, data.juchuKizaiHeadId);
      let newReturnJuchuContainerMeisaiId = juchuContainerMeisaiMaxId
        ? juchuContainerMeisaiMaxId.juchu_kizai_meisai_id + 1
        : 1;
      // 新規コンテナに明細id割り振り
      const newReturnJuchuContainerMeisaiData = returnJuchuContainerMeisaiList.map((data) =>
        data.juchuKizaiMeisaiId === 0 && !data.delFlag
          ? { ...data, juchuKizaiMeisaiId: newReturnJuchuContainerMeisaiId++ }
          : data
      );

      // 追加コンテナ
      const addReturnJuchuContainerMeisaiData = newReturnJuchuContainerMeisaiData.filter(
        (data) => !data.delFlag && !data.saveFlag
      );
      // 更新コンテナ
      const updateReturnJuchuContainerMeisaiData = newReturnJuchuContainerMeisaiData.filter(
        (data) => !data.delFlag && data.saveFlag
      );
      // 削除コンテナ
      const deleteReturnJuchuContainerMeisaiData = newReturnJuchuContainerMeisaiData.filter(
        (data) => data.delFlag && data.saveFlag
      );

      if (checkJuchuContainerMeisai) {
        // 削除
        if (deleteReturnJuchuContainerMeisaiData.length > 0) {
          const deleteKizaiIds = deleteReturnJuchuContainerMeisaiData.map((data) => data.kizaiId);
          const deleteContainerMeisaiResult = await delReturnJuchuContainerMeisai(
            data.juchuHeadId,
            data.juchuKizaiHeadId,
            deleteKizaiIds,
            connection
          );
        }
        // 追加
        if (addReturnJuchuContainerMeisaiData.length > 0) {
          const addContainerMeisaiResult = await addReturnJuchuContainerMeisai(
            addReturnJuchuContainerMeisaiData,
            userNam,
            connection
          );
        }
        // 更新
        if (updateReturnJuchuContainerMeisaiData.length > 0) {
          const updateContainerMeisaiResult = await updReturnJuchuContainerMeisai(
            updateReturnJuchuContainerMeisaiData,
            userNam,
            connection
          );
        }
      }

      // 機材入出庫伝票、入出庫実績削除
      if (deleteReturnJuchuKizaiMeisaiData.length > 0) {
        const deleteNyushukoDenResult = await delReturnNyushukoDen(deleteReturnJuchuKizaiMeisaiData, connection);

        const deleteNyushukoResultResult = await delNyushukoResult(deleteReturnJuchuKizaiMeisaiData, connection);
      }

      // コンテナ入出庫伝票、入出庫実績削除
      if (deleteReturnJuchuContainerMeisaiData.length > 0) {
        const deleteCtnNyushukoDenResult = await delCtnNyukoDen(deleteReturnJuchuContainerMeisaiData, connection);

        const deleteIds = deleteReturnJuchuContainerMeisaiData.map((d) => d.kizaiId);
        if (deleteIds.length > 0) {
          const deleteKicsContainerNyushukoResultResult = await delNyushukoCtnResult(
            data.juchuHeadId,
            data.juchuKizaiHeadId,
            deleteIds,
            connection
          );
        }
      }

      if (checkKicsDat) {
        const deleteAllKicsNyukoDenResult = await delAllKicsOrYardNyukoDen(
          data.juchuHeadId,
          data.juchuKizaiHeadId,
          1,
          connection
        );

        const deleteAllKicsNyukoResultResult = await delAllNyukoResult(
          data.juchuHeadId,
          data.juchuKizaiHeadId,
          1,
          connection
        );

        if (data.kicsNyukoDat && data.yardNyukoDat && !checkYardDat) {
          const kicsNyukoData = newReturnJuchuKizaiMeisaiData.filter((d) => !d.delFlag && d.mShozokuId === 1);

          if (kicsNyukoData.length) {
            await delReturnKicsOrYardNyukoDen(kicsNyukoData, 2, connection);

            await delNyukoResult(kicsNyukoData, 2, connection);
          }
        }

        // ダミーKICS入庫伝票追加
        if (data.kicsNyukoDat) {
          await addDummyNyushukoDen(data.juchuHeadId, data.juchuKizaiHeadId, data.kicsNyukoDat, 1, userNam, connection);
        }
      }

      if (checkYardDat) {
        const deleteAllYardNyukoDenResult = await delAllKicsOrYardNyukoDen(
          data.juchuHeadId,
          data.juchuKizaiHeadId,
          2,
          connection
        );

        const deleteAllYardNyukoResultResult = await delAllNyukoResult(
          data.juchuHeadId,
          data.juchuKizaiHeadId,
          2,
          connection
        );

        if (data.kicsNyukoDat && data.yardNyukoDat && !checkKicsDat) {
          const yardNyukoData = newReturnJuchuKizaiMeisaiData.filter((d) => !d.delFlag && d.mShozokuId === 2);

          if (yardNyukoData.length) {
            await delReturnKicsOrYardNyukoDen(yardNyukoData, 1, connection);

            await delNyukoResult(yardNyukoData, 1, connection);
          }
        }

        // ダミーYARD入庫伝票追加
        if (data.yardNyukoDat) {
          await addDummyNyushukoDen(data.juchuHeadId, data.juchuKizaiHeadId, data.yardNyukoDat, 2, userNam, connection);
        }
      }

      // 入庫追加更新
      if (data.kicsNyukoDat && data.yardNyukoDat) {
        // KICS入庫明細
        const kicsNyukoData = newReturnJuchuKizaiMeisaiData.filter((d) => !d.delFlag && d.mShozokuId === 1);
        // YARD入庫明細
        const yardNyukoData = newReturnJuchuKizaiMeisaiData.filter((d) => !d.delFlag && d.mShozokuId === 2);

        if (kicsNyukoData.length > 0) {
          const upsertKicsNyukoDenResult = await upsNyukoDen(kicsNyukoData, data.kicsNyukoDat, 1, userNam, connection);
        }

        if (yardNyukoData.length > 0) {
          const upsertYardNyukoDenResult = await upsNyukoDen(yardNyukoData, data.yardNyukoDat, 2, userNam, connection);
        }

        // コンテナ入庫明細
        const ctnNyukoData = newReturnJuchuContainerMeisaiData.filter((d) => !d.delFlag);
        if (ctnNyukoData.length > 0) {
          const upsertKicsCtnNyukoDenResult = await upsCtnNyukoDen(
            ctnNyukoData,
            data.kicsNyukoDat,
            1,
            1,
            userNam,
            connection
          );

          const upsertYardCtnNyukoDenResult = await upsCtnNyukoDen(
            ctnNyukoData,
            data.yardNyukoDat,
            2,
            2,
            userNam,
            connection
          );
        }
      } else if (data.kicsNyukoDat && !data.yardNyukoDat) {
        // KICS機材明細
        const kicsNyukoData = newReturnJuchuKizaiMeisaiData.filter((d) => !d.delFlag);

        if (kicsNyukoData.length > 0) {
          const upsertKicsNyukoDenResult = await upsNyukoDen(kicsNyukoData, data.kicsNyukoDat, 1, userNam, connection);
        }

        // KICSコンテナ入庫明細
        const ctnNyukoData = newReturnJuchuContainerMeisaiData.filter((d) => !d.delFlag);
        if (ctnNyukoData.length > 0) {
          const upsertCtnNyukoDenResult = await upsCtnNyukoDen(
            ctnNyukoData,
            data.kicsNyukoDat,
            1,
            3,
            userNam,
            connection
          );
        }
      } else if (!data.kicsNyukoDat && data.yardNyukoDat) {
        // YARD機材明細
        const yardNyukoData = newReturnJuchuKizaiMeisaiData.filter((d) => !d.delFlag);

        if (yardNyukoData.length > 0) {
          const upsertNyukoDenResult = await upsNyukoDen(yardNyukoData, data.yardNyukoDat, 2, userNam, connection);
        }

        // YARDコンテナ入庫明細
        const ctnNyukoData = newReturnJuchuContainerMeisaiData.filter((d) => !d.delFlag);
        if (ctnNyukoData.length > 0) {
          const upsertCtnNyukoDenResult = await upsCtnNyukoDen(
            ctnNyukoData,
            data.yardNyukoDat,
            2,
            3,
            userNam,
            connection
          );
        }
      }
    }

    await connection.query('COMMIT');

    await revalidatePath('/eqpt-order-list');
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
 * 親受注機材本番日数取得
 * @param juchuHeadId 受注ヘッダーid
 * @param juchuKizaiHeadId 受注機材ヘッダーid
 * @returns
 */
export const getJuchuHonbanbiQty = async (juchuHeadId: number, juchuKizaiHeadId: number) => {
  try {
    const { data, error } = await selectJuchuHonbanbiQty(juchuHeadId, juchuKizaiHeadId);
    if (error) {
      if (error.code === 'PGRST116') {
        return null;
      }
      console.error('getJuchuHonbanbiQty error : ', error);
      throw error;
    }

    return data.juchu_honbanbi_qty;
  } catch (e) {
    console.error(e);
    throw e;
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
    if (error) {
      if (error.code === 'PGRST116') {
        return null;
      }
      console.error('GetEqHeader juchuKizaiHead error : ', error);
      throw error;
    }

    if (data?.oya_juchu_kizai_head_id === null) {
      console.error('親受注機材ヘッダーidが存在しません');
      return null;
    }

    const juchuDate = await getJuchuKizaiNyushuko(juchuHeadId, juchuKizaiHeadId);

    if (!juchuDate) throw new Error('受注機材入出庫日が存在しません');

    const returnJucuKizaiHeadData: ReturnJuchuKizaiHeadValues = {
      juchuHeadId: data.juchu_head_id,
      juchuKizaiHeadId: data.juchu_kizai_head_id,
      juchuKizaiHeadKbn: data.juchu_kizai_head_kbn,
      juchuHonbanbiQty: data.juchu_honbanbi_qty,
      //nebikiAmt: data.nebiki_amt,
      mem: data.mem ? data.mem : '',
      headNam: data.head_nam ?? '',
      oyaJuchuKizaiHeadId: data.oya_juchu_kizai_head_id,
      kicsNyukoDat: juchuDate.kicsNyukoDat ? new Date(juchuDate.kicsNyukoDat) : null,
      yardNyukoDat: juchuDate.yardNyukoDat ? new Date(juchuDate.yardNyukoDat) : null,
    };

    return returnJucuKizaiHeadData;
  } catch (e) {
    console.error(e);
    throw e;
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
    //nebiki_amt: returnJuchuKizaiHeadData.nebikiAmt,
    mem: returnJuchuKizaiHeadData.mem,
    head_nam: returnJuchuKizaiHeadData.headNam,
    oya_juchu_kizai_head_id: returnJuchuKizaiHeadData.oyaJuchuKizaiHeadId,
    ht_kbn: 0,
    add_dat: new Date().toISOString(),
    add_user: userNam,
  };
  try {
    await insertReturnJuchuKizaiHead(newData, connection);
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
    //nebiki_amt: juchuKizaiHeadData.nebikiAmt,
    mem: juchuKizaiHeadData.mem,
    head_nam: juchuKizaiHeadData.headNam,
    oya_juchu_kizai_head_id: juchuKizaiHeadData.oyaJuchuKizaiHeadId,
    ht_kbn: 0,
    upd_dat: new Date().toISOString(),
    upd_user: userNam,
  };

  try {
    await updateReturnJuchuKizaiHead(updateData, connection);
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
      throw returnError;
    }

    const eqIds = [...new Set(returnData.map((data) => data.kizai_id))];

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

    const { data: oyaData, error: oyaError } = await selectOyaJuchuKizaiMeisai(juchuHeadId, oyaJuchuKizaiHeadId);
    if (oyaError) {
      console.error('GetKeeoEqList oya eqList error : ', oyaError);
      throw oyaError;
    }

    const returnJuchuKizaiMeisaiData: ReturnJuchuKizaiMeisaiValues[] = returnData.map((d) => ({
      juchuHeadId: d.juchu_head_id,
      juchuKizaiHeadId: d.juchu_kizai_head_id,
      juchuKizaiMeisaiId: d.juchu_kizai_meisai_id,
      mShozokuId: mKizai.find((data) => data.kizai_id === d.kizai_id)?.shozoku_id ?? 0,
      shozokuId: d.shozoku_id,
      shozokuNam: d.shozoku_nam ?? '',
      mem: d.mem,
      kizaiId: d.kizai_id,
      kizaiTankaAmt: eqTanka.find((t) => t.kizai_id === d.kizai_id)?.kizai_tanka_amt || 0,
      kizaiNam: d.kizai_nam ?? '',
      oyaPlanKizaiQty: oyaData.find((oya) => oya.dsp_ord_num === d.dsp_ord_num)?.plan_kizai_qty ?? 0,
      oyaPlanYobiQty: oyaData.find((oya) => oya.dsp_ord_num === d.dsp_ord_num)?.plan_yobi_qty ?? 0,
      planQty: d.plan_kizai_qty ? -1 * d.plan_kizai_qty : 0,
      dspOrdNum: d.dsp_ord_num ?? 0,
      indentNum: d.indent_num ?? 0,
      delFlag: false,
      saveFlag: true,
    }));
    return returnJuchuKizaiMeisaiData;
  } catch (e) {
    console.error(e);
    throw e;
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
    plan_kizai_qty: d.planQty ? -1 * d.planQty : d.planQty,
    mem: d.mem,
    dsp_ord_num: d.dspOrdNum,
    indent_num: d.indentNum,
    add_dat: new Date().toISOString(),
    add_user: userNam,
    shozoku_id: d.shozokuId,
  }));
  try {
    await insertJuchuKizaiMeisai(newData, connection);
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
    plan_kizai_qty: d.planQty ? -1 * d.planQty : d.planQty,
    mem: d.mem,
    dsp_ord_num: d.dspOrdNum,
    indent_num: d.indentNum,
    upd_dat: new Date().toISOString(),
    upd_user: userNam,
    shozoku_id: d.shozokuId,
  }));

  try {
    for (const data of updateData) {
      await updateJuchuKizaiMeisai(data, connection);
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
  returnJuchuKizaiMeisaiData: ReturnJuchuKizaiMeisaiValues[],
  connection: PoolClient
) => {
  const deleteData = returnJuchuKizaiMeisaiData.map((d) => ({
    juchu_head_id: d.juchuHeadId,
    juchu_kizai_head_id: d.juchuKizaiHeadId,
    juchu_kizai_meisai_id: d.juchuKizaiMeisaiId,
    kizai_id: d.kizaiId,
  }));
  try {
    for (const data of deleteData) {
      await deleteJuchuKizaiMeisai(data, connection);
    }
    return true;
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
      throw containerError;
    }

    const { data: oyaData, error: oyaError } = await selectJuchuContainerMeisai(juchuHeadId, oyaJuchuKizaiHeadId);
    if (oyaError) {
      console.error('GetReturnCOntainerList oya containerList error : ', oyaError);
      throw oyaError;
    }

    const returnJuchuContainerMeisaiData: ReturnJuchuContainerMeisaiValues[] = containerData.map((d) => ({
      juchuHeadId: d.juchu_head_id ?? 0,
      juchuKizaiHeadId: d.juchu_kizai_head_id ?? 0,
      juchuKizaiMeisaiId: d.juchu_kizai_meisai_id ?? 0,
      mem: d.mem,
      kizaiId: d.kizai_id ?? 0,
      kizaiNam: d.kizai_nam ?? '',
      oyaPlanKicsKizaiQty: oyaData.find((oya) => oya.kizai_id === d.kizai_id)?.kics_plan_kizai_qty ?? 0,
      oyaPlanYardKizaiQty: oyaData.find((oya) => oya.kizai_id === d.kizai_id)?.yard_plan_kizai_qty ?? 0,
      planKicsKizaiQty: d.kics_plan_kizai_qty ? -1 * d.kics_plan_kizai_qty : 0,
      planYardKizaiQty: d.yard_plan_kizai_qty ? -1 * d.yard_plan_kizai_qty : 0,
      planQty: -1 * ((d.kics_plan_kizai_qty ?? 0) + (d.yard_plan_kizai_qty ?? 0)),
      dspOrdNum: d.dsp_ord_num ?? 0,
      indentNum: 0,
      delFlag: false,
      saveFlag: true,
    }));
    return returnJuchuContainerMeisaiData;
  } catch (e) {
    console.error(e);
    throw e;
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
    dsp_ord_num: d.dspOrdNum,
    indent_num: d.indentNum,
    add_dat: new Date().toISOString(),
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
    dsp_ord_num: d.dspOrdNum,
    indent_num: d.indentNum,
    add_dat: new Date().toISOString(),
    add_user: userNam,
  }));

  const mergeData = [...newKicsData, ...newYardData];

  try {
    await insertJuchuContainerMeisai(mergeData, connection);
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
    dsp_ord_num: d.dspOrdNum,
    indent_num: d.indentNum,
    upd_dat: new Date().toISOString(),
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
    dsp_ord_num: d.dspOrdNum,
    indent_num: d.indentNum,
    upd_dat: new Date().toISOString(),
    upd_user: userNam,
  }));

  const mergeData = [...updateKicsData, ...updateYardData];

  try {
    for (const data of mergeData) {
      await updateJuchuContainerMeisai(data, connection);
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
        ? returnJuchuKizaiHeadData.kicsNyukoDat!.toISOString()
        : returnJuchuKizaiHeadData.yardNyukoDat!.toISOString(),
    sagyo_id: d.shozokuId,
    kizai_id: d.kizaiId,
    plan_qty: d.planQty,
    dsp_ord_num: d.dspOrdNum,
    indent_num: d.indentNum,
    add_dat: new Date().toISOString(),
    add_user: userNam,
  }));

  try {
    await insertNyushukoDen(newReturnNyukoCheckData, connection);
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
        ? returnJuchuKizaiHeadData.kicsNyukoDat!.toISOString()
        : returnJuchuKizaiHeadData.yardNyukoDat!.toISOString(),
    sagyo_id: d.shozokuId,
    kizai_id: d.kizaiId,
    plan_qty: d.planQty,
    dsp_ord_num: d.dspOrdNum,
    indent_num: d.indentNum,
    add_dat: new Date().toISOString(),
    add_user: userNam,
  }));

  try {
    for (const data of updateReturnNyukoCheckData) {
      await updateNyushukoDen(data, connection);
    }
    return true;
  } catch (e) {
    console.error('Exception while updating return nyushuko den:', e);
    throw e;
  }
};

/**
 * 入庫伝票追加更新
 * @param juchuKizaiMeisaiData
 * @param shukoDat
 * @param sagyoId
 * @param userNam
 * @param connection
 */
export const upsNyukoDen = async (
  juchuKizaiMeisaiData: ReturnJuchuKizaiMeisaiValues[],
  nyukoDat: Date,
  sagyoId: number,
  userNam: string,
  connection: PoolClient
) => {
  const newData: NyushukoDen[] = juchuKizaiMeisaiData.map((d) => ({
    juchu_head_id: d.juchuHeadId,
    juchu_kizai_head_id: d.juchuKizaiHeadId,
    juchu_kizai_meisai_id: d.juchuKizaiMeisaiId,
    sagyo_kbn_id: 30,
    sagyo_den_dat: nyukoDat.toISOString(),
    sagyo_id: sagyoId,
    kizai_id: d.kizaiId,
    plan_qty: d.planQty,
    dsp_ord_num: d.dspOrdNum,
    indent_num: d.indentNum,
    add_dat: new Date().toISOString(),
    add_user: userNam,
  }));

  try {
    await upsertNyushukoDen(newData, connection);
  } catch (e) {
    console.error('Exception while updating nyuko den:', e);
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
  returnJuchuKizaiMeisaiData: ReturnJuchuKizaiMeisaiValues[],
  connection: PoolClient
) => {
  const deleteData = returnJuchuKizaiMeisaiData.map((d) => ({
    juchu_head_id: d.juchuHeadId,
    juchu_kizai_head_id: d.juchuKizaiHeadId,
    juchu_kizai_meisai_id: d.juchuKizaiMeisaiId,
    kizai_id: d.kizaiId,
  }));
  try {
    for (const data of deleteData) {
      await deleteNyushukoDen(data, connection);
    }
    return true;
  } catch (e) {
    throw e;
  }
};

/**
 * 返却入庫伝票削除(KICS/YARD)
 * @param juchuKizaiMeisaiData
 * @param sagyoId
 * @param connection
 */
export const delReturnKicsOrYardNyukoDen = async (
  juchuKizaiMeisaiData: ReturnJuchuKizaiMeisaiValues[],
  sagyoId: number,
  connection: PoolClient
) => {
  const deleteData = juchuKizaiMeisaiData.map((d) => ({
    juchu_head_id: d.juchuHeadId,
    juchu_kizai_head_id: d.juchuKizaiHeadId,
    juchu_kizai_meisai_id: d.juchuKizaiMeisaiId,
    kizai_id: d.kizaiId,
    sagyo_id: sagyoId,
  }));

  try {
    for (const data of deleteData) {
      await deleteKicsOrYardNyukoDen(data, connection);
    }
  } catch (e) {
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
  juchuCtnMeisaiData: ReturnJuchuContainerMeisaiValues[],
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
    sagyo_den_dat: nyukoDat.toISOString(),
    sagyo_id: sagyoId,
    kizai_id: d.kizaiId,
    plan_qty: sagyoId === 1 ? d.planKicsKizaiQty : d.planYardKizaiQty,
    dsp_ord_num: d.dspOrdNum,
    indent_num: d.indentNum,
    add_dat: new Date().toISOString(),
    add_user: userNam,
  }));

  try {
    await insertNyushukoDen(newCtnNyukoCheckData, connection);
    return true;
  } catch (e) {
    console.error('Exception while adding return ctn nyuko den:', e);
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
  juchuCtnMeisaiData: ReturnJuchuContainerMeisaiValues[],
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
    sagyo_den_dat: nyukoDat.toISOString(),
    sagyo_id: sagyoId,
    kizai_id: d.kizaiId,
    plan_qty: sagyoId === 1 ? d.planKicsKizaiQty : d.planYardKizaiQty,
    dsp_ord_num: d.dspOrdNum,
    indent_num: d.indentNum,
    upd_dat: new Date().toISOString(),
    upd_user: userNam,
  }));

  try {
    for (const data of updCtnNyukoCheckData) {
      await updateNyushukoDen(data, connection);
    }
    return true;
  } catch (e) {
    console.error('Exception while update return ctn nyuko den:', e);
    throw e;
  }
};

/**
 * コンテナ入庫伝票追加更新
 * @param juchuKizaiMeisaiData
 * @param shukoDat
 * @param sagyoId
 * @param userNam
 * @param connection
 */
export const upsCtnNyukoDen = async (
  juchuContainerMeisaiData: ReturnJuchuContainerMeisaiValues[],
  nyukoDat: Date,
  sagyoId: number,
  planQtyId: number,
  userNam: string,
  connection: PoolClient
) => {
  const upsertCtnNyukoData: NyushukoDen[] = juchuContainerMeisaiData.map((d) => ({
    juchu_head_id: d.juchuHeadId,
    juchu_kizai_head_id: d.juchuKizaiHeadId,
    juchu_kizai_meisai_id: d.juchuKizaiMeisaiId,
    sagyo_kbn_id: 30,
    sagyo_den_dat: nyukoDat.toISOString(),
    sagyo_id: sagyoId,
    kizai_id: d.kizaiId,
    plan_qty: planQtyId === 1 ? d.planKicsKizaiQty : planQtyId === 2 ? d.planYardKizaiQty : d.planQty,
    dsp_ord_num: d.dspOrdNum,
    indent_num: d.indentNum,
    add_dat: new Date().toISOString(),
    add_user: userNam,
  }));

  try {
    await upsertNyushukoDen(upsertCtnNyukoData, connection);
  } catch (e) {
    console.error('Exception while updating ctn nyuko den:', e);
    throw e;
  }
};

/**
 * コンテナ入庫伝票削除
 * @param returnJuchuKizaiMeisaiData キープ受注コンテナ明細データ
 * @param connection
 * @returns
 */
export const delCtnNyukoDen = async (
  returnJuchuContainerMeisaiData: ReturnJuchuContainerMeisaiValues[],
  connection: PoolClient
) => {
  const deleteData = returnJuchuContainerMeisaiData.map((d) => ({
    juchu_head_id: d.juchuHeadId,
    juchu_kizai_head_id: d.juchuKizaiHeadId,
    juchu_kizai_meisai_id: d.juchuKizaiMeisaiId,
    kizai_id: d.kizaiId,
  }));
  try {
    for (const data of deleteData) {
      await deleteNyukoDen(data, connection);
    }
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
export const delNyushukoResult = async (
  juchuKizaiMeisaiData: ReturnJuchuKizaiMeisaiValues[],
  connection: PoolClient
) => {
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
 * 入庫実績削除
 * @param juchuKizaiMeisaiData 受注機材明細データ
 * @param connection
 * @returns
 */
export const delNyukoResult = async (
  juchuKizaiMeisaiData: ReturnJuchuKizaiMeisaiValues[],
  sagyoId: number,
  connection: PoolClient
) => {
  const deleteData = juchuKizaiMeisaiData.map((d) => ({
    juchuHeadId: d.juchuHeadId,
    juchuKizaiHeadId: d.juchuKizaiHeadId,
    juchuKizaiMeisaiId: d.juchuKizaiMeisaiId,
    kizaiId: d.kizaiId,
    sagyoId: sagyoId,
  }));
  try {
    for (const data of deleteData) {
      await deleteNyukoResult(
        data.juchuHeadId,
        data.juchuKizaiHeadId,
        data.juchuKizaiMeisaiId,
        data.kizaiId,
        sagyoId,
        connection
      );
    }
    return true;
  } catch (e) {
    throw e;
  }
};
