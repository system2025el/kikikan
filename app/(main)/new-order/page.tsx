'use client';

import { Box } from '@mui/material';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

import { Loading } from '../_ui/loading';
import { AddLock, AddNewOrder, GetMaxId } from '../order/[juchu_head_id]/[mode]/_lib/funcs';

const Page = () => {
  const router = useRouter();

  // 新規受注番号作成
  useEffect(() => {
    const asyncProcess = async () => {
      const maxId = await GetMaxId();
      if (maxId) {
        const newOrderId = maxId.juchu_head_id + 1;
        await AddNewOrder(newOrderId);

        router.push(`/order/${newOrderId}/${'edit'}`);
      } else {
        console.error('Failed to retrieve max order ID');
      }
    };
    asyncProcess();
  }, [router]);

  return (
    <Box height={'90vh'}>
      <Loading />
    </Box>
  );
};

export default Page;
