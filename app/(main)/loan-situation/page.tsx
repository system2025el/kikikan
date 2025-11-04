import { LoanList } from '@/app/(main)/loan-situation/_ui/loan-list';

import { getFilteredEqpts } from './_lib/funcs';

const Page = async () => {
  const eqpts = await getFilteredEqpts();
  const data = eqpts.filter((d) => !d.delFlg && d.dspFlg);
  return <LoanList eqpts={data} />;
};

export default Page;
