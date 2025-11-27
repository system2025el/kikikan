'use server';

import { redirect } from 'next/navigation';

import pool from '@/app/_lib/db/postgres';
import { selectActiveVehs } from '@/app/_lib/db/tables/m-sharyou';
import { insertJuchuSharyoHead, selectJuchuSharyoMeisai } from '@/app/_lib/db/tables/t-juchu-sharyo-head';
import { insertJuchuSharyoMeisai } from '@/app/_lib/db/tables/t-juchu-sharyo-meisai';
import { selectJuchuSharyoHeadList } from '@/app/_lib/db/tables/v-juchu-sharyo-head-lst';
import { JuchuSharyoHeadDBValues } from '@/app/_lib/db/types/t-juchu-sharyo-head-type';
import { JuchuSharyoMeisaiDBValues } from '@/app/_lib/db/types/t-juchu-sharyo-meisai-type';
import { toJapanTimeString } from '@/app/(main)/_lib/date-conversion';
import { SelectTypes } from '@/app/(main)/_ui/form-box';
import { FAKE_NEW_ID } from '@/app/(main)/(masters)/_lib/constants';
import { fakeToNull, nullToFake } from '@/app/(main)/(masters)/_lib/value-converters';
import { VehicleTableValues } from '@/app/(main)/order/[juchuHeadId]/[mode]/_lib/types';

import { JuchuSharyoHeadValues } from './types';

/**
 * 車両の選択肢を取得する関数
 * @returns {SelectTypes[]} 選択肢配列
 */
export const getVehsSelections = async (): Promise<SelectTypes[]> => {
  try {
    const { data, error } = await selectActiveVehs();
    if (error) {
      console.error(error.message, error.hint, error.cause, error.details);
    }
    if (!data || data.length === 0) {
      return [];
    }
    return data.map((d) => ({ id: d.sharyo_id, label: d.sharyo_nam }));
  } catch (e) {
    throw e;
  }
};

/**
 * 選択された受注車両明細を取得、成型する関数
 * @param {number} juchuHeadId
 * @param {number} sharyoHeadId
 * @returns {Promise<JuchuSharyoHeadValues>} フォーム型のデータ
 */
export const getChosenJuchuSharyoMeisais = async (
  juchuHeadId: number,
  sharyoHeadId: number
): Promise<JuchuSharyoHeadValues> => {
  try {
    const { rows } = await selectJuchuSharyoMeisai(juchuHeadId, sharyoHeadId);
    console.log('==============================================', rows);

    const meisaiList =
      rows.length === 2
        ? rows.map((r) => ({
            sharyoId: r.sharyo_id,
            sharyoQty: r.daisu,
            sharyoMem: r.sharyo_mem,
          }))
        : rows.length === 1
          ? [
              { sharyoId: rows[0].sharyo_id, sharyoQty: rows[0].daisu, sharyoMem: rows[0].sharyo_mem },
              { sharyoId: FAKE_NEW_ID, sharyoQty: null, sharyoMem: null },
            ]
          : [
              { sharyoId: FAKE_NEW_ID, sharyoQty: null, sharyoMem: null },
              { sharyoId: FAKE_NEW_ID, sharyoQty: null, sharyoMem: null },
            ];

    const sharyoData: JuchuSharyoHeadValues = {
      juchuHeadId: juchuHeadId,
      juchuShryoHeadId: sharyoHeadId,
      headNam: rows[0].head_nam,
      headMem: rows[0].head_mem,
      nyushukoDat: new Date(rows[0].nyushuko_dat),
      nyushukoBashoId: rows[0].nyushuko_basho_id,
      nyushukoKbn: nullToFake(rows[0].nyushuko_shubetu_id),
      meisai: meisaiList,
    };

    return sharyoData;
  } catch (e) {
    throw e;
  }
};

/**
 * 受注車両明細ヘッダの新規登録関数
 * @param {JuchuSharyoHeadValues} data フォームの情報
 * @param {string} user ログインユーザ名
 */
export const addNewJuchuSharyoHead = async (data: JuchuSharyoHeadValues, user: string) => {
  /**現在時刻の文字列 */
  const now = new Date().toISOString();
  /** 車両明細ヘッダのデータ */
  const sharyoHead: JuchuSharyoHeadDBValues = {
    juchu_head_id: data.juchuHeadId,
    juchu_sharyo_head_id: FAKE_NEW_ID,
    mem: data.headMem,
    head_nam: data.headNam,
    dsp_ord_num: FAKE_NEW_ID,
    add_dat: now,
    add_user: user,
  };

  const connection = await pool.connect();

  try {
    // トランザクション開始
    await connection.query('BEGIN');

    if (!sharyoHead) {
      connection.query('ROLLBACK');
      throw new Error('正しくない情報');
    }
    /** 車両明細ヘッダ登録して新規取得したヘッダID */
    const sharyoHeadId = (await insertJuchuSharyoHead(sharyoHead, connection)).rows[0].juchu_sharyo_head_id;

    /** 車両明細のデータ、台数無は登録しない */
    const sharyoMeisai: JuchuSharyoMeisaiDBValues[] = data.meisai
      .filter((d) => d.sharyoId && d.sharyoId !== FAKE_NEW_ID && Number(d.sharyoQty) !== 0)
      .map((d, index) => ({
        juchu_head_id: data.juchuHeadId,
        juchu_sharyo_head_id: Number(sharyoHeadId),
        juchu_sharyo_meisai_id: index + 1,
        sharyo_id: d.sharyoId,
        nyushuko_shubetu_id: fakeToNull(data.nyushukoKbn),
        nyushuko_basho_id: data.nyushukoBashoId,
        nyushuko_dat: data.nyushukoDat?.toISOString() ?? '',
        daisu: d.sharyoQty,
        mem: d.sharyoMem,
        add_dat: now,
        add_user: user,
      }));

    console.log('=========================================', sharyoMeisai);
    if (sharyoMeisai && sharyoMeisai.length > 0) {
      const { rows } = await insertJuchuSharyoMeisai(sharyoMeisai, connection);
      console.log(rows.length, '件の明細を登録');
    }
    await connection.query('COMMIT');
    await redirect(`/vehicle-order-detail/${data.juchuHeadId}/${Number(sharyoHeadId)}/edit`);
  } catch (e) {
    await connection.query('ROLLBACK');
    throw e;
  } finally {
    connection.release();
  }
};

/**
 * 車両明細を更新する関数
 * @param newData
 * @param currentData
 * @param user
 */
export const updateJuchuSharyoHead = async (
  /** 編集後データ */
  newData: JuchuSharyoHeadValues,
  /** 編集前データ */
  currentData: JuchuSharyoHeadValues,
  /** ログインユーザ */
  user: string
) => {
  try {
    console.log('===============================', newData, currentData);
  } catch (e) {
    throw e;
  }
};

/**
 * 受注車両ヘッダリストを取得、成型する関数 後で移動move
 * @param {number} juchuheadId 受注ヘッダID
 * @returns {Promise<VehicleTableValues[]>} 受注車両テーブルの配列
 */
export const getJuchuSharyoHeadList = async (juchuheadId: number): Promise<VehicleTableValues[]> => {
  try {
    const { data, error } = await selectJuchuSharyoHeadList(juchuheadId);

    if (error) {
      console.error(error);
    }
    if (!data || data.length === 0) {
      return [];
    }

    return data.map((d, index) => ({
      sharyoHeadId: d.juchu_sharyo_head_id ?? FAKE_NEW_ID,
      sharyoHeadNam: d.head_nam ?? '',
      basho: d.shozoku_nam ?? '',
      shubetsuId: d.nyushuko_shubetu_id ?? FAKE_NEW_ID,
      shubetuNam: d.nyushuko_shubetu_nam ?? '',
      nyushukoDat: d.nyushuko_dat ? toJapanTimeString(d.nyushuko_dat) : '',
      headMem: d.mem,
    }));
  } catch (e) {
    throw e;
  }
};
