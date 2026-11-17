import 'server-only';

import { PoolClient } from 'pg';

import { SCHEMA } from '../schema';

/**
 * マスタ更新テーブルの更新日時を更新する関数
 * 呼び出し元のトランザクション（connection）の中で更新するので、マスタ本体と同時に確定・ロールバックされる
 * @param masterNam 更新するマスタテーブル名
 * @param connection 呼び出し元のトランザクションの接続
 */
export const updateMasterUpdates = async (masterNam: string, connection: PoolClient) => {
  const date = new Date().toISOString();
  try {
    await connection.query(`UPDATE ${SCHEMA}.m_master_update SET upd_dat = $1 WHERE master_nam = $2`, [
      date,
      masterNam,
    ]);
  } catch (e) {
    throw new Error('[updateMasterUpdates] DBエラー:', { cause: e });
  }
};
