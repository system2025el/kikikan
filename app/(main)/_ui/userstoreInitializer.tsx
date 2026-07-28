'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useRef } from 'react';

// 短時間の連続遷移でDBへ問い合わせすぎないよう間引く間隔
const REFRESH_THROTTLE_MS = 60_000;

export const UserStoreInitializer = () => {
  const pathname = usePathname();
  const router = useRouter();
  const lastRefreshedAtRef = useRef(0);

  // ページ遷移のたびに最新のユーザ情報を反映(ただし直近の間引き時間内はスキップ)
  useEffect(() => {
    const now = Date.now();
    if (now - lastRefreshedAtRef.current < REFRESH_THROTTLE_MS) return;
    lastRefreshedAtRef.current = now;
    router.refresh();
  }, [pathname, router]);

  return null;
};
