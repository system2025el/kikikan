import { PoolClient } from 'pg';

import { MituHead } from '../types/t-mitu-head-types';

export const insertQuotHead = async (data: MituHead, connection: PoolClient) => {
  try {
    console.log('見積ヘッド：', data);
  } catch (e) {
    throw e;
  }
};
