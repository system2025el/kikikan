'use server';

import dayjs from 'dayjs';

import { deleteLock, insertLock, selectLock, updateLock } from '@/app/_lib/db/tables/t-lock';

import { LockValues } from './types';

/**
 * ロック情報取得
 * @param lockShubetu ロック種別
 * @param headId ヘッダーid
 * @returns ロックデータ
 */
export const getLock = async (lockShubetu: number, headId: number) => {
  try {
    const { data, error } = await selectLock(lockShubetu, headId);

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
      addDat: data.add_dat ?? '',
      addUser: data.add_user ?? '',
      mail_adr: data.mail_adr ?? '',
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
export const addLock = async (lockShubetu: number, headId: number, date: string, userNam: string, mailAdr: string) => {
  const lockData = {
    lock_shubetu: lockShubetu,
    head_id: headId,
    add_dat: date,
    add_user: userNam,
    mail_adr: mailAdr,
  };
  const { error } = await insertLock(lockData);
  if (error) {
    console.error('Error adding lock:', error.message);
  }
};

/**
 * ロック情報更新
 * @param lockShubetu
 * @param headId
 * @param userNam
 * @param mailAdr
 */
export const updLock = async (lockShubetu: number, headId: number, date: string, userNam: string, mailAdr: string) => {
  const lockData = {
    lock_shubetu: lockShubetu,
    head_id: headId,
    add_dat: date,
    add_user: userNam,
    mail_adr: mailAdr,
  };
  const { error } = await updateLock(lockData);
  if (error) {
    console.error('Error update lock:', error.message);
  }
};

/**
 * ロック情報削除
 * @param lockShubetu ロック種別
 * @param headId ヘッダーid
 */
export const delLock = async (lockShubetu: number, headId: number) => {
  const { error } = await deleteLock(lockShubetu, headId);

  if (error) {
    console.error('Error delete lock:', error.message);
  }
};
