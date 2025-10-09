'use server';

import { revalidatePath } from 'next/cache';

import pool from '@/app/_lib/db/postgres';
import { selectOneEqpt } from '@/app/_lib/db/tables/m-kizai';
import { deleteNyushukoCtnResult } from '@/app/_lib/db/tables/t-nyushuko-ctn-result';
import { updateResultAdjQty } from '@/app/_lib/db/tables/t-nyushuko-den';
import { deleteNyushukoResult } from '@/app/_lib/db/tables/t-nyushuko-result';
import { selectShukoEqptDetail } from '@/app/_lib/db/tables/v-nyushuko-den2-result';
import { NyushukoDen } from '@/app/_lib/db/types/t-nyushuko-den-type';
import { toJapanTimeString } from '@/app/(main)/_lib/date-conversion';

import { ShukoEqptDetailTableValues, ShukoEqptValues } from './types';

export const getShukoEqptDetail = async (
  juchuHeadId: number,
  nyushukoBashoId: number,
  nyushukoDat: string,
  sagyoKbnId: number,
  kizaiId: number
) => {
  try {
    const { data, error } = await selectShukoEqptDetail(juchuHeadId, nyushukoBashoId, nyushukoDat, sagyoKbnId, kizaiId);

    if (error) {
      console.error('getShukoEqptDetail error : ', error);
      return [];
    }

    const shukoEqptDetailData: ShukoEqptDetailTableValues[] = data.map((d) => ({
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

    return shukoEqptDetailData;
  } catch (e) {
    console.error(e);
    return [];
  }
};

/**
 * 機材データ取得
 * @param kizaiId 機材id
 * @returns 機材データ
 */
export const getKizaiData = async (kizaiId: number) => {
  try {
    const { data, error } = await selectOneEqpt(kizaiId);

    if (error) {
      console.error('getKizaiData error : ', error);
      return null;
    }

    const kizaiData: ShukoEqptValues = {
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
    return null;
  }
};

export const delNyushukoResult = async (deleteData: ShukoEqptDetailTableValues[]) => {
  const connection = await pool.connect();

  const deleteTagIds = deleteData.map((d) => d.rfidTagId).filter((id): id is string => id !== null);
  try {
    await connection.query('BEGIN');

    if (deleteData[0].ctnFlg === 1) {
      await deleteNyushukoCtnResult(
        deleteData[0].juchuHeadId!,
        deleteData[0].sagyoKbnId!,
        deleteData[0].nyushukoDat!,
        deleteData[0].nyushukoBashoId!,
        deleteData[0].kizaiId!,
        deleteTagIds,
        connection
      );
    } else {
      await deleteNyushukoResult(
        deleteData[0].juchuHeadId!,
        deleteData[0].sagyoKbnId!,
        deleteData[0].nyushukoDat!,
        deleteData[0].nyushukoBashoId!,
        deleteData[0].kizaiId!,
        deleteTagIds,
        connection
      );
    }
    await connection.query('COMMIT');
    revalidatePath(
      `shuko-list/shuko-detail/${deleteData[0].juchuHeadId!}/${deleteData[0].nyushukoBashoId!}/${deleteData[0].nyushukoDat!}/${deleteData[0].sagyoKbnId!}`
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
 * 入出庫伝票補正数更新
 * @param data 補正数更新データ
 * @param userNam ユーザー名
 * @returns
 */
export const updResultAdjQty = async (
  juchuHeadId: number,
  juchuKizaiHeadId: number,
  sagyoKbnId: number,
  sagyoDenDat: string,
  sagyoId: number,
  kizaiId: number,
  resultAdjQty: number,
  userNam: string
) => {
  const updateData: NyushukoDen = {
    juchu_head_id: juchuHeadId,
    juchu_kizai_head_id: juchuKizaiHeadId,
    sagyo_kbn_id: sagyoKbnId,
    sagyo_den_dat: sagyoDenDat,
    sagyo_id: sagyoId,
    kizai_id: kizaiId,
    result_adj_qty: resultAdjQty,
    upd_dat: toJapanTimeString(),
    upd_user: userNam,
  };
  try {
    const { error } = await updateResultAdjQty(updateData);
    if (error) {
      console.error('updResultAdjQty error : ', error);
      return false;
    }

    revalidatePath(`shuko-list/shuko-detail/${juchuHeadId}/${sagyoId}/${sagyoDenDat}/${sagyoKbnId}`);
    return true;
  } catch (e) {
    console.error(e);
    return false;
  }
};
