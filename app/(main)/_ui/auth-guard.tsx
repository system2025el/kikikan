'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

import { supabase } from '@/app/_lib/db/supabase';
import { useUserStore } from '@/app/_lib/stores/usestore';

import { sessionCheck } from '../_lib/funcs';
import { LoadingOverlay } from './loading';

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const user = useUserStore((state) => state.user);
  const clearUser = useUserStore((state) => state.clearUser);
  const router = useRouter();
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    setIsHydrated(true);
  }, []);

  // useEffect(() => {
  //   const handleStorageChange = (event: StorageEvent) => {
  //     // 他のタブで 'user-storage' キーに変更があったかチェック
  //     if (event.key === 'user-storage') {
  //       if (!event.newValue || event.newValue.includes('"user":null')) {
  //         clearUser();
  //         router.replace('/login');
  //       }
  //     }
  //   };

  //   // 他のタブでのlocalStorage操作を監視
  //   window.addEventListener('storage', handleStorageChange);

  //   // さらに、タブに戻ってきた時にも念のため同期（ブラウザバック対策）
  //   const handleFocus = () => {
  //     if (!localStorage.getItem('user-storage') && user) {
  //       clearUser();
  //       router.replace('/login');
  //     }
  //   };
  //   window.addEventListener('focus', handleFocus);

  //   return () => {
  //     window.removeEventListener('storage', handleStorageChange);
  //     window.removeEventListener('focus', handleFocus);
  //   };
  // }, [user, clearUser, router]);

  // useEffect(() => {
  //   // ハイドレーション（ストレージ読み込み）が終わるまで何もしない
  //   if (!isHydrated) return;

  //   const checkAuth = async () => {
  //     if (!user) {
  //       router.replace('/login');
  //       return;
  //     }

  //     // const session = await sessionCheck();

  //     const {
  //       data: { user: sessionUser },
  //     } = await supabase.auth.getUser();
  //     if (!sessionUser) {
  //       router.replace('/login');
  //     }
  //   };
  //   checkAuth();
  // }, [user, isHydrated, router]);

  useEffect(() => {
    if (!isHydrated) return;

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT') {
        clearUser();
        router.replace('/login');
      }
    });

    const checkAuth = async () => {
      if (!user) {
        await supabase.auth.signOut();
        router.replace('/login');
        return;
      }

      const {
        data: { user: sessionUser },
        error,
      } = await supabase.auth.getUser();

      if (error || !sessionUser) {
        clearUser();
        await supabase.auth.signOut();
        router.replace('/login');
      }
    };

    checkAuth();

    return () => subscription.unsubscribe();
  }, [isHydrated, user, router, clearUser]);

  // --- レンダリング・ブロック ---

  // 1. ハイドレーションが終わるまで何も出さない
  if (!isHydrated) return null;

  // 2. ユーザー情報がないなら、リダイレクト中なので何も出さない
  // これにより、一瞬でも Sidebar やページ中身が見えるのを防ぎます
  if (!user) return null;

  // ログインしている場合のみ、中身を表示
  return <>{children}</>;
}
