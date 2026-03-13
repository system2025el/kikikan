'use client';

import WarningIcon from '@mui/icons-material/Warning';
import { Box, Button, Dialog, DialogActions, DialogContentText, DialogTitle } from '@mui/material';
import { usePathname, useRouter } from 'next/navigation';
import { createContext, useContext, useEffect, useState, useTransition } from 'react';

import { supabase } from '@/app/_lib/db/supabase';
import { serverErrorLog } from '@/app/_lib/funcs';
import { useUserStore } from '@/app/_lib/stores/usestore';

type DirtyContextType = {
  isDirty: boolean;
  setIsDirty: (val: boolean) => void;
  //setLock: (val: LockValues | null) => void;
  requestNavigation: (path: string) => void;
  requestBack: () => void;
  isPending: boolean;
};

const DirtyContext = createContext<DirtyContextType | undefined>(undefined);

export const DirtyProvider = ({ children }: { children: React.ReactNode }) => {
  const router = useRouter();
  const clearUser = useUserStore((state) => state.clearUser);
  //const pathname = usePathname();
  //const user = useUserStore((state) => state.user);
  const [isDirty, setIsDirty] = useState(false);
  //const [lock, setLock] = useState<LockValues | null>(null);
  const [pendingPath, setPendingPath] = useState<string | null>(null);
  const [showDialog, setShowDialog] = useState(false);
  const [isPending, startTransition] = useTransition();

  const requestNavigation = (path: string) => {
    if (isPending) return;
    if (isDirty) {
      setPendingPath(path);
      setShowDialog(true);
    } else {
      // if (lock && lock.addUser === user?.name) {
      //   await delLock(lock.lockShubetu, lock.headId);
      //   setLock(null);
      // }

      startTransition(async () => {
        if (path === '/login') {
          await executeLogout();
        } else {
          router.push(path);
        }
      });
    }
  };

  const confirmNavigation = () => {
    // if (lock && lock.addUser === user?.name) {
    //   await delLock(lock.lockShubetu, lock.headId);
    //   setLock(null);
    // }
    if (isPending) return;
    if (pendingPath) {
      startTransition(async () => {
        setIsDirty(false);
        setShowDialog(false);

        if (pendingPath === '/login') {
          await executeLogout();
        } else {
          router.push(pendingPath);
        }

        setPendingPath(null);
      });
    }
  };

  const executeLogout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        throw new Error(`[supabase.auth.signOut] エラー: ${error.message}`);
      }
      clearUser();

      router.refresh();
      router.replace('/login');
    } catch (e) {
      const errorLog = e as Error;
      await serverErrorLog(errorLog.message);
      console.error('ログアウトエラー：', e);
    }
  };

  const requestBack = () => {
    if (isPending) return;
    if (isDirty) {
      setShowDialog(true);
    } else {
      // if (lock && lock.addUser === user?.name) {
      //   await delLock(lock.lockShubetu, lock.headId);
      //   setLock(null);
      // }
      startTransition(() => {
        router.back();
      });
    }
  };

  const confirmBack = () => {
    // if (lock && lock.addUser === user?.name) {
    //   await delLock(lock.lockShubetu, lock.headId);
    //   setLock(null);
    // }
    if (isPending) return;
    startTransition(() => {
      setIsDirty(false);
      router.back();
      setShowDialog(false);
    });
  };

  const cancelNavigation = () => {
    setShowDialog(false);
    setPendingPath(null);
  };

  const handleResult = (result: boolean) => {
    if (result) {
      if (pendingPath) {
        confirmNavigation();
      } else {
        confirmBack();
      }
    } else {
      cancelNavigation();
    }
  };

  return (
    <DirtyContext.Provider value={{ isDirty, setIsDirty, /*setLock,*/ requestNavigation, requestBack, isPending }}>
      {children}
      <IsDirtyAlertDialog open={showDialog} onClick={handleResult} />
    </DirtyContext.Provider>
  );
};

export const useDirty = () => {
  const context = useContext(DirtyContext);
  if (!context) {
    throw new Error('useDirty must be used within DirtyProvider');
  }
  return context;
};

export const IsDirtyAlertDialog = ({ open, onClick }: { open: boolean; onClick: (result: boolean) => void }) => {
  const [isSave, setIsSave] = useState(false);

  const handleClick = async (result: boolean) => {
    setIsSave(true);
    await onClick(result);
  };

  useEffect(() => {
    if (open) {
      setIsSave(false);
    }
  }, [open]);
  return (
    <Dialog open={open}>
      <DialogTitle alignContent={'center'} display={'flex'} alignItems={'center'}>
        <WarningIcon color="error" />
        <Box>保存されていません</Box>
      </DialogTitle>
      <DialogContentText m={2} p={2}>
        入力内容を破棄しますか？
      </DialogContentText>
      <DialogActions>
        <Button onClick={() => handleClick(true)} loading={isSave}>
          破棄
        </Button>
        <Button onClick={() => onClick(false)} disabled={isSave}>
          戻る
        </Button>
      </DialogActions>
    </Dialog>
  );
};
