import { Metadata } from 'next';

import { ExportMaster } from './_ui/masters-export';

export const metadata: Metadata = {
  title: 'マスタエクスポート',
  description: 'マスタエクスポートページです',
};

const Page = () => {
  return <ExportMaster />;
};

export default Page;
