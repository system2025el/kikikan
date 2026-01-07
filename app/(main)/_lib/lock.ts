'use server';

import dayjs from 'dayjs';

import { toJapanTimeStampString } from './date-conversion';
import { addLock, getLock, updLock } from './funcs';

/**
 * ロックデータ確認
 * @param lockShubetu ロック種別
 * @param headId ヘッダーid
 * @param userNam ユーザー名
 * @param mailAdr メールアドレス
 * @returns
 */
export const lockCheck = async (lockShubetu: number, headId: number, userNam: string, mailAdr: string) => {
  const lockData = await getLock(lockShubetu, headId);
  //const date = dayjs(new Date()).add(10, 'm').tz('Asia/Tokyo').format(`YYYY-MM-DD HH:mm:ss`);
  const now = new Date();
  const date = new Date(now.getTime() + 10 * 60 * 1000).toISOString();

  // ロックデータがない場合は新規追加
  if (lockData === null) {
    await addLock(lockShubetu, headId, date, userNam, mailAdr);
    return null;
    // ロックデータがありユーザーが同じなら時間の更新
  } else if (lockData.mail_adr === mailAdr) {
    await updLock(lockShubetu, headId, date, userNam, mailAdr);
    return null;
    // ロックデータがありユーザーが別
  } else if (lockData.mail_adr !== mailAdr) {
    //const now = toJapanTimeStampString();
    //const lockDat = toJapanTimeStampString(lockData.addDat);
    const lockDat = new Date(lockData.addDat);

    // 現在時刻の方が有効時間よりも上なら上書き
    if (now > lockDat) {
      await updLock(lockShubetu, headId, date, userNam, mailAdr);
      return null;
      // 有効時間の方が上ならロックデータを返す
    } else {
      return lockData;
    }
  }
  return null;
};

export const lockRelease = async (lockShubetu: number, headId: number, userNam: string, mailAdr: string) => {
  const lockData = await getLock(lockShubetu, headId);

  if (lockData && lockData.mail_adr === mailAdr) {
    //const date = dayjs(new Date()).tz('Asia/Tokyo').format(`YYYY-MM-DD HH:mm:ss`);
    const date = new Date().toISOString();
    await updLock(lockShubetu, headId, date, userNam, mailAdr);
  }
};
