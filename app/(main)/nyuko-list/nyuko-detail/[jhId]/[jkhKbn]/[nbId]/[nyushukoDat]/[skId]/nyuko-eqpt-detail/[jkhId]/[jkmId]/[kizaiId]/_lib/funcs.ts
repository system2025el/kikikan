'use server';

import { revalidatePath } from 'next/cache';

import pool from '@/app/_lib/db/postgres';
import { selectOneEqpt } from '@/app/_lib/db/tables/m-kizai';
import { deleteNyushukoCtnResult } from '@/app/_lib/db/tables/t-nyushuko-ctn-result';
import { updateNyushukoDen, updateResultAdjQty } from '@/app/_lib/db/tables/t-nyushuko-den';
import { selectSagyoIdFilterNyushukoFixFlag } from '@/app/_lib/db/tables/t-nyushuko-fix';
import { deleteNyushukoResult } from '@/app/_lib/db/tables/t-nyushuko-result';
import { selectNyushukoDetailOne } from '@/app/_lib/db/tables/v-nyushuko-den2-lst';
import { selectNyushukoEqptDetail } from '@/app/_lib/db/tables/v-nyushuko-den2-result';
import { NyushukoDen } from '@/app/_lib/db/types/t-nyushuko-den-type';

import { NyukoEqptDetailValues } from './types';
import { NyukoEqptDetailTableValues } from './types';

/**
 * 入庫機材詳細取得
 * @param juchuHeadId 受注ヘッダーid
 * @param nyushukoBashoId 入出庫場所id
 * @param nyushukoDat 入出庫日
 * @param kizaiId 機材id
 * @returns
 */
export const getNyukoEqptDetail = async (
  juchuHeadId: number,
  juchuKizaiHeadId: number,
  juchuKizaiMeisaiId: number,
  juchuKizaiHeadKbnId: number,
  nyushukoBashoId: number,
  nyushukoDat: string,
  sagyoKbnId: number,
  kizaiId: number
) => {
  try {
    const { data, error } = await selectNyushukoDetailOne(
      juchuHeadId,
      juchuKizaiHeadId,
      juchuKizaiMeisaiId,
      nyushukoBashoId,
      nyushukoDat,
      sagyoKbnId,
      kizaiId
    );

    if (error) {
      if (error.code === 'PGRST116') {
        return null;
      }
      console.error('getNyukoEqptDetail error : ', error);
      throw error;
    }

    const nyukoEqptDetailData: NyukoEqptDetailValues = {
      juchuHeadId: juchuHeadId,
      juchuKizaiHeadId: juchuKizaiHeadId,
      juchuKizaiMeisaiId: juchuKizaiMeisaiId,
      juchuKizaiHeadKbnId: juchuKizaiHeadKbnId,
      nyushukoBashoId: nyushukoBashoId,
      nyushukoDat: nyushukoDat,
      sagyoKbnId: sagyoKbnId,
      planQty: data.plan_qty ?? 0,
      resultQty: data.result_qty ?? 0,
      resultAdjQty: data.result_adj_qty ?? 0,
      kizaiId: kizaiId,
      kizaiNam: data.kizai_nam,
      bldCod: data.bld_cod,
      tanaCod: data.tana_cod,
      edaCod: data.eda_cod,
      kizaiMem: data.kizai_mem,
      ctnFlg: data.ctn_flg === 1 ? true : false,
      indentNum: data.indent_num ?? 0,
    };

    return nyukoEqptDetailData;
  } catch (e) {
    console.error(e);
    throw e;
  }
};

/**
 * 入庫読取実績データ取得
 * @param juchuHeadId 受注ヘッダーid
 * @param nyushukoBashoId 入出庫場所id
 * @param nyushukoDat 入出庫日
 * @param sagyoKbnId 作業区分id
 * @param kizaiId 機材id
 * @returns
 */
export const getNyukoEqptDetailTable = async (
  juchuHeadId: number,
  juchuKizaiHeadId: number,
  juchuKizaiMeisaiId: number,
  nyushukoBashoId: number,
  nyushukoDat: string,
  sagyoKbnId: number,
  kizaiId: number
) => {
  try {
    const { data, error } = await selectNyushukoEqptDetail(
      juchuHeadId,
      juchuKizaiHeadId,
      juchuKizaiMeisaiId,
      nyushukoBashoId,
      nyushukoDat,
      sagyoKbnId,
      kizaiId
    );

    if (error) {
      console.error('getNyukoEqptDetailTable error : ', error);
      throw error;
    }

    const nyukoEqptDetailTableData: NyukoEqptDetailTableValues[] = data.map((d) => ({
      nyushukoBashoId: d.nyushuko_basho_id ?? 0,
      rfidDat: d.rfid_dat,
      rfidDelFlg: d.rfid_del_flg,
      rfidElNum: d.rfid_el_num,
      rfidKizaiSts: d.rfid_kizai_sts,
      rfidMem: d.rfid_mem,
      rfidShozokuId: d.rfid_shozoku_id,
      rfidShozokuNam: d.rfid_shozoku_nam,
      rfidStsNam: d.rfid_sts_nam,
      rfidTagId: d.rfid_tag_id,
      rfidUser: d.rfid_user,
    }));

    return nyukoEqptDetailTableData;
  } catch (e) {
    console.error(e);
    throw e;
  }
};

/**
 * 出庫読取実績データ削除
 * @param deleteData 実績クリアデータ
 * @param userNam ユーザー名
 * @returns
 */
export const delNyukoResult = async (
  nyukoEqptDetailData: NyukoEqptDetailValues,
  deleteData: NyukoEqptDetailTableValues[],
  userNam: string
) => {
  const connection = await pool.connect();

  const deleteTagIds = deleteData.map((d) => d.rfidTagId).filter((id): id is string => id !== null);
  try {
    await connection.query('BEGIN');

    if (nyukoEqptDetailData.ctnFlg) {
      await deleteNyushukoCtnResult(
        nyukoEqptDetailData.juchuHeadId,
        nyukoEqptDetailData.juchuKizaiHeadId,
        nyukoEqptDetailData.juchuKizaiMeisaiId,
        nyukoEqptDetailData.sagyoKbnId,
        nyukoEqptDetailData.nyushukoDat,
        nyukoEqptDetailData.nyushukoBashoId,
        nyukoEqptDetailData.kizaiId,
        deleteTagIds,
        connection
      );
    } else {
      await deleteNyushukoResult(
        nyukoEqptDetailData.juchuHeadId,
        nyukoEqptDetailData.juchuKizaiHeadId,
        nyukoEqptDetailData.juchuKizaiMeisaiId,
        nyukoEqptDetailData.sagyoKbnId,
        nyukoEqptDetailData.nyushukoDat,
        nyukoEqptDetailData.nyushukoBashoId,
        nyukoEqptDetailData.kizaiId,
        deleteTagIds,
        connection
      );
    }
    console.log('delete nyushuko result', deleteData);

    const updateNyushukoDenData: NyushukoDen = {
      juchu_head_id: nyukoEqptDetailData.juchuHeadId,
      juchu_kizai_head_id: nyukoEqptDetailData.juchuKizaiHeadId,
      juchu_kizai_meisai_id: nyukoEqptDetailData.juchuKizaiMeisaiId,
      sagyo_kbn_id: nyukoEqptDetailData.sagyoKbnId,
      sagyo_den_dat: nyukoEqptDetailData.nyushukoDat,
      sagyo_id: nyukoEqptDetailData.nyushukoBashoId,
      kizai_id: nyukoEqptDetailData.kizaiId,
      result_qty: nyukoEqptDetailData.resultQty - deleteData.length,
      upd_dat: new Date().toISOString(),
      upd_user: userNam,
    };

    await updateNyushukoDen(updateNyushukoDenData, connection);
    console.log('update nyushuko den result_qty', nyukoEqptDetailData.resultQty - deleteData.length);

    await await connection.query('COMMIT');
    revalidatePath(
      `nyuko-list/nyuko-detail/${nyukoEqptDetailData.juchuHeadId}/${nyukoEqptDetailData.nyushukoBashoId}/${nyukoEqptDetailData.nyushukoDat}/${nyukoEqptDetailData.sagyoKbnId}`
    );
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
 * 出庫伝票補正数更新
 * @param data 補正数更新データ
 * @param userNam ユーザー名
 * @returns
 */
export const updNyukoResultAdjQty = async (
  nyukoEqptDetailData: NyukoEqptDetailValues,
  resultAdjQty: number,
  userNam: string
) => {
  const updateData: NyushukoDen = {
    juchu_head_id: nyukoEqptDetailData.juchuHeadId,
    juchu_kizai_head_id: nyukoEqptDetailData.juchuKizaiHeadId,
    juchu_kizai_meisai_id: nyukoEqptDetailData.juchuKizaiMeisaiId,
    sagyo_kbn_id: nyukoEqptDetailData.sagyoKbnId,
    sagyo_den_dat: nyukoEqptDetailData.nyushukoDat,
    sagyo_id: nyukoEqptDetailData.nyushukoBashoId,
    kizai_id: nyukoEqptDetailData.kizaiId,
    result_adj_qty: resultAdjQty,
    upd_dat: new Date().toISOString(),
    upd_user: userNam,
  };
  try {
    await updateResultAdjQty(updateData);

    revalidatePath(
      `nyuko-list/nyuko-detail/${nyukoEqptDetailData.juchuHeadId}/${nyukoEqptDetailData.nyushukoBashoId}/${nyukoEqptDetailData.nyushukoDat}/${nyukoEqptDetailData.sagyoKbnId}`
    );
    return true;
  } catch (e) {
    console.error(e);
    return false;
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
