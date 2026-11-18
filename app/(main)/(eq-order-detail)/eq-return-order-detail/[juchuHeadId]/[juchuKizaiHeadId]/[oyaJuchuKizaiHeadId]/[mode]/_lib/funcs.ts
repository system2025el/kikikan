'use server';

import { subDays } from 'date-fns';
import { revalidatePath } from 'next/cache';
import { PoolClient } from 'pg';

import { BASHO_ID, HONBANBI_SHUBETU_ID, JUCHU_KIZAI_HEAD_KBN, SAGYO_KBN_ID } from '@/app/_lib/constants';
import pool from '@/app/_lib/db/postgres';
import { selectMeisaiEqts } from '@/app/_lib/db/tables/m-kizai';
import {
  deleteJuchuContainerMeisai,
  insertJuchuContainerMeisai,
  selectCtnMaxMeisaiIdTx,
  updateJuchuContainerMeisai,
} from '@/app/_lib/db/tables/t-juchu-ctn-meisai';
import {
  insertReturnJuchuKizaiHead,
  selectReturnJuchuKizaiHead,
  updateReturnJuchuKizaiHead,
} from '@/app/_lib/db/tables/t-juchu-kizai-head';
import {
  deleteJuchuKizaiMeisai,
  insertJuchuKizaiMeisai,
  selectJuchuKizaiMeisaiKizaiTanka,
  selectJuchuKizaiMeisaiMaxIdWithDenTx,
  updateJuchuKizaiMeisai,
} from '@/app/_lib/db/tables/t-juchu-kizai-meisai';
import {
  deleteKicsOrYardNyukoDen,
  deleteNyukoDen,
  deleteNyushukoDen,
  selectNyukoDenWithoutMeisaiTx,
  upsertNyushukoDen,
} from '@/app/_lib/db/tables/t-nyushuko-den';
import { deleteKizaiIdNyushukoResult, deleteNyukoResult } from '@/app/_lib/db/tables/t-nyushuko-result';
import { selectJuchuContainerMeisai } from '@/app/_lib/db/tables/v-juchu-ctn-meisai';
import { selectOyaJuchuKizaiMeisai, selectReturnJuchuKizaiMeisai } from '@/app/_lib/db/tables/v-juchu-kizai-meisai';
import { JuchuCtnMeisai } from '@/app/_lib/db/types/t_juchu_ctn_meisai-type';
import { JuchuKizaiHead } from '@/app/_lib/db/types/t-juchu-kizai-head-type';
import { JuchuKizaiMeisai } from '@/app/_lib/db/types/t-juchu-kizai-meisai-type';
import { NyushukoDen } from '@/app/_lib/db/types/t-nyushuko-den-type';
import { logError } from '@/app/_lib/log-error';
import { getNyukoDate, getShukoDate } from '@/app/(main)/_lib/date-funcs';
import { expandHonbanbiTemplate, getHonbanbiTemplate } from '@/app/(main)/_lib/honbanbi-funcs';
import {
  addAllHonbanbi,
  addDummyNyushukoDen,
  addJuchuKizaiNyushuko,
  delAllKicsOrYardNyukoDen,
  delAllNyukoResult,
  delNyushukoCtnResult,
  delSiyouHonbanbi,
  getALLStockList,
  getDetailJuchuHead,
  getJuchuKizaiHeadMaxId,
  getJuchuKizaiNyushuko,
  getNyushukoFixFlag,
  isOyaShukoFixedTx,
  updJuchuKizaiNyushuko,
} from '@/app/(main)/(eq-order-detail)/_lib/funcs';
import { createNyukoDenMeisaiIdPicker } from '@/app/(main)/(eq-order-detail)/_lib/reuse-nyuko-den';
import { SaveNewChildJuchuKizaiHeadResult } from '@/app/(main)/(eq-order-detail)/_lib/types';
import { toEqStockList } from '@/app/(main)/(eq-order-detail)/eq-main-order-detail/[juchuHeadId]/[juchuKizaiHeadId]/[mode]/_lib/stock-list';
import {
  JuchuKizaiHonbanbiValues,
  StockTableValues,
} from '@/app/(main)/(eq-order-detail)/eq-main-order-detail/[juchuHeadId]/[juchuKizaiHeadId]/[mode]/_lib/types';

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
): Promise<SaveNewChildJuchuKizaiHeadResult> => {
  const connection = await pool.connect();

  const maxId = await getJuchuKizaiHeadMaxId(data.juchuHeadId);
  const newJuchuKizaiHeadId = maxId ? maxId.juchu_kizai_head_id + 1 : 1;

  try {
    await connection.query('BEGIN');

    // 親が全場所出発済みかを確かめ直す（受注画面を開いた後に出発解除されていたら作らない）
    if (!(await isOyaShukoFixedTx(data.juchuHeadId, data.oyaJuchuKizaiHeadId, connection))) {
      await connection.query('ROLLBACK');
      return { ok: false, reason: 'oyaNotFixed' };
    }

    // 受注機材ヘッダー追加
    await addReturnJuchuKizaiHead(newJuchuKizaiHeadId, data, userNam, connection);
    // 受注機材入出庫追加
    await addJuchuKizaiNyushuko(
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
      juchuHonbanbiShubetuId: HONBANBI_SHUBETU_ID.use,
      juchuHonbanbiDat: new Date(d),
      mem: '',
      juchuHonbanbiAddQty: 0,
    }));
    await addAllHonbanbi(data.juchuHeadId, newJuchuKizaiHeadId, addReturnJuchuSiyouHonbanbiData, userNam, connection);

    // 受注本番日テンプレートから本番日数を算出する。
    // 返却ヘッダーは本番日の行を持たないため、更新するのは本番日数だけ。
    const honbanbiTemplate = await getHonbanbiTemplate(data.juchuHeadId);
    await expandHonbanbiTemplate(
      data.juchuHeadId,
      newJuchuKizaiHeadId,
      updateDateRange[0] ?? null,
      updateDateRange[updateDateRange.length - 1] ?? null,
      honbanbiTemplate,
      userNam,
      connection,
      true
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
    logError(e);
    await connection.query('ROLLBACK');
    throw e;
  } finally {
    connection.release();
  }
};

/**
 * saveReturnJuchuKizai の各段で共通に使う値
 * data は画面で編集した返却受注機材ヘッダー（入庫日時は保存後の値）
 */
type SaveReturnJuchuKizaiContext = {
  data: ReturnJuchuKizaiHeadValues;
  userNam: string;
  connection: PoolClient;
};

/**
 * HT・ゲートが先に作った入庫伝票（受注明細なし）の明細idを使い回すための選び出し関数（機材・コンテナで共有する）
 */
type NyukoDenMeisaiIdPicker = ReturnType<typeof createNyukoDenMeisaiIdPicker>;

/**
 * [保存1] 返却受注機材ヘッダー・受注機材入出庫を更新し、使用日（種別1）と本番日数を作り直す
 * @param ctx
 * @param updateDateRange 返却日〜親の入庫日の全日
 */
const updReturnHeadAndHonbanbi = async (ctx: SaveReturnJuchuKizaiContext, updateDateRange: string[]) => {
  const { data, userNam, connection } = ctx;

  // 受注機材ヘッド更新
  await updReturnJuchuKizaiHead(data, userNam, connection);

  // 受注機材入出庫更新
  await updJuchuKizaiNyushuko(
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
    juchuHonbanbiShubetuId: HONBANBI_SHUBETU_ID.use,
    juchuHonbanbiDat: new Date(d),
    mem: '',
    juchuHonbanbiAddQty: 0,
  }));
  await delSiyouHonbanbi(data.juchuHeadId, data.juchuKizaiHeadId, connection);
  await addAllHonbanbi(data.juchuHeadId, data.juchuKizaiHeadId, addReturnJuchuSiyouHonbanbiData, userNam, connection);

  // 返却日が変わると適用期間（返却日〜親の入庫日）が変わるため本番日数を計算し直す。
  // 返却ヘッダーは本番日の行を持たないため、更新するのは本番日数だけ。
  const honbanbiTemplate = await getHonbanbiTemplate(data.juchuHeadId);
  await expandHonbanbiTemplate(
    data.juchuHeadId,
    data.juchuKizaiHeadId,
    updateDateRange[0] ?? null,
    updateDateRange[updateDateRange.length - 1] ?? null,
    honbanbiTemplate,
    userNam,
    connection,
    true
  );
};

/**
 * [保存2] 返却受注機材明細の新規の行に明細idを割り振り、追加・更新・削除に分ける（DBには書かない）
 * @param ctx
 * @param returnJuchuKizaiMeisaiList 画面の返却受注機材明細（削除した明細を含む）
 * @param pickNyukoDenMeisaiId 使い回す明細idの選び出し関数
 * @returns savedList 明細id割り振り済みの全明細（削除した明細を含む）、addList・updateList・deleteList
 */
const assignReturnKizaiMeisaiIds = async (
  ctx: SaveReturnJuchuKizaiContext,
  returnJuchuKizaiMeisaiList: ReturnJuchuKizaiMeisaiValues[],
  pickNyukoDenMeisaiId: NyukoDenMeisaiIdPicker
) => {
  const { data, connection } = ctx;

  // 受注機材明細id最大値（メイン明細と同じく入出庫伝票の明細idも含める。送信RPCが作った明細の無い伝票と重ならないように）
  let newReturnJuchuKizaiMeisaiId =
    (await selectJuchuKizaiMeisaiMaxIdWithDenTx(data.juchuHeadId, data.juchuKizaiHeadId, connection)) + 1;
  // 新規機材に明細id割り振り
  const newReturnJuchuKizaiMeisaiData = returnJuchuKizaiMeisaiList.map((d) =>
    d.juchuKizaiMeisaiId === 0 && !d.delFlag
      ? {
          ...d,
          juchuKizaiMeisaiId: pickNyukoDenMeisaiId(false, d.kizaiId, d.dspOrdNum) ?? newReturnJuchuKizaiMeisaiId++,
        }
      : d
  );

  return {
    savedList: newReturnJuchuKizaiMeisaiData,
    // 追加明細
    addList: newReturnJuchuKizaiMeisaiData.filter((d) => !d.delFlag && !d.saveFlag),
    // 更新明細
    updateList: newReturnJuchuKizaiMeisaiData.filter((d) => !d.delFlag && d.saveFlag),
    // 削除明細
    deleteList: newReturnJuchuKizaiMeisaiData.filter((d) => d.delFlag && d.saveFlag),
  };
};

/**
 * [保存2] 返却受注機材明細の削除・追加・更新
 * @param ctx
 * @param kizai assignReturnKizaiMeisaiIds の結果
 */
const writeReturnKizaiMeisai = async (
  ctx: SaveReturnJuchuKizaiContext,
  kizai: Awaited<ReturnType<typeof assignReturnKizaiMeisaiIds>>
) => {
  const { userNam, connection } = ctx;

  // 削除
  if (kizai.deleteList.length > 0) {
    await delReturnJuchuKizaiMeisai(kizai.deleteList, connection);
  }
  // 追加
  if (kizai.addList.length > 0) {
    await addReturnJuchuKizaiMeisai(kizai.addList, userNam, connection);
  }
  // 更新
  if (kizai.updateList.length > 0) {
    await updReturnJuchuKizaiMeisai(kizai.updateList, userNam, connection);
  }
};

/**
 * [保存3] 返却受注コンテナ明細の新規の行に明細idを割り振り、追加・更新・削除に分ける（DBには書かない）
 * @param ctx
 * @param returnJuchuContainerMeisaiList 画面の返却受注コンテナ明細（削除した明細を含む）
 * @param pickNyukoDenMeisaiId 使い回す明細idの選び出し関数
 * @returns savedList 明細id割り振り済みの全コンテナ（削除したコンテナを含む）、addList・updateList・deleteList
 */
const assignReturnCtnMeisaiIds = async (
  ctx: SaveReturnJuchuKizaiContext,
  returnJuchuContainerMeisaiList: ReturnJuchuContainerMeisaiValues[],
  pickNyukoDenMeisaiId: NyukoDenMeisaiIdPicker
) => {
  const { data, connection } = ctx;

  // 受注コンテナ明細id最大値（出庫明細・送信RPCと同じく、受注コンテナ明細とコンテナの入出庫伝票の最大値。
  // 送信RPCが作った明細の無いコンテナ伝票と重ならないように）
  let newReturnJuchuContainerMeisaiId =
    (await selectCtnMaxMeisaiIdTx(data.juchuHeadId, data.juchuKizaiHeadId, connection)) + 1;
  // 新規コンテナに明細id割り振り
  const newReturnJuchuContainerMeisaiData = returnJuchuContainerMeisaiList.map((d) =>
    d.juchuKizaiMeisaiId === 0 && !d.delFlag
      ? {
          ...d,
          juchuKizaiMeisaiId: pickNyukoDenMeisaiId(true, d.kizaiId, d.dspOrdNum) ?? newReturnJuchuContainerMeisaiId++,
        }
      : d
  );

  return {
    savedList: newReturnJuchuContainerMeisaiData,
    // 追加コンテナ
    addList: newReturnJuchuContainerMeisaiData.filter((d) => !d.delFlag && !d.saveFlag),
    // 更新コンテナ
    updateList: newReturnJuchuContainerMeisaiData.filter((d) => !d.delFlag && d.saveFlag),
    // 削除コンテナ
    deleteList: newReturnJuchuContainerMeisaiData.filter((d) => d.delFlag && d.saveFlag),
  };
};

/**
 * [保存3] 返却受注コンテナ明細の削除・追加・更新
 * @param ctx
 * @param ctn assignReturnCtnMeisaiIds の結果
 */
const writeReturnCtnMeisai = async (
  ctx: SaveReturnJuchuKizaiContext,
  ctn: Awaited<ReturnType<typeof assignReturnCtnMeisaiIds>>
) => {
  const { data, userNam, connection } = ctx;

  // 削除
  if (ctn.deleteList.length > 0) {
    const deleteKizaiIds = ctn.deleteList.map((d) => d.kizaiId);
    await delReturnJuchuContainerMeisai(data.juchuHeadId, data.juchuKizaiHeadId, deleteKizaiIds, connection);
  }
  // 追加
  if (ctn.addList.length > 0) {
    await addReturnJuchuContainerMeisai(ctn.addList, userNam, connection);
  }
  // 更新
  if (ctn.updateList.length > 0) {
    await updReturnJuchuContainerMeisai(ctn.updateList, userNam, connection);
  }
};

/**
 * [保存4] 削除した機材・コンテナの入出庫伝票・入出庫実績を削除する
 * @param ctx
 * @param deleteKizaiList 削除した機材明細
 * @param deleteCtnList 削除したコンテナ明細
 */
const delDeletedReturnNyushukoDen = async (
  ctx: SaveReturnJuchuKizaiContext,
  deleteKizaiList: ReturnJuchuKizaiMeisaiValues[],
  deleteCtnList: ReturnJuchuContainerMeisaiValues[]
) => {
  const { data, connection } = ctx;

  // 機材入出庫伝票、入出庫実績削除
  if (deleteKizaiList.length > 0) {
    await delReturnNyushukoDen(deleteKizaiList, connection);

    await delNyushukoResult(deleteKizaiList, connection);
  }

  // コンテナ入出庫伝票、入出庫実績削除
  if (deleteCtnList.length > 0) {
    await delCtnNyukoDen(deleteCtnList, connection);

    const deleteIds = deleteCtnList.map((d) => d.kizaiId);
    if (deleteIds.length > 0) {
      await delNyushukoCtnResult(data.juchuHeadId, data.juchuKizaiHeadId, deleteIds, connection);
    }
  }
};

/**
 * [保存5] 入庫日時が変わった場所の入庫伝票・入庫実績を削除し、ダミーの入庫伝票を作る（作り直しは rebuildReturnNyukoDen）
 * @param ctx
 * @param savedList 明細id割り振り済みの全機材明細（削除した明細を含む）
 * @param checkKicsDat KICS入庫日時が変わったか
 * @param checkYardDat YARD入庫日時が変わったか
 */
const delReturnNyukoDenForDatChange = async (
  ctx: SaveReturnJuchuKizaiContext,
  savedList: ReturnJuchuKizaiMeisaiValues[],
  checkKicsDat: boolean,
  checkYardDat: boolean
) => {
  const { data, userNam, connection } = ctx;

  if (checkKicsDat) {
    await delAllKicsOrYardNyukoDen(data.juchuHeadId, data.juchuKizaiHeadId, BASHO_ID.kics, connection);

    await delAllNyukoResult(data.juchuHeadId, data.juchuKizaiHeadId, BASHO_ID.kics, connection);

    if (data.kicsNyukoDat && data.yardNyukoDat && !checkYardDat) {
      const kicsNyukoData = savedList.filter((d) => !d.delFlag && d.mShozokuId === BASHO_ID.kics);

      if (kicsNyukoData.length) {
        await delReturnKicsOrYardNyukoDen(kicsNyukoData, BASHO_ID.yard, connection);

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

  if (checkYardDat) {
    await delAllKicsOrYardNyukoDen(data.juchuHeadId, data.juchuKizaiHeadId, BASHO_ID.yard, connection);

    await delAllNyukoResult(data.juchuHeadId, data.juchuKizaiHeadId, BASHO_ID.yard, connection);

    if (data.kicsNyukoDat && data.yardNyukoDat && !checkKicsDat) {
      const yardNyukoData = savedList.filter((d) => !d.delFlag && d.mShozokuId === BASHO_ID.yard);

      if (yardNyukoData.length) {
        await delReturnKicsOrYardNyukoDen(yardNyukoData, BASHO_ID.kics, connection);

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
 * [保存5] 機材・コンテナの入庫伝票を作り直す（追加・更新）
 * @param ctx
 * @param savedKizaiList 明細id割り振り済みの全機材明細（削除した明細を含む）
 * @param savedCtnList 明細id割り振り済みの全コンテナ明細（削除したコンテナを含む）
 */
const rebuildReturnNyukoDen = async (
  ctx: SaveReturnJuchuKizaiContext,
  savedKizaiList: ReturnJuchuKizaiMeisaiValues[],
  savedCtnList: ReturnJuchuContainerMeisaiValues[]
) => {
  const { data, userNam, connection } = ctx;

  // 入庫追加更新
  if (data.kicsNyukoDat && data.yardNyukoDat) {
    // KICS入庫明細
    const kicsNyukoData = savedKizaiList.filter((d) => !d.delFlag && d.mShozokuId === BASHO_ID.kics);
    // YARD入庫明細
    const yardNyukoData = savedKizaiList.filter((d) => !d.delFlag && d.mShozokuId === BASHO_ID.yard);

    if (kicsNyukoData.length > 0) {
      await upsNyukoDen(kicsNyukoData, data.kicsNyukoDat, BASHO_ID.kics, userNam, connection);
    }

    if (yardNyukoData.length > 0) {
      await upsNyukoDen(yardNyukoData, data.yardNyukoDat, BASHO_ID.yard, userNam, connection);
    }

    // コンテナ入庫明細
    const ctnNyukoData = savedCtnList.filter((d) => !d.delFlag);
    if (ctnNyukoData.length > 0) {
      await upsCtnNyukoDen(ctnNyukoData, data.kicsNyukoDat, BASHO_ID.kics, BASHO_ID.kics, userNam, connection);

      await upsCtnNyukoDen(ctnNyukoData, data.yardNyukoDat, BASHO_ID.yard, BASHO_ID.yard, userNam, connection);
    }
  } else if (data.kicsNyukoDat && !data.yardNyukoDat) {
    // KICS機材明細
    const kicsNyukoData = savedKizaiList.filter((d) => !d.delFlag);

    if (kicsNyukoData.length > 0) {
      await upsNyukoDen(kicsNyukoData, data.kicsNyukoDat, BASHO_ID.kics, userNam, connection);
    }

    // KICSコンテナ入庫明細
    const ctnNyukoData = savedCtnList.filter((d) => !d.delFlag);
    if (ctnNyukoData.length > 0) {
      await upsCtnNyukoDen(ctnNyukoData, data.kicsNyukoDat, BASHO_ID.kics, BASHO_ID.others, userNam, connection);
    }
  } else if (!data.kicsNyukoDat && data.yardNyukoDat) {
    // YARD機材明細
    const yardNyukoData = savedKizaiList.filter((d) => !d.delFlag);

    if (yardNyukoData.length > 0) {
      await upsNyukoDen(yardNyukoData, data.yardNyukoDat, BASHO_ID.yard, userNam, connection);
    }

    // YARDコンテナ入庫明細
    const ctnNyukoData = savedCtnList.filter((d) => !d.delFlag);
    if (ctnNyukoData.length > 0) {
      await upsCtnNyukoDen(ctnNyukoData, data.yardNyukoDat, BASHO_ID.yard, BASHO_ID.others, userNam, connection);
    }
  }
};

/**
 * 返却受注機材ヘッダー保存
 * @param checkJuchuKizaiHead 返却受注機材ヘッダーが変わったか
 * @param checkJuchuKizaiMeisai 返却受注機材明細が変わったか
 * @param checkJuchuContainerMeisai 返却受注コンテナ明細が変わったか
 * @param checkKicsDat KICS入庫日時が変わったか
 * @param checkYardDat YARD入庫日時が変わったか
 * @param data 返却受注機材ヘッダー
 * @param updateDateRange 返却日〜親の入庫日の全日
 * @param returnJuchuKizaiMeisaiList 画面の返却受注機材明細（削除した明細を含む）
 * @param returnJuchuContainerMeisaiList 画面の返却受注コンテナ明細（削除したコンテナを含む）
 * @param userNam ユーザー名
 * @returns
 *
 * 処理は段ごとに関数に分けてあり、ここではどの段を動かすかの判定と、トランザクションだけを持つ。
 * 段の順番は変えないこと。
 */
export const saveReturnJuchuKizai = async (
  checkJuchuKizaiHead: boolean,
  checkJuchuKizaiMeisai: boolean,
  checkJuchuContainerMeisai: boolean,
  checkKicsDat: boolean,
  checkYardDat: boolean,
  data: ReturnJuchuKizaiHeadValues,
  updateDateRange: string[],
  returnJuchuKizaiMeisaiList: ReturnJuchuKizaiMeisaiValues[],
  returnJuchuContainerMeisaiList: ReturnJuchuContainerMeisaiValues[],
  userNam: string
) => {
  const connection = await pool.connect();
  const ctx: SaveReturnJuchuKizaiContext = { data, userNam, connection };

  try {
    await connection.query('BEGIN');

    // 1. 返却受注機材ヘッダー・入庫日時・使用日・本番日数
    if (checkJuchuKizaiHead) {
      await updReturnHeadAndHonbanbi(ctx, updateDateRange);
    }

    if (checkKicsDat || checkYardDat || checkJuchuKizaiMeisai || checkJuchuContainerMeisai) {
      // HT・ゲートが親機材として読んで先に作った入庫伝票（受注明細なし）があれば、その明細idを使い回す（機材・コンテナ共通）
      const pickNyukoDenMeisaiId = createNyukoDenMeisaiIdPicker(
        await selectNyukoDenWithoutMeisaiTx(data.juchuHeadId, data.juchuKizaiHeadId, connection)
      );

      // 2. 返却受注機材明細（明細idの割り振りは、明細に変更が無くても入庫伝票の作り直しに使うので必ず行う）
      const kizai = await assignReturnKizaiMeisaiIds(ctx, returnJuchuKizaiMeisaiList, pickNyukoDenMeisaiId);
      if (checkJuchuKizaiMeisai) {
        await writeReturnKizaiMeisai(ctx, kizai);
      }

      // 3. 返却受注コンテナ明細
      const ctn = await assignReturnCtnMeisaiIds(ctx, returnJuchuContainerMeisaiList, pickNyukoDenMeisaiId);
      if (checkJuchuContainerMeisai) {
        await writeReturnCtnMeisai(ctx, ctn);
      }

      // 4. 削除した機材・コンテナの入出庫伝票・実績
      await delDeletedReturnNyushukoDen(ctx, kizai.deleteList, ctn.deleteList);

      // 5. 入庫伝票・入庫実績（削除してから作り直す）
      await delReturnNyukoDenForDatChange(ctx, kizai.savedList, checkKicsDat, checkYardDat);
      await rebuildReturnNyukoDen(ctx, kizai.savedList, ctn.savedList);
    }

    await connection.query('COMMIT');

    await revalidatePath('/eqpt-order-list');
    await revalidatePath('/shuko-list');
    await revalidatePath('/nyuko-list');

    return true;
  } catch (e) {
    logError(e);
    await connection.query('ROLLBACK');
    throw e;
  } finally {
    connection.release();
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
      throw new Error('[selectReturnJuchuKizaiHead] DBエラー:', { cause: error });
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
    logError(e);
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
const addReturnJuchuKizaiHead = async (
  returnJuchuKizaiHeadId: number,
  returnJuchuKizaiHeadData: ReturnJuchuKizaiHeadValues,
  userNam: string,
  connection: PoolClient
) => {
  const newData: JuchuKizaiHead = {
    juchu_head_id: returnJuchuKizaiHeadData.juchuHeadId,
    juchu_kizai_head_id: returnJuchuKizaiHeadId,
    juchu_kizai_head_kbn: JUCHU_KIZAI_HEAD_KBN.return,
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
  } catch (e) {
    logError(e);
    throw e;
  }
};

/**
 * 返却受注機材ヘッダー更新
 * @param juchuKizaiHeadData 受注機材ヘッダーデータ
 * @param userNam ユーザー名
 * @returns
 */
const updReturnJuchuKizaiHead = async (
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
  } catch (e) {
    logError(e);
    throw e;
  }
};

/**
 * 返却受注機材明細リスト取得
 * @param juchuHeadId 受注ヘッダーid
 * @param juchuKizaiHeadId 受注機材ヘッダーid
 * @returns 返却受注機材明細
 */
const getReturnJuchuKizaiMeisai = async (
  juchuHeadId: number,
  juchuKizaiHeadId: number,
  oyaJuchuKizaiHeadId: number
) => {
  try {
    const [
      { data: returnData, error: returnError },
      { data: eqTanka, error: eqTankaError },
      { data: oyaData, error: oyaError },
    ] = await Promise.all([
      selectReturnJuchuKizaiMeisai(juchuHeadId, juchuKizaiHeadId),
      selectJuchuKizaiMeisaiKizaiTanka(juchuHeadId, juchuKizaiHeadId),
      selectOyaJuchuKizaiMeisai(juchuHeadId, oyaJuchuKizaiHeadId),
    ]);
    if (returnError) {
      throw new Error('[selectReturnJuchuKizaiMeisai] DBエラー:', { cause: returnError });
    }
    if (eqTankaError) {
      throw new Error('[selectJuchuKizaiMeisaiKizaiTanka] DBエラー:', { cause: eqTankaError });
    }
    if (oyaError) {
      throw new Error('[selectOyaJuchuKizaiMeisai] DBエラー:', { cause: oyaError });
    }

    const eqIds = [...new Set(returnData.map((data) => data.kizai_id))];

    const { data: mKizai, error: mKizaiError } = await selectMeisaiEqts(eqIds);

    if (mKizaiError) {
      throw new Error('[selectMeisaiEqts] DBエラー:', { cause: mKizaiError });
    }

    const returnJuchuKizaiMeisaiData: ReturnJuchuKizaiMeisaiValues[] = returnData.map((d) => ({
      juchuHeadId: d.juchu_head_id,
      juchuKizaiHeadId: d.juchu_kizai_head_id,
      juchuKizaiMeisaiId: d.juchu_kizai_meisai_id,
      mShozokuId: mKizai.find((data) => data.kizai_id === d.kizai_id)?.shozoku_id ?? 0,
      shozokuId: d.shozoku_id,
      shozokuNam: d.shozoku_nam ?? '',
      mem: d.mem,
      mem2: d.mem2,
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
      selected: false,
    }));
    return returnJuchuKizaiMeisaiData;
  } catch (e) {
    logError(e);
    throw e;
  }
};

/**
 * 返却受注機材明細新規追加
 * @param returnJuchuKizaiMeisaiData 返却受注機材明細データ
 * @param userNam ユーザー名
 * @returns
 */
const addReturnJuchuKizaiMeisai = async (
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
    mem2: d.mem2,
    dsp_ord_num: d.dspOrdNum,
    indent_num: d.indentNum,
    add_dat: new Date().toISOString(),
    add_user: userNam,
    shozoku_id: d.shozokuId,
  }));
  try {
    await insertJuchuKizaiMeisai(newData, connection);
  } catch (e) {
    logError(e);
    throw e;
  }
};

/**
 * 返却受注機材明細更新
 * @param returnJuchuKizaiMeisaiData 返却受注機材明細データ
 * @param userNam ユーザー名
 * @returns
 */
const updReturnJuchuKizaiMeisai = async (
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
    mem2: d.mem2,
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
    logError(e);
    throw e;
  }
};

/**
 * 返却受注機材明細削除
 * @param juchuHeadId 受注ヘッダーid
 * @param juchuKizaiHeadId 受注機材ヘッダーid
 * @param kizaiId 機材id
 */
const delReturnJuchuKizaiMeisai = async (
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
  } catch (e) {
    logError(e);
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
      selected: false,
    }));
    return returnJuchuContainerMeisaiData;
  } catch (e) {
    logError(e);
    throw e;
  }
};

/**
 * 返却明細画面を開いたときの明細一式（返却受注機材明細・返却受注コンテナ明細・機材在庫）の取得
 * Server Action は1本ずつ順番に処理され、1往復ごとに時間が上乗せされるので、
 * 明細の内容で決まる在庫の取得までサーバー側で続けて行い、画面からは1回の呼び出しで済ませる（メイン明細と同じ）
 * （エラーの記録は中で呼ぶ各取得関数が行う）
 * @param juchuHeadId 受注ヘッダーid
 * @param juchuKizaiHeadId 受注機材ヘッダーid
 * @param oyaJuchuKizaiHeadId 親受注機材ヘッダーid
 * @param nyukoDate 返却入庫日（在庫テーブルの基準日。テーブルの左端はこの前日）
 * @returns stockList は返却受注機材明細の並びに合わせた明細ごとの在庫（明細が無い・返却入庫日が無いときは空配列）
 */
export const getReturnJuchuKizaiDetailData = async (
  juchuHeadId: number,
  juchuKizaiHeadId: number,
  oyaJuchuKizaiHeadId: number,
  nyukoDate: Date | null
) => {
  const [returnJuchuKizaiMeisaiData, returnJuchuContainerMeisaiData] = await Promise.all([
    getReturnJuchuKizaiMeisai(juchuHeadId, juchuKizaiHeadId, oyaJuchuKizaiHeadId),
    getReturnJuchuContainerMeisai(juchuHeadId, juchuKizaiHeadId, oyaJuchuKizaiHeadId),
  ]);

  const kizaiIds = returnJuchuKizaiMeisaiData.filter((d) => !d.delFlag).map((d) => d.kizaiId);
  const uniqueIds = Array.from(new Set(kizaiIds));
  const stockList: StockTableValues[][] =
    uniqueIds.length > 0 && nyukoDate
      ? toEqStockList(kizaiIds, await getALLStockList(juchuHeadId, juchuKizaiHeadId, uniqueIds, subDays(nyukoDate, 1)))
      : [];

  return { returnJuchuKizaiMeisaiData, returnJuchuContainerMeisaiData, stockList };
};

/**
 * ほかの人が編集中で編集に入れなかったときに、画面を最新の内容に読み直すためのデータを取得する
 * （受注ヘッダー・親受注機材入出庫・到着フラグ・返却受注機材ヘッダー・明細一式）
 * 以前は画面から3回に分けて呼んでいた（Server Action は1本ずつ順番に処理される）ので、サーバー側で続けて取る
 * （エラーの記録は中で呼ぶ各取得関数が行う）
 * @param juchuHeadId 受注ヘッダーid
 * @param juchuKizaiHeadId 受注機材ヘッダーid（0 は新規なので、返却受注機材ヘッダー以降は取らない）
 * @param oyaJuchuKizaiHeadId 親受注機材ヘッダーid
 * @returns kizai は返却受注機材ヘッダーが無いとき（新規・見つからない）は null
 */
export const getReturnJuchuKizaiLockReloadData = async (
  juchuHeadId: number,
  juchuKizaiHeadId: number,
  oyaJuchuKizaiHeadId: number
) => {
  const [juchuHeadData, oyaJuchuKizaiHeadData, nyukoFixFlag] = await Promise.all([
    getDetailJuchuHead(juchuHeadId),
    getJuchuKizaiNyushuko(juchuHeadId, oyaJuchuKizaiHeadId),
    getNyushukoFixFlag(juchuHeadId, juchuKizaiHeadId, SAGYO_KBN_ID.nyukoConfirmed),
  ]);

  // 画面側は、受注ヘッダー・親の入出庫データ・親の出庫日/入庫日のどれかが無ければここで読み直しをやめる。
  // そのときは以前と同じく返却受注機材ヘッダー以降を取らない（取得でエラーになることもあるため）
  const noOyaDate =
    !oyaJuchuKizaiHeadData ||
    !getShukoDate(oyaJuchuKizaiHeadData.kicsShukoDat, oyaJuchuKizaiHeadData.yardShukoDat) ||
    !getNyukoDate(oyaJuchuKizaiHeadData.kicsNyukoDat, oyaJuchuKizaiHeadData.yardNyukoDat);
  if (!juchuHeadData || noOyaDate || juchuKizaiHeadId === 0) {
    return { juchuHeadData, oyaJuchuKizaiHeadData, nyukoFixFlag, kizai: null };
  }

  const returnJuchuKizaiHeadData = await getReturnJuchuKizaiHead(juchuHeadId, juchuKizaiHeadId);
  if (!returnJuchuKizaiHeadData) {
    return { juchuHeadData, oyaJuchuKizaiHeadData, nyukoFixFlag, kizai: null };
  }

  // 明細一式は返却入庫日（在庫テーブルの基準日）が要るので、返却受注機材ヘッダーの後に取る（画面側と同じ求め方）
  const returnNyukoDate = getNyukoDate(
    returnJuchuKizaiHeadData.kicsNyukoDat && new Date(returnJuchuKizaiHeadData.kicsNyukoDat),
    returnJuchuKizaiHeadData.yardNyukoDat && new Date(returnJuchuKizaiHeadData.yardNyukoDat)
  );
  const detailData = await getReturnJuchuKizaiDetailData(
    returnJuchuKizaiHeadData.juchuHeadId,
    returnJuchuKizaiHeadData.juchuKizaiHeadId,
    returnJuchuKizaiHeadData.oyaJuchuKizaiHeadId,
    returnNyukoDate
  );

  return { juchuHeadData, oyaJuchuKizaiHeadData, nyukoFixFlag, kizai: { returnJuchuKizaiHeadData, ...detailData } };
};

/**
 * 返却受注コンテナ明細新規追加
 * @param returnJuchuContainerMeisaiData 返却受注コンテナ明細データ
 * @param userNam ユーザー名
 * @returns
 */
const addReturnJuchuContainerMeisai = async (
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
  } catch (e) {
    logError(e);
    throw e;
  }
};

/**
 * 返却受注コンテナ明細更新
 * @param returnJuchuContainerMeisaiData 返却受注コンテナ明細データ
 * @param userNam ユーザー名
 * @returns
 */
const updReturnJuchuContainerMeisai = async (
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
  } catch (e) {
    logError(e);
    throw e;
  }
};

/**
 * 返却受注コンテナ明細削除
 * @param juchuHeadId 受注ヘッダーid
 * @param juchuKizaiHeadId 受注機材ヘッダーid
 * @param deleteJuchuContainerMeisaiIds 受注コンテナ明細id
 */
const delReturnJuchuContainerMeisai = async (
  juchuHeadId: number,
  juchuKizaiHeadId: number,
  kizaiId: number[],
  connection: PoolClient
) => {
  try {
    await deleteJuchuContainerMeisai(juchuHeadId, juchuKizaiHeadId, kizaiId, connection);
  } catch (e) {
    logError(e);
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
const upsNyukoDen = async (
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
    sagyo_kbn_id: SAGYO_KBN_ID.nyukoCount,
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
    logError(e);
    throw e;
  }
};

/**
 * 返却入出庫伝票削除
 * @param juchuHeadId 受注ヘッダーid
 * @param juchuKizaiHeadId 受注機材ヘッダーid
 * @param kizaiId 機材id
 */
const delReturnNyushukoDen = async (
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
  } catch (e) {
    logError(e);
    throw e;
  }
};

/**
 * 返却入庫伝票削除(KICS/YARD)
 * @param juchuKizaiMeisaiData
 * @param sagyoId
 * @param connection
 */
const delReturnKicsOrYardNyukoDen = async (
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
    logError(e);
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
const upsCtnNyukoDen = async (
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
    sagyo_kbn_id: SAGYO_KBN_ID.nyukoCount,
    sagyo_den_dat: nyukoDat.toISOString(),
    sagyo_id: sagyoId,
    kizai_id: d.kizaiId,
    plan_qty:
      planQtyId === BASHO_ID.kics ? d.planKicsKizaiQty : planQtyId === BASHO_ID.yard ? d.planYardKizaiQty : d.planQty,
    dsp_ord_num: d.dspOrdNum,
    indent_num: d.indentNum,
    add_dat: new Date().toISOString(),
    add_user: userNam,
  }));

  try {
    await upsertNyushukoDen(upsertCtnNyukoData, connection);
  } catch (e) {
    logError(e);
    throw e;
  }
};

/**
 * コンテナ入庫伝票削除
 * @param returnJuchuKizaiMeisaiData キープ受注コンテナ明細データ
 * @param connection
 * @returns
 */
const delCtnNyukoDen = async (
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
  } catch (e) {
    logError(e);
    throw e;
  }
};

/**
 * 入出庫実績削除
 * @param juchuKizaiMeisaiData 受注機材明細データ
 * @param connection
 * @returns
 */
const delNyushukoResult = async (juchuKizaiMeisaiData: ReturnJuchuKizaiMeisaiValues[], connection: PoolClient) => {
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
    logError(e);
    throw e;
  }
};

/**
 * 入庫実績削除
 * @param juchuKizaiMeisaiData 受注機材明細データ
 * @param connection
 * @returns
 */
const delNyukoResult = async (
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
  } catch (e) {
    logError(e);
    throw e;
  }
};
