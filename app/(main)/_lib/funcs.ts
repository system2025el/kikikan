'use server';

import { DeleteLock, InsertLock, SelectLock } from '@/app/_lib/db/tables/t-lock';

import { toJapanTimeString } from './date-conversion';
import { LockValues } from './types';

/**
 * ロック情報取得
 * @param lockShubetu ロック種別
 * @param headId ヘッダーid
 * @returns ロックデータ
 */
export const GetLock = async (lockShubetu: number, headId: number) => {
  try {
    const { data, error } = await SelectLock(lockShubetu, headId);

    console.log('GetLock data : ', data);

    if (error) {
      console.log(error.code);
      if (error.code === 'PGRST116') {
        console.log('ロックデータなし');
        return null;
      }
      console.error('Error lock:', error.message);
      throw new Error('ロック取得異常');
    }
    const lockData: LockValues = {
      lockShubetu: data.lock_shubetu,
      headId: data.head_id,
      addDat: data.add_dat ? new Date(data.add_dat) : new Date(),
      addUser: data.add_user ?? '',
    };
    return lockData;
  } catch (e) {
    console.error(e);
    return null;
  }
};

/**
 * ロック情報追加
 * @param lockShubetu ロック種別
 * @param headId ヘッダーid
 */
export const AddLock = async (lockShubetu: number, headId: number, userNam: string) => {
  const lockData = {
    lock_shubetu: lockShubetu,
    head_id: headId,
    add_dat: toJapanTimeString(),
    add_user: userNam,
  };
  const { error } = await InsertLock(lockData);
  if (error) {
    console.error('Error adding lock:', error.message);
  }
};

/**
 * ロック情報削除
 * @param lockShubetu ロック種別
 * @param headId ヘッダーid
 */
export const DelLock = async (lockShubetu: number, headId: number) => {
  const { error } = await DeleteLock(lockShubetu, headId);

  if (error) {
    console.error('Error delete lock:', error.message);
  }
};
