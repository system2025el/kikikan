'use server';

import { revalidatePath } from 'next/cache';

import {
  insertNewSection,
  selectActiveSections,
  selectFilteredSections,
  selectOneSection,
  upDateSectionDB,
} from '@/app/_lib/db/tables/m-section';
import { toJapanTimeStampString, toJapanTimeString } from '@/app/(main)/_lib/date-conversion';
import { SelectTypes } from '@/app/(main)/_ui/form-box';

import { emptySection } from './datas';
import { SectionsMasterDialogValues, SectionsMasterTableValues } from './types';

/**
 * 課の選択肢を取得・成型する関数（略称）
 * @returns {SelectTypes[]} id, labelともに略称
 */
export const getSectionShortSelections = async () => {
  try {
    const { data, error } = await selectActiveSections();
    if (error) {
      console.error('DB情報取得エラー', error.message, error.cause, error.hint);
      throw error;
    }
    if (!data || data.length === 0) {
      return [];
    }

    return data.map((d) => ({ id: d.section_nam_short, label: d.section_nam_short }));
  } catch (e) {
    console.error('例外が発生しました:', e);
    throw e;
  }
};

/**
 * 課マスタテーブルのデータを取得する関数
 * @param query 検索キーワード
 * @returns {Promise<SectionsMasterTableValues[]>} 課マスタテーブルに表示するデータ（ 検索キーワードが空の場合は全て ）
 */
export const getFilteredSections = async (query: string = '') => {
  try {
    const { data, error } = await selectFilteredSections(query);
    if (error) {
      console.error('DB情報取得エラー', error.message, error.cause, error.hint);
      throw error;
    }
    if (!data || data.length === 0) {
      return [];
    }
    const filteredSections: SectionsMasterTableValues[] = data.map((d, index) => ({
      sectionId: d.section_id,
      sectionNam: d.section_nam,
      sectionNamShort: d.section_nam_short,
      mem: d.mem,
      tblDspId: index + 1,
      delFlg: Boolean(d.del_flg),
    }));
    console.log(filteredSections.length);
    return filteredSections;
  } catch (e) {
    console.error('例外が発生しました:', e);
    throw e;
  }
};

/**
 * 選択された課のデータを取得する関数
 * @param id 課マスタID
 * @returns {Promise<SectionsMasterDialogValues>} - 課の詳細情報。取得失敗時は空オブジェクトを返します。
 */
export const getChosenSection = async (id: number) => {
  try {
    const { data, error } = await selectOneSection(id);
    if (error) {
      console.error('DB情報取得エラー', error.message, error.cause, error.hint);
      throw error;
    }
    if (!data) {
      return emptySection;
    }
    const sectionDetails: SectionsMasterDialogValues = {
      sectionNam: data.section_nam,
      sectionNamShort: data.section_nam_short,
      delFlg: Boolean(data.del_flg),
      mem: data.mem,
    };
    return sectionDetails;
  } catch (e) {
    console.error('例外が発生しました:', e);
    throw e;
  }
};

/**
 * 課マスタに新規登録する関数
 * @param data フォームで取得した課情報
 */
export const addNewSection = async (data: SectionsMasterDialogValues, user: string) => {
  try {
    await insertNewSection(data, user);
    await revalidatePath('/sections-master');
  } catch (error) {
    console.log('DB接続エラー', error);
    throw error;
  }
};

/**
 * 課マスタの情報を更新する関数
 * @param data フォームに入力されている情報
 * @param id 更新する課マスタID
 */
export const updateSection = async (rawData: SectionsMasterDialogValues, id: number, user: string) => {
  const date = toJapanTimeStampString();
  const updateDate = {
    section_id: id,
    section_nam: rawData.sectionNam,
    section_nam_short: rawData.sectionNamShort,
    del_flg: Number(rawData.delFlg),
    mem: rawData.mem,
    upd_dat: date,
    upd_user: user,
  };

  try {
    await upDateSectionDB(updateDate);
    await revalidatePath('/sections-master');
  } catch (error) {
    console.log('例外が発生しました', error);
    throw error;
  }
};
