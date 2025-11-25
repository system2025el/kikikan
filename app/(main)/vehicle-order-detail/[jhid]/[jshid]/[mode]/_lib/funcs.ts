'use server';

import { selectActiveVehs } from '@/app/_lib/db/tables/m-sharyou';
import { SelectTypes } from '@/app/(main)/_ui/form-box';

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
