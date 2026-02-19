'use server';

import { revalidatePath } from 'next/cache';
import { PoolClient } from 'pg';

import pool, { refreshVRfid } from '@/app/_lib/db/postgres';
import { selectJuchuContainerMeisaiMaxId, upsertJuchuContainerMeisai } from '@/app/_lib/db/tables/t-juchu-ctn-meisai';
import { selectChildJuchuKizaiHeadConfirm } from '@/app/_lib/db/tables/t-juchu-kizai-head';
import { selectJuchuKizaiNyushukoConfirm } from '@/app/_lib/db/tables/t-juchu-kizai-nyushuko';
import { updateNyushukoDen, upsertNyushukoDen } from '@/app/_lib/db/tables/t-nyushuko-den';
import {
  deleteShukoFix,
  insertNyushukoFix,
  selectSagyoIdFilterNyushukoFixFlag,
} from '@/app/_lib/db/tables/t-nyushuko-fix';
import { selectNyushukoOne } from '@/app/_lib/db/tables/v-nyushuko-den2-head';
import { selectNyushukoDetail } from '@/app/_lib/db/tables/v-nyushuko-den2-lst';
import { JuchuCtnMeisai } from '@/app/_lib/db/types/t_juchu_ctn_meisai-type';
import { NyushukoDen } from '@/app/_lib/db/types/t-nyushuko-den-type';
import { NyushukoFix } from '@/app/_lib/db/types/t-nyushuko-fix-type';

import { NyukoValues, ShukoDetailTableValues, ShukoDetailValues } from './types';

/**
 * 出庫明細取得
 * @param juchuHeadId 受注ヘッダーid
 * @param juchuKizaiHeadKbn 受注機材ヘッダー区分
 * @param nyushukoBashoId 入出庫場所id
 * @param nyushukoDat 入出庫日時
 * @param sagyoKbnId 作業区分id
 * @returns
 */
export const getShukoDetail = async (
  juchuHeadId: number,
  juchuKizaiHeadKbn: number,
  nyushukoBashoId: number,
  nyushukoDat: string,
  sagyoKbnId: number
) => {
  try {
    // const { data, error } = await selectNyushukoOne(juchuHeadId, juchuKizaiHeadKbn, nyushukoBashoId, nyushukoDat, 1);

    // if (error) {
    //   if (error.code === 'PGRST116') {
    //     return null;
    //   }
    //   console.error('getShukoDetail error : ', error);
    //   throw error;
    // }

    const data = await selectNyushukoOne(juchuHeadId, juchuKizaiHeadKbn, nyushukoBashoId, nyushukoDat, 1);

    const nyukoDetailData: ShukoDetailValues = {
      juchuHeadId: juchuHeadId,
      juchuKizaiHeadKbn: juchuKizaiHeadKbn,
      nyushukoBashoId: nyushukoBashoId,
      nyushukoDat: nyushukoDat,
      sagyoKbnId: sagyoKbnId,
      juchuKizaiHeadIds: data[0].juchu_kizai_head_idv?.split(',').map((id: string) => parseInt(id)) || [],
      nyushukoShubetuId: 1,
      headNamv: data[0].head_namv,
      koenNam: data[0].koen_nam,
      koenbashoNam: data[0].koenbasho_nam,
      kokyakuNam: data[0].kokyaku_nam,
    };

    return nyukoDetailData;
  } catch (e) {
    console.error(e);
    throw e;
  }
};

/**
 * 出庫明細テーブルデータ取得
 * @param juchuHeadId 受注ヘッダーid
 * @param nyushukoBashoId 入出庫場所id
 * @param nyushukoDat 入出庫日
 * @param sagyoKbnId 作業区分id
 * @returns
 */
export const getShukoDetailTable = async (
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
      console.error('getShukoDetailTable error : ', error);
      throw error;
    }

    const shukoDetailTableData: ShukoDetailTableValues[] = data.map((d) => ({
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
      mem2: d.mem2 ?? '',
    }));

    return shukoDetailTableData;
  } catch (e) {
    console.error(e);
    throw e;
  }
};

/**
 * 出庫作業確定フラグ取得
 * @param juchuHeadId 受注ヘッダーid
 * @param juchuKizaiHeadId 受注機材ヘッダーid
 * @param sagyoKbnId 作業区分id
 * @param sagyoDenDat 作業日時
 * @param sagyoId 作業id
 * @returns
 */
export const getShukoFixFlag = async (
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
    throw e;
  }
};

/**
 * 出発
 * @param shukoDetailData 出庫データ
 * @param sagyoFixFlg 作業確定フラグ
 * @param userNam ユーザー名
 * @returns
 */
export const updShukoDetail = async (
  shukoDetailData: ShukoDetailValues,
  shukoDetailTableData: ShukoDetailTableValues[],
  userNam: string
) => {
  if (shukoDetailTableData.length === 0) {
    console.error('No data to update');
    return;
  }

  const connection = await pool.connect();

  // コンテナデータ
  const ctnData = shukoDetailTableData.filter((data) => data.ctnFlg);

  try {
    await connection.query('BEGIN');

    // キープ以外は明細、伝票を更新
    if (shukoDetailTableData[0].juchuKizaiHeadKbn !== 3 && ctnData && ctnData.length > 0) {
      // コンテナ明細追加更新
      const upsertJuchuMeisaiResult = await upsJuchuCtnMeisai(ctnData, userNam, connection);
      console.log('コンテナ明細UPSERT', upsertJuchuMeisaiResult);

      // 入出庫伝票追加更新
      const juchuKizaiHeadIds = [
        ...new Set(shukoDetailTableData.map((d) => d.juchuKizaiHeadId).filter((id) => id !== null)),
      ];
      const nyukoDatas: NyukoValues[] = [];
      for (const juchuKizaiHeadId of juchuKizaiHeadIds) {
        // 入庫日取得
        const { data: nyukoDat, error: nyukoDataError } = await selectJuchuKizaiNyushukoConfirm({
          juchu_head_id: shukoDetailData.juchuHeadId,
          juchu_kizai_head_id: juchuKizaiHeadId,
          nyushuko_shubetu_id: 2,
          nyushuko_basho_id: shukoDetailData.nyushukoBashoId,
        });
        if (nyukoDataError) {
          throw nyukoDataError;
        }
        const nyukoData: NyukoValues = {
          juchuKizaiHeadId: juchuKizaiHeadId,
          nyushukoDat: nyukoDat.nyushuko_dat,
        };
        nyukoDatas.push(nyukoData);
      }
      const upsertShukoDenResult = await upsNyushukoDen(ctnData, nyukoDatas, userNam, connection);
      console.log('入出庫伝票追加更新', upsertShukoDenResult);
    }

    // 入出庫確定追加
    const addNyushukoFixResult = await addShukoFix(shukoDetailData, shukoDetailTableData, userNam, connection);
    console.log('入出庫確定追加', addNyushukoFixResult);

    await connection.query('COMMIT');

    await revalidatePath('/shuko-list');
    await revalidatePath('/nyuko-list');

    return true;
  } catch (e) {
    console.error(e);
    await connection.query('ROLLBACK');
    return false;
  } finally {
    refreshVRfid().catch((err) => {
      console.error('バックグラウンドでのマテビュー更新に失敗:', err);
    });
    connection.release();
  }
};

/**
 * 受注コンテナ明細追加更新
 * @param shukoDetailTableData 出庫テーブルデータ
 * @param userNam ユーザー名
 * @param connection
 */
export const upsJuchuCtnMeisai = async (
  shukoDetailTableData: ShukoDetailTableValues[],
  userNam: string,
  connection: PoolClient
) => {
  const upsertCtnData: JuchuCtnMeisai[] = shukoDetailTableData.map((d) => ({
    juchu_head_id: d.juchuHeadId,
    juchu_kizai_head_id: d.juchuKizaiHeadId,
    juchu_kizai_meisai_id: d.juchuKizaiMeisaiId,
    kizai_id: d.kizaiId,
    plan_kizai_qty: (d.resultQty ?? 0) + (d.resultAdjQty ?? 0),
    shozoku_id: d.nyushukoBashoId,
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
 * 入出庫伝票追加更新
 * @param shukoDetailTableData 出庫テーブルデータ
 * @param userNam ユーザー名
 * @param connection
 * @returns
 */
export const upsNyushukoDen = async (
  shukoDetailTableData: ShukoDetailTableValues[],
  nyukoDatas: NyukoValues[],
  userNam: string,
  connection: PoolClient
) => {
  const upsCtnShukoCheckData: NyushukoDen[] = shukoDetailTableData.map((d) => ({
    juchu_head_id: d.juchuHeadId,
    juchu_kizai_head_id: d.juchuKizaiHeadId,
    juchu_kizai_meisai_id: d.juchuKizaiMeisaiId,
    kizai_id: d.kizaiId,
    plan_qty: (d.resultQty ?? 0) + (d.resultAdjQty ?? 0),
    sagyo_den_dat: d.nyushukoDat,
    sagyo_id: d.nyushukoBashoId,
    sagyo_kbn_id: 20,
    dsp_ord_num: d.dspOrdNumMeisai,
    indent_num: d.indentNum,
    add_dat: new Date().toISOString(),
    add_user: userNam,
    upd_dat: null,
    upd_user: null,
  }));

  const upsCtnNyukoCheckData: NyushukoDen[] = shukoDetailTableData.map((d) => ({
    juchu_head_id: d.juchuHeadId,
    juchu_kizai_head_id: d.juchuKizaiHeadId,
    juchu_kizai_meisai_id: d.juchuKizaiMeisaiId,
    kizai_id: d.kizaiId,
    plan_qty: (d.resultQty ?? 0) + (d.resultAdjQty ?? 0),
    sagyo_den_dat: nyukoDatas.find((data) => data.juchuKizaiHeadId === d.juchuKizaiHeadId)!.nyushukoDat,
    sagyo_id: d.nyushukoBashoId,
    sagyo_kbn_id: 30,
    dsp_ord_num: d.dspOrdNumMeisai,
    indent_num: d.indentNum,
    add_dat: new Date().toISOString(),
    add_user: userNam,
    upd_dat: null,
    upd_user: null,
  }));

  const mergeData = [...upsCtnShukoCheckData, ...upsCtnNyukoCheckData];

  try {
    await upsertNyushukoDen(mergeData, connection);

    console.log('nyushuko den upsert successfully:', mergeData);
    return true;
  } catch (e) {
    console.error('Exception while updating nyushuko den:', e);
    throw e;
  }
};

/**
 * 出庫確定新規追加
 * @param shukoDetailData 出庫データ
 * @param shukoDetailTableData 出庫テーブルデータ
 * @param userNam ユーザー名
 * @param connection
 */
export const addShukoFix = async (
  shukoDetailData: ShukoDetailValues,
  shukoDetailTableData: ShukoDetailTableValues[],
  userNam: string,
  connection: PoolClient
) => {
  const juchuKizaiHeadIds = [
    ...new Set(shukoDetailTableData.map((d) => d.juchuKizaiHeadId).filter((id) => id !== null)),
  ];

  const newFixData: NyushukoFix[] = juchuKizaiHeadIds.map((id) => ({
    juchu_head_id: shukoDetailData.juchuHeadId,
    juchu_kizai_head_id: id,
    sagyo_kbn_id: 60,
    sagyo_den_dat: shukoDetailData.nyushukoDat,
    sagyo_id: shukoDetailData.nyushukoBashoId,
    sagyo_fix_flg: 1,
    upd_dat: new Date().toISOString(),
    upd_user: userNam,
  }));

  try {
    await insertNyushukoFix(newFixData, connection);
    console.log('nyushuko fix add successfully:', newFixData);
    return true;
  } catch (e) {
    throw e;
  }
};

/**
 * 出発解除
 * @param shukoDetailData 出庫データ
 * @param shukoDetailTableData 出庫テーブルデータ
 * @param userNam ユーザー名
 * @param connection
 */
export const delShukoFix = async (
  shukoDetailData: ShukoDetailValues,
  shukoDetailTableData: ShukoDetailTableValues[]
) => {
  const connection = await pool.connect();

  if (shukoDetailTableData.length === 0) {
    console.error('No data to update');
    return;
  }

  const juchuKizaiHeadIds = [
    ...new Set(shukoDetailTableData.map((d) => d.juchuKizaiHeadId).filter((id) => id !== null)),
  ];

  const deleteFixData = juchuKizaiHeadIds.map((d) => ({
    juchu_head_id: shukoDetailData.juchuHeadId,
    juchu_kizai_head_id: d,
    sagyo_kbn_id: 60,
    sagyo_id: shukoDetailData.nyushukoBashoId,
  }));

  try {
    await connection.query('BEGIN');

    for (const data of deleteFixData) {
      await deleteShukoFix(data, connection);
    }
    console.log('nyushuko fix delete successfully:', deleteFixData);

    await connection.query('COMMIT');

    await revalidatePath('/shuko-list');

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
 * 子受注機材ヘッダー確認
 * @param juchuHeadId 受注ヘッダーid
 * @returns
 */
export const confirmChildJuchuKizaiHead = async (juchuHeadId: number, juchuKizaiHeadIdv: number[]) => {
  try {
    const { count, error } = await selectChildJuchuKizaiHeadConfirm(juchuHeadId, juchuKizaiHeadIdv);

    if (error) {
      console.error('confirmChildJuchuKizaiHead error : ', error);
      throw error;
    }

    return count;
  } catch (e) {
    throw e;
  }
};

export const updShukoAdjust = async (adjustData: ShukoDetailTableValues[], userNam: string) => {
  const updateData: NyushukoDen[] = adjustData.map((d) => ({
    juchu_head_id: d.juchuHeadId,
    juchu_kizai_head_id: d.juchuKizaiHeadId,
    juchu_kizai_meisai_id: d.juchuKizaiMeisaiId,
    kizai_id: d.kizaiId,
    plan_qty: d.planQty,
    result_adj_qty: (d.planQty ?? 0) - (d.resultQty ?? 0),
    sagyo_den_dat: d.nyushukoDat,
    sagyo_id: d.nyushukoBashoId,
    sagyo_kbn_id: d.sagyoKbnId ?? 0,
    dsp_ord_num: d.dspOrdNumMeisai,
    indent_num: d.indentNum,
    upd_dat: new Date().toISOString(),
    upd_user: userNam,
  }));
  const connection = await pool.connect();
  try {
    for (const data of updateData) {
      await updateNyushukoDen(data, connection);
    }

    console.log('nyushuko den adjust update successfully:', updateData);

    await connection.query('COMMIT');
  } catch (e) {
    console.error('Exception while updating nyushuko den adjust:', e);
    await connection.query('ROLLBACK');
    throw e;
  } finally {
    refreshVRfid().catch((err) => {
      console.error('バックグラウンドでのマテビュー更新に失敗:', err);
    });
    connection.release();
  }
};
