'use client';

import { useCallback, useEffect, useRef } from 'react';

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
