'use server';

import { revalidatePath } from 'next/cache';
import { QueryResult } from 'pg';

import pool from '@/app/_lib/db/postgres';
import { deleteNyushukoCtnResult } from '@/app/_lib/db/tables/t-nyushuko-ctn-result';
import { updateNyushukoDen, updateResultAdjQty } from '@/app/_lib/db/tables/t-nyushuko-den';
import { selectSagyoIdFilterNyushukoFixFlag } from '@/app/_lib/db/tables/t-nyushuko-fix';
import { deleteNyushukoResult } from '@/app/_lib/db/tables/t-nyushuko-result';
import { selectNyushukoDetailOne } from '@/app/_lib/db/tables/v-nyushuko-den2-lst';
import { selectNyushukoEqptDetail } from '@/app/_lib/db/tables/v-nyushuko-den2-result';
import { NyushukoDen } from '@/app/_lib/db/types/t-nyushuko-den-type';

import { ShukoEqptDetailTableValues, ShukoEqptDetailValues } from './types';

/**
 * 出庫機材詳細取得
 * @param juchuHeadId 受注ヘッダーid
 * @param nyushukoBashoId 入出庫場所id
 * @param sagyoDenDat 作業日時
 * @param sagyoKbnId 作業区分id
 * @param kizaiId 機材id
 * @returns
 */
export const getShukoEqptDetail = async (
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
      console.error('getShukoEqptDetail error : ', error);
      throw error;
    }

    const shukoEqptDetaildata: ShukoEqptDetailValues = {
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

    return shukoEqptDetaildata;
  } catch (e) {
    console.error(e);
    return null;
  }
};

/**
 * 出庫読取実績データ取得
 * @param juchuHeadId 受注ヘッダーid
 * @param nyushukoBashoId 入出庫場所id
 * @param nyushukoDat 入出庫日
 * @param sagyoKbnId 作業区分id
 * @param kizaiId 機材id
 * @returns
 */
export const getShukoEqptDetailTable = async (
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
      console.error('getShukoEqptDetailTable error : ', error);
      throw error;
    }

    const shukoEqptDetailTableData: ShukoEqptDetailTableValues[] = data.map((d) => ({
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

    return shukoEqptDetailTableData;
  } catch (e) {
    console.error(e);
    return [];
  }
};

/**
 * 出庫読取実績データ削除
 * @param deleteData 実績クリアデータ
 * @param userNam ユーザー名
 * @returns
 */
export const delshukoResult = async (
  shukoEqptDetailData: ShukoEqptDetailValues,
  deleteData: ShukoEqptDetailTableValues[],
  userNam: string
) => {
  const connection = await pool.connect();

  const deleteTagIds = deleteData.map((d) => d.rfidTagId).filter((id): id is string => id !== null);
  try {
    await connection.query('BEGIN');

    if (shukoEqptDetailData.ctnFlg) {
      await deleteNyushukoCtnResult(
        shukoEqptDetailData.juchuHeadId,
        shukoEqptDetailData.juchuKizaiHeadId,
        shukoEqptDetailData.juchuKizaiMeisaiId,
        shukoEqptDetailData.sagyoKbnId,
        shukoEqptDetailData.nyushukoDat,
        shukoEqptDetailData.nyushukoBashoId,
        shukoEqptDetailData.kizaiId,
        deleteTagIds,
        connection
      );
    } else {
      await deleteNyushukoResult(
        shukoEqptDetailData.juchuHeadId,
        shukoEqptDetailData.juchuKizaiHeadId,
        shukoEqptDetailData.juchuKizaiMeisaiId,
        shukoEqptDetailData.sagyoKbnId,
        shukoEqptDetailData.nyushukoDat,
        shukoEqptDetailData.nyushukoBashoId,
        shukoEqptDetailData.kizaiId,
        deleteTagIds,
        connection
      );
    }
    console.log('delete nyushuko result', deleteData);

    const updateNyushukoDenData: NyushukoDen = {
      juchu_head_id: shukoEqptDetailData.juchuHeadId,
      juchu_kizai_head_id: shukoEqptDetailData.juchuKizaiHeadId,
      juchu_kizai_meisai_id: shukoEqptDetailData.juchuKizaiMeisaiId,
      sagyo_kbn_id: shukoEqptDetailData.sagyoKbnId,
      sagyo_den_dat: shukoEqptDetailData.nyushukoDat,
      sagyo_id: shukoEqptDetailData.nyushukoBashoId,
      kizai_id: shukoEqptDetailData.kizaiId,
      result_qty: shukoEqptDetailData.resultQty - deleteData.length,
      upd_dat: new Date().toISOString(),
      upd_user: userNam,
    };

    await updateNyushukoDen(updateNyushukoDenData, connection);
    console.log('update nyushuko den result_qty', shukoEqptDetailData.resultQty - deleteData.length);

    await await connection.query('COMMIT');
    revalidatePath(
      `shuko-list/shuko-detail/${shukoEqptDetailData.juchuHeadId}/${shukoEqptDetailData.nyushukoBashoId}/${shukoEqptDetailData.nyushukoDat}/${shukoEqptDetailData.sagyoKbnId}`
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
export const updShukoResultAdjQty = async (
  shukoEqptDetailData: ShukoEqptDetailValues,
  resultAdjQty: number,
  userNam: string
) => {
  const updateData: NyushukoDen = {
    juchu_head_id: shukoEqptDetailData.juchuHeadId,
    juchu_kizai_head_id: shukoEqptDetailData.juchuKizaiHeadId,
    juchu_kizai_meisai_id: shukoEqptDetailData.juchuKizaiMeisaiId,
    sagyo_kbn_id: shukoEqptDetailData.sagyoKbnId,
    sagyo_den_dat: shukoEqptDetailData.nyushukoDat,
    sagyo_id: shukoEqptDetailData.nyushukoBashoId,
    kizai_id: shukoEqptDetailData.kizaiId,
    result_adj_qty: resultAdjQty,
    upd_dat: new Date().toISOString(),
    upd_user: userNam,
  };
  try {
    await updateResultAdjQty(updateData);

    revalidatePath(
      `shuko-list/shuko-detail/${shukoEqptDetailData.juchuHeadId}/${shukoEqptDetailData.nyushukoBashoId}/${shukoEqptDetailData.nyushukoDat}/${shukoEqptDetailData.sagyoKbnId}`
    );
    return true;
  } catch (e) {
    console.error(e);
    return false;
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
