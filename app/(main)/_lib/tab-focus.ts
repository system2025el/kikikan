'use client';

import { Snackbar } from '@mui/material';
import { usePathname, useSearchParams } from 'next/navigation';
import { createElement, useEffect } from 'react';
import { createRoot } from 'react-dom/client';

/** 複数タブ制御用チャンネル名 */
const CHANNEL_NAME = 'tab-focus';
/** フォーカス要求に応答が無い場合、新規タブを開くまでの待ち時間 */
const RESPONSE_TIMEOUT_MS = 300;
/**
 * URL末尾が編集/閲覧モードのパラメータになっている画面のパス接頭辞。
 * 同一の受注機材を編集中でも閲覧リンクからフォーカスできるよう、判定時はこの末尾segmentを無視する。
 */
const MODE_SUFFIXED_PREFIXES = ['/eq-main-order-detail/', '/eq-return-order-detail/', '/eq-keep-order-detail/'];

type FocusMessage = { type: 'ping'; requestId: string; path: string } | { type: 'pong'; requestId: string };

/**
 * 画面同一判定用にパスを正規化する。
 * クエリの並び順・エンコード差異を吸収し、eq-order-detail系画面は末尾のmodeセグメントを除いて比較する。
 */
const normalizeForMatch = (path: string): string => {
  const url = new URL(path, 'http://tab-focus.invalid/');
  let pathname = url.pathname;

  if (MODE_SUFFIXED_PREFIXES.some((prefix) => pathname.startsWith(prefix))) {
    const segments = pathname.split('/');
    segments.pop();
    pathname = segments.join('/');
  }

  const sortedSearch = new URLSearchParams([...url.searchParams.entries()].sort());
  return `${pathname}?${sortedSearch.toString()}`;
};

/**
 * (main)配下のレイアウトで一度だけ呼び出す。
 * 自タブのURLと一致するフォーカス要求を受け取ったら、画面遷移せずwindow.focus()のみ行う。
 */
export const useTabFocusResponder = () => {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentPath = searchParams.size > 0 ? `${pathname}?${searchParams.toString()}` : pathname;

  useEffect(() => {
    if (typeof BroadcastChannel === 'undefined') return;

    const channel = new BroadcastChannel(CHANNEL_NAME);
    channel.onmessage = (event: MessageEvent<FocusMessage>) => {
      const data = event.data;
      if (data.type === 'ping' && normalizeForMatch(data.path) === normalizeForMatch(currentPath)) {
        window.focus();
        channel.postMessage({ type: 'pong', requestId: data.requestId } satisfies FocusMessage);
      }
    };

    return () => channel.close();
  }, [currentPath]);
};

/**
 * 「既に別タブで開いています」というSnackbar通知を表示する。
 * openOrFocusTabはReactコンポーネントツリー外（onClickハンドラ内）から呼び出されるため、
 * 一時的なReactルートを生成しMUIのSnackbarをマウントする。
 * ブラウザの制限上window.focus()では既存タブへの切り替えができないため、
 * ユーザー自身にタブを探してもらうための案内として表示する。
 */
const showAlreadyOpenSnackbar = () => {
  if (typeof document === 'undefined') return;

  const container = document.createElement('div');
  document.body.appendChild(container);
  const root = createRoot(container);

  const handleClose = () => {
    root.unmount();
    container.remove();
  };

  root.render(
    createElement(Snackbar, {
      open: true,
      autoHideDuration: 4000,
      onClose: handleClose,
      message: 'この画面は既に別タブで開いています',
      anchorOrigin: { vertical: 'top', horizontal: 'center' },
    })
  );
};

/**
 * 指定パスの画面が既に別タブで開いていればSnackbarで通知し、
 * なければ新規タブで開く。window.open(path)の代替として使用する。
 * （ブラウザの制限上、既存タブへの自動切り替えはできないため通知のみ）
 */
export const openOrFocusTab = (path: string) => {
  if (typeof BroadcastChannel === 'undefined') {
    window.open(path);
    return;
  }

  const channel = new BroadcastChannel(CHANNEL_NAME);
  const requestId = `${Date.now()}-${Math.random()}`;
  let handled = false;

  const timer = setTimeout(() => {
    channel.close();
    if (!handled) {
      window.open(path);
    }
  }, RESPONSE_TIMEOUT_MS);

  channel.onmessage = (event: MessageEvent<FocusMessage>) => {
    const data = event.data;
    if (data.type === 'pong' && data.requestId === requestId) {
      handled = true;
      clearTimeout(timer);
      channel.close();
      showAlreadyOpenSnackbar();
    }
  };

  channel.postMessage({ type: 'ping', requestId, path } satisfies FocusMessage);
};
