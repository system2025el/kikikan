'use server';

import { revalidatePath } from 'next/cache';
import { PoolClient } from 'pg';

import pool from '@/app/_lib/db/postgres';
import { selectJuchuContainerMeisaiMaxId, upsertJuchuContainerMeisai } from '@/app/_lib/db/tables/t-juchu-ctn-meisai';
import { selectJuchuKizaiMeisaiMaxId, upsertJuchuKizaiMeisai } from '@/app/_lib/db/tables/t-juchu-kizai-meisai';
import { selectJuchuKizaiNyushukoConfirm } from '@/app/_lib/db/tables/t-juchu-kizai-nyushuko';
import { updateNyushukoDen, updateOyaNyukoDen, upsertNyushukoDen } from '@/app/_lib/db/tables/t-nyushuko-den';
import {
  insertNyushukoFix,
  selectSagyoIdFilterNyushukoFixFlag,
  updateNyushukoFix,
} from '@/app/_lib/db/tables/t-nyushuko-fix';
import { selectNyushukoOne } from '@/app/_lib/db/tables/v-nyushuko-den2';
import { selectNyushukoDetail } from '@/app/_lib/db/tables/v-nyushuko-den2-lst';
import { JuchuCtnMeisai } from '@/app/_lib/db/types/t_juchu_ctn_meisai-type';
import { JuchuKizaiMeisai } from '@/app/_lib/db/types/t-juchu-kizai-meisai-type';
import { NyushukoDen } from '@/app/_lib/db/types/t-nyushuko-den-type';
import { NyushukoFix } from '@/app/_lib/db/types/t-nyushuko-fix-type';

import { NyukoDetailTableValues, NyukoDetailValues } from './types';

/**
 * 入庫明細取得
 * @param juchuHeadId 受注ヘッダーid
 * @param juchuKizaiHeadKbn 受注機材ヘッダー区分
 * @param nyushukoBashoId 入出庫場所id
 * @param nyushukoDat 入出庫日時
 * @param sagyoKbnId 作業区分id
 * @returns
 */
export const getNyukoDetail = async (
  juchuHeadId: number,
  juchuKizaiHeadKbn: number,
  nyushukoBashoId: number,
  nyushukoDat: string,
  sagyoKbnId: number
) => {
  try {
    const { data, error } = await selectNyushukoOne(juchuHeadId, juchuKizaiHeadKbn, nyushukoBashoId, nyushukoDat, 2);

    if (error) {
      console.error('getNyukoDetail error : ', error);
      throw error;
    }

    const nyukoDetailData: NyukoDetailValues = {
      juchuHeadId: juchuHeadId,
      juchuKizaiHeadKbn: juchuKizaiHeadKbn,
      nyushukoBashoId: nyushukoBashoId,
      nyushukoDat: nyushukoDat,
      sagyoKbnId: sagyoKbnId,
      juchuKizaiHeadIds: data.juchu_kizai_head_idv?.split(',').map((id) => parseInt(id)) || [],
      nyushukoShubetuId: 2,
      headNamv: data.head_namv,
      koenNam: data.koen_nam,
      koenbashoNam: data.koenbasho_nam,
      kokyakuNam: data.kokyaku_nam,
    };

    return nyukoDetailData;
  } catch (e) {
    console.error(e);
  }
};

/**
 * 入庫明細テーブルデータ取得
 * @param juchuHeadId 受注ヘッダーid
 * @param nyushukoBashoId 入出庫場所id
 * @param nyushukoDat 入出庫日
 * @returns
 */
export const getNyukoDetailTable = async (
  juchuHeadId: number,
  juchuKizaiHeadKbn: number,
  nyushukoBashoId: number,
  nyushukoDat: string,
  sagyoKbnId: number
) => {
  try {
    const { data, error } = await selectNyushukoDetail(
      juchuHeadId,
      juchuKizaiHeadKbn,
      nyushukoBashoId,
      nyushukoDat,
      sagyoKbnId
    );

    if (error) {
      console.error('getNyukoDetailTable error : ', error);
      throw error;
    }

    const nyukoDetailTableData: NyukoDetailTableValues[] = data.map((d) => ({
      juchuHeadId: d.juchu_head_id ?? 0,
      juchuKizaiHeadId: d.juchu_kizai_head_id ?? 0,
      juchuKizaiMeisaiId: d.juchu_kizai_meisai_id ?? 0,
      juchuKizaiHeadKbn: d.juchu_kizai_head_kbnv ? parseInt(d.juchu_kizai_head_kbnv) : 0,
      headNamv: d.head_namv,
      kizaiId: d.kizai_id ?? 0,
      kizaiNam: d.kizai_nam,
      koenNam: d.koen_nam,
      koenbashoNam: d.koenbasho_nam,
      kokyakuNam: d.kokyaku_nam,
      nyushukoBashoId: d.nyushuko_basho_id ?? 0,
      nyushukoDat: d.nyushuko_dat ?? '',
      nyushukoShubetuId: d.nyushuko_shubetu_id,
      planQty: d.plan_qty,
      resultAdjQty: d.result_adj_qty,
      resultQty: d.result_qty,
      sagyoKbnId: d.sagyo_kbn_id,
      diff: (d.result_qty ?? 0) + (d.result_adj_qty ?? 0) - (d.plan_qty ?? 0),
      ctnFlg: d.ctn_flg,
      dspOrdNumMeisai: d.dsp_ord_num_meisai,
      indentNum: d.indent_num ?? 0,
    }));

    return nyukoDetailTableData;
  } catch (e) {
    console.error(e);
  }
};

/**
 * 到着
 * @param nyukoDetailData 入庫データ
 * @param sagyoFixFlg 作業確定フラグ
 * @param userNam ユーザー名
 * @returns
 */
export const updNyukoDetail = async (
  nyukoDetailData: NyukoDetailValues,
  nyukoDetailTableData: NyukoDetailTableValues[],
  userNam: string
) => {
  if (nyukoDetailTableData.length === 0) {
    console.log('No data to update');
    return;
  }

  const connection = await pool.connect();

  try {
    await connection.query('BEGIN');

    switch (nyukoDetailData.juchuKizaiHeadKbn) {
      case 1: // メイン
        await updMainNyukoDetail(nyukoDetailData, nyukoDetailTableData, userNam, connection);
        break;
      case 2: // 返却
        await updReturnNyukoDetail(nyukoDetailData, nyukoDetailTableData, userNam, connection);
        break;
      case 3: // キープ
        await updKeepNyukoDetail(nyukoDetailData, nyukoDetailTableData, userNam, connection);
        break;
    }

    await connection.query('COMMIT');

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
 * メイン入庫伝票到着処理
 * @param nyukoDetailData 入庫データ
 * @param nyukoDetailTableData 入庫テーブルデータ
 * @param userNam ユーザー名
 * @param connection
 */
export const updMainNyukoDetail = async (
  nyukoDetailData: NyukoDetailValues,
  nyukoDetailTableData: NyukoDetailTableValues[],
  userNam: string,
  connection: PoolClient
) => {
  try {
    // 入庫確定追加
    await addNyukoFix(nyukoDetailData, nyukoDetailTableData, userNam, connection);
  } catch (e) {
    throw e;
  }
};

/**
 * 返却入庫伝票到着処理
 * @param nyukoDetailData 入庫データ
 * @param nyukoDetailTableData 入庫テーブルデータ
 * @param userNam ユーザー名
 * @param connection
 */
export const updReturnNyukoDetail = async (
  nyukoDetailData: NyukoDetailValues,
  nyukoDetailTableData: NyukoDetailTableValues[],
  userNam: string,
  connection: PoolClient
) => {
  // 機材データ
  const kizaiData = nyukoDetailTableData.filter((d) => !d.ctnFlg);
  // コンテナデータ
  const ctnData = nyukoDetailTableData.filter((data) => data.ctnFlg);
  try {
    // 返却入庫伝票更新
    await updNyukoDen(nyukoDetailTableData, userNam, connection);

    // 親入子伝票更新
    await updOyaNyukoDen(nyukoDetailTableData, userNam, connection);

    // 機材明細追加更新
    if (kizaiData && kizaiData.length > 0) {
      await upsJuchuKizaiMeisai(kizaiData, userNam, connection);
    }

    // コンテナ明細追加更新
    if (ctnData && ctnData.length > 0) {
      await upsJuchuCtnMeisai(ctnData, userNam, connection);
    }

    // 入庫確定追加
    await addNyukoFix(nyukoDetailData, nyukoDetailTableData, userNam, connection);
  } catch (e) {
    throw e;
  }
};

/**
 * キープ入庫伝票到着処理
 * @param nyukoDetailData 入庫データ
 * @param nyukoDetailTableData 入庫テーブルデータ
 * @param userNam ユーザー名
 * @param connection
 */
export const updKeepNyukoDetail = async (
  nyukoDetailData: NyukoDetailValues,
  nyukoDetailTableData: NyukoDetailTableValues[],
  userNam: string,
  connection: PoolClient
) => {
  const juchuKizaiHeadIds = [
    ...new Set(nyukoDetailTableData.map((d) => d.juchuKizaiHeadId).filter((id) => id !== null)),
  ];
  // 機材データ
  const kizaiData = nyukoDetailTableData.filter((d) => !d.ctnFlg);
  // コンテナデータ
  const ctnData = nyukoDetailTableData.filter((data) => data.ctnFlg);

  try {
    // 入庫伝票更新
    await updNyukoDen(nyukoDetailTableData, userNam, connection);

    // 出庫日があれば出庫伝票追加更新
    for (const juchuKizaiHeadId of juchuKizaiHeadIds) {
      // 出庫日確認
      const shukoDat = await selectJuchuKizaiNyushukoConfirm({
        juchu_head_id: nyukoDetailData.juchuHeadId,
        juchu_kizai_head_id: juchuKizaiHeadId,
        nyushuko_shubetu_id: 1,
        nyushuko_basho_id: nyukoDetailData.nyushukoBashoId,
      });

      if (shukoDat.data) {
        await upsShukoDen(nyukoDetailTableData, shukoDat.data.nyushuko_dat, userNam, connection);
      }
    }

    // 機材明細追加更新
    if (kizaiData && kizaiData.length > 0) {
      await upsJuchuKizaiMeisai(kizaiData, userNam, connection);
    }

    // コンテナ明細追加更新
    if (ctnData && ctnData.length > 0) {
      await upsJuchuCtnMeisai(ctnData, userNam, connection);
    }

    // 入庫確定追加
    await addNyukoFix(nyukoDetailData, nyukoDetailTableData, userNam, connection);
  } catch (e) {
    throw e;
  }
};

/**
 * 入庫作業確定フラグ取得
 * @param juchuHeadId 受注ヘッダーid
 * @param juchuKizaiHeadId 受注機材ヘッダーid
 * @param sagyoKbnId 作業区分id
 * @param sagyoDenDat 作業日時
 * @param sagyoId 作業id
 * @returns
 */
export const getNyukoFixFlag = async (
  juchuHeadId: number,
  juchuKizaiHeadId: number,
  sagyoKbnId: number,
  sagyoDenDat: string,
  sagyoId: number
) => {
  try {
    const { data, error } = await selectSagyoIdFilterNyushukoFixFlag(
      juchuHeadId,
      juchuKizaiHeadId,
      sagyoKbnId,
      sagyoDenDat,
      sagyoId
    );

    if (error) {
      if (error.code === 'PGRST116') {
        return false;
      }
      throw error;
    }

    return data.sagyo_fix_flg === 0 ? false : true;
  } catch (e) {
    console.error(e);
    throw e;
  }
};

/**
 * 受注機材明細追加更新
 * @param nyukoDetailTableData 入庫テーブルデータ
 * @param userNam ユーザー名
 * @param connection
 */
export const upsJuchuKizaiMeisai = async (
  nyukoDetailTableData: NyukoDetailTableValues[],
  userNam: string,
  connection: PoolClient
) => {
  const upsertKizaiData: JuchuKizaiMeisai[] = nyukoDetailTableData.map((d) => ({
    juchu_head_id: d.juchuHeadId,
    juchu_kizai_head_id: d.juchuKizaiHeadId,
    juchu_kizai_meisai_id: d.juchuKizaiMeisaiId,
    keep_qty: d.juchuKizaiHeadKbn === 3 ? (d.resultQty ?? 0) + (d.resultAdjQty ?? 0) : null,
    kizai_id: d.kizaiId,
    plan_kizai_qty:
      /*d.juchuKizaiHeadKbn === 1
        ? (d.resultQty ?? 0) + (d.resultAdjQty ?? 0)
        :*/ d.juchuKizaiHeadKbn === 2 ? -1 * ((d.resultQty ?? 0) + (d.resultAdjQty ?? 0)) : null,
    shozoku_id: d.nyushukoShubetuId ?? 0,
    dsp_ord_num: d.dspOrdNumMeisai,
    indent_num: d.indentNum,
    add_dat: new Date().toISOString(),
    add_user: userNam,
    upd_dat: null,
    upd_user: null,
  }));

  try {
    await upsertJuchuKizaiMeisai(upsertKizaiData, connection);

    console.log('juchu kizai meisai upsert successfully:', upsertKizaiData);
    return true;
  } catch (e) {
    throw e;
  }
};

/**
 * 受注コンテナ明細追加更新
 * @param nyukoDetailTableData 入庫テーブルデータ
 * @param userNam ユーザー名
 * @param connection
 */
export const upsJuchuCtnMeisai = async (
  nyukoDetailTableData: NyukoDetailTableValues[],
  userNam: string,
  connection: PoolClient
) => {
  const upsertCtnData: JuchuCtnMeisai[] = nyukoDetailTableData.map((d) => ({
    juchu_head_id: d.juchuHeadId,
    juchu_kizai_head_id: d.juchuKizaiHeadId,
    juchu_kizai_meisai_id: d.juchuKizaiMeisaiId,
    kizai_id: d.kizaiId,
    plan_kizai_qty: (d.resultQty ?? 0) + (d.resultAdjQty ?? 0),
    shozoku_id: d.nyushukoShubetuId ?? 0,
    dsp_ord_num: d.dspOrdNumMeisai,
    indent_num: d.indentNum,
    add_dat: new Date().toISOString(),
    add_user: userNam,
  }));
  try {
    await upsertJuchuContainerMeisai(upsertCtnData, connection);

    console.log('juchu ctn meisai upsert successfully:', upsertCtnData);
    return true;
  } catch (e) {
    throw e;
  }
};

/**
 * 入庫伝票更新
 * @param nyukoDetailTableData 入庫テーブルデータ
 * @param userNam ユーザー名
 * @param connection
 * @returns
 */
export const updNyukoDen = async (
  nyukoDetailTableData: NyukoDetailTableValues[],
  userNam: string,
  connection: PoolClient
) => {
  const upsertNyukoData: NyushukoDen[] = nyukoDetailTableData.map((d) => ({
    juchu_head_id: d.juchuHeadId,
    juchu_kizai_head_id: d.juchuKizaiHeadId,
    juchu_kizai_meisai_id: d.juchuKizaiMeisaiId,
    kizai_id: d.kizaiId,
    plan_qty: (d.resultQty ?? 0) + (d.resultAdjQty ?? 0),
    sagyo_den_dat: d.nyushukoDat,
    sagyo_id: d.nyushukoBashoId,
    sagyo_kbn_id: 30,
    dsp_ord_num: d.dspOrdNumMeisai,
    indent_num: d.indentNum,
    add_dat: new Date().toISOString(),
    add_user: userNam,
    upd_dat: null,
    upd_user: null,
  }));

  try {
    for (const data of upsertNyukoData) {
      await updateNyushukoDen(data, connection);
    }

    console.log('nyuko den update successfully:', upsertNyukoData);
    return true;
  } catch (e) {
    console.error('Exception while updating nyushuko den:', e);
    throw e;
  }
};

/**
 * 出庫伝票追加更新
 * @param nyukoDetailTableData 入庫テーブルデータ
 * @param userNam ユーザー名
 * @param connection
 * @returns
 */
export const upsShukoDen = async (
  nyukoDetailTableData: NyukoDetailTableValues[],
  shukoDat: string,
  userNam: string,
  connection: PoolClient
) => {
  const upsertShukoStandbyData: NyushukoDen[] = nyukoDetailTableData.map((d) => ({
    juchu_head_id: d.juchuHeadId,
    juchu_kizai_head_id: d.juchuKizaiHeadId,
    juchu_kizai_meisai_id: d.juchuKizaiMeisaiId,
    kizai_id: d.kizaiId,
    plan_qty: (d.resultQty ?? 0) + (d.resultAdjQty ?? 0),
    sagyo_den_dat: shukoDat,
    sagyo_id: d.nyushukoBashoId,
    sagyo_kbn_id: 10,
    dsp_ord_num: d.dspOrdNumMeisai,
    indent_num: d.indentNum,
    add_dat: new Date().toISOString(),
    add_user: userNam,
    upd_dat: null,
    upd_user: null,
  }));

  const upsertShukoCheckData: NyushukoDen[] = nyukoDetailTableData.map((d) => ({
    juchu_head_id: d.juchuHeadId,
    juchu_kizai_head_id: d.juchuKizaiHeadId,
    juchu_kizai_meisai_id: d.juchuKizaiMeisaiId,
    kizai_id: d.kizaiId,
    plan_qty: (d.resultQty ?? 0) + (d.resultAdjQty ?? 0),
    sagyo_den_dat: shukoDat,
    sagyo_id: d.nyushukoBashoId,
    sagyo_kbn_id: 20,
    dsp_ord_num: d.dspOrdNumMeisai,
    indent_num: d.indentNum,
    add_dat: new Date().toISOString(),
    add_user: userNam,
    upd_dat: null,
    upd_user: null,
  }));

  const mergeData = [...upsertShukoStandbyData, ...upsertShukoCheckData];

  try {
    await upsertNyushukoDen(mergeData, connection);

    console.log('shuko den upsert successfully:', mergeData);
    return true;
  } catch (e) {
    console.error('Exception while updating nyushuko den:', e);
    throw e;
  }
};

/**
 * 親入庫伝票更新
 * @param nyukoDetailTableData 入庫テーブルデータ
 * @param userNam ユーザー名
 * @param connection
 * @returns
 */
export const updOyaNyukoDen = async (
  nyukoDetailTableData: NyukoDetailTableValues[],
  userNam: string,
  connection: PoolClient
) => {
  const updateNyukoData: NyushukoDen[] = nyukoDetailTableData.map((d) => ({
    juchu_head_id: d.juchuHeadId,
    juchu_kizai_head_id: d.juchuKizaiHeadId,
    juchu_kizai_meisai_id: d.juchuKizaiMeisaiId,
    kizai_id: d.kizaiId,
    plan_qty: (d.resultQty ?? 0) + (d.resultAdjQty ?? 0),
    sagyo_den_dat: d.nyushukoDat,
    sagyo_id: d.nyushukoBashoId,
    sagyo_kbn_id: 30,
    dsp_ord_num: d.dspOrdNumMeisai,
    indent_num: d.indentNum,
    upd_dat: new Date().toISOString(),
    upd_user: userNam,
  }));

  try {
    for (const data of updateNyukoData) {
      await updateOyaNyukoDen(data, connection);
    }
    console.log('oya nyuko den update successfully:', updateNyukoData);
  } catch (e) {
    console.error('Exception while updating nyushuko den:', e);
    throw e;
  }
};

/**
 * 入庫確定新規追加
 * @param shukoDetailData 出庫データ
 * @param shukoDetailTableData 出庫テーブルデータ
 * @param userNam ユーザー名
 * @param connection
 */
export const addNyukoFix = async (
  nyukoDetailData: NyukoDetailValues,
  nyukoDetailTableData: NyukoDetailTableValues[],
  userNam: string,
  connection: PoolClient
) => {
  const juchuKizaiHeadIds = [
    ...new Set(nyukoDetailTableData.map((d) => d.juchuKizaiHeadId).filter((id) => id !== null)),
  ];

  const newFixData: NyushukoFix[] = juchuKizaiHeadIds.map((id) => ({
    juchu_head_id: nyukoDetailData.juchuHeadId,
    juchu_kizai_head_id: id,
    sagyo_kbn_id: 70,
    sagyo_den_dat: nyukoDetailData.nyushukoDat,
    sagyo_id: nyukoDetailData.nyushukoBashoId,
    sagyo_fix_flg: 1,
    upd_dat: new Date().toISOString(),
    upd_user: userNam,
  }));

  try {
    await insertNyushukoFix(newFixData, connection);
    console.log('nyushuko fix add successfully:', newFixData);
  } catch (e) {
    throw e;
  }
};
