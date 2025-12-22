'use client';

import WarningIcon from '@mui/icons-material/Warning';
import { Box, Button, Dialog, DialogActions, DialogContentText, DialogTitle } from '@mui/material';
import { useRouter } from 'next/navigation';
import { createContext, useContext, useEffect, useState } from 'react';

import { useUserStore } from '@/app/_lib/stores/usestore';

import { delLock } from '../_lib/funcs';
import { LockValues } from '../_lib/types';

//import { IsDirtyAlertDialog } from '../order/[juchu_head_id]/[mode]/_ui/caveat-dialog';

type DirtyContextType = {
  isDirty: boolean;
  setIsDirty: (val: boolean) => void;
  setLock: (val: LockValues | null) => void;
  requestNavigation: (path: string) => void;
  requestBack: () => void;
};

const DirtyContext = createContext<DirtyContextType | undefined>(undefined);

export const DirtyProvider = ({ children }: { children: React.ReactNode }) => {
  const router = useRouter();
  const user = useUserStore((state) => state.user);
  const [isDirty, setIsDirty] = useState(false);
  const [lock, setLock] = useState<LockValues | null>(null);
  const [pendingPath, setPendingPath] = useState<string | null>(null);
  const [showDialog, setShowDialog] = useState(false);

  const requestNavigation = async (path: string) => {
    if (isDirty) {
      setPendingPath(path);
      setShowDialog(true);
    } else {
      if (lock && lock.addUser === user?.name) {
        await delLock(lock.lockShubetu, lock.headId);
        setLock(null);
      }
      setIsDirty(false);
      router.push(path);
    }
  };

  const confirmNavigation = async () => {
    if (lock && lock.addUser === user?.name) {
      await delLock(lock.lockShubetu, lock.headId);
      setLock(null);
    }
    if (pendingPath) {
      setShowDialog(false);
      setIsDirty(false);
      router.push(pendingPath);
      setPendingPath(null);
    }
  };

  const requestBack = async () => {
    if (isDirty) {
      setShowDialog(true);
    } else {
      if (lock && lock.addUser === user?.name) {
        await delLock(lock.lockShubetu, lock.headId);
        setLock(null);
      }
      setIsDirty(false);
      router.back();
    }
  };

  const confirmBack = async () => {
    if (lock && lock.addUser === user?.name) {
      await delLock(lock.lockShubetu, lock.headId);
      setLock(null);
    }
    setShowDialog(false);
    setIsDirty(false);
    router.back();
  };

  const cancelNavigation = () => {
    setShowDialog(false);
    setPendingPath(null);
  };

  const handleResult = async (result: boolean) => {
    if (result) {
      if (pendingPath) {
        await confirmNavigation();
      } else {
        await confirmBack();
      }
    } else {
      cancelNavigation();
    }
  };

  return (
    <DirtyContext.Provider value={{ isDirty, setIsDirty, setLock, requestNavigation, requestBack }}>
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

  const handleClick = (result: boolean) => {
    setIsSave(true);
    onClick(result);
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
        <Button onClick={() => onClick(false)}>戻る</Button>
      </DialogActions>
    </Dialog>
  );
};
