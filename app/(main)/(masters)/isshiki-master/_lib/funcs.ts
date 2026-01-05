'use server';

import { revalidatePath } from 'next/cache';

import pool from '@/app/_lib/db/postgres';
import {
  insertNewIsshiki,
  selectFilteredIsshikis,
  selectOneIsshiki,
  updateIsshikiDB,
  updIsshikiDelFlgDB,
} from '@/app/_lib/db/tables/m-issiki';
import { delIsshikiSet, insertNewIsshikiSetList, updIsshikiSetDB } from '@/app/_lib/db/tables/m-issiki-set';
import { checkExIsshiki, selectActiveEqpts } from '@/app/_lib/db/tables/m-kizai';
import { MIsshikiSetDBValues } from '@/app/_lib/db/types/m-issiki-set-type';
import { MIsshikiDBValues } from '@/app/_lib/db/types/m-issiki-type';
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
      regAmt: Number(rows[0].reg_amt),
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
 * @param {IsshikisMasterDialogValues} data フォームで取得した一式情報
 * @param {string} user ログインユーザ名ざめい
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
    // 新規挿入した一式ID
    const newId = (await insertNewIsshiki(isshikiData, connection)).rows[0].issiki_id;

    // 挿入する一式セット機材のリスト
    const isshikiSetDatas =
      data.kizaiList.length > 0
        ? data.kizaiList.map((d) => ({ issiki_id: newId, kizai_id: d.id, mem: d.mem, add_dat: now, add_user: user }))
        : [];

    // 一式セット機材のリストがあれば挿入実行
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
export const updateIsshiki = async (
  newData: IsshikisMasterDialogValues,
  currentData: IsshikisMasterDialogValues,
  id: number,
  user: string
) => {
  const now = new Date().toISOString();

  // 一式マスタ(m_issiki)の差異
  const isshikiDiff =
    `${newData.isshikiNam}-${newData.regAmt}-${newData.mem}-${newData.delFlg}` !==
    `${currentData.isshikiNam}-${currentData.regAmt}-${currentData.mem}-${currentData.delFlg}`;

  const newList = newData.kizaiList;
  const cList = currentData.kizaiList;

  // 削除対象
  const delList = cList
    .filter((c) => !newList.map((n) => n.id).includes(c.id))
    .map((d) => ({ issiki_id: id, kizai_id: d.id }));

  // 更新対象
  const updList: MIsshikiSetDBValues[] = newList
    .filter((n) => cList.map((c) => c.id).includes(n.id))
    .map((d) => ({
      issiki_id: id,
      kizai_id: d.id,
      mem: d.mem,
      upd_dat: now,
      upd_user: user,
    }));

  // 新規登録対象
  const insertList: MIsshikiSetDBValues[] = newList
    .filter((n) => !cList.map((c) => c.id).includes(n.id))
    .map((d) => ({
      issiki_id: id,
      kizai_id: d.id,
      mem: d.mem,
      add_dat: now,
      add_user: user,
    }));

  // トランザクション
  const connection = await pool.connect();

  try {
    // トランザクション開始
    await connection.query('BEGIN');
    // 一式マスタ変更あれば更新
    if (isshikiDiff) {
      const updData: MIsshikiDBValues = {
        issiki_id: id,
        issiki_nam: newData.isshikiNam,
        reg_amt: newData.regAmt,
        del_flg: Number(newData.delFlg),
        mem: newData.mem,
        upd_dat: now,
        upd_user: user,
      };
      await updateIsshikiDB(updData);
    }
    if (delList && delList.length > 0) {
      // 削除実行
      await delIsshikiSet(delList, connection);
    }
    if (insertList && insertList.length > 0) {
      // 新規挿入実行
      await insertNewIsshikiSetList(insertList, connection);
    }
    if (updList && updList.length > 0) {
      // 更新実行
      await updIsshikiSetDB(updList, connection);
    }
    await connection.query('COMMIT');
    await revalidatePath('/isshiki-master');
  } catch (error) {
    console.log('例外が発生', error);
    await connection.query('ROLLBACK');
    throw error;
  } finally {
    connection.release();
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

/**
 * 一覧で選択された一式の削除フラグを１にする関数
 * @param {number[]} ids 選択された一式のヘッドIDの配列
 * @param {string} user ログインユーザ名
 */
export const updIsshikiDelFlg = async (id: number, flg: boolean, user: string) => {
  const data = { del_flg: flg ? 1 : 0, upd_user: user, upd_dat: new Date().toISOString() };
  try {
    console.log('Delete ::: ', id);
    await updIsshikiDelFlgDB(id, data);
    await revalidatePath('/isshiki-master');
  } catch (e) {
    throw e;
  }
};
