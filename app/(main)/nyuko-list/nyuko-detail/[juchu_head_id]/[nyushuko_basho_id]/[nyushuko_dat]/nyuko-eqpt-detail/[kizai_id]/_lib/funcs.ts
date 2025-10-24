'use server';

import { revalidatePath } from 'next/cache';

import pool from '@/app/_lib/db/postgres';
import { selectOneEqpt } from '@/app/_lib/db/tables/m-kizai';
import { deleteNyushukoCtnResult } from '@/app/_lib/db/tables/t-nyushuko-ctn-result';
import { selectKizaiDetail, updateNyushukoDen, updateResultAdjQty } from '@/app/_lib/db/tables/t-nyushuko-den';
import { deleteNyushukoResult } from '@/app/_lib/db/tables/t-nyushuko-result';
import { selectNyushukoEqptDetail } from '@/app/_lib/db/tables/v-nyushuko-den2-result';
import { NyushukoDen } from '@/app/_lib/db/types/t-nyushuko-den-type';
import { toJapanTimeString } from '@/app/(main)/_lib/date-conversion';

import { NyukoKizaiDetailValues } from './types';
import { NyukoEqptDetailTableValues, NyukoEqptValues } from './types';

/**
 * 入庫機材詳細取得
 * @param juchuHeadId 受注ヘッダーid
 * @param nyushukoBashoId 入出庫場所id
 * @param sagyoDenDat 作業日時
 * @param kizaiId 機材id
 * @returns
 */
export const getNyukoKizaiDetail = async (
  juchuHeadId: number,
  nyushukoBashoId: number,
  sagyoDenDat: string,
  kizaiId: number
) => {
  try {
    const { data, error } = await selectKizaiDetail(juchuHeadId, nyushukoBashoId, sagyoDenDat, 30, kizaiId);

    if (error) {
      console.error('getNyukoKizaiDetail error : ', error);
      throw error;
    }

    const nyukoKizaiDetail: NyukoKizaiDetailValues[] = data.map((d) => ({
      juchuKizaiHeadId: d.juchu_kizai_head_id,
      planQty: d.plan_qty,
      resultQty: d.result_qty,
      resultAdjQty: d.result_adj_qty,
    }));

    return nyukoKizaiDetail;
  } catch (e) {
    console.error(e);
  }
};

/**
 * 入庫読取実績データ取得
 * @param juchuHeadId 受注ヘッダーid
 * @param nyushukoBashoId 入出庫場所id
 * @param nyushukoDat 入出庫日
 * @param kizaiId 機材id
 * @returns
 */
export const getNyukoEqptDetail = async (
  juchuHeadId: number,
  nyushukoBashoId: number,
  nyushukoDat: string,
  kizaiId: number
) => {
  try {
    const { data, error } = await selectNyushukoEqptDetail(juchuHeadId, nyushukoBashoId, nyushukoDat, 30, kizaiId);

    if (error) {
      console.error('getShukoEqptDetail error : ', error);
      throw error;
    }

    const nyukoEqptDetailData: NyukoEqptDetailTableValues[] = data.map((d) => ({
      bldCod: d.bld_cod,
      ctnFlg: d.ctn_flg,
      edaCod: d.eda_cod,
      juchuHeadId: d.juchu_head_id,
      juchuKizaiHeadId: d.juchu_kizai_head_id,
      juchuKizaiMeisaiId: d.juchu_kizai_meisai_id,
      kizaiId: d.kizai_id,
      kizaiMem: d.kizai_mem,
      kizaiNam: d.kizai_nam,
      nyushukoBashoId: d.nyushuko_basho_id,
      nyushukoDat: d.nyushuko_dat,
      nyushukoShubetuId: d.nyushuko_shubetu_id,
      planQty: d.plan_qty,
      resultAdjQty: d.result_adj_qty,
      resultQty: d.result_qty,
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
      sagyoKbnId: d.sagyo_kbn_id,
      sagyoKbnNam: d.sagyo_kbn_nam,
      tanaCod: d.tana_cod,
    }));

    return nyukoEqptDetailData;
  } catch (e) {
    console.error(e);
    throw e;
  }
};

/**
 * 入庫機材データ取得
 * @param kizaiId 機材id
 * @returns 機材データ
 */
export const getKizaiData = async (kizaiId: number) => {
  try {
    const { data, error } = await selectOneEqpt(kizaiId);

    if (error) {
      console.error('getKizaiData error : ', error);
      throw error;
    }

    const kizaiData: NyukoEqptValues = {
      kizaiId: data.kizai_id,
      kizaiNam: data.kizai_nam,
      bldCod: data.bld_cod,
      tanaCod: data.tana_cod,
      edaCod: data.eda_cod,
      mem: data.mem,
      ctnFlg: data.ctn_flg,
    };

    return kizaiData;
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
export const delNyukoResult = async (deleteData: NyukoEqptDetailTableValues[], userNam: string) => {
  const connection = await pool.connect();

  const deleteTagIds = deleteData.map((d) => d.rfidTagId).filter((id): id is string => id !== null);
  try {
    await connection.query('BEGIN');

    if (deleteData[0].ctnFlg === 1) {
      await deleteNyushukoCtnResult(
        deleteData[0].juchuHeadId,
        deleteData[0].sagyoKbnId,
        deleteData[0].nyushukoDat,
        deleteData[0].nyushukoBashoId,
        deleteData[0].kizaiId,
        deleteTagIds,
        connection
      );
    } else {
      await deleteNyushukoResult(
        deleteData[0].juchuHeadId,
        deleteData[0].sagyoKbnId,
        deleteData[0].nyushukoDat,
        deleteData[0].nyushukoBashoId,
        deleteData[0].kizaiId,
        deleteTagIds,
        connection
      );
    }
    console.log('delete nyushuko result', deleteData);

    const updateNyushukoDenData: NyushukoDen = {
      juchu_head_id: deleteData[0].juchuHeadId,
      juchu_kizai_head_id: deleteData[0].juchuKizaiHeadId,
      sagyo_kbn_id: deleteData[0].sagyoKbnId,
      sagyo_den_dat: deleteData[0].nyushukoDat,
      sagyo_id: deleteData[0].nyushukoBashoId,
      kizai_id: deleteData[0].kizaiId,
      result_qty: deleteData[0].resultQty && deleteData[0].resultQty - deleteData.length,
      upd_dat: toJapanTimeString(),
      upd_user: userNam,
    };

    await updateNyushukoDen(updateNyushukoDenData, connection);
    console.log(
      'update nyushuko den result_qty',
      deleteData[0].resultQty && deleteData[0].resultQty - deleteData.length
    );

    await await connection.query('COMMIT');
    revalidatePath(
      `nyuko-list/nyuko-detail/${deleteData[0].juchuHeadId!}/${deleteData[0].nyushukoBashoId!}/${deleteData[0].nyushukoDat!}`
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
  kizaiDetailData: NyukoKizaiDetailValues[],
  juchuHeadId: number,
  sagyoKbnId: number,
  sagyoDenDat: string,
  sagyoId: number,
  kizaiId: number,
  resultAdjQty: number,
  userNam: string
) => {
  const connection = await pool.connect();

  const adjQty: number[] = [];

  if (kizaiDetailData.length === 1) {
    adjQty.push(resultAdjQty);
  } else {
    let remainingAdjQty = resultAdjQty;
    for (let i = 0; i < kizaiDetailData.length - 1; i++) {
      const possibleAdjQty = (kizaiDetailData[i].planQty ?? 0) - (kizaiDetailData[i].resultQty ?? 0);
      const assignAdjQty =
        possibleAdjQty > 0 && possibleAdjQty <= remainingAdjQty
          ? possibleAdjQty
          : possibleAdjQty > 0 && possibleAdjQty >= remainingAdjQty
            ? remainingAdjQty
            : 0;
      adjQty.push(assignAdjQty);
      remainingAdjQty = remainingAdjQty - assignAdjQty >= 0 ? remainingAdjQty - assignAdjQty : 0;
    }
    adjQty.push(remainingAdjQty);
  }
  const updateData: NyushukoDen[] = kizaiDetailData.map((d, i) => ({
    juchu_head_id: juchuHeadId,
    juchu_kizai_head_id: d.juchuKizaiHeadId,
    sagyo_kbn_id: sagyoKbnId,
    sagyo_den_dat: sagyoDenDat,
    sagyo_id: sagyoId,
    kizai_id: kizaiId,
    result_adj_qty: adjQty[i],
    upd_dat: toJapanTimeString(),
    upd_user: userNam,
  }));
  try {
    await connection.query('BEGIN');
    for (const data of updateData) {
      await updateResultAdjQty(data, connection);
    }
    await connection.query('COMMIT');

    revalidatePath(`nyuko-list/nyuko-detail/${juchuHeadId}/${sagyoId}/${sagyoDenDat}`);
    return true;
  } catch (e) {
    console.error(e);
    await connection.query('ROLLBACK');
    return false;
  } finally {
    connection.release();
  }
};
