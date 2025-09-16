import { PoolClient } from 'pg';

import { MituMeisaiHead } from '../types/t-mitu-meisai-head-type';

export const insertQuotMeisaiHead = async (data: MituMeisaiHead[], connection: PoolClient) => {
  try {
    console.log('見積明細ヘッド：', data);
  } catch (e) {
    throw e;
  }
};
