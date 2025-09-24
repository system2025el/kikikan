// export const dynamic = 'force-dynamic';

import { getFilteredQuotList } from './_lib/func';
import { QuotationList } from './_ui/quotation-list';

const Page = async () => {
  const quotList = await getFilteredQuotList();
  return <QuotationList quots={quotList} />;
};

export default Page;
