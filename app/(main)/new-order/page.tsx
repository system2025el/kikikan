'use client';

import { Box, Typography } from '@mui/material';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

import { useUserStore } from '@/app/_lib/stores/usestore';

import { Loading } from '../_ui/loading';
import { AddLock, AddNewOrder, GetMaxId } from '../order/[juchu_head_id]/[mode]/_lib/funcs';

const Page = () => {
  const router = useRouter();
  // user情報
  const user = useUserStore((state) => state.user);

  // 新規受注番号作成
  useEffect(() => {
    if (!user) return;

    const asyncProcess = async () => {
      const maxId = await GetMaxId();
      if (maxId) {
        console.log('user:', user);
        const newOrderId = maxId.juchu_head_id + 1;
        await AddNewOrder(newOrderId, user.name);

        router.push(`/order/${newOrderId}/${'edit'}`);
      } else {
        console.error('Failed to retrieve max order ID');
      }
    };
    asyncProcess();
  }, [router, user]);

  return (
    <Box height={'90vh'}>
      <Loading />
    </Box>
  );
};

export default Page;
