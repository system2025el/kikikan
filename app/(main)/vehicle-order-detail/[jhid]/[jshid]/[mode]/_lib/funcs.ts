'use server';

import { selectActiveVehs } from '@/app/_lib/db/tables/m-sharyou';
import { SelectTypes } from '@/app/(main)/_ui/form-box';

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

export const addNewJuchuSharyoHead = async (data: JuchuSharyoHeadValues) => {
  try {
    console.log('==========================================', data);
  } catch (e) {
    throw e;
  }
};
