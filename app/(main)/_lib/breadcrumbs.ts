'use client';

import { Box, Typography } from '@mui/material';
import { usePathname, useSelectedLayoutSegments } from 'next/navigation';

export const BreadCrumbs = () => {
  const segments = useSelectedLayoutSegments();
  let segment: string = '';

  for (let i = 0; i < segments.length; i++) {
    segment += '/' + segments[i];
  }

  const items = [
    { path: '/new-order', name: '受注管理＞新規受注' },
    { path: '/new-order/equipment-order-detail', name: '受注管理＞新規受注＞受注明細（機材）' },
    { path: '/new-order/vehicle-order-detail', name: '受注管理＞新規受注＞受注明細（車両）' },
    { path: '/order-list', name: '受注管理＞受注一覧' },
    { path: '/quotation-list', name: '受注管理＞見積一覧' },
    { path: '/quotation-list/quotation', name: '受注管理＞見積一覧＞見積書' },
    { path: '/stock', name: '受注管理＞在庫確認' },
    { path: '/loan-situation', name: '受注管理＞貸出状況' },
  ];

  for (let i = 0; i < items.length; i++) {
    if (items[i].path === segment) {
      return items[i].name;
    }
  }
};
