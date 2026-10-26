'use server';

import { revalidatePath } from 'next/cache';
import { PoolClient } from 'pg';

import { BASHO_ID, HONBANBI_SHUBETU_ID, JUCHU_KIZAI_HEAD_KBN, SAGYO_KBN_ID } from '@/app/_lib/constants';
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
  deleteAllJuchuContainerMeisaiShozoku,
  deleteJuchuContainerMeisai,
  insertJuchuContainerMeisai,
  selectJuchuContainerMeisaiRowsTx,
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
  deleteJuchuKizaiJizen,
  selectJuchuKizaiJizen,
  upsertJuchuKizaiJizen,
} from '@/app/_lib/db/tables/t-juchu-kizai-jizen';
import {
  deleteJuchuKizaiMeisai,
  insertJuchuKizaiMeisai,
  selectJuchuKizaiMeisaiKizaiTanka,
  selectJuchuKizaiMeisaiMaxIdWithDenTx,
  updateJuchuKizaiMeisai,
} from '@/app/_lib/db/tables/t-juchu-kizai-meisai';
import { updateShukoCtnResultDat } from '@/app/_lib/db/tables/t-nyushuko-ctn-result';
import {
  deleteAllNyushukoDen,
  deleteAllShukoCtnDenBasho,
  deleteContainerNyushukoDen,
  deleteJizenDen,
  deleteKicsOrYardNyukoDen,
  deleteKicsOrYardShukoDen,
  deleteNyukoDen,
  deleteNyushukoDen,
  deleteNyushukoDenKeepResulted,
  deleteShukoDen,
  deleteShukoDenBashoKeepResulted,
  insertNyushukoDen,
  selectContainerNyushukoDenConfirm,
  selectJizenResultExists,
  selectShukoResultDenKizaiCount,
  selectShukoResultExistsBasho,
  updateDeletedShukoDenDat,
  updateNyushukoDen,
  updateNyushukoDenFromKizaiMeisai,
  updateShukoCtnDenDat,
  upsertJizenDen,
  upsertNyushukoDen,
  upsertShukoDenBasho,
} from '@/app/_lib/db/tables/t-nyushuko-den';
import {
  deleteNyushukoFix,
  insertNyushukoFix,
  selectFixedSagyoIdsTx,
  selectNyushukoFixConfirm,
  updateNyushukoFix,
} from '@/app/_lib/db/tables/t-nyushuko-fix';
import {
  deleteJizenResult,
  deleteKizaiIdNyushukoResult,
  deleteKizaiIdNyushukoResultKeepDen,
  deleteNyukoResult,
  deleteShukoResult,
  deleteShukoResultBashoKeepDen,
  updateDeletedShukoResultDat,
  updateJizenResultDat,
  updateShukoResult,
} from '@/app/_lib/db/tables/t-nyushuko-result';
import { selectActiveBumons } from '@/app/_lib/db/tables/v_bumon_lst';
import { selectJuchuKizaiMeisai } from '@/app/_lib/db/tables/v-juchu-kizai-meisai';
import { selectIdoJuchuKizaiMeisai } from '@/app/_lib/db/tables/v-juchu-kizai-meisai-sum';
import { selectChosenEqptsDetails } from '@/app/_lib/db/tables/v-kizai-list';
import { selectActiveEqpts } from '@/app/_lib/db/tables/v-kizai-lst-sel';
import { selectShukoStateConfirm } from '@/app/_lib/db/tables/v-nyushuko-den2';
import { selectFinishedReturn } from '@/app/_lib/db/tables/v-nyushuko-den2-lst-oyako';
import { JuchuCtnMeisai } from '@/app/_lib/db/types/t_juchu_ctn_meisai-type';
import { IdoDenJuchu } from '@/app/_lib/db/types/t-ido-den-juchu-type';
import { IdoDen } from '@/app/_lib/db/types/t-ido-den-type';
import { IdoFix } from '@/app/_lib/db/types/t-ido-fix-type';
import { JuchuKizaiHead } from '@/app/_lib/db/types/t-juchu-kizai-head-type';
import { JuchuKizaiHonbanbi } from '@/app/_lib/db/types/t-juchu-kizai-honbanbi-type';
import { JuchuKizaiMeisai } from '@/app/_lib/db/types/t-juchu-kizai-meisai-type';
import { NyushukoDen } from '@/app/_lib/db/types/t-nyushuko-den-type';
import { NyushukoFix } from '@/app/_lib/db/types/t-nyushuko-fix-type';
import { syncNyukoCtnAfterDelete } from '@/app/(main)/_lib/ctn-nyuko-funcs';
import { toJapanYMDString } from '@/app/(main)/_lib/date-conversion';
import { getNyukoDate, getRange } from '@/app/(main)/_lib/date-funcs';
import { expandHonbanbiTemplate, getHonbanbiTemplate } from '@/app/(main)/_lib/honbanbi-funcs';
import {
  addAllHonbanbi,
  addJuchuKizaiNyushuko,
  delAllKicsOrYardNyukoDen,
  delAllKicsOrYardShukoCtnResult,
  delAllKicsOrYardShukoDen,
  delAllNyukoResult,
  delAllNyushukoDen,
  delAllNyushukoResult,
  delAllShukoResult,
  delSiyouHonbanbi,
  getChildJuchuKizaiHead,
  getJuchuContainerMeisaiTx,
  getJuchuKizaiHeadMaxId,
  getJuchuKizaiNyushuko,
  updJuchuKizaiNyushuko,
} from '@/app/(main)/(eq-order-detail)/_lib/funcs';
import { IdoList } from '@/app/(main)/ido-list/_ui/ido-list';

import { validateJizen } from './jizen';
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
 * メイン受注機材ヘッダー取得
 * @param juchuHeadId 受注ヘッダーid
 * @param juchuKizaiHeadId 受注機材ヘッダーid
 * @returns 受注機材ヘッダーデータ
 */
export const getJuchuKizaiHead = async (juchuHeadId: number, juchuKizaiHeadId: number) => {
  try {
    const juchuKizaiHeadData = await selectJuchuKizaiHead(juchuHeadId, juchuKizaiHeadId);

    if (juchuKizaiHeadData.error) {
      throw new Error('[selectJuchuKizaiHead] DBエラー:', { cause: juchuKizaiHeadData.error });
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
 * メイン受注機材明細取得
 * @param juchuHeadId 受注ヘッダーid
 * @param juchuKizaiHeadId 受注機材ヘッダーid
 * @returns
 */
export const getJuchuKizaiMeisai = async (juchuHeadId: number, juchuKizaiHeadId: number) => {
  try {
    const [/*{ data: eqList, error: eqListError }*/ eqList, { data: eqTanka, error: eqTankaError }, jizenList] =
      await Promise.all([
        selectJuchuKizaiMeisai(juchuHeadId, juchuKizaiHeadId),
        selectJuchuKizaiMeisaiKizaiTanka(juchuHeadId, juchuKizaiHeadId),
        selectJuchuKizaiJizen(juchuHeadId, juchuKizaiHeadId),
      ]);
    // 事前準備（明細id・機材がキー）
    const jizenMap = new Map(jizenList.map((j) => [`${j.juchu_kizai_meisai_id}_${j.kizai_id}`, j]));
    // if (eqListError) {
    //   console.error('getJuchuKizaiMeisai eqList error : ', eqListError);
    //   throw eqListError;
    // }
    if (eqTankaError) {
      throw new Error('[selectJuchuKizaiMeisaiKizaiTanka] DBエラー:', { cause: eqTankaError });
    }

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
      throw new Error('[selectMeisaiEqts] DBエラー:', { cause: mKizaiError });
    }

    const juchuKizaiMeisaiData: JuchuKizaiMeisaiValues[] = uniqueEqList.map((d) => {
      const row: JuchuKizaiMeisaiValues = {
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
        selected: false,
      };
      // 事前準備が無い明細は項目自体を持たせない（画面の未保存判定の JSON 比較を合わせるため。withJizen と同じ）
      const jizen = jizenMap.get(`${d.juchu_kizai_meisai_id}_${d.kizai_id}`);
      return jizen ? { ...row, jizenDat: new Date(jizen.jizen_dat), jizenQty: jizen.jizen_qty } : row;
    });
    return juchuKizaiMeisaiData;
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
      throw new Error('[selectMeisaiEqts] DBエラー:', { cause: mKizaiError });
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
      kizaiQty: Number(d.kizai_qty ?? 0),
      planKizaiQty: Number(d.plan_kizai_qty ?? 0),
      planYobiQty: Number(d.plan_yobi_qty ?? 0),
      planQty: Number(d.plan_qty ?? 0),
      delFlag: false,
      saveFlag: true,
    }));
    return juchuKizaiMeisaiData;
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
    sagyo_kbn_id: SAGYO_KBN_ID.shukoPicking,
    sagyo_den_dat:
      d.shozokuId === BASHO_ID.kics
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
    sagyo_kbn_id: SAGYO_KBN_ID.shukoConfirmation,
    sagyo_den_dat:
      d.shozokuId === BASHO_ID.kics
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
    sagyo_kbn_id: SAGYO_KBN_ID.nyukoCount,
    // sagyo_den_dat:
    //   d.shozokuId === BASHO_ID.kics
    //     ? juchuKizaiHeadData.kicsNyukoDat!.toISOString()
    //     : juchuKizaiHeadData.yardNyukoDat!.toISOString(),
    sagyo_den_dat:
      juchuKizaiHeadData.kicsNyukoDat && juchuKizaiHeadData.yardNyukoDat && d.mShozokuId === BASHO_ID.kics
        ? juchuKizaiHeadData.kicsNyukoDat.toISOString()
        : juchuKizaiHeadData.kicsNyukoDat && juchuKizaiHeadData.yardNyukoDat && d.mShozokuId === BASHO_ID.yard
          ? juchuKizaiHeadData.yardNyukoDat.toISOString()
          : juchuKizaiHeadData.kicsNyukoDat && !juchuKizaiHeadData.yardNyukoDat
            ? juchuKizaiHeadData.kicsNyukoDat.toISOString()
            : !juchuKizaiHeadData.kicsNyukoDat && juchuKizaiHeadData.yardNyukoDat
              ? juchuKizaiHeadData.yardNyukoDat.toISOString()
              : '',
    // sagyo_id: d.shozokuId,
    sagyo_id:
      juchuKizaiHeadData.kicsNyukoDat && juchuKizaiHeadData.yardNyukoDat && d.mShozokuId === BASHO_ID.kics
        ? BASHO_ID.kics
        : juchuKizaiHeadData.kicsNyukoDat && juchuKizaiHeadData.yardNyukoDat && d.mShozokuId === BASHO_ID.yard
          ? BASHO_ID.yard
          : juchuKizaiHeadData.kicsNyukoDat && !juchuKizaiHeadData.yardNyukoDat
            ? BASHO_ID.kics
            : !juchuKizaiHeadData.kicsNyukoDat && juchuKizaiHeadData.yardNyukoDat
              ? BASHO_ID.yard
              : BASHO_ID.others,
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
  juchuKizaiMeisaiData: JuchuKizaiMeisaiValues[],
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
    sagyo_kbn_id: SAGYO_KBN_ID.shukoConfirmation,
    sagyo_den_dat: shukoDat.toISOString(),
    sagyo_id: d.shozokuId,
    kizai_id: d.kizaiId,
    plan_qty: d.planQty,
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
 * 入庫伝票新規追加
 * @param juchuKizaiHeadData 受注機材ヘッダーデータ
 * @param juchuKizaiMeisaiData 受注機材明細データ
 * @param userNam ユーザー名
 * @param connection
 * @returns
 */
export const addNyukoDen = async (
  juchuKizaiMeisaiData: JuchuKizaiMeisaiValues[],
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
    sagyo_kbn_id: SAGYO_KBN_ID.shukoPicking,
    sagyo_den_dat:
      d.shozokuId === BASHO_ID.kics
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
    sagyo_kbn_id: SAGYO_KBN_ID.shukoConfirmation,
    sagyo_den_dat:
      d.shozokuId === BASHO_ID.kics
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
    sagyo_kbn_id: SAGYO_KBN_ID.nyukoCount,
    // sagyo_den_dat:
    //   d.shozokuId === BASHO_ID.kics
    //     ? juchuKizaiHeadData.kicsNyukoDat!.toISOString()
    //     : juchuKizaiHeadData.yardNyukoDat!.toISOString(),
    sagyo_den_dat:
      juchuKizaiHeadData.kicsNyukoDat && juchuKizaiHeadData.yardNyukoDat && d.mShozokuId === BASHO_ID.kics
        ? juchuKizaiHeadData.kicsNyukoDat.toISOString()
        : juchuKizaiHeadData.kicsNyukoDat && juchuKizaiHeadData.yardNyukoDat && d.mShozokuId === BASHO_ID.yard
          ? juchuKizaiHeadData.yardNyukoDat.toISOString()
          : juchuKizaiHeadData.kicsNyukoDat && !juchuKizaiHeadData.yardNyukoDat
            ? juchuKizaiHeadData.kicsNyukoDat.toISOString()
            : !juchuKizaiHeadData.kicsNyukoDat && juchuKizaiHeadData.yardNyukoDat
              ? juchuKizaiHeadData.yardNyukoDat.toISOString()
              : '',
    // sagyo_id: d.shozokuId,
    sagyo_id:
      juchuKizaiHeadData.kicsNyukoDat && juchuKizaiHeadData.yardNyukoDat && d.mShozokuId === BASHO_ID.kics
        ? BASHO_ID.kics
        : juchuKizaiHeadData.kicsNyukoDat && juchuKizaiHeadData.yardNyukoDat && d.mShozokuId === BASHO_ID.yard
          ? BASHO_ID.yard
          : juchuKizaiHeadData.kicsNyukoDat && !juchuKizaiHeadData.yardNyukoDat
            ? BASHO_ID.kics
            : !juchuKizaiHeadData.kicsNyukoDat && juchuKizaiHeadData.yardNyukoDat
              ? BASHO_ID.yard
              : BASHO_ID.others,
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
 * @param juchuKizaiMeisaiData
 * @param shukoDat
 * @param userNam
 * @param connection
 */
export const updShukoDen = async (
  juchuKizaiMeisaiData: JuchuKizaiMeisaiValues[],
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
    sagyo_kbn_id: SAGYO_KBN_ID.shukoConfirmation,
    sagyo_den_dat: shukoDat.toISOString(),
    sagyo_id: d.shozokuId,
    kizai_id: d.kizaiId,
    plan_qty: d.planQty,
    dsp_ord_num: d.dspOrdNum,
    indent_num: d.indentNum,
    add_dat: new Date().toISOString(),
    add_user: userNam,
  }));
  const mergeData = [...newShukoStandbyData, ...newShukoCheckData];

  try {
    for (const data of mergeData) {
      await updateNyushukoDenFromKizaiMeisai(data, connection);
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
 * 入庫伝票更新
 * @param juchuKizaiMeisaiData
 * @param returnData
 * @param nyukoDat
 * @param sagyoId
 * @param userNam
 * @param connection
 */
export const updNyukoDen = async (
  juchuKizaiMeisaiData: JuchuKizaiMeisaiValues[],
  returnData: { kizaiId: number; planQty: number; dspOrdNumMeisai: number; nyushukoBashoId: number }[],
  nyukoDat: Date,
  sagyoId: number,
  userNam: string,
  connection: PoolClient
) => {
  const nyukoData: NyushukoDen[] = juchuKizaiMeisaiData.map((d) => ({
    juchu_head_id: d.juchuHeadId,
    juchu_kizai_head_id: d.juchuKizaiHeadId,
    juchu_kizai_meisai_id: d.juchuKizaiMeisaiId,
    sagyo_kbn_id: SAGYO_KBN_ID.nyukoCount,
    sagyo_den_dat: nyukoDat.toISOString(),
    sagyo_id: sagyoId,
    kizai_id: d.kizaiId,
    // 到着済みの返却で親から引いた量を、同じ機材・dsp の行（複数の返却・親機材として読んだ行）すべて合計して引く
    plan_qty:
      d.planQty -
      returnData
        .filter((r) => r.kizaiId === d.kizaiId && r.dspOrdNumMeisai === d.dspOrdNum)
        .reduce((sum, r) => sum + r.planQty, 0),
    dsp_ord_num: d.dspOrdNum,
    indent_num: d.indentNum,
    add_dat: new Date().toISOString(),
    add_user: userNam,
  }));

  try {
    for (const data of nyukoData) {
      await updateNyushukoDenFromKizaiMeisai(data, connection);
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
  juchuKizaiMeisaiData: JuchuKizaiMeisaiValues[],
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
    sagyo_kbn_id: SAGYO_KBN_ID.shukoConfirmation,
    sagyo_den_dat: shukoDat.toISOString(),
    sagyo_id: sagyoId,
    kizai_id: d.kizaiId,
    plan_qty: d.planQty,
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
  juchuKizaiMeisaiData: JuchuKizaiMeisaiValues[],
  returnData: { kizaiId: number; planQty: number; dspOrdNumMeisai: number; nyushukoBashoId: number }[],
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
    // 到着済みの返却で親から引いた量を、同じ機材・dsp の行（複数の返却・親機材として読んだ行）すべて合計して引く
    plan_qty:
      d.planQty -
      returnData
        .filter((r) => r.kizaiId === d.kizaiId && r.dspOrdNumMeisai === d.dspOrdNum)
        .reduce((sum, r) => sum + r.planQty, 0),
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
 * 入出庫伝票削除（出庫実績が残っている行は予定数0にして残す）
 *
 * 明細を削除しても出庫実績が残っている行は消さずに残し、出庫画面で
 * 「受注から削除された＝現物を取り除くべきもの」として見えるようにする。
 *
 * @param juchuKizaiMeisaiData 受注機材明細データ
 * @param userNam ユーザー名
 * @param connection
 */
export const delNyushukoDenKeepResulted = async (
  juchuKizaiMeisaiData: JuchuKizaiMeisaiValues[],
  userNam: string,
  connection: PoolClient
) => {
  const deleteData = juchuKizaiMeisaiData.map((d) => ({
    juchu_head_id: d.juchuHeadId,
    juchu_kizai_head_id: d.juchuKizaiHeadId,
    juchu_kizai_meisai_id: d.juchuKizaiMeisaiId,
    kizai_id: d.kizaiId,
  }));
  const updDat = new Date().toISOString();

  try {
    for (const data of deleteData) {
      await deleteNyushukoDenKeepResulted(data, updDat, userNam, connection);
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
 * 出庫場所が変わった機材の、元の場所の出庫伝票・実績を整理する（明細idは変えない）
 * 実績・補正がある伝票は予定数0にして受注削除として元の場所に残し、それ以外の伝票と、伝票が無くなった実績は削除する。
 * 明細idを変えないので、元の場所に戻したとき（K → Y → K）は残した伝票がそのまま通常の行に戻り、実績も引き継ぐ
 * （新しい場所の伝票は upsShukoDenBasho で作る／更新する）。
 * キープの画面は場所を変えたら元の場所を全部消す（delShukoDen・delShukoResult）ので、この関数はメイン明細専用
 * @param shozokuChangedData 出庫場所が変わった受注機材明細（変更後の値）
 * @param originMap 変更前の受注機材明細（明細idがキー）
 * @param userNam ユーザー名
 * @param connection
 */
const keepShozokuChangedShukoDen = async (
  shozokuChangedData: JuchuKizaiMeisaiValues[],
  originMap: Map<number, JuchuKizaiMeisaiValues>,
  userNam: string,
  connection: PoolClient
) => {
  const updDat = new Date().toISOString();
  for (const d of shozokuChangedData) {
    const origin = originMap.get(d.juchuKizaiMeisaiId);
    if (!origin) continue;

    const data = {
      juchu_head_id: d.juchuHeadId,
      juchu_kizai_head_id: d.juchuKizaiHeadId,
      juchu_kizai_meisai_id: d.juchuKizaiMeisaiId,
      kizai_id: d.kizaiId,
    };
    await deleteShukoDenBashoKeepResulted(data, origin.shozokuId, updDat, userNam, connection);
    await deleteShukoResultBashoKeepDen(
      d.juchuHeadId,
      d.juchuKizaiHeadId,
      d.juchuKizaiMeisaiId,
      d.kizaiId,
      origin.shozokuId,
      connection
    );
  }
};

/**
 * 出庫場所が変わった機材の、新しい場所の出庫伝票（ピッキング・最終確認）を作る／更新する
 * 新しい場所に同じ明細id・機材の伝票（元の場所に戻したときの受注削除の行）があれば、予定数・作業日時・表示順・
 * インデントを更新して通常の行に戻す。無ければ作る。あわせて、その場所の実績の作業日時を新しい出庫日時に揃える
 * @param juchuKizaiMeisaiData 出庫場所が変わった受注機材明細（変更後の値。shozokuId が新しい場所）
 * @param shukoDat 新しい場所の出庫日時
 * @param userNam ユーザー名
 * @param connection
 */
const upsShukoDenBasho = async (
  juchuKizaiMeisaiData: JuchuKizaiMeisaiValues[],
  shukoDat: Date,
  userNam: string,
  connection: PoolClient
) => {
  const now = new Date().toISOString();
  for (const d of juchuKizaiMeisaiData) {
    for (const sagyoKbnId of [SAGYO_KBN_ID.shukoPicking, SAGYO_KBN_ID.shukoConfirmation]) {
      await upsertShukoDenBasho(
        {
          juchu_head_id: d.juchuHeadId,
          juchu_kizai_head_id: d.juchuKizaiHeadId,
          juchu_kizai_meisai_id: d.juchuKizaiMeisaiId,
          sagyo_kbn_id: sagyoKbnId,
          sagyo_den_dat: shukoDat.toISOString(),
          sagyo_id: d.shozokuId,
          kizai_id: d.kizaiId,
          plan_qty: d.planQty,
          dsp_ord_num: d.dspOrdNum,
          indent_num: d.indentNum,
          add_dat: now,
          add_user: userNam,
        },
        connection
      );
    }
    // 受注削除の行を通常の行に戻した場合、実績の日時を伝票に揃える（作業場所・機材が条件なので、ほかの場所の実績は動かない）
    await updateShukoResult(
      d.juchuHeadId,
      d.juchuKizaiHeadId,
      d.juchuKizaiMeisaiId,
      d.kizaiId,
      d.shozokuId,
      shukoDat.toISOString(),
      connection
    );
  }
};

/**
 * 事前準備の保存（t_juchu_kizai_jizen と事前の伝票・実績 80/90）
 * 明細の保存（明細の追加・削除・明細idの採番・本番の出庫伝票）の後に呼ぶ。明細ごとに変更前と比べて次を行う。
 * - 明細の削除：事前準備の行を消す（事前の伝票・実績は deleteNyushukoDenKeepResulted・deleteKizaiIdNyushukoResultKeepDen で
 *   削除済み。80/90 は受注削除として残さない）
 * - 出庫場所の変更：変更前の場所の事前の伝票・実績をすべて削除し、事前準備が残っていれば新しい場所で作り直す
 *   （事前の読取は本番にコピー済みで、本番側は keepShozokuChangedShukoDen が受注削除として残す）。
 *   準備日を消して受注削除として残っていた事前の伝票も、このとき削除する（本番にも関わる変更なので、受注削除は本番側だけ）
 * - 準備日の削除：実績・補正のある事前の伝票は、明細idを変えずに予定数0で残す（事前側だけ受注削除）。
 *   残す条件は本番と同じ（最終確認に実績があれば最終確認だけ）。それ以外の伝票と、伝票が無くなった実績は削除し、
 *   事前準備の行も消す。事前の受注削除の判定は「事前準備の行（t_juchu_kizai_jizen）が無い」で行う
 *   （v_nyushuko_den2_lst・deleteEmptyNyushukoDen）。明細idが本番と同じまま残るので、事前でのタグ削除・補正を
 *   本番の同じ明細に反映できる。本番の出庫場所の変更（keepShozokuChangedShukoDen）と同じ形
 * - 準備日時・準備数の追加・変更：事前準備の行と事前の伝票（予定数＝準備数）を作る・更新し、実績の日時も新しい
 *   準備日時に揃える。準備日を消して受注削除として残っている伝票があれば、同じ伝票を通常の行に戻す（実績を引き継ぐ。
 *   本番で出庫場所を元に戻したときと同じ）
 * @param originList 変更前の受注機材明細（DBの状態）
 * @param savedList 保存した受注機材明細（明細id採番済み・削除した明細を含む）
 * @param userNam ユーザー名
 * @param connection
 */
const syncJizen = async (
  originList: JuchuKizaiMeisaiValues[],
  savedList: JuchuKizaiMeisaiValues[],
  userNam: string,
  connection: PoolClient
) => {
  const now = new Date().toISOString();
  const originMap = new Map(originList.map((d) => [`${d.juchuKizaiMeisaiId}_${d.kizaiId}`, d]));

  for (const d of savedList) {
    // 未保存の明細を削除した場合は何も無い
    if (!d.saveFlag && d.delFlag) continue;

    const key = {
      juchu_head_id: d.juchuHeadId,
      juchu_kizai_head_id: d.juchuKizaiHeadId,
      juchu_kizai_meisai_id: d.juchuKizaiMeisaiId,
      kizai_id: d.kizaiId,
    };
    const origin = d.saveFlag ? originMap.get(`${d.juchuKizaiMeisaiId}_${d.kizaiId}`) : undefined;

    if (d.delFlag) {
      // 画面の変更前データに事前日時が無くても必ず消す（古い画面から削除したときに事前準備の行だけ残り、
      // 明細idが再利用されたときに新しい明細へ付いてしまうのを防ぐ。行が無ければ何も消えない）
      await deleteJuchuKizaiJizen(key, connection);
      continue;
    }

    // 出庫場所を変えたときは、変更前の場所の事前の伝票・実績をすべて削除する（準備日があれば新しい場所で作り直す）
    // 出庫場所の変更は本番にも関わるので、受注削除は本番側（keepShozokuChangedShukoDen）だけに残す。
    // 準備日を消して受注削除として残っていた事前の伝票（準備日が無い明細）も、このとき削除する
    // （事前日の削除だけなら事前側だけ受注削除、場所の変更なら本番側だけ受注削除。保存を分けても同じ結果になる）
    const shozokuChanged = !!origin && origin.shozokuId !== d.shozokuId;
    if (shozokuChanged) {
      await deleteJizenDen(key, connection, origin.shozokuId);
      await deleteJizenResult(key, connection, origin.shozokuId);
    }

    if (!d.jizenDat) {
      if (origin?.jizenDat) {
        if (!shozokuChanged) {
          await deleteShukoDenBashoKeepResulted(key, origin.shozokuId, now, userNam, connection, true);
          await deleteShukoResultBashoKeepDen(
            d.juchuHeadId,
            d.juchuKizaiHeadId,
            d.juchuKizaiMeisaiId,
            d.kizaiId,
            origin.shozokuId,
            connection,
            true
          );
        }
        await deleteJuchuKizaiJizen(key, connection);
      }
      continue;
    }

    const jizenDat = new Date(d.jizenDat).toISOString();
    const jizenQty = d.jizenQty ?? d.planQty;
    await upsertJuchuKizaiJizen(
      {
        ...key,
        jizen_dat: jizenDat,
        jizen_qty: jizenQty,
        add_dat: now,
        add_user: userNam,
        upd_dat: now,
        upd_user: userNam,
      },
      connection
    );
    await upsertJizenDen(
      {
        ...key,
        sagyo_id: d.shozokuId,
        sagyo_den_dat: jizenDat,
        plan_qty: jizenQty,
        dsp_ord_num: d.dspOrdNum,
        indent_num: d.indentNum,
      },
      userNam,
      connection
    );
    // 実績の日時を準備日時に揃える（準備日時の変更のほか、受注削除として残っていた伝票を付け直しで戻した場合も）
    // 出庫場所を変えたときも呼ぶ（K→Y→K と戻して、K に残っていた受注削除の伝票が戻った場合に、実績の日時も揃えるため）
    // 新しい場所の実績だけが対象で、日時が違う実績だけ更新するので、変わっていなければ何もしない
    await updateJizenResultDat(key, d.shozokuId, jizenDat, connection);
  }
};

export const delShukoDen = async (juchuKizaiMeisaiData: JuchuKizaiMeisaiValues[], connection: PoolClient) => {
  const deleteData = juchuKizaiMeisaiData.map((d) => ({
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

export const delKicsOrYardShukoDen = async (
  juchuKizaiMeisaiData: JuchuKizaiMeisaiValues[],
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

export const delKicsOrYardNyukoDen = async (
  juchuKizaiMeisaiData: JuchuKizaiMeisaiValues[],
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
    sagyo_kbn_id: SAGYO_KBN_ID.shukoPicking,
    sagyo_den_dat: shukoDat.toISOString(),
    sagyo_id: sagyoId,
    kizai_id: d.kizaiId,
    plan_qty: sagyoId === BASHO_ID.kics ? d.planKicsKizaiQty : d.planYardKizaiQty,
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
    plan_qty: sagyoId === BASHO_ID.kics ? d.planKicsKizaiQty : d.planYardKizaiQty,
    dsp_ord_num: d.dspOrdNum,
    indent_num: d.indentNum,
    add_dat: new Date().toISOString(),
    add_user: userNam,
  }));

  const newCtnNyukoCheckData: NyushukoDen[] = juchuCtnMeisaiData.map((d) => ({
    juchu_head_id: d.juchuHeadId,
    juchu_kizai_head_id: d.juchuKizaiHeadId,
    juchu_kizai_meisai_id: d.juchuKizaiMeisaiId,
    sagyo_kbn_id: SAGYO_KBN_ID.nyukoCount,
    sagyo_den_dat: nyukoDat.toISOString(),
    sagyo_id: sagyoId,
    kizai_id: d.kizaiId,
    plan_qty: sagyoId === BASHO_ID.kics ? d.planKicsKizaiQty : d.planYardKizaiQty,
    dsp_ord_num: d.dspOrdNum,
    indent_num: d.indentNum,
    add_dat: new Date().toISOString(),
    add_user: userNam,
  }));

  const mergeData = [...newCtnShukoStandbyData, ...newCtnShukoCheckData, ...newCtnNyukoCheckData];

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
 * コンテナ出庫伝票新規追加
 * @param juchuCtnMeisaiData 受注コンテナ明細データ
 * @param shukoDat 出庫日
 * @param sagyoId 作業id
 * @param userNam ユーザー名
 * @param connection
 * @returns
 */
export const addCtnShukoDen = async (
  juchuCtnMeisaiData: JuchuContainerMeisaiValues[],
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
    plan_qty: sagyoId === BASHO_ID.kics ? d.planKicsKizaiQty : d.planYardKizaiQty,
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
    plan_qty: sagyoId === BASHO_ID.kics ? d.planKicsKizaiQty : d.planYardKizaiQty,
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
 * コンテナ入庫伝票新規追加
 * @param juchuCtnMeisaiData 受注コンテナ明細データ
 * @param nyukoDat 入庫日
 * @param sagyoId 作業id
 * @param userNam ユーザー名
 * @param connection
 * @returns
 */
export const addCtnNyukoDen = async (
  juchuCtnMeisaiData: JuchuContainerMeisaiValues[],
  nyukoDat: Date,
  sagyoId: number,
  planQtyId: number,
  userNam: string,
  connection: PoolClient
) => {
  const newCtnNyukoData: NyushukoDen[] = juchuCtnMeisaiData.map((d) => ({
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
    await insertNyushukoDen(newCtnNyukoData, connection);
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
    sagyo_kbn_id: SAGYO_KBN_ID.shukoPicking,
    sagyo_den_dat: shukoDat.toISOString(),
    sagyo_id: sagyoId,
    kizai_id: d.kizaiId,
    plan_qty: sagyoId === BASHO_ID.kics ? d.planKicsKizaiQty : d.planYardKizaiQty,
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
    plan_qty: sagyoId === BASHO_ID.kics ? d.planKicsKizaiQty : d.planYardKizaiQty,
    dsp_ord_num: d.dspOrdNum,
    indent_num: d.indentNum,
    add_dat: new Date().toISOString(),
    add_user: userNam,
  }));

  const updCtnNyukoCheckData: NyushukoDen[] = juchuCtnMeisaiData.map((d) => ({
    juchu_head_id: d.juchuHeadId,
    juchu_kizai_head_id: d.juchuKizaiHeadId,
    juchu_kizai_meisai_id: d.juchuKizaiMeisaiId,
    sagyo_kbn_id: SAGYO_KBN_ID.nyukoCount,
    sagyo_den_dat: nyukoDat.toISOString(),
    sagyo_id: sagyoId,
    kizai_id: d.kizaiId,
    plan_qty: sagyoId === BASHO_ID.kics ? d.planKicsKizaiQty : d.planYardKizaiQty,
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
 * @param juchuCtnMeisaiData
 * @param shukoDat
 * @param sagyoId
 * @param userNam
 * @param connection
 * @returns
 */
export const updCtnShukoDen = async (
  juchuCtnMeisaiData: JuchuContainerMeisaiValues[],
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
    plan_qty: sagyoId === BASHO_ID.kics ? d.planKicsKizaiQty : d.planYardKizaiQty,
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
    plan_qty: sagyoId === BASHO_ID.kics ? d.planKicsKizaiQty : d.planYardKizaiQty,
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

export const updCtnNyukoDen = async (
  juchuCtnMeisaiData: JuchuContainerMeisaiValues[],
  nyukoDat: Date,
  sagyoId: number,
  planQtyId: number,
  userNam: string,
  connection: PoolClient
) => {
  const updCtnNyukoData: NyushukoDen[] = juchuCtnMeisaiData.map((d) => ({
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
    for (const data of updCtnNyukoData) {
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
  juchuContainerMeisaiData: JuchuContainerMeisaiValues[],
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
    plan_qty: sagyoId === BASHO_ID.kics ? d.planKicsKizaiQty : d.planYardKizaiQty,
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
    plan_qty: sagyoId === BASHO_ID.kics ? d.planKicsKizaiQty : d.planYardKizaiQty,
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
  juchuContainerMeisaiData: JuchuContainerMeisaiValues[],
  returnData: { kizaiId: number; planQty: number; dspOrdNumMeisai: number; nyushukoBashoId: number }[],
  nyukoDat: Date,
  sagyoId: number,
  planQtyId: number,
  userNam: string,
  connection: PoolClient
) => {
  const upsertCtnNyukoData: NyushukoDen[] = juchuContainerMeisaiData.map((d) => {
    let planQty =
      planQtyId === BASHO_ID.kics ? d.planKicsKizaiQty : planQtyId === BASHO_ID.yard ? d.planYardKizaiQty : d.planQty;
    // 到着済みの返却で親から引いた量を、同じ機材・dsp の行ごとに場所へ振り分けて合計して引く
    const childDatas = returnData.filter((r) => r.kizaiId === d.kizaiId && r.dspOrdNumMeisai === d.dspOrdNum);
    for (const childData of childDatas) {
      const oyaPlanQty = childData.nyushukoBashoId === BASHO_ID.kics ? d.planKicsKizaiQty : d.planYardKizaiQty;

      planQty -=
        sagyoId === childData.nyushukoBashoId && planQtyId !== 3 && oyaPlanQty < childData.planQty
          ? oyaPlanQty
          : sagyoId === childData.nyushukoBashoId && planQtyId !== 3 && oyaPlanQty >= childData.planQty
            ? childData.planQty
            : sagyoId !== childData.nyushukoBashoId && planQtyId !== 3 && oyaPlanQty < childData.planQty
              ? childData.planQty - oyaPlanQty
              : sagyoId !== childData.nyushukoBashoId && planQtyId !== 3 && oyaPlanQty >= childData.planQty
                ? 0
                : childData.planQty;
    }
    return {
      juchu_head_id: d.juchuHeadId,
      juchu_kizai_head_id: d.juchuKizaiHeadId,
      juchu_kizai_meisai_id: d.juchuKizaiMeisaiId,
      sagyo_kbn_id: SAGYO_KBN_ID.nyukoCount,
      sagyo_den_dat: nyukoDat.toISOString(),
      sagyo_id: sagyoId,
      kizai_id: d.kizaiId,
      plan_qty: planQty,
      dsp_ord_num: d.dspOrdNum,
      indent_num: d.indentNum,
      add_dat: new Date().toISOString(),
      add_user: userNam,
    };
  });

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
 * コンテナ入庫伝票削除(KICS/YARD)
 * @param juchuContainerMeisaiData
 * @param connection
 * @returns
 */
export const delKicsOrYardCtnNyukoDen = async (
  juchuContainerMeisaiData: JuchuContainerMeisaiValues[],
  sagyoId: number,
  connection: PoolClient
) => {
  const deleteData = juchuContainerMeisaiData.map((d) => ({
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

export const updShukoResult = async (
  juchuKizaiMeisaiData: JuchuKizaiMeisaiValues[],
  shukoDat: Date,
  connection: PoolClient
) => {
  const updateData = juchuKizaiMeisaiData.map((d) => ({
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
 * 入出庫実績削除（伝票行が残っているものは残す）
 *
 * どのRFIDタグを確保していたかを出庫画面に出すため、予定数0で残した出庫伝票行の
 * 実績は残す。伝票の削除より後に呼ぶこと。
 *
 * @param juchuKizaiMeisaiData 受注機材明細データ
 * @param connection
 */
export const delNyushukoResultKeepDen = async (
  juchuKizaiMeisaiData: JuchuKizaiMeisaiValues[],
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
      await deleteKizaiIdNyushukoResultKeepDen(
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
 * 出庫場所が変わった明細について、変更前の場所の出庫の伝票（10/20/80/90）に実績・補正があるか
 * 移動日の入力・解除で出庫場所だけが変わったときも、保存前の作業中の確認を出すために使う
 * @param juchuHeadId 受注ヘッダーid
 * @param juchuKizaiHeadId 受注機材ヘッダーid
 * @param targets 出庫場所が変わった明細（明細id・機材id・変更前の出庫場所）
 * @returns あれば true
 */
export const getShozokuChangedResultExists = async (
  juchuHeadId: number,
  juchuKizaiHeadId: number,
  targets: { juchuKizaiMeisaiId: number; kizaiId: number; shozokuId: number }[]
) => {
  if (targets.length === 0) return false;
  try {
    return await selectShukoResultExistsBasho(
      juchuHeadId,
      juchuKizaiHeadId,
      targets.map((d) => d.juchuKizaiMeisaiId),
      targets.map((d) => d.kizaiId),
      targets.map((d) => d.shozokuId)
    );
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
 * 事前の伝票（80/90）に実績・補正がある明細があるか
 * 準備日時・準備数を変えた明細について、保存前の作業中の確認に使う
 * @param juchuHeadId 受注ヘッダーid
 * @param juchuKizaiHeadId 受注機材ヘッダーid
 * @param targets 準備日時・準備数を変えた明細（明細id・機材id）
 * @returns あれば true
 */
export const getJizenResultExists = async (
  juchuHeadId: number,
  juchuKizaiHeadId: number,
  targets: { juchuKizaiMeisaiId: number; kizaiId: number }[]
) => {
  if (targets.length === 0) return false;
  try {
    return await selectJizenResultExists(
      juchuHeadId,
      juchuKizaiHeadId,
      targets.map((d) => d.juchuKizaiMeisaiId),
      targets.map((d) => d.kizaiId)
    );
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
 * 削除対象のうち出庫実績・補正数がある機材の件数を取得
 *
 * 削除確認ダイアログで「既に実績があります」の警告を出すために使う。実際に伝票を残す
 * 条件（入出庫伝票の実績数＋補正数）で数えるので、RFIDタグを付けられない機材で補正数
 * だけ入っているケースも警告に含まれる。
 * コンテナは出庫明細で管理するため（この画面では削除できない）、対象は機材だけ。
 *
 * @param juchuKizaiMeisaiData 削除対象の受注機材明細データ
 * @returns 出庫実績・補正数のある機材の件数
 */
export const getShukoResultKizaiCount = async (juchuKizaiMeisaiData: JuchuKizaiMeisaiValues[]) => {
  const targets = juchuKizaiMeisaiData;

  if (targets.length === 0) {
    return 0;
  }

  try {
    const rows = await selectShukoResultDenKizaiCount(
      targets[0].juchuHeadId,
      targets.map((d) => d.juchuKizaiHeadId),
      targets.map((d) => d.juchuKizaiMeisaiId),
      targets.map((d) => d.kizaiId)
    );

    return (rows[0]?.kizai_cnt as number | undefined) ?? 0;
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
export const delShukoResult = async (juchuKizaiMeisaiData: JuchuKizaiMeisaiValues[], connection: PoolClient) => {
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
  juchuKizaiMeisaiData: JuchuKizaiMeisaiValues[],
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
    return data.ido_den_id;
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
    sagyo_kbn_id: SAGYO_KBN_ID.idoShuko,
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
    sagyo_id: d.mShozokuId === BASHO_ID.kics ? BASHO_ID.yard : BASHO_ID.kics,
    sagyo_kbn_id: SAGYO_KBN_ID.idoNyuko,
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
      sagyo_kbn_id: SAGYO_KBN_ID.idoShuko,
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
      sagyo_id: d.mShozokuId === BASHO_ID.kics ? BASHO_ID.yard : BASHO_ID.kics,
      sagyo_kbn_id: SAGYO_KBN_ID.idoNyuko,
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
 * 移動伝票受注削除
 * @param idoDenIds 移動伝票受注id
 */
export const delIdoDenJuchu = async (idoDenIds: number[], connection: PoolClient) => {
  try {
    await deleteIdoDenJuchu(idoDenIds, connection);
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
 * 受注機材本番日取得
 * @param juchuHeadId 受注ヘッダーid
 * @param juchuKizaiHeadId 受注機材ヘッダーid
 * @returns 受注機材本番日
 */
export const getHonbanbi = async (juchuHeadId: number, juchuKizaiHeadId: number) => {
  try {
    const { data, error } = await selectHonbanbi(juchuHeadId, juchuKizaiHeadId);
    if (error) {
      throw new Error('[selectHonbanbi] DBエラー:', { cause: error });
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
 * 機材選択で使う部門リストを取得する関数
 * @returns 無効化フラグなし、表示順部門の配列
 */
export const getBumonsForEqptSelection = async () => {
  try {
    const { data, error } = await selectActiveBumons();
    if (error) {
      throw new Error('[selectActiveBumons] DBエラー:', { cause: error });
    }
    if (!data || data.length === 0) {
      return [];
    }
    const selectElements = data.map((d, index) => ({
      id: d.bumon_id!,
      label: d.bumon_nam ?? '',
      tblDspNum: index,
    }));
    return selectElements;
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
    if (!setIdList || setIdList.length === 0) return [];
    // return setIdList.map((d) => d.kizai_id);
    return Array.from(new Set(setIdList.map((d) => d.kizai_id)));
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
 * 機材選択に表示するための機材リスト
 * コンテナは出庫明細（最終確認）で追加するため、受注機材明細の機材選択には出さない
 * @param query 検索キーワード
 * @returns
 */
export const getEqptsForEqptSelection = async (query: string = ''): Promise<EqptSelection[] | undefined> => {
  try {
    const data = await selectActiveEqpts(query);
    if (!data || data.rowCount === 0) {
      return [];
    }
    return data.rows.filter((d) => d.ctnFlg !== 1);
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
      throw new Error('[selectChosenEqptsDetails] DBエラー:', { cause: error });
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
    await addJuchuKizaiHead(newJuchuKizaiHeadId, juchuKizaiHeadData, JUCHU_KIZAI_HEAD_KBN.normal, userNam, connection);

    // 受注機材入出庫追加
    await addJuchuKizaiNyushuko(
      juchuKizaiHeadData.juchuHeadId,
      newJuchuKizaiHeadId,
      juchuKizaiHeadData.kicsShukoDat,
      juchuKizaiHeadData.yardShukoDat,
      juchuKizaiHeadData.kicsNyukoDat,
      juchuKizaiHeadData.yardNyukoDat,
      userNam,
      connection
    );

    // 受注機材本番日(入出庫、使用中)追加
    const addJuchuSiyouHonbanbiData: JuchuKizaiHonbanbiValues[] = dateRange.map((d) => ({
      juchuHeadId: juchuKizaiHeadData.juchuHeadId,
      juchuKizaiHeadId: newJuchuKizaiHeadId,
      juchuHonbanbiShubetuId: HONBANBI_SHUBETU_ID.use,
      juchuHonbanbiDat: new Date(d),
      mem: '',
      juchuHonbanbiAddQty: 0,
    }));
    const addJuchuHonbanbiData: JuchuKizaiHonbanbiValues[] = [
      {
        juchuHeadId: juchuKizaiHeadData.juchuHeadId,
        juchuKizaiHeadId: newJuchuKizaiHeadId,
        juchuHonbanbiShubetuId: HONBANBI_SHUBETU_ID.shuko,
        juchuHonbanbiDat: shukoDate,
        mem: '',
        juchuHonbanbiAddQty: 0,
      },
      {
        juchuHeadId: juchuKizaiHeadData.juchuHeadId,
        juchuKizaiHeadId: newJuchuKizaiHeadId,
        juchuHonbanbiShubetuId: HONBANBI_SHUBETU_ID.nyuko,
        juchuHonbanbiDat: nyukoDate,
        mem: '',
        juchuHonbanbiAddQty: 0,
      },
    ];
    const mergeHonbanbiData: JuchuKizaiHonbanbiValues[] = [...addJuchuSiyouHonbanbiData, ...addJuchuHonbanbiData];
    await addAllHonbanbi(juchuKizaiHeadData.juchuHeadId, newJuchuKizaiHeadId, mergeHonbanbiData, userNam, connection);

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
      await addJuchuKizaiMeisai(newJuchuKizaiMeisai, userNam, connection);

      // 機材入出庫伝票追加
      await addNyushukoDen(juchuKizaiHeadData, newJuchuKizaiMeisai, userNam, connection);
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
      await addJuchuContainerMeisai(newJuchuCtnMeisai, userNam, connection);

      // コンテナ入出庫伝票追加
      if (juchuKizaiHeadData.kicsShukoDat) {
        // コンテナ出庫伝票追加(KICS)
        await addCtnShukoDen(newJuchuCtnMeisai, juchuKizaiHeadData.kicsShukoDat, BASHO_ID.kics, userNam, connection);
      }

      if (juchuKizaiHeadData.yardShukoDat) {
        // コンテナ出庫伝票追加(YARD)
        await addCtnShukoDen(newJuchuCtnMeisai, juchuKizaiHeadData.yardShukoDat, BASHO_ID.yard, userNam, connection);
      }

      if (juchuKizaiHeadData.kicsNyukoDat && juchuKizaiHeadData.yardNyukoDat) {
        if (juchuKizaiHeadData.kicsShukoDat && juchuKizaiHeadData.yardShukoDat) {
          // コンテナ入庫伝票追加(KICS)
          await addCtnNyukoDen(
            newJuchuCtnMeisai,
            juchuKizaiHeadData.kicsNyukoDat,
            BASHO_ID.kics,
            BASHO_ID.kics,
            userNam,
            connection
          );

          // コンテナ入庫伝票追加(YARD)
          await addCtnNyukoDen(
            newJuchuCtnMeisai,
            juchuKizaiHeadData.yardNyukoDat,
            BASHO_ID.yard,
            BASHO_ID.yard,
            userNam,
            connection
          );
        } else if (juchuKizaiHeadData.kicsShukoDat && !juchuKizaiHeadData.yardShukoDat) {
          // コンテナ入庫伝票追加(KICS)
          await addCtnNyukoDen(
            newJuchuCtnMeisai,
            juchuKizaiHeadData.kicsNyukoDat,
            BASHO_ID.kics,
            BASHO_ID.kics,
            userNam,
            connection
          );
        } else if (!juchuKizaiHeadData.kicsShukoDat && juchuKizaiHeadData.yardShukoDat) {
          // コンテナ入庫伝票追加(YARD)
          await addCtnNyukoDen(
            newJuchuCtnMeisai,
            juchuKizaiHeadData.yardNyukoDat,
            BASHO_ID.yard,
            BASHO_ID.yard,
            userNam,
            connection
          );
        }
      } else if (juchuKizaiHeadData.kicsNyukoDat && !juchuKizaiHeadData.yardNyukoDat) {
        if (juchuKizaiHeadData.kicsShukoDat && juchuKizaiHeadData.yardShukoDat) {
          // コンテナ入庫伝票追加(KICS)
          await addCtnNyukoDen(
            newJuchuCtnMeisai,
            juchuKizaiHeadData.kicsNyukoDat,
            BASHO_ID.kics,
            3,
            userNam,
            connection
          );
        } else if (juchuKizaiHeadData.kicsShukoDat && !juchuKizaiHeadData.yardShukoDat) {
          // コンテナ入庫伝票追加(KICS)
          await addCtnNyukoDen(
            newJuchuCtnMeisai,
            juchuKizaiHeadData.kicsNyukoDat,
            BASHO_ID.kics,
            BASHO_ID.kics,
            userNam,
            connection
          );
        } else if (!juchuKizaiHeadData.kicsShukoDat && juchuKizaiHeadData.yardShukoDat) {
          // コンテナ入庫伝票追加(KICS)
          await addCtnNyukoDen(
            newJuchuCtnMeisai,
            juchuKizaiHeadData.kicsNyukoDat,
            BASHO_ID.kics,
            BASHO_ID.yard,
            userNam,
            connection
          );
        }
      } else if (!juchuKizaiHeadData.kicsNyukoDat && juchuKizaiHeadData.yardNyukoDat) {
        if (juchuKizaiHeadData.kicsShukoDat && juchuKizaiHeadData.yardShukoDat) {
          // コンテナ入庫伝票追加(YARD)
          await addCtnNyukoDen(
            newJuchuCtnMeisai,
            juchuKizaiHeadData.yardNyukoDat,
            BASHO_ID.yard,
            3,
            userNam,
            connection
          );
        } else if (juchuKizaiHeadData.kicsShukoDat && !juchuKizaiHeadData.yardShukoDat) {
          // コンテナ入庫伝票追加(YARD)
          await addCtnNyukoDen(
            newJuchuCtnMeisai,
            juchuKizaiHeadData.yardNyukoDat,
            BASHO_ID.yard,
            BASHO_ID.kics,
            userNam,
            connection
          );
        } else if (!juchuKizaiHeadData.kicsShukoDat && juchuKizaiHeadData.yardShukoDat) {
          // コンテナ入庫伝票追加(YARD)
          await addCtnNyukoDen(
            newJuchuCtnMeisai,
            juchuKizaiHeadData.yardNyukoDat,
            BASHO_ID.yard,
            BASHO_ID.yard,
            userNam,
            connection
          );
        }
      }
    }

    // 移動受注機材明細
    if (idoList.length > 0) {
      const idoDenMaxId = await getIdoDenJuchuMaxId();
      const newIdoDenId = idoDenMaxId ? idoDenMaxId + 1 : 1;

      const newIdoList = idoList.map((d) => ({ ...d, juchuKizaiHeadId: newJuchuKizaiHeadId }));

      // 移動受注機材明細追加
      await addIdoDenJuchu(newIdoDenId, newIdoList, userNam, connection);
    }

    // 受注本番日追加
    if (juchuHonbanbiList.length > 0) {
      for (const data of juchuHonbanbiList) {
        await addHonbanbi(juchuKizaiHeadData.juchuHeadId, newJuchuKizaiHeadId, data, userNam, connection);
      }
    }

    await connection.query('COMMIT');

    await revalidatePath('/eqpt-order-list');
    await revalidatePath('/ido-list');
    await revalidatePath('/shuko-list');
    await revalidatePath('/nyuko-list');

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
export const juchuMeisaiSeparation = async (
  juchuKizaiHeadData: JuchuKizaiHeadValues,
  motoJuchuKizaiHeadData: JuchuKizaiHeadValues,
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
    await addJuchuKizaiHead(newJuchuKizaiHeadId, juchuKizaiHeadData, JUCHU_KIZAI_HEAD_KBN.normal, userNam, connection);

    // 元受注機材ヘッダー更新（分離により機材合計が変わるため、再計算した割引金額を保存する）
    await updJuchuKizaiHead(motoJuchuKizaiHeadData, userNam, connection);

    // 受注機材入出庫追加
    await addJuchuKizaiNyushuko(
      juchuKizaiHeadData.juchuHeadId,
      newJuchuKizaiHeadId,
      juchuKizaiHeadData.kicsShukoDat,
      juchuKizaiHeadData.yardShukoDat,
      juchuKizaiHeadData.kicsNyukoDat,
      juchuKizaiHeadData.yardNyukoDat,
      userNam,
      connection
    );

    // 受注機材本番日(入出庫、使用中)追加
    const addJuchuSiyouHonbanbiData: JuchuKizaiHonbanbiValues[] = dateRange.map((d) => ({
      juchuHeadId: juchuKizaiHeadData.juchuHeadId,
      juchuKizaiHeadId: newJuchuKizaiHeadId,
      juchuHonbanbiShubetuId: HONBANBI_SHUBETU_ID.use,
      juchuHonbanbiDat: new Date(d),
      mem: '',
      juchuHonbanbiAddQty: 0,
    }));
    const addJuchuHonbanbiData: JuchuKizaiHonbanbiValues[] = [
      {
        juchuHeadId: juchuKizaiHeadData.juchuHeadId,
        juchuKizaiHeadId: newJuchuKizaiHeadId,
        juchuHonbanbiShubetuId: HONBANBI_SHUBETU_ID.shuko,
        juchuHonbanbiDat: shukoDate,
        mem: '',
        juchuHonbanbiAddQty: 0,
      },
      {
        juchuHeadId: juchuKizaiHeadData.juchuHeadId,
        juchuKizaiHeadId: newJuchuKizaiHeadId,
        juchuHonbanbiShubetuId: HONBANBI_SHUBETU_ID.nyuko,
        juchuHonbanbiDat: nyukoDate,
        mem: '',
        juchuHonbanbiAddQty: 0,
      },
    ];
    const mergeHonbanbiData: JuchuKizaiHonbanbiValues[] = [...addJuchuSiyouHonbanbiData, ...addJuchuHonbanbiData];
    await addAllHonbanbi(juchuKizaiHeadData.juchuHeadId, newJuchuKizaiHeadId, mergeHonbanbiData, userNam, connection);

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
      await addJuchuKizaiMeisai(newJuchuKizaiMeisai, userNam, connection);

      // 機材入出庫伝票追加
      await addNyushukoDen(juchuKizaiHeadData, newJuchuKizaiMeisai, userNam, connection);

      // 元受注機材明細（受注数・予備数が両方0）削除
      const deleteEq = updateEq.filter((d) => d.delFlag);
      if (deleteEq.length > 0) {
        await delJuchuKizaiMeisai(deleteEq, connection);
        // 事前（80/90）の伝票・実績も作業区分を問わず消える（本番と同じ動き）。事前準備の行も消す
        await delNyushukoDen(deleteEq, connection);
        await delNyushukoResult(deleteEq, connection);
        for (const d of deleteEq) {
          await deleteJuchuKizaiJizen(
            {
              juchu_head_id: d.juchuHeadId,
              juchu_kizai_head_id: d.juchuKizaiHeadId,
              juchu_kizai_meisai_id: d.juchuKizaiMeisaiId,
              kizai_id: d.kizaiId,
            },
            connection
          );
        }
      }

      // 元受注機材明細更新
      const remainEq = updateEq.filter((d) => !d.delFlag);
      if (remainEq.length > 0) {
        await updJuchuKizaiMeisai(remainEq, userNam, connection);

        // 元機材入出庫伝票更新
        await updNyushukoDen(juchuKizaiHeadData, remainEq, userNam, connection);

        // 事前準備は元の明細に残す（実績も元の明細のまま）。準備数が分離後の合計数を超えたら合計数まで下げる
        const overJizen = remainEq.filter((d) => d.jizenDat && (d.jizenQty ?? 0) > d.planQty);
        for (const d of overJizen) {
          await syncJizen([d], [{ ...d, jizenQty: d.planQty }], userNam, connection);
        }
      }
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
      await addJuchuContainerMeisai(newJuchuCtnMeisai, userNam, connection);

      // 元受注コンテナ明細更新
      await updJuchuContainerMeisai(updateCtn, userNam, connection);

      if (juchuKizaiHeadData.kicsShukoDat) {
        // コンテナ出庫伝票追加(KICS)
        await addCtnShukoDen(newJuchuCtnMeisai, juchuKizaiHeadData.kicsShukoDat, BASHO_ID.kics, userNam, connection);

        // 元コンテナ出庫伝票更新(KICS)
        await updCtnShukoDen(updateCtn, juchuKizaiHeadData.kicsShukoDat, BASHO_ID.kics, userNam, connection);
      }

      if (juchuKizaiHeadData.yardShukoDat) {
        // コンテナ出庫伝票追加(YARD)
        await addCtnShukoDen(newJuchuCtnMeisai, juchuKizaiHeadData.yardShukoDat, BASHO_ID.yard, userNam, connection);

        // 元コンテナ出庫伝票更新(YARD)
        await updCtnShukoDen(updateCtn, juchuKizaiHeadData.yardShukoDat, BASHO_ID.yard, userNam, connection);
      }

      if (juchuKizaiHeadData.kicsNyukoDat && juchuKizaiHeadData.yardNyukoDat) {
        if (juchuKizaiHeadData.kicsShukoDat && juchuKizaiHeadData.yardShukoDat) {
          // コンテナ入庫伝票追加(KICS)
          await addCtnNyukoDen(
            newJuchuCtnMeisai,
            juchuKizaiHeadData.kicsNyukoDat,
            BASHO_ID.kics,
            BASHO_ID.kics,
            userNam,
            connection
          );

          // コンテナ入庫伝票追加(YARD)
          await addCtnNyukoDen(
            newJuchuCtnMeisai,
            juchuKizaiHeadData.yardNyukoDat,
            BASHO_ID.yard,
            BASHO_ID.yard,
            userNam,
            connection
          );

          // 元コンテナ入庫伝票更新(KICS)
          await updCtnNyukoDen(
            updateCtn,
            juchuKizaiHeadData.kicsNyukoDat,
            BASHO_ID.kics,
            BASHO_ID.kics,
            userNam,
            connection
          );

          // 元コンテナ入庫伝票更新(YARD)
          await updCtnNyukoDen(
            updateCtn,
            juchuKizaiHeadData.yardNyukoDat,
            BASHO_ID.yard,
            BASHO_ID.yard,
            userNam,
            connection
          );
        } else if (juchuKizaiHeadData.kicsShukoDat && !juchuKizaiHeadData.yardShukoDat) {
          // コンテナ入庫伝票追加(KICS)
          await addCtnNyukoDen(
            newJuchuCtnMeisai,
            juchuKizaiHeadData.kicsNyukoDat,
            BASHO_ID.kics,
            BASHO_ID.kics,
            userNam,
            connection
          );

          // 元コンテナ入庫伝票更新(KICS)
          await updCtnNyukoDen(
            updateCtn,
            juchuKizaiHeadData.kicsNyukoDat,
            BASHO_ID.kics,
            BASHO_ID.kics,
            userNam,
            connection
          );
        } else if (!juchuKizaiHeadData.kicsShukoDat && juchuKizaiHeadData.yardShukoDat) {
          // コンテナ入庫伝票追加(YARD)
          await addCtnNyukoDen(
            newJuchuCtnMeisai,
            juchuKizaiHeadData.yardNyukoDat,
            BASHO_ID.yard,
            BASHO_ID.yard,
            userNam,
            connection
          );

          // 元コンテナ入庫伝票更新(YARD)
          await updCtnNyukoDen(
            updateCtn,
            juchuKizaiHeadData.yardNyukoDat,
            BASHO_ID.yard,
            BASHO_ID.yard,
            userNam,
            connection
          );
        }
      } else if (juchuKizaiHeadData.kicsNyukoDat && !juchuKizaiHeadData.yardNyukoDat) {
        if (juchuKizaiHeadData.kicsShukoDat && juchuKizaiHeadData.yardShukoDat) {
          // コンテナ入庫伝票追加(KICS)
          await addCtnNyukoDen(
            newJuchuCtnMeisai,
            juchuKizaiHeadData.kicsNyukoDat,
            BASHO_ID.kics,
            3,
            userNam,
            connection
          );

          // 元コンテナ入庫伝票更新(KICS)
          await updCtnNyukoDen(
            updateCtn,
            juchuKizaiHeadData.kicsNyukoDat,
            BASHO_ID.kics,
            BASHO_ID.others,
            userNam,
            connection
          );
        } else if (juchuKizaiHeadData.kicsShukoDat && !juchuKizaiHeadData.yardShukoDat) {
          // コンテナ入庫伝票追加(KICS)
          await addCtnNyukoDen(
            newJuchuCtnMeisai,
            juchuKizaiHeadData.kicsNyukoDat,
            BASHO_ID.kics,
            BASHO_ID.kics,
            userNam,
            connection
          );

          // 元コンテナ入庫伝票更新(KICS)
          await updCtnNyukoDen(
            updateCtn,
            juchuKizaiHeadData.kicsNyukoDat,
            BASHO_ID.kics,
            BASHO_ID.kics,
            userNam,
            connection
          );
        } else if (!juchuKizaiHeadData.kicsShukoDat && juchuKizaiHeadData.yardShukoDat) {
          // コンテナ入庫伝票追加(KICS)
          await addCtnNyukoDen(
            newJuchuCtnMeisai,
            juchuKizaiHeadData.kicsNyukoDat,
            BASHO_ID.kics,
            BASHO_ID.yard,
            userNam,
            connection
          );

          // 元コンテナ入庫伝票更新(KICS)
          await updCtnNyukoDen(
            updateCtn,
            juchuKizaiHeadData.kicsNyukoDat,
            BASHO_ID.kics,
            BASHO_ID.yard,
            userNam,
            connection
          );
        }
      } else if (!juchuKizaiHeadData.kicsNyukoDat && juchuKizaiHeadData.yardNyukoDat) {
        if (juchuKizaiHeadData.kicsShukoDat && juchuKizaiHeadData.yardShukoDat) {
          // コンテナ入庫伝票追加(YARD)
          await addCtnNyukoDen(
            newJuchuCtnMeisai,
            juchuKizaiHeadData.yardNyukoDat,
            BASHO_ID.yard,
            3,
            userNam,
            connection
          );

          // 元コンテナ入庫伝票更新(YARD)
          await updCtnNyukoDen(
            updateCtn,
            juchuKizaiHeadData.yardNyukoDat,
            BASHO_ID.yard,
            BASHO_ID.others,
            userNam,
            connection
          );
        } else if (juchuKizaiHeadData.kicsShukoDat && !juchuKizaiHeadData.yardShukoDat) {
          // コンテナ入庫伝票追加(YARD)
          await addCtnNyukoDen(
            newJuchuCtnMeisai,
            juchuKizaiHeadData.yardNyukoDat,
            BASHO_ID.yard,
            BASHO_ID.kics,
            userNam,
            connection
          );

          // 元コンテナ入庫伝票更新(YARD)
          await updCtnNyukoDen(
            updateCtn,
            juchuKizaiHeadData.yardNyukoDat,
            BASHO_ID.yard,
            BASHO_ID.kics,
            userNam,
            connection
          );
        } else if (!juchuKizaiHeadData.kicsShukoDat && juchuKizaiHeadData.yardShukoDat) {
          // コンテナ入庫伝票追加(YARD)
          await addCtnNyukoDen(
            newJuchuCtnMeisai,
            juchuKizaiHeadData.yardNyukoDat,
            BASHO_ID.yard,
            BASHO_ID.yard,
            userNam,
            connection
          );

          // 元コンテナ入庫伝票更新(YARD)
          await updCtnNyukoDen(
            updateCtn,
            juchuKizaiHeadData.yardNyukoDat,
            BASHO_ID.yard,
            BASHO_ID.yard,
            userNam,
            connection
          );
        }
      }
    }

    // 移動受注機材明細
    if (idoList.length > 0) {
      const idoDenMaxId = await getIdoDenJuchuMaxId();
      const newIdoDenId = idoDenMaxId ? idoDenMaxId + 1 : 1;

      const newIdoList = idoList.map((d) => ({ ...d, juchuKizaiHeadId: newJuchuKizaiHeadId }));

      // 移動受注機材明細追加
      await addIdoDenJuchu(newIdoDenId, newIdoList, userNam, connection);

      // 元移動受注機材明細（受注数・予備数が両方0）削除
      const deleteIdo = updateIdoList.filter((d) => d.idoDenId && d.delFlag);
      if (deleteIdo.length > 0) {
        await delIdoDenJuchu(
          deleteIdo.map((d) => d.idoDenId as number),
          connection
        );
      }

      // 元移動受注機材明細更新
      const remainIdo = updateIdoList.filter((d) => !d.delFlag);
      if (remainIdo.length > 0) {
        await updIdoDenJuchu(remainIdo, userNam, connection);
      }
    }

    // 受注本番日追加
    if (juchuHonbanbiList.length > 0) {
      for (const data of juchuHonbanbiList) {
        await addHonbanbi(juchuKizaiHeadData.juchuHeadId, newJuchuKizaiHeadId, data, userNam, connection);
      }
    }

    await connection.query('COMMIT');

    await revalidatePath('/eqpt-order-list');
    await revalidatePath('/ido-list');
    await revalidatePath('/shuko-list');
    await revalidatePath('/nyuko-list');

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

// /**
//  * 出庫作業ステータス確認
//  * @param juchuHeadId
//  * @param juchuKizaiHeadId
//  * @returns
//  */
// export const checkShukoStatus = async (juchuHeadId: number, juchuKizaiHeadId: number) => {
//   try {
//     const confirmData = await selectShukoStateConfirm(juchuHeadId, juchuKizaiHeadId);
//     return confirmData.length === 0 ? false : true;
//   } catch (e) {
//     if (e instanceof Error) {
//       console.error(`[ERROR] ${e.message}`);
//       if (e.cause) {
//         console.error(`[CAUSE]`, e.cause);
//       }
//     } else {
//       console.error(e);
//     }
//     throw e;
//   }
// };

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
    await addJuchuKizaiHead(newJuchuKizaiHeadId, data, JUCHU_KIZAI_HEAD_KBN.normal, userNam, connection);
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
    // 受注機材本番日(入出庫、使用中)追加
    const addJuchuSiyouHonbanbiData: JuchuKizaiHonbanbiValues[] = updateDateRange.map((d) => ({
      juchuHeadId: data.juchuHeadId,
      juchuKizaiHeadId: newJuchuKizaiHeadId,
      juchuHonbanbiShubetuId: HONBANBI_SHUBETU_ID.use,
      juchuHonbanbiDat: new Date(d),
      mem: '',
      juchuHonbanbiAddQty: 0,
    }));
    const addJuchuHonbanbiData: JuchuKizaiHonbanbiValues[] = [
      {
        juchuHeadId: data.juchuHeadId,
        juchuKizaiHeadId: newJuchuKizaiHeadId,
        juchuHonbanbiShubetuId: HONBANBI_SHUBETU_ID.shuko,
        juchuHonbanbiDat: updateShukoDate,
        mem: '',
        juchuHonbanbiAddQty: 0,
      },
      {
        juchuHeadId: data.juchuHeadId,
        juchuKizaiHeadId: newJuchuKizaiHeadId,
        juchuHonbanbiShubetuId: HONBANBI_SHUBETU_ID.nyuko,
        juchuHonbanbiDat: updateNyukoDate,
        mem: '',
        juchuHonbanbiAddQty: 0,
      },
    ];
    const mergeHonbanbiData: JuchuKizaiHonbanbiValues[] = [...addJuchuSiyouHonbanbiData, ...addJuchuHonbanbiData];
    await addAllHonbanbi(data.juchuHeadId, newJuchuKizaiHeadId, mergeHonbanbiData, userNam, connection);

    // 受注本番日(仕込・RH・GP・本番)を受注本番日テンプレートから展開
    const honbanbiTemplate = await getHonbanbiTemplate(data.juchuHeadId);
    await expandHonbanbiTemplate(
      data.juchuHeadId,
      newJuchuKizaiHeadId,
      updateShukoDate,
      updateNyukoDate,
      honbanbiTemplate,
      userNam,
      connection
    );

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
    throw e;
  } finally {
    connection.release();
  }
};

/**
 * 受注機材ヘッダー保存
 * @param checkJuchuKizaiHead
 * @param checkJuchuHonbanbi
 * @param checkJuchuKizaiMeisai
 * @param data
 * @param updateShukoDate
 * @param updateNyukoDate
 * @param updateDateRange
 * @param juchuHonbanbiList
 * @param juchuHonbanbiDeleteList
 * @param juchuKizaiMeisaiList
 * @param userNam
 * @returns
 *
 * コンテナの追加・削除・予定数・メモは出庫明細（最終確認）で管理するため、ここでは変更しない。
 * 出庫日時・出庫場所の変更をコンテナの伝票・実績・受注コンテナ明細に反映し、入庫伝票を作り直すだけ。
 */
export const saveJuchuKizai = async (
  checkJuchuKizaiHead: boolean,
  checkKicsShukoDat: boolean,
  checkKicsNyukoDat: boolean,
  checkYardShukoDat: boolean,
  checkYardNyukoDat: boolean,
  checkJuchuKizaiMeisai: boolean,
  checkJuchuKizaiJizen: boolean,
  checkIdoJuchuKizaiMeisai: boolean,
  data: JuchuKizaiHeadValues,
  updateShukoDate: Date,
  updateNyukoDate: Date,
  updateDateRange: string[],
  originJuchuKizaiMeisaiList: JuchuKizaiMeisaiValues[],
  juchuKizaiMeisaiList: JuchuKizaiMeisaiValues[],
  idoJuchuKizaiMeisaiList: IdoJuchuKizaiMeisaiValues[],
  userNam: string
) => {
  // 事前準備の入力チェック（画面の保存前チェックと同じ。画面を通らずに呼ばれた場合に備えてサーバー側でも確かめる）
  // 日時は通信で文字列になり得るので Date に揃えてから比べる
  const toDate = (v: Date | string | null | undefined) => (v ? new Date(v) : null);
  const jizenErrors = validateJizen(
    juchuKizaiMeisaiList.map((d) => (d.jizenDat ? { ...d, jizenDat: new Date(d.jizenDat) } : d)),
    toDate(data.kicsShukoDat),
    toDate(data.yardShukoDat)
  );
  if (jizenErrors.length > 0) {
    throw new Error(`[saveJuchuKizai] 事前準備の入力に誤りがあります: ${jizenErrors.join(' / ')}`);
  }

  const connection = await pool.connect();

  try {
    await connection.query('BEGIN');

    // 受注機材ヘッダー関係更新
    if (checkJuchuKizaiHead) {
      // 受注機材ヘッダー更新
      await updJuchuKizaiHead(data, userNam, connection);

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

      // 受注機材本番日(使用中)更新
      const addJuchuSiyouHonbanbiData: JuchuKizaiHonbanbiValues[] = updateDateRange.map((d) => ({
        juchuHeadId: data.juchuHeadId,
        juchuKizaiHeadId: data.juchuKizaiHeadId,
        juchuHonbanbiShubetuId: HONBANBI_SHUBETU_ID.use,
        juchuHonbanbiDat: new Date(d),
        mem: '',
        juchuHonbanbiAddQty: 0,
      }));
      await delSiyouHonbanbi(data.juchuHeadId, data.juchuKizaiHeadId, connection);
      await addAllHonbanbi(data.juchuHeadId, data.juchuKizaiHeadId, addJuchuSiyouHonbanbiData, userNam, connection);

      if (checkKicsNyukoDat || checkYardNyukoDat) {
        // 返却伝票チェック
        const returnJuchuKizaiHeads = await getChildJuchuKizaiHead(data.juchuHeadId, data.juchuKizaiHeadId);
        if (returnJuchuKizaiHeads.length > 0) {
          // 返却ヘッダーの適用期間（返却日〜親の入庫日）も変わるため、本番日数を計算し直す
          const returnHonbanbiTemplate = await getHonbanbiTemplate(data.juchuHeadId);

          for (const returnHead of returnJuchuKizaiHeads) {
            const returnDateRange = getRange(
              returnHead.nyuko_dat ? new Date(returnHead.nyuko_dat) : null,
              updateNyukoDate
            );
            const returnJuchuSiyouHonbanbiData: JuchuKizaiHonbanbiValues[] = returnDateRange.map((d) => ({
              juchuHeadId: returnHead.juchu_head_id,
              juchuKizaiHeadId: returnHead.juchu_kizai_head_id,
              juchuHonbanbiShubetuId: HONBANBI_SHUBETU_ID.use,
              juchuHonbanbiDat: new Date(d),
              mem: '',
              juchuHonbanbiAddQty: 0,
            }));
            await delSiyouHonbanbi(returnHead.juchu_head_id, returnHead.juchu_kizai_head_id, connection);
            await addAllHonbanbi(
              returnHead.juchu_head_id,
              returnHead.juchu_kizai_head_id,
              returnJuchuSiyouHonbanbiData,
              userNam,
              connection
            );

            // 返却ヘッダーは本番日の行を持たないため、本番日数だけを更新する
            await expandHonbanbiTemplate(
              returnHead.juchu_head_id,
              returnHead.juchu_kizai_head_id,
              returnDateRange[0] ?? null,
              returnDateRange[returnDateRange.length - 1] ?? null,
              returnHonbanbiTemplate,
              userNam,
              connection,
              true
            );
          }
        }
      }

      // 受注機材本番日(出庫、入庫)更新
      const updateNyushukoHonbanbiData: JuchuKizaiHonbanbiValues[] = [
        {
          juchuHeadId: data.juchuHeadId,
          juchuKizaiHeadId: data.juchuKizaiHeadId,
          juchuHonbanbiShubetuId: HONBANBI_SHUBETU_ID.shuko,
          juchuHonbanbiDat: updateShukoDate,
          mem: '',
          juchuHonbanbiAddQty: 0,
        },
        {
          juchuHeadId: data.juchuHeadId,
          juchuKizaiHeadId: data.juchuKizaiHeadId,
          juchuHonbanbiShubetuId: HONBANBI_SHUBETU_ID.nyuko,
          juchuHonbanbiDat: updateNyukoDate,
          mem: '',
          juchuHonbanbiAddQty: 0,
        },
      ];
      for (const item of updateNyushukoHonbanbiData) {
        await updNyushukoHonbanbi(data.juchuHeadId, data.juchuKizaiHeadId, item, userNam, connection);
      }
    }

    // 受注本番日（仕込・RH・GP・本番）の展開し直し。
    // この画面では本番日を編集できないが、入出庫日が変わると適用範囲が変わるため、
    // 受注ヘッダー単位のテンプレートから作り直す。
    if (checkKicsShukoDat || checkKicsNyukoDat || checkYardShukoDat || checkYardNyukoDat) {
      const template = await getHonbanbiTemplate(data.juchuHeadId);
      await expandHonbanbiTemplate(
        data.juchuHeadId,
        data.juchuKizaiHeadId,
        updateShukoDate,
        updateNyukoDate,
        template,
        userNam,
        connection
      );
    }

    let dspOrdNum = 1;
    // 受注明細、入出庫伝票、入出庫実績
    if (checkKicsShukoDat || checkKicsNyukoDat || checkYardShukoDat || checkYardNyukoDat || checkJuchuKizaiMeisai) {
      // 受注機材明細id最大値（受注削除で残した入出庫伝票の明細idも含める。使い回すと残した伝票と主キーが重なるため）
      const juchuKizaiMeisaiMaxId = await selectJuchuKizaiMeisaiMaxIdWithDenTx(
        data.juchuHeadId,
        data.juchuKizaiHeadId,
        connection
      );
      let newJuchuKizaiMeisaiId = juchuKizaiMeisaiMaxId + 1;
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
        await delJuchuKizaiMeisai(deleteJuchuKizaiMeisaiData, connection);
      }
      // 追加
      if (addJuchuKizaiMeisaiData.length > 0) {
        await addJuchuKizaiMeisai(addJuchuKizaiMeisaiData, userNam, connection);
      }
      // 更新
      if (updateJuchuKizaiMeisaiData.length > 0) {
        await updJuchuKizaiMeisai(updateJuchuKizaiMeisaiData, userNam, connection);
      }

      // 削除処理された機材の入出庫伝票、入出庫実績削除
      // 出庫実績が残っている行は予定数0にして残し、出庫画面で取り除くべき現物として見せる
      if (deleteJuchuKizaiMeisaiData.length > 0) {
        await delNyushukoDenKeepResulted(deleteJuchuKizaiMeisaiData, userNam, connection);
        await delNyushukoResultKeepDen(deleteJuchuKizaiMeisaiData, connection);
      }

      // 出庫場所が変更された機材の出庫伝票、出庫実績削除
      const originMap = new Map(originJuchuKizaiMeisaiList.map((item) => [item.juchuKizaiMeisaiId, item]));
      // 削除、追加出庫機材
      const shozokuChangedData = [];
      // 更新出庫機材
      const shozokuUnChangedData = [];

      for (const updItem of updateJuchuKizaiMeisaiData) {
        const key = updItem.juchuKizaiMeisaiId;
        const originItem = originMap.get(key);

        if (originItem && originItem.shozokuId !== updItem.shozokuId) {
          shozokuChangedData.push(updItem);
        } else {
          shozokuUnChangedData.push(updItem);
        }
      }

      // 出庫機材伝票削除、追加
      if (addJuchuKizaiMeisaiData.length > 0 || shozokuChangedData.length > 0) {
        // 出庫場所が変わった機材の、元の場所の出庫伝票・実績を整理する（明細idは変えない）
        // 実績・補正がある伝票は予定数0にして受注削除として元の場所に残し、それ以外は削除する
        await keepShozokuChangedShukoDen(shozokuChangedData, originMap, userNam, connection);

        if (data.kicsShukoDat) {
          // 新規の明細は新しい明細idなので作るだけ
          const addKicsJuchuKizaiMeisaiData = addJuchuKizaiMeisaiData.filter((d) => d.shozokuId === BASHO_ID.kics);
          if (addKicsJuchuKizaiMeisaiData.length > 0) {
            await addShukoDen(addKicsJuchuKizaiMeisaiData, data.kicsShukoDat, userNam, connection);
          }
          // 出庫場所が変わった明細は、新しい場所に同じ明細idの受注削除の行（元に戻した場合）があれば通常の行に戻す
          const changedKicsJuchuKizaiMeisaiData = shozokuChangedData.filter((d) => d.shozokuId === BASHO_ID.kics);
          if (changedKicsJuchuKizaiMeisaiData.length > 0) {
            await upsShukoDenBasho(changedKicsJuchuKizaiMeisaiData, data.kicsShukoDat, userNam, connection);
          }
        }

        if (data.yardShukoDat) {
          const addYardJuchuKizaiMeisaiData = addJuchuKizaiMeisaiData.filter((d) => d.shozokuId === BASHO_ID.yard);
          if (addYardJuchuKizaiMeisaiData.length > 0) {
            await addShukoDen(addYardJuchuKizaiMeisaiData, data.yardShukoDat, userNam, connection);
          }
          const changedYardJuchuKizaiMeisaiData = shozokuChangedData.filter((d) => d.shozokuId === BASHO_ID.yard);
          if (changedYardJuchuKizaiMeisaiData.length > 0) {
            await upsShukoDenBasho(changedYardJuchuKizaiMeisaiData, data.yardShukoDat, userNam, connection);
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

      // 事前準備（明細の変更で出庫場所・表示順・削除が変わるため、事前準備に変更が無くても通す）
      if (checkJuchuKizaiMeisai || checkJuchuKizaiJizen) {
        await syncJizen(originJuchuKizaiMeisaiList, newJuchuKizaiMeisaiData, userNam, connection);
      }

      // 出庫日時・出庫場所の変更前の受注コンテナ明細（出庫場所がなくなるときの入庫伝票の削除に使う）
      const beforeJuchuContainerMeisaiData = await getJuchuContainerMeisaiTx(
        data.juchuHeadId,
        data.juchuKizaiHeadId,
        connection
      );

      // 出庫場所ごとの受注コンテナ明細（出庫場所をなくすときに、その場所にあったコンテナを知るために削除前に読む）
      const beforeCtnMeisaiRows = await selectJuchuContainerMeisaiRowsTx(
        data.juchuHeadId,
        data.juchuKizaiHeadId,
        connection
      );

      // コンテナの出庫伝票・実績：出庫日時が変わっても削除せず日時だけ更新する（機材と同じ）
      // 出庫場所がなくなる場合（Y出庫のみ → K出庫のみ など）は、その場所の伝票・実績・受注コンテナ明細を削除する
      // ※対象は m_kizai.ctn_flg = 1 で絞る（画面に出ていない予定外コンテナの伝票も漏れなく扱うため）
      const ctnShukoBashos = [
        { bashoId: BASHO_ID.kics, checkShukoDat: checkKicsShukoDat, shukoDat: data.kicsShukoDat },
        { bashoId: BASHO_ID.yard, checkShukoDat: checkYardShukoDat, shukoDat: data.yardShukoDat },
      ];
      for (const { bashoId, checkShukoDat, shukoDat } of ctnShukoBashos) {
        if (!checkShukoDat) continue;

        if (shukoDat) {
          const newShukoDat = new Date(shukoDat).toISOString();
          await updateShukoCtnDenDat(data.juchuHeadId, data.juchuKizaiHeadId, bashoId, newShukoDat, connection);
          await updateShukoCtnResultDat(data.juchuHeadId, data.juchuKizaiHeadId, bashoId, newShukoDat, connection);
          // 受注削除で残した機材の伝票・実績も新しい日時に移す（通常の機材は画面の明細ごとに更新しているが、
          // 受注明細が無いこの行は対象に入らず、古い日時のまま取り残されるため）
          await updateDeletedShukoDenDat(data.juchuHeadId, data.juchuKizaiHeadId, bashoId, newShukoDat, connection);
          await updateDeletedShukoResultDat(data.juchuHeadId, data.juchuKizaiHeadId, bashoId, newShukoDat, connection);
        } else {
          await deleteAllShukoCtnDenBasho(data.juchuHeadId, data.juchuKizaiHeadId, bashoId, connection);
          await delAllKicsOrYardShukoCtnResult(data.juchuHeadId, data.juchuKizaiHeadId, bashoId, connection);
          await deleteAllJuchuContainerMeisaiShozoku(data.juchuHeadId, data.juchuKizaiHeadId, bashoId, connection);

          // 出発解除後などで入庫伝票が残っていることがあるため、出庫明細でコンテナを削除したときと同じように入庫伝票・入庫実績を合わせる
          const removedCtnRows = beforeCtnMeisaiRows
            .filter((c) => c.shozoku_id === bashoId)
            .map((c) => ({
              juchuHeadId: data.juchuHeadId,
              juchuKizaiHeadId: data.juchuKizaiHeadId,
              juchuKizaiMeisaiId: c.juchu_kizai_meisai_id,
              kizaiId: c.kizai_id,
            }));
          await syncNyukoCtnAfterDelete(removedCtnRows, bashoId, userNam, connection);
        }
      }
      if (checkKicsNyukoDat) {
        await delAllKicsOrYardNyukoDen(data.juchuHeadId, data.juchuKizaiHeadId, 1, connection);

        await delAllNyukoResult(data.juchuHeadId, data.juchuKizaiHeadId, 1, connection);

        if (data.kicsNyukoDat && data.yardNyukoDat && !checkYardNyukoDat) {
          const kicsNyukoData = newJuchuKizaiMeisaiData.filter((d) => !d.delFlag && d.mShozokuId === BASHO_ID.kics);

          if (kicsNyukoData.length) {
            await delKicsOrYardNyukoDen(kicsNyukoData, 2, connection);

            await delNyukoResult(kicsNyukoData, 2, connection);
          }
        }
      }
      if (checkYardNyukoDat) {
        await delAllKicsOrYardNyukoDen(data.juchuHeadId, data.juchuKizaiHeadId, 2, connection);

        await delAllNyukoResult(data.juchuHeadId, data.juchuKizaiHeadId, 2, connection);

        if (data.kicsNyukoDat && data.yardNyukoDat && !checkKicsNyukoDat) {
          const yardNyukoData = newJuchuKizaiMeisaiData.filter((d) => !d.delFlag && d.mShozokuId === BASHO_ID.yard);

          if (yardNyukoData.length) {
            await delKicsOrYardNyukoDen(yardNyukoData, 1, connection);

            await delNyukoResult(yardNyukoData, 1, connection);
          }
        }
      }

      if (!data.kicsShukoDat && checkKicsShukoDat && data.kicsNyukoDat && !checkKicsNyukoDat) {
        if (beforeJuchuContainerMeisaiData.length > 0) {
          await delKicsOrYardCtnNyukoDen(beforeJuchuContainerMeisaiData, BASHO_ID.kics, connection);
        }
      }

      if (!data.yardShukoDat && checkYardShukoDat && data.yardNyukoDat && !checkYardNyukoDat) {
        if (beforeJuchuContainerMeisaiData.length > 0) {
          await delKicsOrYardCtnNyukoDen(beforeJuchuContainerMeisaiData, BASHO_ID.yard, connection);
        }
      }

      // コンテナの出庫伝票はここでは作らない（出庫明細の保存・HT/ゲートの送信・出発で作る）

      // コンテナの入庫伝票に使う受注コンテナ明細（上で削除した場所の分を反映した状態で読み直す）
      const juchuContainerMeisaiData = await getJuchuContainerMeisaiTx(
        data.juchuHeadId,
        data.juchuKizaiHeadId,
        connection
      );

      // 返却データ
      const returnData = await selectFinishedReturn(data.juchuHeadId, data.juchuKizaiHeadId, connection);

      // コンテナの入庫伝票は、流れ込む出庫場所が出発済みの分だけ作り直す（メイン明細から未出発の分を作らない）
      // 入庫が2か所なら同じ場所の出庫、入庫が1か所なら K・Y 両方の出庫が流れ込む（planQtyId が others）
      const departedShukoBashoIds = await selectFixedSagyoIdsTx(
        data.juchuHeadId,
        data.juchuKizaiHeadId,
        SAGYO_KBN_ID.shukoConfirmed,
        connection
      );
      const ctnMeisaiRows = await selectJuchuContainerMeisaiRowsTx(data.juchuHeadId, data.juchuKizaiHeadId, connection);
      const upsDepartedCtnNyukoDen = async (nyukoDat: Date, sagyoId: number, planQtyId: number) => {
        const shukoBashoIds = planQtyId === BASHO_ID.others ? [BASHO_ID.kics, BASHO_ID.yard] : [planQtyId];
        const targets = juchuContainerMeisaiData.filter((d) =>
          ctnMeisaiRows.some(
            (c) =>
              c.juchu_kizai_meisai_id === d.juchuKizaiMeisaiId &&
              c.kizai_id === d.kizaiId &&
              shukoBashoIds.includes(c.shozoku_id) &&
              departedShukoBashoIds.includes(c.shozoku_id)
          )
        );
        if (targets.length === 0) return;

        // K・Y 両方が流れ込む場合の予定数は、出発済みの場所の分だけを合計する（出発時の計算と同じ）
        const departedTargets =
          planQtyId === BASHO_ID.others
            ? targets.map((d) => ({
                ...d,
                planQty:
                  (departedShukoBashoIds.includes(BASHO_ID.kics) ? d.planKicsKizaiQty : 0) +
                  (departedShukoBashoIds.includes(BASHO_ID.yard) ? d.planYardKizaiQty : 0),
              }))
            : targets;

        await upsCtnNyukoDen(departedTargets, returnData, nyukoDat, sagyoId, planQtyId, userNam, connection);
      };

      // 入庫追加更新
      if (data.kicsNyukoDat && data.yardNyukoDat) {
        // KICS入庫明細
        const kicsNyukoData = newJuchuKizaiMeisaiData.filter((d) => !d.delFlag && d.mShozokuId === BASHO_ID.kics);
        // YARD入庫明細
        const yardNyukoData = newJuchuKizaiMeisaiData.filter((d) => !d.delFlag && d.mShozokuId === BASHO_ID.yard);

        if (kicsNyukoData.length > 0) {
          await upsNyukoDen(kicsNyukoData, returnData, data.kicsNyukoDat, BASHO_ID.kics, userNam, connection);
        }

        if (yardNyukoData.length > 0) {
          await upsNyukoDen(yardNyukoData, returnData, data.yardNyukoDat, BASHO_ID.yard, userNam, connection);
        }

        // コンテナ入庫明細
        const ctnNyukoData = juchuContainerMeisaiData;
        if (ctnNyukoData.length > 0) {
          if (data.kicsShukoDat && data.yardShukoDat) {
            await upsDepartedCtnNyukoDen(data.kicsNyukoDat, BASHO_ID.kics, BASHO_ID.kics);

            await upsDepartedCtnNyukoDen(data.yardNyukoDat, BASHO_ID.yard, BASHO_ID.yard);
          } else if (data.kicsShukoDat && !data.yardShukoDat) {
            await upsDepartedCtnNyukoDen(data.kicsNyukoDat, BASHO_ID.kics, BASHO_ID.kics);
          } else if (!data.kicsShukoDat && data.yardShukoDat) {
            await upsDepartedCtnNyukoDen(data.yardNyukoDat, BASHO_ID.yard, BASHO_ID.yard);
          }
        }
      } else if (data.kicsNyukoDat && !data.yardNyukoDat) {
        // KICS機材明細
        const kicsNyukoData = newJuchuKizaiMeisaiData.filter((d) => !d.delFlag);

        if (kicsNyukoData.length > 0) {
          await upsNyukoDen(kicsNyukoData, returnData, data.kicsNyukoDat, BASHO_ID.kics, userNam, connection);
        }

        // KICSコンテナ入庫明細
        const ctnNyukoData = juchuContainerMeisaiData;
        if (ctnNyukoData.length > 0) {
          if (data.kicsShukoDat && data.yardShukoDat) {
            await upsDepartedCtnNyukoDen(data.kicsNyukoDat, BASHO_ID.kics, BASHO_ID.others);
          } else if (data.kicsShukoDat && !data.yardShukoDat) {
            await upsDepartedCtnNyukoDen(data.kicsNyukoDat, BASHO_ID.kics, BASHO_ID.kics);
          } else if (!data.kicsShukoDat && data.yardShukoDat) {
            await upsDepartedCtnNyukoDen(data.kicsNyukoDat, BASHO_ID.kics, BASHO_ID.yard);
          }
        }
      } else if (!data.kicsNyukoDat && data.yardNyukoDat) {
        // YARD機材明細
        const yardNyukoData = newJuchuKizaiMeisaiData.filter((d) => !d.delFlag);

        if (yardNyukoData.length > 0) {
          await upsNyukoDen(yardNyukoData, returnData, data.yardNyukoDat, BASHO_ID.yard, userNam, connection);
        }

        // YARDコンテナ入庫明細
        const ctnNyukoData = juchuContainerMeisaiData;
        if (ctnNyukoData.length > 0) {
          if (data.kicsShukoDat && data.yardShukoDat) {
            await upsDepartedCtnNyukoDen(data.yardNyukoDat, BASHO_ID.yard, BASHO_ID.others);
          } else if (data.kicsShukoDat && !data.yardShukoDat) {
            await upsDepartedCtnNyukoDen(data.yardNyukoDat, BASHO_ID.yard, BASHO_ID.kics);
          } else if (!data.kicsShukoDat && data.yardShukoDat) {
            await upsDepartedCtnNyukoDen(data.yardNyukoDat, BASHO_ID.yard, BASHO_ID.yard);
          }
        }
      }
    } else if (checkJuchuKizaiJizen) {
      // 事前準備だけの変更（明細・入出庫日時は変わっていない）：明細・本番の伝票・入庫伝票には触れない
      await syncJizen(originJuchuKizaiMeisaiList, juchuKizaiMeisaiList, userNam, connection);
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
        await delIdoDenJuchu(deleteIdoDenIds as number[], connection);
      }
      // 追加
      if (addIdoKizaiData.length > 0) {
        const idoDenMaxId = await getIdoDenJuchuMaxId();
        const newIdoDenId = idoDenMaxId ? idoDenMaxId + 1 : 1;
        await addIdoDenJuchu(newIdoDenId, addIdoKizaiData, userNam, connection);
      }
      // 更新
      if (updateIdoKizaiData.length > 0) {
        await updIdoDenJuchu(updateIdoKizaiData, userNam, connection);
      }
    }

    await connection.query('COMMIT');

    await revalidatePath('/eqpt-order-list');
    await revalidatePath('/ido-list');
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
