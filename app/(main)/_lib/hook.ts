'use client';

import { DependencyList, RefObject, useCallback, useEffect, useRef } from 'react';

export const useUnsavedChangesWarning = (isDirty: boolean) => {
  useEffect(() => {
    const handleBeforeUnload = async (e: BeforeUnloadEvent) => {
      if (!isDirty) {
        return;
      }
      e.preventDefault();
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [isDirty]);
};

/**
 * 常に最新のクロージャを実行しつつ、返り値の関数参照自体は再レンダリングを跨いで固定する。
 * React.memoでラップした子コンポーネントに渡すコールバックを安定化させたい場合に使用する。
 */
export const useStableCallback = <T extends (...args: never[]) => unknown>(callback: T): T => {
  const callbackRef = useRef(callback);

  useEffect(() => {
    callbackRef.current = callback;
  });

  return useCallback(((...args: never[]) => callbackRef.current(...args)) as T, []);
};

/**
 * 横に並べた2つのテーブルの縦スクロールを同期する。
 * ユーザーが操作した側からだけ同期し、同期で動かした側のscrollイベントには反応しない。
 * （反応すると往復でscrollTopを書き戻し、ホイールのスムーズスクロールが毎回打ち切られて
 *   端に近づくほど1回のスクロール量が小さくなる）
 * @param leftRef 左テーブルのスクロール要素
 * @param rightRef 右テーブルのスクロール要素
 * @param deps テーブルの描画が切り替わるタイミング（refが付け替わったら登録し直す）
 */
export const useSyncScroll = (
  leftRef: RefObject<HTMLElement | null>,
  rightRef: RefObject<HTMLElement | null>,
  deps: DependencyList
) => {
  useEffect(() => {
    const left = leftRef.current;
    const right = rightRef.current;
    if (!left || !right) return;

    // 最後にユーザーが操作した側
    let active: HTMLElement | null = null;

    const sync = (source: HTMLElement, target: HTMLElement) => {
      if (active !== source) return;
      const range = source.scrollHeight - source.clientHeight;
      const ratio = range > 0 ? source.scrollTop / range : 0;
      target.scrollTop = ratio * (target.scrollHeight - target.clientHeight);
    };

    const activateLeft = () => (active = left);
    const activateRight = () => (active = right);
    const onLeftScroll = () => sync(left, right);
    const onRightScroll = () => sync(right, left);

    const activateEvents = ['wheel', 'pointerdown', 'touchstart', 'keydown'] as const;
    activateEvents.forEach((type) => {
      left.addEventListener(type, activateLeft, { passive: true });
      right.addEventListener(type, activateRight, { passive: true });
    });
    left.addEventListener('scroll', onLeftScroll, { passive: true });
    right.addEventListener('scroll', onRightScroll, { passive: true });

    return () => {
      activateEvents.forEach((type) => {
        left.removeEventListener(type, activateLeft);
        right.removeEventListener(type, activateRight);
      });
      left.removeEventListener('scroll', onLeftScroll);
      right.removeEventListener('scroll', onRightScroll);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
};
