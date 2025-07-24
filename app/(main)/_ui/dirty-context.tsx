'use client';

import { useRouter } from 'next/navigation';
import { createContext, useContext, useState } from 'react';

import { useUserStore } from '@/app/_lib/stores/usestore';

import { DeleteLock } from '../order/[juchu_head_id]/[mode]/_lib/funcs';
import { LockValues } from '../order/[juchu_head_id]/[mode]/_lib/types';
import { IsDirtyAlertDialog, PreservationAlertDialog } from '../order/[juchu_head_id]/[mode]/_ui/caveat-dialog';

type DirtyContextType = {
  isDirty: boolean;
  setIsDirty: (val: boolean) => void;
  setIsSave: (val: boolean) => void;
  setLock: (val: LockValues) => void;
  setLockShubetu: (val: number) => void;
  setHeadId: (val: number) => void;
  requestNavigation: (path: string) => void;
};

const DirtyContext = createContext<DirtyContextType | undefined>(undefined);

export const DirtyProvider = ({ children }: { children: React.ReactNode }) => {
  const router = useRouter();
  const user = useUserStore((state) => state.user);
  const [isDirty, setIsDirty] = useState(false);
  const [isSave, setIsSave] = useState(true);
  const [lock, setLock] = useState<LockValues | null>(null);
  const [lockShubetu, setLockShubetu] = useState<number | null>(null);
  const [headId, setHeadId] = useState<number | null>(null);
  const [pendingPath, setPendingPath] = useState<string | null>(null);
  const [showDialog, setShowDialog] = useState(false);

  const requestNavigation = async (path: string) => {
    if (isDirty || !isSave) {
      setPendingPath(path);
      setShowDialog(true);
    } else {
      if (lockShubetu && headId && lock && lock.addUser === user?.name) {
        await DeleteLock(lockShubetu, headId);
        setLock(null);
        setLockShubetu(null);
        setHeadId(null);
      }
      router.push(path);
    }
  };

  const confirmNavigation = async () => {
    if (lockShubetu && headId && lock && lock.addUser === user?.name) {
      await DeleteLock(lockShubetu, headId);
      setLock(null);
      setLockShubetu(null);
      setHeadId(null);
    }
    if (pendingPath) {
      setShowDialog(false);
      setIsDirty(false);
      setIsSave(false);
      router.push(pendingPath);
      setPendingPath(null);
    }
  };

  const cancelNavigation = () => {
    setShowDialog(false);
    setPendingPath(null);
  };

  const handleResult = (result: boolean) => {
    if (result) {
      confirmNavigation();
    } else {
      cancelNavigation();
    }
  };

  return (
    <DirtyContext.Provider
      value={{ isDirty, setIsDirty, setIsSave, setLock, setLockShubetu, setHeadId, requestNavigation }}
    >
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
