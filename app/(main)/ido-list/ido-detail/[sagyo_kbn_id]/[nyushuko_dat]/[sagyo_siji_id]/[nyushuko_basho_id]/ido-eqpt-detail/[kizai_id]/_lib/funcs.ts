'use server';

import { revalidatePath } from 'next/cache';

import pool from '@/app/_lib/db/postgres';
import { deleteIdoCtnResult } from '@/app/_lib/db/tables/t-ido-ctn-result';
import { updateIdoDen } from '@/app/_lib/db/tables/t-ido-den';
import { deleteIdoResult } from '@/app/_lib/db/tables/t-ido-result';
import { selectIdoDenOne } from '@/app/_lib/db/tables/v-ido-den3-lst';
import { selectIdoEqptDetail } from '@/app/_lib/db/tables/v-ido-den3-result';
import { IdoDen } from '@/app/_lib/db/types/t-ido-den-type';
import { toJapanTimeString } from '@/app/(main)/_lib/date-conversion';

import { IdoEqptDetailTableValues, IdoEqptDetailValues } from './types';

export const getIdoDenDetail = async (
  sagyoKbnId: number,
  sagyoSijiId: number,
  sagyoDenDat: string,
  sagyoId: number,
  kizaiId: number
) => {
  try {
    const { data, error } = await selectIdoDenOne(sagyoKbnId, sagyoSijiId, sagyoDenDat, sagyoId, kizaiId);

    if (error) {
      console.error('getIdoEqptDetail error : ', error);
      throw error;
    }

    const idoEqptDetailData: IdoEqptDetailValues = {
      idoDenId: data.ido_den_id,
      sagyoKbnId: sagyoKbnId,
      sagyoSijiId: sagyoSijiId,
      sagyoDenDat: sagyoDenDat,
      sagyoId: sagyoId,
      planQty: data.plan_qty,
      resultQty: data.result_qty,
      resultAdjQty: data.result_adj_qty,
      kizaiId: data.kizai_id,
      kizaiNam: data.kizai_nam,
      bldCod: data.bld_cod,
      tanaCod: data.tana_cod,
      edaCod: data.eda_cod,
      mem: data.kizai_mem,
      ctnFlg: data.ctn_flg,
    };

    return idoEqptDetailData;
  } catch (e) {
    console.error(e);
    throw e;
  }
};

export const getIdoEqptDetail = async (
  sagyoKbnId: number,
  sagyoSijiId: number,
  sagyoDenDat: string,
  sagyoId: number,
  kizaiId: number
) => {
  try {
    const { data, error } = await selectIdoEqptDetail(sagyoKbnId, sagyoSijiId, sagyoDenDat, sagyoId, kizaiId);

    if (error) {
      console.error('getIdoEqptDetail error : ', error);
      throw error;
    }

    const idoEqptDetailData: IdoEqptDetailTableValues[] = data.map((d) => ({
      idoDenId: d.ido_den_id,
      rfidElNum: d.rfid_el_num,
      rfidTagId: d.rfid_tag_id,
      rfidKizaiSts: d.rfid_kizai_sts,
      rfidStsNam: d.rfid_sts_nam,
      rfidMem: d.rfid_mem,
      rfidDat: d.rfid_dat,
      rfidUser: d.rfid_user,
      rfidDelFlg: d.rfid_del_flg,
    }));

    return idoEqptDetailData;
  } catch (e) {
    console.error(e);
    throw e;
  }
};

export const delIdoResult = async (idoDenDetailData: IdoEqptDetailValues, deleteTagIds: string[], userNam: string) => {
  const connection = await pool.connect();
  try {
    await connection.query('BEGIN');

    if (idoDenDetailData.ctnFlg) {
      await deleteIdoCtnResult(
        idoDenDetailData.sagyoKbnId,
        idoDenDetailData.sagyoSijiId,
        idoDenDetailData.sagyoDenDat,
        idoDenDetailData.sagyoId,
        idoDenDetailData.kizaiId,
        deleteTagIds,
        connection
      );
    } else {
      await deleteIdoResult(
        idoDenDetailData.sagyoKbnId,
        idoDenDetailData.sagyoSijiId,
        idoDenDetailData.sagyoDenDat,
        idoDenDetailData.sagyoId,
        idoDenDetailData.kizaiId,
        deleteTagIds,
        connection
      );
    }
    console.log('delete ido result', deleteTagIds);

    const updateIdoDenData: IdoDen = {
      ido_den_id: idoDenDetailData.idoDenId,
      kizai_id: idoDenDetailData.kizaiId,
      result_qty: idoDenDetailData.resultQty && idoDenDetailData.resultQty - deleteTagIds.length,
      sagyo_den_dat: idoDenDetailData.sagyoDenDat,
      sagyo_id: idoDenDetailData.sagyoId,
      sagyo_kbn_id: idoDenDetailData.sagyoKbnId,
      sagyo_siji_id: idoDenDetailData.sagyoSijiId,
      upd_dat: toJapanTimeString(),
      upd_user: userNam,
    };

    await updateIdoDen(updateIdoDenData, connection);
    console.log(
      'update ido den result_qty',
      idoDenDetailData.planQty && idoDenDetailData.planQty - deleteTagIds.length
    );

    await await connection.query('COMMIT');
    revalidatePath(
      `ido-list/ido-detail/${idoDenDetailData.sagyoKbnId}/${idoDenDetailData.sagyoDenDat}/${idoDenDetailData.sagyoSijiId}/${idoDenDetailData.sagyoId}`
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

export const updIdoResultAdjQty = async (
  idoDenDetailData: IdoEqptDetailValues,
  resultAdjQty: number,
  userNam: string
) => {
  const connection = await pool.connect();

  const updateData: IdoDen = {
    ido_den_id: idoDenDetailData.idoDenId,
    kizai_id: idoDenDetailData.kizaiId,
    result_adj_qty: resultAdjQty,
    sagyo_den_dat: idoDenDetailData.sagyoDenDat,
    sagyo_id: idoDenDetailData.sagyoId,
    sagyo_kbn_id: idoDenDetailData.sagyoKbnId,
    sagyo_siji_id: idoDenDetailData.sagyoSijiId,
    upd_dat: toJapanTimeString(),
    upd_user: userNam,
  };

  try {
    await updateIdoDen(updateData, connection);
    revalidatePath(
      `ido-list/ido-detail/${idoDenDetailData.sagyoKbnId}/${idoDenDetailData.sagyoDenDat}/${idoDenDetailData.sagyoSijiId}/${idoDenDetailData.sagyoId}`
    );
    return true;
  } catch (e) {
    console.error(e);
    return false;
  }
};
