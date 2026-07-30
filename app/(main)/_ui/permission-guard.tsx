'use client';

import { Typography } from '@mui/material';

import { useUserStore } from '@/app/_lib/stores/usestore';

type PermissionCategory = 'juchu' | 'nyushuko' | 'masters' | 'loginSetting' | 'ht';

type Props = {
  category: PermissionCategory;
  required: number;
  children: React.ReactNode;
};

export const PermissionGuard = ({ category, required, children }: Props) => {
  const user = useUserStore((state) => state.user);

  if (!user) return null;

  const userPermValue = user.permission[category];

  const hasPermission = !!(userPermValue & required);

  if (!hasPermission) {
    return <Typography>このページを閲覧する権限がありません。</Typography>;
  }

  return <>{children}</>;
};
