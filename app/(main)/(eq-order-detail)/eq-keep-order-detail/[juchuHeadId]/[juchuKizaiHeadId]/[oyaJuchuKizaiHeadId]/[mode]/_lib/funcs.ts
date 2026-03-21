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
  deleteKicsOrYardNyukoDen,
  deleteKicsOrYardShukoDen,
  deleteNyukoDen,
  deleteNyushukoDen,
  deleteShukoDen,
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
import {
  deleteKizaiIdNyukoResult,
  deleteKizaiIdNyushukoResult,
  deleteKizaiIdShukoResult,
  deleteNyukoResult,
  deleteShukoResult,
} from '@/app/_lib/db/tables/t-nyushuko-result';
import { selectJuchuContainerMeisai } from '@/app/_lib/db/tables/v-juchu-ctn-meisai';
import { selectKeepJuchuKizaiMeisai, selectOyaJuchuKizaiMeisai } from '@/app/_lib/db/tables/v-juchu-kizai-meisai';
import { JuchuCtnMeisai } from '@/app/_lib/db/types/t_juchu_ctn_meisai-type';
import { JuchuKizaiHead } from '@/app/_lib/db/types/t-juchu-kizai-head-type';
import { JuchuKizaiMeisai } from '@/app/_lib/db/types/t-juchu-kizai-meisai-type';
import { NyushukoDen } from '@/app/_lib/db/types/t-nyushuko-den-type';
import {
  addDummyNyushukoDen,
  addJuchuKizaiNyushuko,
  delAllKicsOrYardNyukoDen,
  delAllKicsOrYardShukoDen,
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
    if (e instanceof Error) {
      console.error(`[ERROR] ${e.message}`);
      if (e.cause) {
        console.error(`[CAUSE]`, e.cause);
      }
    } else {
      console.error(e);
    }
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

      if (checkJuchuKizaiMeisai) {
        // 削除
        if (deleteKeepJuchuKizaiMeisaiData.length > 0) {
          const deleteMeisaiResult = await delKeepJuchuKizaiMeisai(deleteKeepJuchuKizaiMeisaiData, connection);
        }
        // 追加
        if (addKeepJuchuKizaiMeisaiData.length > 0) {
          const addMeisaiResult = await addKeepJuchuKizaiMeisai(addKeepJuchuKizaiMeisaiData, userNam, connection);
        }
        // 更新
        if (updateKeepJuchuKizaiMeisaiData.length > 0) {
          const updateMeisaiResult = await updKeepJuchuKizaiMeisai(updateKeepJuchuKizaiMeisaiData, userNam, connection);
        }
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

      if (checkJuchuContainerMeisai) {
        // 削除
        if (deleteKeepJuchuContainerMeisaiData.length > 0) {
          const deleteKizaiIds = deleteKeepJuchuContainerMeisaiData.map((data) => data.kizaiId);
          const deleteContainerMeisaiResult = await delKeepJuchuContainerMeisai(
            data.juchuHeadId,
            data.juchuKizaiHeadId,
            deleteKizaiIds,
            connection
          );
        }
        // 追加
        if (addKeepJuchuContainerMeisaiData.length > 0) {
          const addContainerMeisaiResult = await addKeepJuchuContainerMeisai(
            addKeepJuchuContainerMeisaiData,
            userNam,
            connection
          );
        }
        // 更新
        if (updateKeepJuchuContainerMeisaiData.length > 0) {
          const updateContainerMeisaiResult = await updKeepJuchuContainerMeisai(
            updateKeepJuchuContainerMeisaiData,
            userNam,
            connection
          );
        }
      }

      // 機材入出庫伝票、入出庫実績削除
      if (deleteKeepJuchuKizaiMeisaiData.length > 0) {
        const deleteNyushukoDenResult = await delKeepNyushukoDen(deleteKeepJuchuKizaiMeisaiData, connection);

        const deleteNyushukoResultResult = await delNyushukoResult(deleteKeepJuchuKizaiMeisaiData, connection);
      }

      // コンテナ入出庫伝票、入出庫実績削除
      if (deleteKeepJuchuContainerMeisaiData.length > 0) {
        const deleteCtnNyushukoDenResult = await delCtnNyushukoDen(deleteKeepJuchuContainerMeisaiData, connection);

        const deleteIds = deleteKeepJuchuContainerMeisaiData.map((d) => d.kizaiId);
        if (deleteIds.length > 0) {
          const deleteKicsContainerNyushukoResultResult = await delNyushukoCtnResult(
            data.juchuHeadId,
            data.juchuKizaiHeadId,
            deleteIds,
            connection
          );
        }
      }

      if (checkKicsNyukoDat) {
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

        if (data.kicsNyukoDat && data.yardNyukoDat && !checkYardNyukoDat) {
          const kicsNyukoData = newKeepJuchuKizaiMeisaiData.filter((d) => !d.delFlag && d.shozokuId === 1);

          if (kicsNyukoData.length) {
            await delKeepKicsOrYardNyukoDen(kicsNyukoData, 2, connection);

            await delNyukoResult(kicsNyukoData, 2, connection);
          }
        }

        // ダミーKICS入庫伝票追加
        if (data.kicsNyukoDat) {
          await addDummyNyushukoDen(data.juchuHeadId, data.juchuKizaiHeadId, data.kicsNyukoDat, 1, userNam, connection);
        }
      }

      if (checkYardNyukoDat) {
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

        if (data.kicsNyukoDat && data.yardNyukoDat && !checkKicsNyukoDat) {
          const yardNyukoData = newKeepJuchuKizaiMeisaiData.filter((d) => !d.delFlag && d.shozokuId === 2);

          if (yardNyukoData.length) {
            await delKeepKicsOrYardNyukoDen(yardNyukoData, 1, connection);

            await delNyukoResult(yardNyukoData, 1, connection);
          }
        }

        // ダミーYARD入庫伝票追加
        if (data.yardNyukoDat) {
          await addDummyNyushukoDen(data.juchuHeadId, data.juchuKizaiHeadId, data.yardNyukoDat, 2, userNam, connection);
        }
      }

      if (checkKicsShukoDat) {
        const deleteAllKicsShukoDenResult = await delAllKicsOrYardShukoDen(
          data.juchuHeadId,
          data.juchuKizaiHeadId,
          1,
          connection
        );

        const deleteAllKicsShukoResultResult = await delAllShukoResult(
          data.juchuHeadId,
          data.juchuKizaiHeadId,
          1,
          connection
        );
      }

      if (checkYardShukoDat) {
        const deleteAllYardShukoDenResult = await delAllKicsOrYardShukoDen(
          data.juchuHeadId,
          data.juchuKizaiHeadId,
          2,
          connection
        );

        const deleteAllYardShukoResultResult = await delAllShukoResult(
          data.juchuHeadId,
          data.juchuKizaiHeadId,
          2,
          connection
        );
      }

      // KICS入庫追加更新
      if (data.kicsNyukoDat) {
        // KICS入庫明細
        const kicsNyukoData = newKeepJuchuKizaiMeisaiData.filter((d) => !d.delFlag && d.shozokuId === 1);

        if (kicsNyukoData.length > 0) {
          const upsertKicsNyukoDenResult = await upsNyukoDen(kicsNyukoData, data.kicsNyukoDat, 1, userNam, connection);
        }

        // KICSコンテナ入庫明細
        const ctnNyukoData = newKeepJuchuContainerMeisaiData.filter((d) => !d.delFlag);
        if (ctnNyukoData.length > 0) {
          const upsertKicsCtnNyukoDenResult = await upsCtnNyukoDen(
            ctnNyukoData,
            data.kicsNyukoDat,
            1,
            userNam,
            connection
          );
        }
      }

      // YARD入庫追加更新
      if (data.yardNyukoDat) {
        // YARD入庫明細
        const yardNyukoData = newKeepJuchuKizaiMeisaiData.filter((d) => !d.delFlag && d.shozokuId === 2);

        if (yardNyukoData.length > 0) {
          const upsertYardNyukoDenResult = await upsNyukoDen(yardNyukoData, data.yardNyukoDat, 2, userNam, connection);
        }

        // YARDコンテナ入庫明細
        const ctnNyukoData = newKeepJuchuContainerMeisaiData.filter((d) => !d.delFlag);
        if (ctnNyukoData.length > 0) {
          const upsertYardCtnNyukoDenResult = await upsCtnNyukoDen(
            ctnNyukoData,
            data.yardNyukoDat,
            2,
            userNam,
            connection
          );
        }
      }

      // KICS出庫追加更新
      if (data.kicsShukoDat) {
        const kicsShukoData = newKeepJuchuKizaiMeisaiData.filter((d) => !d.delFlag && d.shozokuId === 1);

        if (kicsShukoData.length > 0) {
          const upsertKicsShukoDenResult = await upsShukoDen(kicsShukoData, data.kicsShukoDat, 1, userNam, connection);
        }

        const KicsCtnShukoData = newKeepJuchuContainerMeisaiData.filter((d) => !d.delFlag);
        if (KicsCtnShukoData.length > 0) {
          const upsertKicsCtnShukoDenResult = await upsCtnShukoDen(
            KicsCtnShukoData,
            data.kicsShukoDat,
            1,
            userNam,
            connection
          );
        }
      }

      // YARD出庫追加更新
      if (data.yardShukoDat) {
        const upsertYardJuchuKizaiMeisaiData = newKeepJuchuKizaiMeisaiData.filter(
          (d) => !d.delFlag && d.shozokuId === 2
        );

        if (upsertYardJuchuKizaiMeisaiData.length > 0) {
          const upsertShukoDenResult = await upsShukoDen(
            upsertYardJuchuKizaiMeisaiData,
            data.yardShukoDat,
            2,
            userNam,
            connection
          );
        }

        const upsertYardJuchuCtnMeisaiData = newKeepJuchuContainerMeisaiData.filter((d) => !d.delFlag);
        if (upsertYardJuchuCtnMeisaiData.length > 0) {
          const upsertCtnShukoDenResult = await upsCtnShukoDen(
            upsertYardJuchuCtnMeisaiData,
            data.yardShukoDat,
            2,
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
    if (e instanceof Error) {
      console.error(`[ERROR] ${e.message}`);
      if (e.cause) {
        console.error(`[CAUSE]`, e.cause);
      }
    } else {
      console.error(e);
    }
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
    if (error) {
      if (error.code === 'PGRST116') {
        console.error('受注ヘッダーが存在しません');
        return null;
      }
      throw new Error('[selectKeepJuchuKizaiHead] DBエラー:', { cause: error });
    }

    if (data.oya_juchu_kizai_head_id === null) {
      console.error('親受注機材ヘッダーidが存在しません');
      return null;
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

    return keepJucuKizaiHeadData;
  } catch (e) {
    if (e instanceof Error) {
      console.error(`[ERROR] ${e.message}`);
      if (e.cause) {
        console.error(`[CAUSE]`, e.cause);
      }
    } else {
      console.error(e);
    }
    throw e;
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
    add_dat: new Date().toISOString(),
    add_user: userNam,
  };
  try {
    await insertKeepJuchuKizaiHead(newData, connection);
    return true;
  } catch (e) {
    if (e instanceof Error) {
      console.error(`[ERROR] ${e.message}`);
      if (e.cause) {
        console.error(`[CAUSE]`, e.cause);
      }
    } else {
      console.error(e);
    }
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
    upd_dat: new Date().toISOString(),
    upd_user: userNam,
  };

  try {
    await updateKeepJuchuKizaiHead(updateData, connection);
    return true;
  } catch (e) {
    if (e instanceof Error) {
      console.error(`[ERROR] ${e.message}`);
      if (e.cause) {
        console.error(`[CAUSE]`, e.cause);
      }
    } else {
      console.error(e);
    }
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
      throw new Error('[selectKeepJuchuKizaiMeisai] DBエラー:', { cause: keepError });
    }

    const eqIds = [...new Set(keepData.map((data) => data.kizai_id))];

    const { data: mKizai, error: mKizaiError } = await selectMeisaiEqts(eqIds);

    if (mKizaiError) {
      throw new Error('[selectMeisaiEqts] DBエラー:', { cause: mKizaiError });
    }

    const { data: oyaData, error: oyaError } = await selectOyaJuchuKizaiMeisai(juchuHeadId, oyaJuchuKizaiHeadId);
    if (oyaError) {
      throw new Error('[selectOyaJuchuKizaiMeisai] DBエラー:', { cause: oyaError });
    }

    const keepJuchuKizaiMeisaiData: KeepJuchuKizaiMeisaiValues[] = keepData.map((d) => ({
      juchuHeadId: d.juchu_head_id,
      juchuKizaiHeadId: d.juchu_kizai_head_id,
      juchuKizaiMeisaiId: d.juchu_kizai_meisai_id,
      mShozokuId: mKizai.find((data) => data.kizai_id === d.kizai_id)?.shozoku_id ?? 0,
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
    if (e instanceof Error) {
      console.error(`[ERROR] ${e.message}`);
      if (e.cause) {
        console.error(`[CAUSE]`, e.cause);
      }
    } else {
      console.error(e);
    }
    throw e;
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
    add_dat: new Date().toISOString(),
    add_user: userNam,
    shozoku_id: d.shozokuId,
  }));

  try {
    await insertJuchuKizaiMeisai(newData, connection);
    return true;
  } catch (e) {
    if (e instanceof Error) {
      console.error(`[ERROR] ${e.message}`);
      if (e.cause) {
        console.error(`[CAUSE]`, e.cause);
      }
    } else {
      console.error(e);
    }
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
    if (e instanceof Error) {
      console.error(`[ERROR] ${e.message}`);
      if (e.cause) {
        console.error(`[CAUSE]`, e.cause);
      }
    } else {
      console.error(e);
    }
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
      throw new Error('[selectJuchuContainerMeisai] DBエラー:', { cause: containerError });
    }

    const { data: oyaData, error: oyaError } = await selectJuchuContainerMeisai(juchuHeadId, oyaJuchuKizaiHeadId);
    if (oyaError) {
      throw new Error('[selectJuchuContainerMeisai] DBエラー:', { cause: oyaError });
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
    if (e instanceof Error) {
      console.error(`[ERROR] ${e.message}`);
      if (e.cause) {
        console.error(`[CAUSE]`, e.cause);
      }
    } else {
      console.error(e);
    }
    throw e;
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
    add_dat: new Date().toISOString(),
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
    add_dat: new Date().toISOString(),
    add_user: userNam,
  }));

  const mergeData = [...newKicsData, ...newYardData];

  try {
    await insertJuchuContainerMeisai(mergeData, connection);
    return true;
  } catch (e) {
    if (e instanceof Error) {
      console.error(`[ERROR] ${e.message}`);
      if (e.cause) {
        console.error(`[CAUSE]`, e.cause);
      }
    } else {
      console.error(e);
    }
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
    upd_dat: new Date().toISOString(),
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
    if (e instanceof Error) {
      console.error(`[ERROR] ${e.message}`);
      if (e.cause) {
        console.error(`[CAUSE]`, e.cause);
      }
    } else {
      console.error(e);
    }
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
    sagyo_den_dat: shukoDat.toISOString(),
    sagyo_id: sagyoId,
    kizai_id: d.kizaiId,
    plan_qty: d.keepQty,
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
    sagyo_den_dat: shukoDat.toISOString(),
    sagyo_id: sagyoId,
    kizai_id: d.kizaiId,
    plan_qty: d.keepQty,
    dsp_ord_num: d.dspOrdNum,
    indent_num: d.indentNum,
    add_dat: new Date().toISOString(),
    add_user: userNam,
  }));

  const mergeData = [...newShukoStandbyData, ...newShukoCheckData];

  try {
    await insertNyushukoDen(mergeData, connection);
    return true;
  } catch (e) {
    if (e instanceof Error) {
      console.error(`[ERROR] ${e.message}`);
      if (e.cause) {
        console.error(`[CAUSE]`, e.cause);
      }
    } else {
      console.error(e);
    }
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
    sagyo_den_dat: shukoDat.toISOString(),
    sagyo_id: sagyoId,
    kizai_id: d.kizaiId,
    plan_qty: d.keepQty,
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
    sagyo_den_dat: shukoDat.toISOString(),
    sagyo_id: sagyoId,
    kizai_id: d.kizaiId,
    plan_qty: d.keepQty,
    dsp_ord_num: d.dspOrdNum,
    indent_num: d.indentNum,
    add_dat: new Date().toISOString(),
    add_user: userNam,
  }));

  const mergeData = [...newShukoStandbyData, ...newShukoCheckData];

  try {
    for (const data of mergeData) {
      await updateNyushukoDen(data, connection);
    }
    return true;
  } catch (e) {
    if (e instanceof Error) {
      console.error(`[ERROR] ${e.message}`);
      if (e.cause) {
        console.error(`[CAUSE]`, e.cause);
      }
    } else {
      console.error(e);
    }
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
        ? juchuKizaiHeadData.kicsNyukoDat!.toISOString()
        : juchuKizaiHeadData.yardNyukoDat!.toISOString(),
    sagyo_id: d.shozokuId,
    kizai_id: d.kizaiId,
    plan_qty: d.keepQty,
    dsp_ord_num: d.dspOrdNum,
    indent_num: d.indentNum,
    add_dat: new Date().toISOString(),
    add_user: userNam,
  }));

  try {
    await insertNyushukoDen(newData, connection);
    return true;
  } catch (e) {
    if (e instanceof Error) {
      console.error(`[ERROR] ${e.message}`);
      if (e.cause) {
        console.error(`[CAUSE]`, e.cause);
      }
    } else {
      console.error(e);
    }
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
        ? juchuKizaiHeadData.kicsNyukoDat!.toISOString()
        : juchuKizaiHeadData.yardNyukoDat!.toISOString(),
    sagyo_id: d.shozokuId,
    kizai_id: d.kizaiId,
    plan_qty: d.keepQty,
    dsp_ord_num: d.dspOrdNum,
    indent_num: d.indentNum,
    add_dat: new Date().toISOString(),
    add_user: userNam,
  }));

  try {
    for (const data of updateNyukoCheckData) {
      await updateNyushukoDen(data, connection);
    }
    return true;
  } catch (e) {
    if (e instanceof Error) {
      console.error(`[ERROR] ${e.message}`);
      if (e.cause) {
        console.error(`[CAUSE]`, e.cause);
      }
    } else {
      console.error(e);
    }
    throw e;
  }
};

/**
 * 出庫伝票追加更新
 * @param juchuKizaiMeisaiData
 * @param shukoDat
 * @param sagyoId
 * @param userNam
 * @param connection
 */
export const upsShukoDen = async (
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
    sagyo_den_dat: shukoDat.toISOString(),
    sagyo_id: sagyoId,
    kizai_id: d.kizaiId,
    plan_qty: d.keepQty,
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
    sagyo_den_dat: shukoDat.toISOString(),
    sagyo_id: sagyoId,
    kizai_id: d.kizaiId,
    plan_qty: d.keepQty,
    dsp_ord_num: d.dspOrdNum,
    indent_num: d.indentNum,
    add_dat: new Date().toISOString(),
    add_user: userNam,
  }));
  const mergeData = [...newShukoStandbyData, ...newShukoCheckData];

  try {
    await upsertNyushukoDen(mergeData, connection);
  } catch (e) {
    if (e instanceof Error) {
      console.error(`[ERROR] ${e.message}`);
      if (e.cause) {
        console.error(`[CAUSE]`, e.cause);
      }
    } else {
      console.error(e);
    }
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
  juchuKizaiMeisaiData: KeepJuchuKizaiMeisaiValues[],
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
    plan_qty: d.keepQty,
    dsp_ord_num: d.dspOrdNum,
    indent_num: d.indentNum,
    add_dat: new Date().toISOString(),
    add_user: userNam,
  }));

  try {
    await upsertNyushukoDen(newData, connection);
  } catch (e) {
    if (e instanceof Error) {
      console.error(`[ERROR] ${e.message}`);
      if (e.cause) {
        console.error(`[CAUSE]`, e.cause);
      }
    } else {
      console.error(e);
    }
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
    sagyo_den_dat: shukoDat.toISOString(),
    sagyo_id: sagyoId,
    kizai_id: d.kizaiId,
    plan_qty: sagyoId === 1 ? d.kicsKeepQty : d.yardKeepQty,
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
    plan_qty: sagyoId === 1 ? d.kicsKeepQty : d.yardKeepQty,
    dsp_ord_num: d.dspOrdNum,
    indent_num: d.indentNum,
    add_dat: new Date().toISOString(),
    add_user: userNam,
  }));

  const mergeData = [...newCtnShukoStandbyData, ...newCtnShukoCheckData];

  try {
    await insertNyushukoDen(mergeData, connection);

    return true;
  } catch (e) {
    if (e instanceof Error) {
      console.error(`[ERROR] ${e.message}`);
      if (e.cause) {
        console.error(`[CAUSE]`, e.cause);
      }
    } else {
      console.error(e);
    }
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
    sagyo_den_dat: shukoDat.toISOString(),
    sagyo_id: sagyoId,
    kizai_id: d.kizaiId,
    plan_qty: sagyoId === 1 ? d.kicsKeepQty : d.yardKeepQty,
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
    plan_qty: sagyoId === 1 ? d.kicsKeepQty : d.yardKeepQty,
    dsp_ord_num: d.dspOrdNum,
    indent_num: d.indentNum,
    add_dat: new Date().toISOString(),
    add_user: userNam,
  }));

  const mergeData = [...updCtnShukoStandbyData, ...updCtnShukoCheckData];

  try {
    for (const data of mergeData) {
      await updateNyushukoDen(data, connection);
    }

    return true;
  } catch (e) {
    if (e instanceof Error) {
      console.error(`[ERROR] ${e.message}`);
      if (e.cause) {
        console.error(`[CAUSE]`, e.cause);
      }
    } else {
      console.error(e);
    }
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
    sagyo_den_dat: nyukoDat.toISOString(),
    sagyo_id: sagyoId,
    kizai_id: d.kizaiId,
    plan_qty: sagyoId === 1 ? d.kicsKeepQty : d.yardKeepQty,
    dsp_ord_num: d.dspOrdNum,
    indent_num: d.indentNum,
    add_dat: new Date().toISOString(),
    add_user: userNam,
  }));

  try {
    await insertNyushukoDen(newCtnNyukoCheckData, connection);

    return true;
  } catch (e) {
    if (e instanceof Error) {
      console.error(`[ERROR] ${e.message}`);
      if (e.cause) {
        console.error(`[CAUSE]`, e.cause);
      }
    } else {
      console.error(e);
    }
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
    sagyo_den_dat: nyukoDat.toISOString(),
    sagyo_id: sagyoId,
    kizai_id: d.kizaiId,
    plan_qty: sagyoId === 1 ? d.kicsKeepQty : d.yardKeepQty,
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
    if (e instanceof Error) {
      console.error(`[ERROR] ${e.message}`);
      if (e.cause) {
        console.error(`[CAUSE]`, e.cause);
      }
    } else {
      console.error(e);
    }
    throw e;
  }
};

/**
 * コンテナ出庫伝票追加更新
 * @param juchuKizaiMeisaiData
 * @param shukoDat
 * @param sagyoId
 * @param userNam
 * @param connection
 */
export const upsCtnShukoDen = async (
  juchuContainerMeisaiData: KeepJuchuContainerMeisaiValues[],
  shukoDat: Date,
  sagyoId: number,
  userNam: string,
  connection: PoolClient
) => {
  const upsCtnShukoStandbyData: NyushukoDen[] = juchuContainerMeisaiData.map((d) => ({
    juchu_head_id: d.juchuHeadId,
    juchu_kizai_head_id: d.juchuKizaiHeadId,
    juchu_kizai_meisai_id: d.juchuKizaiMeisaiId,
    sagyo_kbn_id: 10,
    sagyo_den_dat: shukoDat.toISOString(),
    sagyo_id: sagyoId,
    kizai_id: d.kizaiId,
    plan_qty: sagyoId === 1 ? d.kicsKeepQty : d.yardKeepQty,
    dsp_ord_num: d.dspOrdNum,
    indent_num: d.indentNum,
    add_dat: new Date().toISOString(),
    add_user: userNam,
  }));

  const upsCtnShukoCheckData: NyushukoDen[] = juchuContainerMeisaiData.map((d) => ({
    juchu_head_id: d.juchuHeadId,
    juchu_kizai_head_id: d.juchuKizaiHeadId,
    juchu_kizai_meisai_id: d.juchuKizaiMeisaiId,
    sagyo_kbn_id: 20,
    sagyo_den_dat: shukoDat.toISOString(),
    sagyo_id: sagyoId,
    kizai_id: d.kizaiId,
    plan_qty: sagyoId === 1 ? d.kicsKeepQty : d.yardKeepQty,
    dsp_ord_num: d.dspOrdNum,
    indent_num: d.indentNum,
    add_dat: new Date().toISOString(),
    add_user: userNam,
  }));
  const mergeData = [...upsCtnShukoStandbyData, ...upsCtnShukoCheckData];

  try {
    await upsertNyushukoDen(mergeData, connection);
  } catch (e) {
    if (e instanceof Error) {
      console.error(`[ERROR] ${e.message}`);
      if (e.cause) {
        console.error(`[CAUSE]`, e.cause);
      }
    } else {
      console.error(e);
    }
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
  juchuContainerMeisaiData: KeepJuchuContainerMeisaiValues[],
  nyukoDat: Date,
  sagyoId: number,
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
    plan_qty: sagyoId === 1 ? d.kicsKeepQty : d.yardKeepQty,
    dsp_ord_num: d.dspOrdNum,
    indent_num: d.indentNum,
    add_dat: new Date().toISOString(),
    add_user: userNam,
  }));

  try {
    await upsertNyushukoDen(upsertCtnNyukoData, connection);
  } catch (e) {
    if (e instanceof Error) {
      console.error(`[ERROR] ${e.message}`);
      if (e.cause) {
        console.error(`[CAUSE]`, e.cause);
      }
    } else {
      console.error(e);
    }
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
 * キープ入出庫伝票削除
 * @param juchuHeadId 受注ヘッダーid
 * @param juchuKizaiHeadId 受注機材ヘッダーid
 * @param kizaiId 機材id
 */
export const delKeepNyushukoDen = async (
  returnJuchuKizaiMeisaiData: KeepJuchuKizaiMeisaiValues[],
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
 * キープ出庫伝票削除(KICS/YARD)
 * @param juchuKizaiMeisaiData
 * @param sagyoId
 * @param connection
 */
export const delKeepKicsOrYardShukoDen = async (
  juchuKizaiMeisaiData: KeepJuchuKizaiMeisaiValues[],
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
      await deleteKicsOrYardShukoDen(data, connection);
    }
  } catch (e) {
    throw e;
  }
};

/**
 * キープ入庫伝票削除(KICS/YARD)
 * @param juchuKizaiMeisaiData
 * @param sagyoId
 * @param connection
 */
export const delKeepKicsOrYardNyukoDen = async (
  juchuKizaiMeisaiData: KeepJuchuKizaiMeisaiValues[],
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
    return true;
  } catch (e) {
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
  juchuContainerMeisaiData: KeepJuchuContainerMeisaiValues[],
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

/**
 * 出庫実績削除
 * @param juchuKizaiMeisaiData 受注機材明細データ
 * @param connection
 * @returns
 */
export const delShukoResult = async (
  juchuKizaiMeisaiData: KeepJuchuKizaiMeisaiValues[],
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
      await deleteShukoResult(
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

/**
 * 入庫実績削除
 * @param juchuKizaiMeisaiData 受注機材明細データ
 * @param connection
 * @returns
 */
export const delNyukoResult = async (
  juchuKizaiMeisaiData: KeepJuchuKizaiMeisaiValues[],
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
