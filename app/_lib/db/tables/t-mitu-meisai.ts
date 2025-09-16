import { PoolClient } from 'pg';

import { MituMeisai } from '../types/t-mitu-meisai-type';

export const insertQuotMeisai = async (data: MituMeisai[], connection: PoolClient) => {
  try {
    console.log('見積明細：', data);
  } catch (e) {
    throw e;
  }
};
