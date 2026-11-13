'use server';

import { revalidatePath } from 'next/cache';
import { PoolClient } from 'pg';

import { BASHO_ID, JUCHU_KIZAI_HEAD_KBN, SAGYO_KBN_ID } from '@/app/_lib/constants';
import pool from '@/app/_lib/db/postgres';
import { selectMeisaiEqts } from '@/app/_lib/db/tables/m-kizai';
import {
  deleteJuchuContainerMeisai,
  insertJuchuContainerMeisai,
  selectCtnMaxMeisaiIdTx,
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
  selectJuchuKizaiMeisaiMaxIdWithDenTx,
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
  selectNyukoDenWithoutMeisaiTx,
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
  updateShukoResult,
} from '@/app/_lib/db/tables/t-nyushuko-result';
import { selectJuchuContainerMeisai } from '@/app/_lib/db/tables/v-juchu-ctn-meisai';
import { selectKeepJuchuKizaiMeisai, selectOyaJuchuKizaiMeisai } from '@/app/_lib/db/tables/v-juchu-kizai-meisai';
import { JuchuCtnMeisai } from '@/app/_lib/db/types/t_juchu_ctn_meisai-type';
import { JuchuKizaiHead } from '@/app/_lib/db/types/t-juchu-kizai-head-type';
import { JuchuKizaiMeisai } from '@/app/_lib/db/types/t-juchu-kizai-meisai-type';
import { NyushukoDen } from '@/app/_lib/db/types/t-nyushuko-den-type';
import { getNyukoDate, getShukoDate } from '@/app/(main)/_lib/date-funcs';
import {
  addDummyNyushukoDen,
  addJuchuKizaiNyushuko,
  delAllKicsOrYardNyukoDen,
  delAllKicsOrYardShukoCtnDen,
  delAllKicsOrYardShukoCtnResult,
  delAllKicsOrYardShukoDen,
  delAllNyukoResult,
  delAllNyushukoResult,
  delAllShukoResult,
  delNyushukoCtnResult,
  getDetailJuchuHead,
  getJuchuKizaiHeadMaxId,
  getJuchuKizaiNyushuko,
  getNyushukoFixFlags,
  isOyaShukoFixedTx,
  updJuchuKizaiNyushuko,
} from '@/app/(main)/(eq-order-detail)/_lib/funcs';
import { createNyukoDenMeisaiIdPicker } from '@/app/(main)/(eq-order-detail)/_lib/reuse-nyuko-den';
import { SaveNewChildJuchuKizaiHeadResult } from '@/app/(main)/(eq-order-detail)/_lib/types';

import { KeepJuchuContainerMeisaiValues, KeepJuchuKizaiHeadValues, KeepJuchuKizaiMeisaiValues } from './types';

/**
 * 新規キープ受注機材ヘッダー保存
 * @param data
 * @param userNam
 * @returns
 */
export const saveNewKeepJuchuKizaiHead = async (
  data: KeepJuchuKizaiHeadValues,
  userNam: string
): Promise<SaveNewChildJuchuKizaiHeadResult> => {
  const connection = await pool.connect();

  try {
    await connection.query('BEGIN');

    // 親が全場所出発済みかを確かめ直す（受注画面を開いた後に出発解除されていたら作らない）
    if (!(await isOyaShukoFixedTx(data.juchuHeadId, data.oyaJuchuKizaiHeadId, connection))) {
      await connection.query('ROLLBACK');
      return { ok: false, reason: 'oyaNotFixed' };
    }

    const maxId = await getJuchuKizaiHeadMaxId(data.juchuHeadId);
    const newJuchuKizaiHeadId = maxId ? maxId.juchu_kizai_head_id + 1 : 1;
    // 受注機材ヘッダー追加
    await addKeepJuchuKizaiHead(newJuchuKizaiHeadId, data, userNam, connection);
    // 受注機材入出庫追加
    await addJuchuKizaiNyushuko(
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
      await addDummyNyushukoDen(
        data.juchuHeadId,
        newJuchuKizaiHeadId,
        data.kicsNyukoDat,
        BASHO_ID.kics,
        userNam,
        connection
      );
    }
    if (data.yardNyukoDat) {
      await addDummyNyushukoDen(
        data.juchuHeadId,
        newJuchuKizaiHeadId,
        data.yardNyukoDat,
        BASHO_ID.yard,
        userNam,
        connection
      );
    }

    await connection.query('COMMIT');

    await revalidatePath('/eqpt-order-list');

    return { ok: true, juchuKizaiHeadId: newJuchuKizaiHeadId };
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
    throw e;
  } finally {
    connection.release();
  }
};

/**
 * saveKeepJuchuKizai の各段で共通に使う値
 * data は画面で編集したキープ受注機材ヘッダー（出庫日時・入庫日時は保存後の値）
 */
type SaveKeepJuchuKizaiContext = {
  data: KeepJuchuKizaiHeadValues;
  userNam: string;
  connection: PoolClient;
};

/**
 * HT・ゲートが先に作った入庫伝票（受注明細なし）の明細idを使い回すための選び出し関数（機材・コンテナで共有する）
 */
type NyukoDenMeisaiIdPicker = ReturnType<typeof createNyukoDenMeisaiIdPicker>;

/**
 * [保存1] キープ受注機材ヘッダー・受注機材入出庫を更新する
 * @param ctx
 */
const updKeepHeadAndNyushuko = async (ctx: SaveKeepJuchuKizaiContext) => {
  const { data, userNam, connection } = ctx;

  // 受注機材ヘッド更新
  await updKeepJuchuKizaiHead(data, userNam, connection);

  // 受注機材入出庫更新
  await updJuchuKizaiNyushuko(
    data.juchuHeadId,
    data.juchuKizaiHeadId,
    data.kicsShukoDat,
    data.yardShukoDat,
    data.kicsNyukoDat,
    data.yardNyukoDat,
    userNam,
    connection
  );
};

/**
 * [保存2] キープ受注機材明細の新規の行に明細idを割り振り、追加・更新・削除に分ける（DBには書かない）
 * @param ctx
 * @param keepJuchuKizaiMeisaiList 画面のキープ受注機材明細（削除した明細を含む）
 * @param pickNyukoDenMeisaiId 使い回す明細idの選び出し関数
 * @returns savedList 明細id割り振り済みの全明細（削除した明細を含む）、addList・updateList・deleteList
 */
const assignKeepKizaiMeisaiIds = async (
  ctx: SaveKeepJuchuKizaiContext,
  keepJuchuKizaiMeisaiList: KeepJuchuKizaiMeisaiValues[],
  pickNyukoDenMeisaiId: NyukoDenMeisaiIdPicker
) => {
  const { data, connection } = ctx;

  // 受注機材明細id最大値（メイン明細と同じく入出庫伝票の明細idも含める。送信RPCが作った明細の無い伝票と重ならないように）
  let newKeepJuchuKizaiMeisaiId =
    (await selectJuchuKizaiMeisaiMaxIdWithDenTx(data.juchuHeadId, data.juchuKizaiHeadId, connection)) + 1;
  // 新規機材に明細id割り振り
  const newKeepJuchuKizaiMeisaiData = keepJuchuKizaiMeisaiList.map((d) =>
    d.juchuKizaiMeisaiId === 0 && !d.delFlag
      ? {
          ...d,
          juchuKizaiMeisaiId: pickNyukoDenMeisaiId(false, d.kizaiId, d.dspOrdNum) ?? newKeepJuchuKizaiMeisaiId++,
        }
      : d
  );

  return {
    savedList: newKeepJuchuKizaiMeisaiData,
    // 追加機材
    addList: newKeepJuchuKizaiMeisaiData.filter((d) => !d.delFlag && !d.saveFlag),
    // 更新機材
    updateList: newKeepJuchuKizaiMeisaiData.filter((d) => !d.delFlag && d.saveFlag),
    // 削除機材
    deleteList: newKeepJuchuKizaiMeisaiData.filter((d) => d.delFlag && d.saveFlag),
  };
};

/**
 * [保存2] キープ受注機材明細の削除・追加・更新
 * @param ctx
 * @param kizai assignKeepKizaiMeisaiIds の結果
 */
const writeKeepKizaiMeisai = async (
  ctx: SaveKeepJuchuKizaiContext,
  kizai: Awaited<ReturnType<typeof assignKeepKizaiMeisaiIds>>
) => {
  const { userNam, connection } = ctx;

  // 削除
  if (kizai.deleteList.length > 0) {
    await delKeepJuchuKizaiMeisai(kizai.deleteList, connection);
  }
  // 追加
  if (kizai.addList.length > 0) {
    await addKeepJuchuKizaiMeisai(kizai.addList, userNam, connection);
  }
  // 更新
  if (kizai.updateList.length > 0) {
    await updKeepJuchuKizaiMeisai(kizai.updateList, userNam, connection);
  }
};

/**
 * [保存3] キープ受注コンテナ明細の新規の行に明細idを割り振り、追加・更新・削除に分ける（DBには書かない）
 * @param ctx
 * @param keepJuchuContainerMeisaiList 画面のキープ受注コンテナ明細（削除したコンテナを含む）
 * @param pickNyukoDenMeisaiId 使い回す明細idの選び出し関数
 * @returns savedList 明細id割り振り済みの全コンテナ（削除したコンテナを含む）、addList・updateList・deleteList
 */
const assignKeepCtnMeisaiIds = async (
  ctx: SaveKeepJuchuKizaiContext,
  keepJuchuContainerMeisaiList: KeepJuchuContainerMeisaiValues[],
  pickNyukoDenMeisaiId: NyukoDenMeisaiIdPicker
) => {
  const { data, connection } = ctx;

  // 受注コンテナ明細id最大値（出庫明細・送信RPCと同じく、受注コンテナ明細とコンテナの入出庫伝票の最大値。
  // 送信RPCが作った明細の無いコンテナ伝票と重ならないように）
  let newKeepJuchuContainerMeisaiId =
    (await selectCtnMaxMeisaiIdTx(data.juchuHeadId, data.juchuKizaiHeadId, connection)) + 1;
  // 新規コンテナに明細id割り振り
  const newKeepJuchuContainerMeisaiData = keepJuchuContainerMeisaiList.map((d) =>
    d.juchuKizaiMeisaiId === 0 && !d.delFlag
      ? {
          ...d,
          juchuKizaiMeisaiId: pickNyukoDenMeisaiId(true, d.kizaiId, d.dspOrdNum) ?? newKeepJuchuContainerMeisaiId++,
        }
      : d
  );

  return {
    savedList: newKeepJuchuContainerMeisaiData,
    // 追加コンテナ
    addList: newKeepJuchuContainerMeisaiData.filter((d) => !d.delFlag && !d.saveFlag),
    // 更新コンテナ
    updateList: newKeepJuchuContainerMeisaiData.filter((d) => !d.delFlag && d.saveFlag),
    // 削除コンテナ
    deleteList: newKeepJuchuContainerMeisaiData.filter((d) => d.delFlag && d.saveFlag),
  };
};

/**
 * [保存3] キープ受注コンテナ明細の削除・追加・更新
 * @param ctx
 * @param ctn assignKeepCtnMeisaiIds の結果
 */
const writeKeepCtnMeisai = async (
  ctx: SaveKeepJuchuKizaiContext,
  ctn: Awaited<ReturnType<typeof assignKeepCtnMeisaiIds>>
) => {
  const { data, userNam, connection } = ctx;

  // 削除
  if (ctn.deleteList.length > 0) {
    const deleteKizaiIds = ctn.deleteList.map((d) => d.kizaiId);
    await delKeepJuchuContainerMeisai(data.juchuHeadId, data.juchuKizaiHeadId, deleteKizaiIds, connection);
  }
  // 追加
  if (ctn.addList.length > 0) {
    await addKeepJuchuContainerMeisai(ctn.addList, userNam, connection);
  }
  // 更新
  if (ctn.updateList.length > 0) {
    await updKeepJuchuContainerMeisai(ctn.updateList, userNam, connection);
  }
};

/**
 * [保存4] 削除した機材・コンテナの入出庫伝票・入出庫実績を削除する
 * キープは受注削除として残さない（実績があっても削除する）
 * @param ctx
 * @param deleteKizaiList 削除した機材明細
 * @param deleteCtnList 削除したコンテナ明細
 */
const delDeletedKeepNyushukoDen = async (
  ctx: SaveKeepJuchuKizaiContext,
  deleteKizaiList: KeepJuchuKizaiMeisaiValues[],
  deleteCtnList: KeepJuchuContainerMeisaiValues[]
) => {
  const { data, connection } = ctx;

  // 削除処理された機材の入出庫伝票、入出庫実績削除
  if (deleteKizaiList.length > 0) {
    await delKeepNyushukoDen(deleteKizaiList, connection);
    await delNyushukoResult(deleteKizaiList, connection);
  }

  // コンテナ入出庫伝票、入出庫実績削除
  if (deleteCtnList.length > 0) {
    await delCtnNyushukoDen(deleteCtnList, connection);

    const deleteIds = deleteCtnList.map((d) => d.kizaiId);
    if (deleteIds.length > 0) {
      await delNyushukoCtnResult(data.juchuHeadId, data.juchuKizaiHeadId, deleteIds, connection);
    }
  }
};

/**
 * [保存5] 機材の出庫伝票（ピッキング・最終確認）と出庫実績
 * - 追加した明細・出庫場所が変わった明細：（場所が変わった明細は元の伝票・実績を削除してから）出庫伝票を作る
 * - それ以外の更新した明細：出庫伝票を更新し、出庫日時が変わっていれば実績の日時も揃える
 * @param ctx
 * @param addList 追加した明細（明細id割り振り済み）
 * @param updateList 更新した明細
 * @param originKeepJuchuKizaiMeisaiList 変更前のキープ受注機材明細（DBの状態）
 * @param checkKicsShukoDat KICS出庫日時が変わったか
 * @param checkYardShukoDat YARD出庫日時が変わったか
 */
const saveKeepKizaiShukoDen = async (
  ctx: SaveKeepJuchuKizaiContext,
  addList: KeepJuchuKizaiMeisaiValues[],
  updateList: KeepJuchuKizaiMeisaiValues[],
  originKeepJuchuKizaiMeisaiList: KeepJuchuKizaiMeisaiValues[],
  checkKicsShukoDat: boolean,
  checkYardShukoDat: boolean
) => {
  const { data, userNam, connection } = ctx;

  // 出庫場所が変更された機材の出庫伝票、出庫実績削除
  const originMap = new Map(originKeepJuchuKizaiMeisaiList.map((item) => [item.juchuKizaiMeisaiId, item]));
  // 削除、追加出庫機材
  const shozokuChangedData = [];
  // 更新出庫機材
  const shozokuUnChangedData = [];

  for (const updItem of updateList) {
    const key = updItem.juchuKizaiMeisaiId;
    const originItem = originMap.get(key);

    if (originItem && originItem.shozokuId !== updItem.shozokuId) {
      shozokuChangedData.push(updItem);
    } else {
      shozokuUnChangedData.push(updItem);
    }
  }

  // 出庫機材伝票削除、追加
  if (addList.length > 0 || shozokuChangedData.length > 0) {
    await delShukoDen(shozokuChangedData, connection);
    await delShukoResult(shozokuChangedData, connection);

    if (data.kicsShukoDat) {
      const addKicsJuchuKizaiMeisaiData = [
        ...addList.filter((d) => d.shozokuId === BASHO_ID.kics),
        ...shozokuChangedData.filter((d) => d.shozokuId === BASHO_ID.kics),
      ];

      if (addKicsJuchuKizaiMeisaiData.length > 0) {
        await addShukoDen(addKicsJuchuKizaiMeisaiData, data.kicsShukoDat, userNam, connection);
      }
    }

    if (data.yardShukoDat) {
      const addYardJuchuKizaiMeisaiData = [
        ...addList.filter((d) => d.shozokuId === BASHO_ID.yard),
        ...shozokuChangedData.filter((d) => d.shozokuId === BASHO_ID.yard),
      ];

      if (addYardJuchuKizaiMeisaiData.length > 0) {
        await addShukoDen(addYardJuchuKizaiMeisaiData, data.yardShukoDat, userNam, connection);
      }
    }
  }

  // 出庫機材伝票、実績更新
  if (shozokuUnChangedData.length > 0) {
    if (data.kicsShukoDat) {
      const updateKicsJuchuKizaiMeisaiData = shozokuUnChangedData.filter((d) => d.shozokuId === BASHO_ID.kics);

      if (updateKicsJuchuKizaiMeisaiData.length > 0) {
        await updShukoDen(updateKicsJuchuKizaiMeisaiData, data.kicsShukoDat, userNam, connection);

        if (checkKicsShukoDat) {
          await updShukoResult(updateKicsJuchuKizaiMeisaiData, data.kicsShukoDat, connection);
        }
      }
    }

    if (data.yardShukoDat) {
      const updateYardJuchuKizaiMeisaiData = shozokuUnChangedData.filter((d) => d.shozokuId === BASHO_ID.yard);

      if (updateYardJuchuKizaiMeisaiData.length > 0) {
        await updShukoDen(updateYardJuchuKizaiMeisaiData, data.yardShukoDat, userNam, connection);

        if (checkYardShukoDat) {
          await updShukoResult(updateYardJuchuKizaiMeisaiData, data.yardShukoDat, connection);
        }
      }
    }
  }
};

/**
 * [保存6] 入庫日時が変わった場所の入庫伝票・入庫実績を削除し、ダミーの入庫伝票を作る（作り直しは rebuildKeepNyukoDen）
 * @param ctx
 * @param savedList 明細id割り振り済みの全機材明細（削除した明細を含む）
 * @param checkKicsNyukoDat KICS入庫日時が変わったか
 * @param checkYardNyukoDat YARD入庫日時が変わったか
 */
const delKeepNyukoDenForDatChange = async (
  ctx: SaveKeepJuchuKizaiContext,
  savedList: KeepJuchuKizaiMeisaiValues[],
  checkKicsNyukoDat: boolean,
  checkYardNyukoDat: boolean
) => {
  const { data, userNam, connection } = ctx;

  if (checkKicsNyukoDat) {
    await delAllKicsOrYardNyukoDen(data.juchuHeadId, data.juchuKizaiHeadId, BASHO_ID.kics, connection);

    await delAllNyukoResult(data.juchuHeadId, data.juchuKizaiHeadId, BASHO_ID.kics, connection);

    if (data.kicsNyukoDat && data.yardNyukoDat && !checkYardNyukoDat) {
      const kicsNyukoData = savedList.filter((d) => !d.delFlag && d.shozokuId === BASHO_ID.kics);

      if (kicsNyukoData.length) {
        await delKeepKicsOrYardNyukoDen(kicsNyukoData, BASHO_ID.yard, connection);

        await delNyukoResult(kicsNyukoData, BASHO_ID.yard, connection);
      }
    }

    // ダミーKICS入庫伝票追加
    if (data.kicsNyukoDat) {
      await addDummyNyushukoDen(
        data.juchuHeadId,
        data.juchuKizaiHeadId,
        data.kicsNyukoDat,
        BASHO_ID.kics,
        userNam,
        connection
      );
    }
  }

  if (checkYardNyukoDat) {
    await delAllKicsOrYardNyukoDen(data.juchuHeadId, data.juchuKizaiHeadId, BASHO_ID.yard, connection);

    await delAllNyukoResult(data.juchuHeadId, data.juchuKizaiHeadId, BASHO_ID.yard, connection);

    if (data.kicsNyukoDat && data.yardNyukoDat && !checkKicsNyukoDat) {
      const yardNyukoData = savedList.filter((d) => !d.delFlag && d.shozokuId === BASHO_ID.yard);

      if (yardNyukoData.length) {
        await delKeepKicsOrYardNyukoDen(yardNyukoData, BASHO_ID.kics, connection);

        await delNyukoResult(yardNyukoData, BASHO_ID.kics, connection);
      }
    }

    // ダミーYARD入庫伝票追加
    if (data.yardNyukoDat) {
      await addDummyNyushukoDen(
        data.juchuHeadId,
        data.juchuKizaiHeadId,
        data.yardNyukoDat,
        BASHO_ID.yard,
        userNam,
        connection
      );
    }
  }
};

/**
 * [保存7] 出庫日時が変わった場所のコンテナの出庫伝票・出庫実績を削除する（作り直しは rebuildKeepCtnShukoDen）
 * @param ctx
 * @param keepJuchuContainerMeisaiList 画面のキープ受注コンテナ明細（削除したコンテナを含む）
 * @param checkKicsShukoDat KICS出庫日時が変わったか
 * @param checkYardShukoDat YARD出庫日時が変わったか
 */
const delKeepCtnShukoDenForDatChange = async (
  ctx: SaveKeepJuchuKizaiContext,
  keepJuchuContainerMeisaiList: KeepJuchuContainerMeisaiValues[],
  checkKicsShukoDat: boolean,
  checkYardShukoDat: boolean
) => {
  const { data, connection } = ctx;

  const ctnKizaiIds = keepJuchuContainerMeisaiList.map((d) => d.kizaiId);

  if (checkKicsShukoDat) {
    await delAllKicsOrYardShukoCtnDen(data.juchuHeadId, data.juchuKizaiHeadId, ctnKizaiIds, BASHO_ID.kics, connection);
    await delAllKicsOrYardShukoCtnResult(data.juchuHeadId, data.juchuKizaiHeadId, BASHO_ID.kics, connection);
  }

  if (checkYardShukoDat) {
    await delAllKicsOrYardShukoCtnDen(data.juchuHeadId, data.juchuKizaiHeadId, ctnKizaiIds, BASHO_ID.yard, connection);
    await delAllKicsOrYardShukoCtnResult(data.juchuHeadId, data.juchuKizaiHeadId, BASHO_ID.yard, connection);
  }
};

/**
 * [保存6] 機材・コンテナの入庫伝票を作り直す（追加・更新）
 * @param ctx
 * @param savedKizaiList 明細id割り振り済みの全機材明細（削除した明細を含む）
 * @param savedCtnList 明細id割り振り済みの全コンテナ明細（削除したコンテナを含む）
 */
const rebuildKeepNyukoDen = async (
  ctx: SaveKeepJuchuKizaiContext,
  savedKizaiList: KeepJuchuKizaiMeisaiValues[],
  savedCtnList: KeepJuchuContainerMeisaiValues[]
) => {
  const { data, userNam, connection } = ctx;

  // KICS入庫追加更新
  if (data.kicsNyukoDat) {
    // KICS入庫明細
    const kicsNyukoData = savedKizaiList.filter((d) => !d.delFlag && d.shozokuId === BASHO_ID.kics);

    if (kicsNyukoData.length > 0) {
      await upsNyukoDen(kicsNyukoData, data.kicsNyukoDat, BASHO_ID.kics, userNam, connection);
    }

    // KICSコンテナ入庫明細
    const ctnNyukoData = savedCtnList.filter((d) => !d.delFlag);
    if (ctnNyukoData.length > 0) {
      await upsCtnNyukoDen(ctnNyukoData, data.kicsNyukoDat, BASHO_ID.kics, userNam, connection);
    }
  }

  // YARD入庫追加更新
  if (data.yardNyukoDat) {
    // YARD入庫明細
    const yardNyukoData = savedKizaiList.filter((d) => !d.delFlag && d.shozokuId === BASHO_ID.yard);

    if (yardNyukoData.length > 0) {
      await upsNyukoDen(yardNyukoData, data.yardNyukoDat, BASHO_ID.yard, userNam, connection);
    }

    // YARDコンテナ入庫明細
    const ctnNyukoData = savedCtnList.filter((d) => !d.delFlag);
    if (ctnNyukoData.length > 0) {
      await upsCtnNyukoDen(ctnNyukoData, data.yardNyukoDat, BASHO_ID.yard, userNam, connection);
    }
  }
};

/**
 * [保存7] コンテナの出庫伝票を作り直す（追加・更新）
 * @param ctx
 * @param savedCtnList 明細id割り振り済みの全コンテナ明細（削除したコンテナを含む）
 */
const rebuildKeepCtnShukoDen = async (
  ctx: SaveKeepJuchuKizaiContext,
  savedCtnList: KeepJuchuContainerMeisaiValues[]
) => {
  const { data, userNam, connection } = ctx;

  // KICS出庫追加更新
  if (data.kicsShukoDat) {
    const KicsCtnShukoData = savedCtnList.filter((d) => !d.delFlag);
    if (KicsCtnShukoData.length > 0) {
      await upsCtnShukoDen(KicsCtnShukoData, data.kicsShukoDat, BASHO_ID.kics, userNam, connection);
    }
  }

  // YARD出庫追加更新
  if (data.yardShukoDat) {
    const upsertYardJuchuCtnMeisaiData = savedCtnList.filter((d) => !d.delFlag);
    if (upsertYardJuchuCtnMeisaiData.length > 0) {
      await upsCtnShukoDen(upsertYardJuchuCtnMeisaiData, data.yardShukoDat, BASHO_ID.yard, userNam, connection);
    }
  }
};

/**
 * キープ受注機材ヘッダー保存
 * @param checkJuchuKizaiHead キープ受注機材ヘッダーが変わったか
 * @param checkKicsShukoDat KICS出庫日時が変わったか
 * @param checkKicsNyukoDat KICS入庫日時が変わったか
 * @param checkYardShukoDat YARD出庫日時が変わったか
 * @param checkYardNyukoDat YARD入庫日時が変わったか
 * @param checkJuchuKizaiMeisai キープ受注機材明細が変わったか
 * @param checkJuchuContainerMeisai キープ受注コンテナ明細が変わったか
 * @param data キープ受注機材ヘッダー
 * @param originKeepJuchuKizaiMeisaiList 変更前のキープ受注機材明細（DBの状態）
 * @param keepJuchuKizaiMeisaiList 画面のキープ受注機材明細（削除した明細を含む）
 * @param keepJuchuContainerMeisaiList 画面のキープ受注コンテナ明細（削除したコンテナを含む）
 * @param userNam ユーザー名
 * @returns
 *
 * 処理は段ごとに関数に分けてあり、ここではどの段を動かすかの判定と、トランザクションだけを持つ。
 * 段の順番は変えないこと。
 */
export const saveKeepJuchuKizai = async (
  checkJuchuKizaiHead: boolean,
  checkKicsShukoDat: boolean,
  checkKicsNyukoDat: boolean,
  checkYardShukoDat: boolean,
  checkYardNyukoDat: boolean,
  checkJuchuKizaiMeisai: boolean,
  checkJuchuContainerMeisai: boolean,
  data: KeepJuchuKizaiHeadValues,
  originKeepJuchuKizaiMeisaiList: KeepJuchuKizaiMeisaiValues[],
  keepJuchuKizaiMeisaiList: KeepJuchuKizaiMeisaiValues[],
  keepJuchuContainerMeisaiList: KeepJuchuContainerMeisaiValues[],
  userNam: string
) => {
  const connection = await pool.connect();
  const ctx: SaveKeepJuchuKizaiContext = { data, userNam, connection };

  try {
    await connection.query('BEGIN');

    // 1. キープ受注機材ヘッダー・入出庫日時
    if (checkJuchuKizaiHead) {
      await updKeepHeadAndNyushuko(ctx);
    }

    if (
      checkKicsShukoDat ||
      checkKicsNyukoDat ||
      checkYardShukoDat ||
      checkYardNyukoDat ||
      checkJuchuKizaiMeisai ||
      checkJuchuContainerMeisai
    ) {
      // HT・ゲートが親機材として読んで先に作った入庫伝票（受注明細なし）があれば、その明細idを使い回す（機材・コンテナ共通）
      const pickNyukoDenMeisaiId = createNyukoDenMeisaiIdPicker(
        await selectNyukoDenWithoutMeisaiTx(data.juchuHeadId, data.juchuKizaiHeadId, connection)
      );

      // 2. キープ受注機材明細
      const kizai = await assignKeepKizaiMeisaiIds(ctx, keepJuchuKizaiMeisaiList, pickNyukoDenMeisaiId);
      await writeKeepKizaiMeisai(ctx, kizai);

      // 3. キープ受注コンテナ明細
      const ctn = await assignKeepCtnMeisaiIds(ctx, keepJuchuContainerMeisaiList, pickNyukoDenMeisaiId);
      await writeKeepCtnMeisai(ctx, ctn);

      // 4. 削除した機材・コンテナの入出庫伝票・実績
      await delDeletedKeepNyushukoDen(ctx, kizai.deleteList, ctn.deleteList);

      // 5. 機材の出庫伝票・出庫実績
      await saveKeepKizaiShukoDen(
        ctx,
        kizai.addList,
        kizai.updateList,
        originKeepJuchuKizaiMeisaiList,
        checkKicsShukoDat,
        checkYardShukoDat
      );

      // 6・7. 日時が変わった場所の入庫伝票・コンテナの出庫伝票を削除してから、入庫伝票・コンテナの出庫伝票を作り直す
      await delKeepNyukoDenForDatChange(ctx, kizai.savedList, checkKicsNyukoDat, checkYardNyukoDat);
      await delKeepCtnShukoDenForDatChange(ctx, keepJuchuContainerMeisaiList, checkKicsShukoDat, checkYardShukoDat);
      await rebuildKeepNyukoDen(ctx, kizai.savedList, ctn.savedList);
      await rebuildKeepCtnShukoDen(ctx, ctn.savedList);
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
    throw e;
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
    juchu_kizai_head_kbn: JUCHU_KIZAI_HEAD_KBN.keep,
    mem: keepJuchuKizaiHeadData.mem,
    head_nam: keepJuchuKizaiHeadData.headNam,
    oya_juchu_kizai_head_id: keepJuchuKizaiHeadData.oyaJuchuKizaiHeadId,
    ht_kbn: 0,
    add_dat: new Date().toISOString(),
    add_user: userNam,
  };
  try {
    await insertKeepJuchuKizaiHead(newData, connection);
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
    const [{ data: keepData, error: keepError }, { data: oyaData, error: oyaError }] = await Promise.all([
      selectKeepJuchuKizaiMeisai(juchuHeadId, juchuKizaiHeadId),
      selectOyaJuchuKizaiMeisai(juchuHeadId, oyaJuchuKizaiHeadId),
    ]);
    if (keepError) {
      throw new Error('[selectKeepJuchuKizaiMeisai] DBエラー:', { cause: keepError });
    }
    if (oyaError) {
      throw new Error('[selectOyaJuchuKizaiMeisai] DBエラー:', { cause: oyaError });
    }

    const eqIds = [...new Set(keepData.map((data) => data.kizai_id))];

    const { data: mKizai, error: mKizaiError } = await selectMeisaiEqts(eqIds);

    if (mKizaiError) {
      throw new Error('[selectMeisaiEqts] DBエラー:', { cause: mKizaiError });
    }

    const keepJuchuKizaiMeisaiData: KeepJuchuKizaiMeisaiValues[] = keepData.map((d) => ({
      juchuHeadId: d.juchu_head_id,
      juchuKizaiHeadId: d.juchu_kizai_head_id,
      juchuKizaiMeisaiId: d.juchu_kizai_meisai_id,
      mShozokuId: mKizai.find((data) => data.kizai_id === d.kizai_id)?.shozoku_id ?? 0,
      shozokuId: d.shozoku_id,
      shozokuNam: d.shozoku_nam ?? '',
      mem: d.mem,
      mem2: d.mem2,
      kizaiId: d.kizai_id,
      kizaiNam: d.kizai_nam ?? '',
      oyaPlanKizaiQty: oyaData.find((oya) => oya.dsp_ord_num === d.dsp_ord_num)?.plan_kizai_qty ?? 0,
      oyaPlanYobiQty: oyaData.find((oya) => oya.dsp_ord_num === d.dsp_ord_num)?.plan_yobi_qty ?? 0,
      keepQty: d.keep_qty ?? 0,
      dspOrdNum: d.dsp_ord_num ?? 0,
      indentNum: d.indent_num ?? 0,
      delFlag: false,
      saveFlag: true,
      selected: false,
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
    mem2: d.mem2,
    keep_qty: d.keepQty,
    dsp_ord_num: d.dspOrdNum,
    indent_num: d.indentNum,
    add_dat: new Date().toISOString(),
    add_user: userNam,
    shozoku_id: d.shozokuId,
  }));

  try {
    await insertJuchuKizaiMeisai(newData, connection);
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
    mem2: d.mem2,
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
    const [{ data: containerData, error: containerError }, { data: oyaData, error: oyaError }] = await Promise.all([
      selectJuchuContainerMeisai(juchuHeadId, juchuKizaiHeadId),
      selectJuchuContainerMeisai(juchuHeadId, oyaJuchuKizaiHeadId),
    ]);
    if (containerError) {
      throw new Error('[selectJuchuContainerMeisai] DBエラー:', { cause: containerError });
    }
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
      selected: false,
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
 * キープ明細画面を開いたときの明細一式（キープ受注機材明細・キープ受注コンテナ明細）の取得
 * Server Action は1本ずつ順番に処理され、1往復ごとに時間が上乗せされるので、画面からは1回の呼び出しで済ませる
 * （メイン・返却明細と同じ。エラーの記録は中で呼ぶ各取得関数が行う）
 * @param juchuHeadId 受注ヘッダーid
 * @param juchuKizaiHeadId 受注機材ヘッダーid
 * @param oyaJuchuKizaiHeadId 親受注機材ヘッダーid
 */
export const getKeepJuchuKizaiDetailData = async (
  juchuHeadId: number,
  juchuKizaiHeadId: number,
  oyaJuchuKizaiHeadId: number
) => {
  const [keepJuchuKizaiMeisaiData, keepJuchuContainerMeisaiData] = await Promise.all([
    getKeepJuchuKizaiMeisai(juchuHeadId, juchuKizaiHeadId, oyaJuchuKizaiHeadId),
    getKeepJuchuContainerMeisai(juchuHeadId, juchuKizaiHeadId, oyaJuchuKizaiHeadId),
  ]);
  return { keepJuchuKizaiMeisaiData, keepJuchuContainerMeisaiData };
};

/**
 * ほかの人が編集中で編集に入れなかったときに、画面を最新の内容に読み直すためのデータを取得する
 * （受注ヘッダー・親受注機材入出庫・出発/到着フラグ・キープ受注機材ヘッダー・明細一式）
 * 以前は画面から3回に分けて呼んでいた（Server Action は1本ずつ順番に処理される）ので、サーバー側で続けて取る
 * （エラーの記録は中で呼ぶ各取得関数が行う）
 * @param juchuHeadId 受注ヘッダーid
 * @param juchuKizaiHeadId 受注機材ヘッダーid（0 は新規なので、キープ受注機材ヘッダー以降は取らない）
 * @param oyaJuchuKizaiHeadId 親受注機材ヘッダーid
 * @returns kizai はキープ受注機材ヘッダーが無いとき（新規・見つからない）は null
 */
export const getKeepJuchuKizaiLockReloadData = async (
  juchuHeadId: number,
  juchuKizaiHeadId: number,
  oyaJuchuKizaiHeadId: number
) => {
  const [juchuHeadData, oyaJuchuKizaiHeadData, { shukoFixFlag, nyukoFixFlag }] = await Promise.all([
    getDetailJuchuHead(juchuHeadId),
    getJuchuKizaiNyushuko(juchuHeadId, oyaJuchuKizaiHeadId),
    getNyushukoFixFlags(juchuHeadId, juchuKizaiHeadId),
  ]);

  // 画面側は、受注ヘッダー・親の入出庫データ・親の出庫日/入庫日のどれかが無ければここで読み直しをやめる。
  // そのときは以前と同じくキープ受注機材ヘッダー以降を取らない（取得でエラーになることもあるため）
  const noOyaDate =
    !oyaJuchuKizaiHeadData ||
    !getShukoDate(
      oyaJuchuKizaiHeadData.kicsShukoDat ? new Date(oyaJuchuKizaiHeadData.kicsShukoDat) : null,
      oyaJuchuKizaiHeadData.yardShukoDat ? new Date(oyaJuchuKizaiHeadData.yardShukoDat) : null
    ) ||
    !getNyukoDate(
      oyaJuchuKizaiHeadData.kicsNyukoDat ? new Date(oyaJuchuKizaiHeadData.kicsNyukoDat) : null,
      oyaJuchuKizaiHeadData.yardNyukoDat ? new Date(oyaJuchuKizaiHeadData.yardNyukoDat) : null
    );
  if (!juchuHeadData || noOyaDate || juchuKizaiHeadId === 0) {
    return { juchuHeadData, oyaJuchuKizaiHeadData, shukoFixFlag, nyukoFixFlag, kizai: null };
  }

  const keepJuchuKizaiHeadData = await getKeepJuchuKizaiHead(juchuHeadId, juchuKizaiHeadId);
  if (!keepJuchuKizaiHeadData) {
    return { juchuHeadData, oyaJuchuKizaiHeadData, shukoFixFlag, nyukoFixFlag, kizai: null };
  }

  // 明細一式はキープ受注機材ヘッダーの値で取る（画面側と同じ）
  const detailData = await getKeepJuchuKizaiDetailData(
    keepJuchuKizaiHeadData.juchuHeadId,
    keepJuchuKizaiHeadData.juchuKizaiHeadId,
    keepJuchuKizaiHeadData.oyaJuchuKizaiHeadId
  );

  return {
    juchuHeadData,
    oyaJuchuKizaiHeadData,
    shukoFixFlag,
    nyukoFixFlag,
    kizai: { keepJuchuKizaiHeadData, ...detailData },
  };
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
  userNam: string,
  connection: PoolClient
) => {
  const newShukoStandbyData: NyushukoDen[] = juchuKizaiMeisaiData.map((d) => ({
    juchu_head_id: d.juchuHeadId,
    juchu_kizai_head_id: d.juchuKizaiHeadId,
    juchu_kizai_meisai_id: d.juchuKizaiMeisaiId,
    sagyo_kbn_id: SAGYO_KBN_ID.shukoPicking,
    sagyo_den_dat: shukoDat.toISOString(),
    sagyo_id: d.shozokuId,
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
    sagyo_kbn_id: SAGYO_KBN_ID.shukoConfirmation,
    sagyo_den_dat: shukoDat.toISOString(),
    sagyo_id: d.shozokuId,
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
  userNam: string,
  connection: PoolClient
) => {
  const newShukoStandbyData: NyushukoDen[] = juchuKizaiMeisaiData.map((d) => ({
    juchu_head_id: d.juchuHeadId,
    juchu_kizai_head_id: d.juchuKizaiHeadId,
    juchu_kizai_meisai_id: d.juchuKizaiMeisaiId,
    sagyo_kbn_id: SAGYO_KBN_ID.shukoPicking,
    sagyo_den_dat: shukoDat.toISOString(),
    sagyo_id: d.shozokuId,
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
    sagyo_kbn_id: SAGYO_KBN_ID.shukoConfirmation,
    sagyo_den_dat: shukoDat.toISOString(),
    sagyo_id: d.shozokuId,
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
    sagyo_kbn_id: SAGYO_KBN_ID.nyukoCount,
    sagyo_den_dat:
      d.shozokuId === BASHO_ID.kics
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
    sagyo_kbn_id: SAGYO_KBN_ID.nyukoCount,
    sagyo_den_dat:
      d.shozokuId === BASHO_ID.kics
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
    sagyo_kbn_id: SAGYO_KBN_ID.shukoPicking,
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
    sagyo_kbn_id: SAGYO_KBN_ID.shukoConfirmation,
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
    sagyo_kbn_id: SAGYO_KBN_ID.nyukoCount,
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
    sagyo_kbn_id: SAGYO_KBN_ID.shukoPicking,
    sagyo_den_dat: shukoDat.toISOString(),
    sagyo_id: sagyoId,
    kizai_id: d.kizaiId,
    plan_qty: sagyoId === BASHO_ID.kics ? d.kicsKeepQty : d.yardKeepQty,
    dsp_ord_num: d.dspOrdNum,
    indent_num: d.indentNum,
    add_dat: new Date().toISOString(),
    add_user: userNam,
  }));

  const newCtnShukoCheckData: NyushukoDen[] = juchuCtnMeisaiData.map((d) => ({
    juchu_head_id: d.juchuHeadId,
    juchu_kizai_head_id: d.juchuKizaiHeadId,
    juchu_kizai_meisai_id: d.juchuKizaiMeisaiId,
    sagyo_kbn_id: SAGYO_KBN_ID.shukoConfirmation,
    sagyo_den_dat: shukoDat.toISOString(),
    sagyo_id: sagyoId,
    kizai_id: d.kizaiId,
    plan_qty: sagyoId === BASHO_ID.kics ? d.kicsKeepQty : d.yardKeepQty,
    dsp_ord_num: d.dspOrdNum,
    indent_num: d.indentNum,
    add_dat: new Date().toISOString(),
    add_user: userNam,
  }));

  const mergeData = [...newCtnShukoStandbyData, ...newCtnShukoCheckData];

  try {
    await insertNyushukoDen(mergeData, connection);
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
    sagyo_kbn_id: SAGYO_KBN_ID.shukoPicking,
    sagyo_den_dat: shukoDat.toISOString(),
    sagyo_id: sagyoId,
    kizai_id: d.kizaiId,
    plan_qty: sagyoId === BASHO_ID.kics ? d.kicsKeepQty : d.yardKeepQty,
    dsp_ord_num: d.dspOrdNum,
    indent_num: d.indentNum,
    add_dat: new Date().toISOString(),
    add_user: userNam,
  }));

  const updCtnShukoCheckData: NyushukoDen[] = juchuCtnMeisaiData.map((d) => ({
    juchu_head_id: d.juchuHeadId,
    juchu_kizai_head_id: d.juchuKizaiHeadId,
    juchu_kizai_meisai_id: d.juchuKizaiMeisaiId,
    sagyo_kbn_id: SAGYO_KBN_ID.shukoConfirmation,
    sagyo_den_dat: shukoDat.toISOString(),
    sagyo_id: sagyoId,
    kizai_id: d.kizaiId,
    plan_qty: sagyoId === BASHO_ID.kics ? d.kicsKeepQty : d.yardKeepQty,
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
    sagyo_kbn_id: SAGYO_KBN_ID.nyukoCount,
    sagyo_den_dat: nyukoDat.toISOString(),
    sagyo_id: sagyoId,
    kizai_id: d.kizaiId,
    plan_qty: sagyoId === BASHO_ID.kics ? d.kicsKeepQty : d.yardKeepQty,
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
    sagyo_kbn_id: SAGYO_KBN_ID.nyukoCount,
    sagyo_den_dat: nyukoDat.toISOString(),
    sagyo_id: sagyoId,
    kizai_id: d.kizaiId,
    plan_qty: sagyoId === BASHO_ID.kics ? d.kicsKeepQty : d.yardKeepQty,
    dsp_ord_num: d.dspOrdNum,
    indent_num: d.indentNum,
    upd_dat: new Date().toISOString(),
    upd_user: userNam,
  }));

  try {
    for (const data of updCtnNyukoCheckData) {
      await updateNyushukoDen(data, connection);
    }
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
    sagyo_kbn_id: SAGYO_KBN_ID.shukoPicking,
    sagyo_den_dat: shukoDat.toISOString(),
    sagyo_id: sagyoId,
    kizai_id: d.kizaiId,
    plan_qty: sagyoId === BASHO_ID.kics ? d.kicsKeepQty : d.yardKeepQty,
    dsp_ord_num: d.dspOrdNum,
    indent_num: d.indentNum,
    add_dat: new Date().toISOString(),
    add_user: userNam,
  }));

  const upsCtnShukoCheckData: NyushukoDen[] = juchuContainerMeisaiData.map((d) => ({
    juchu_head_id: d.juchuHeadId,
    juchu_kizai_head_id: d.juchuKizaiHeadId,
    juchu_kizai_meisai_id: d.juchuKizaiMeisaiId,
    sagyo_kbn_id: SAGYO_KBN_ID.shukoConfirmation,
    sagyo_den_dat: shukoDat.toISOString(),
    sagyo_id: sagyoId,
    kizai_id: d.kizaiId,
    plan_qty: sagyoId === BASHO_ID.kics ? d.kicsKeepQty : d.yardKeepQty,
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
    sagyo_kbn_id: SAGYO_KBN_ID.nyukoCount,
    sagyo_den_dat: nyukoDat.toISOString(),
    sagyo_id: sagyoId,
    kizai_id: d.kizaiId,
    plan_qty: sagyoId === BASHO_ID.kics ? d.kicsKeepQty : d.yardKeepQty,
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
 * 入庫伝票全削除
 * @param juchuHeadId 受注ヘッダーid
 * @param juchuKizaiHeadId 受注機材ヘッダーid
 * @param connection
 */
export const delAllNyukoDen = async (juchuHeadId: number, juchuKizaiHeadId: number, connection: PoolClient) => {
  try {
    await deleteAllNyukoDen(juchuHeadId, juchuKizaiHeadId, connection);
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

export const updShukoResult = async (
  keepJuchuKizaiMeisaiData: KeepJuchuKizaiMeisaiValues[],
  shukoDat: Date,
  connection: PoolClient
) => {
  const updateData = keepJuchuKizaiMeisaiData.map((d) => ({
    juchuHeadId: d.juchuHeadId,
    juchuKizaiHeadId: d.juchuKizaiHeadId,
    juchuKizaiMeisaiId: d.juchuKizaiMeisaiId,
    kizaiId: d.kizaiId,
    shozokuId: d.shozokuId,
  }));

  try {
    for (const data of updateData) {
      await updateShukoResult(
        data.juchuHeadId,
        data.juchuKizaiHeadId,
        data.juchuKizaiMeisaiId,
        data.kizaiId,
        data.shozokuId,
        shukoDat.toISOString(),
        connection
      );
    }
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
 * 出庫実績削除
 * @param juchuKizaiMeisaiData 受注機材明細データ
 * @param connection
 * @returns
 */
export const delShukoResult = async (juchuKizaiMeisaiData: KeepJuchuKizaiMeisaiValues[], connection: PoolClient) => {
  const deleteData = juchuKizaiMeisaiData.map((d) => ({
    juchuHeadId: d.juchuHeadId,
    juchuKizaiHeadId: d.juchuKizaiHeadId,
    juchuKizaiMeisaiId: d.juchuKizaiMeisaiId,
    kizaiId: d.kizaiId,
  }));
  try {
    for (const data of deleteData) {
      await deleteShukoResult(
        data.juchuHeadId,
        data.juchuKizaiHeadId,
        data.juchuKizaiMeisaiId,
        data.kizaiId,
        connection
      );
    }
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
