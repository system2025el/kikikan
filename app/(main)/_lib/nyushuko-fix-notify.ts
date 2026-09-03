'use client';

import { useEffect } from 'react';

import { useStableCallback } from './hook';

/** 出発・出発解除の通知用チャンネル名 */
const CHANNEL_NAME = 'nyushuko-fix';

export type NyushukoFixMessage = {
  juchuHeadId: number;
  juchuKizaiHeadIds: number[];
};

/**
 * 出発・出発解除を他のタブに通知する。
 * 出庫明細画面は処理後にwindow.close()でタブを閉じるため、閉じる前に呼び出すこと。
 * @param juchuHeadId 受注ヘッダーid
 * @param juchuKizaiHeadIds 対象の受注機材ヘッダーid
 */
export const notifyNyushukoFixChanged = (juchuHeadId: number, juchuKizaiHeadIds: number[]) => {
  if (typeof BroadcastChannel === 'undefined') return;

  const channel = new BroadcastChannel(CHANNEL_NAME);
  channel.postMessage({ juchuHeadId, juchuKizaiHeadIds } satisfies NyushukoFixMessage);
  channel.close();
};

/**
 * 他のタブでの出発・出発解除を受け取る。
 * 受注機材ヘッダーを開いている画面が、出発・到着フラグを取り直すために使用する。
 * @param onChanged 通知時の処理
 */
export const useNyushukoFixChanged = (onChanged: (message: NyushukoFixMessage) => void) => {
  const handler = useStableCallback(onChanged);

  useEffect(() => {
    if (typeof BroadcastChannel === 'undefined') return;

    const channel = new BroadcastChannel(CHANNEL_NAME);
    channel.onmessage = (event: MessageEvent<NyushukoFixMessage>) => handler(event.data);

    return () => channel.close();
  }, [handler]);
};
