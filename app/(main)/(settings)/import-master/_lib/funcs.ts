'use server';

import { EqptImportType } from '../_ui/import-master';

export const ImportData = async (data: EqptImportType[]) => {
  console.log(data);
};

export const ImportRfid = async (tagId: string[]) => {
  try {
  } catch (e) {
    console.log('例外が発生', e);
    throw e;
  }
};
