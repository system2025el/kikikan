import { LoanSituation } from './_ui/loan-situation';

const Page = async (props: { params: Promise<{ kizai_id: number }> }) => {
  const params = await props.params;
  const id = params.kizai_id;

  return <LoanSituation />;
};

export default Page;
