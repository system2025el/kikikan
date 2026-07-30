import { Metadata } from 'next';

import { EqptOrderList } from './_ui/eqpt-order-list';

export const metadata: Metadata = {
  title: '受注明細一覧',
  description: '受注明細一覧ページです',
};

/**
 * 受注一覧画面
 * @returns 受注一覧画面
 */
const Page = async () => {
  return <EqptOrderList />;
};

export default Page;
