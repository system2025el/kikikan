'use server';

import { revalidatePath } from 'next/cache';

import pool from '@/app/_lib/db/postgres';
import { SCHEMA, supabase } from '@/app/_lib/db/supabase';
import {
  insertNewIsshiki,
  selectFilteredIsshikis,
  selectOneIsshiki,
  updateIsshikiDB,
} from '@/app/_lib/db/tables/m-issiki';
import { insertNewIsshikiSetList } from '@/app/_lib/db/tables/m-issiki-set';
import { checkExIsshiki, selectActiveEqpts, selectActiveEqptsForIsshiki } from '@/app/_lib/db/tables/m-kizai';
import { toJapanTimeStampString } from '@/app/(main)/_lib/date-conversion';
import { EqptSelection } from '@/app/(main)/(eq-order-detail)/eq-main-order-detail/[juchuHeadId]/[juchuKizaiHeadId]/[mode]/_lib/types';

import { FAKE_NEW_ID } from '../../_lib/constants';
import { emptyIsshiki } from './datas';
import { IsshikisMasterDialogValues, IsshikisMasterTableValues } from './types';

/**
 * 一式マスタのデータを取得する関数、引数無は全取得
 * @param query 一式名検索キーワード
 * @returns {Promise<IsshikisMasterTableValues[]>} 一式マスタテーブルに表示するデータ配列（ 検索キーワードが空の場合は全て ）
 */
export const getFilteredIsshikis = async () => {
  try {
    const { data, error } = await selectFilteredIsshikis();
    if (error) {
      console.error('DB情報取得エラー', error.message, error.cause, error.hint);
      throw error;
    }
    if (!data || data.length === 0) {
      return [];
    }
    // 一式マスタ画面のテーブル要に形成
    const filteredIsshikis: IsshikisMasterTableValues[] = data.map((d, index) => ({
      isshikiId: d.issiki_id,
      isshikiNam: d.issiki_nam ?? '',
      regAmt: d.reg_amt,
      mem: d.mem,
      tblDspId: index + 1,
      delFlg: Boolean(d.del_flg),
      kizaiList: [],
    }));
    console.log('一式マスタ', filteredIsshikis.length, '件');
    return filteredIsshikis;
  } catch (e) {
    console.error('例外が発生しました:', e);
    throw e;
  }
};

/**
 * 選択された一式のデータを取得する関数
 * @param id 選択した一式マスタID
 * @returns {Promise<IsshikisMasterDialogValues>} - 一式の詳細情報。取得失敗時は空オブジェクトを返します。
 */
export const getChosenIsshiki = async (id: number) => {
  try {
    const { rows } = await selectOneIsshiki(id);
    if (!rows || rows.length === 0) {
      return emptyIsshiki;
    }
    // ダイアログ表示用に形成
    const isshikiDetails: IsshikisMasterDialogValues = {
      isshikiNam: rows[0].issiki_nam ?? '',
      regAmt: rows[0].reg_amt,
      delFlg: Boolean(rows[0].del_flg),
      mem: rows[0].mem,
      kizaiList: rows[0].kizai_id ? rows.map((d) => ({ id: d.kizai_id, nam: d.kizai_nam })) : [],
    };
    return isshikiDetails;
  } catch (e) {
    console.error('予期せぬ例外が発生しました:', e);
    throw e;
  }
};

/**
 * 一式マスタに新規登録する関数
 * @param data フォームで取得した一式情報
 */
export const addNewIsshiki = async (data: IsshikisMasterDialogValues, user: string) => {
  const now = new Date().toISOString();

  // 一式マスタに登録する情報
  const isshikiData = {
    issiki_id: FAKE_NEW_ID,
    issiki_nam: data.isshikiNam,
    reg_amt: data.regAmt,
    del_flg: Number(data.delFlg),
    mem: data.mem,
    add_dat: now,
    add_user: user,
  };

  const connection = await pool.connect();

  try {
    connection.query('BEGIN');
    const newId = (await insertNewIsshiki(isshikiData, connection)).rows[0].issiki_id;

    // 新規挿入した一式ID
    const isshikiSetDatas =
      data.kizaiList.length > 0
        ? data.kizaiList.map((d) => ({ issiki_id: newId, kizai_id: d.id, mem: d.mem, add_dat: now, add_user: user }))
        : [];

    if (isshikiSetDatas && isshikiSetDatas.length > 0) {
      await insertNewIsshikiSetList(isshikiSetDatas, connection);
    }

    await revalidatePath('/isshiki-master');
    connection.query('COMMIT');
  } catch (error) {
    console.log('DB接続エラー', error);
    connection.query('ROLLBACK');
    throw error;
  } finally {
    connection.release();
  }
};

/**
 * 一式マスタの情報を更新する関数
 * @param data フォームに入力されている情報
 * @param id 更新する一式マスタID
 */
export const updateIsshiki = async (rawData: IsshikisMasterDialogValues, id: number, user: string) => {
  const date = toJapanTimeStampString();
  const updateData = {
    issiki_id: id,
    issiki_nam: rawData.isshikiNam,
    reg_amt: rawData.regAmt,
    del_flg: Number(rawData.delFlg),
    mem: rawData.mem,
    upd_dat: date,
    upd_user: user,
  };
  console.log(updateData.issiki_nam);
  try {
    await updateIsshikiDB(updateData);
    await revalidatePath('/isshiki-master');
  } catch (error) {
    console.log('例外が発生', error);
    throw error;
  }
};

/**
 * 機材選択に表示するための機材リスト
 * @param query 検索キーワード
 * @returns
 */
export const getEqptsForEqptSelection = async (query: string = ''): Promise<EqptSelection[]> => {
  try {
    const data = await selectActiveEqpts(query);
    if (!data || data.rowCount === 0) {
      return [];
    }
    return data.rows;
  } catch (e) {
    console.error('例外が発生しました:', e);
    throw e;
  }
};

export const checkExistingIsshiki = async (isshikiId: number, kizaiIds: number[]) => {
  try {
    const { data, error } = await checkExIsshiki(isshikiId, kizaiIds);
    if (error) {
      console.error(error);
    }
    if (!data || data.length === 0) {
      return [];
    }
    return data.map((d) => d.kizai_id);
  } catch (e) {
    console.error(e);
    throw e;
  }
};
