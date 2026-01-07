'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

import { useUserStore } from '@/app/_lib/stores/usestore';

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const user = useUserStore((state) => state.user);
  const clearUser = useUserStore((state) => state.clearUser);
  const router = useRouter();
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    setIsHydrated(true);
  }, []);

  useEffect(() => {
    const handleStorageChange = (event: StorageEvent) => {
      // 他のタブで 'user-storage' キーに変更があったかチェック
      if (event.key === 'user-storage') {
        if (!event.newValue || event.newValue.includes('"user":null')) {
          clearUser();
          router.replace('/login');
        }
      }
    };

    // 他のタブでのlocalStorage操作を監視
    window.addEventListener('storage', handleStorageChange);

    // さらに、タブに戻ってきた時にも念のため同期（ブラウザバック対策）
    const handleFocus = () => {
      if (!localStorage.getItem('user-storage') && user) {
        clearUser();
        router.replace('/login');
      }
    };
    window.addEventListener('focus', handleFocus);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('focus', handleFocus);
    };
  }, [user, clearUser, router]);

  useEffect(() => {
    // ハイドレーション（ストレージ読み込み）が終わるまで何もしない
    if (!isHydrated) return;

    // (main) の layout で使うなら、本来 user がいない時点でアウト
    if (!user) {
      router.replace('/login');
    }
  }, [user, isHydrated, router]);

  // --- レンダリング・ブロック ---

  // 1. ハイドレーションが終わるまで何も出さない
  if (!isHydrated) return null;

  // 2. ユーザー情報がないなら、リダイレクト中なので何も出さない
  // これにより、一瞬でも Sidebar やページ中身が見えるのを防ぎます
  if (!user) {
    return null;
  }

  // ログインしている場合のみ、中身を表示
  return <>{children}</>;
}
