'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';

import { DeleteLock } from '../order/[juchu_head_id]/[mode]/_lib/funcs';

export const useUnsavedChangesWarning = (isDirty: boolean, isSave: boolean) => {
  useEffect(() => {
    const handleBeforeUnload = async (e: BeforeUnloadEvent) => {
      if (!isDirty && isSave) {
        return;
      }
      e.preventDefault();
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [isDirty, isSave]);
};
