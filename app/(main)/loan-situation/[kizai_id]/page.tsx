import { LoanSituation } from './_ui/loan-situation';

const Page = async (props: { params: Promise<{ kizaiId: string }> }) => {
  const params = await props.params;
  const id = params.kizaiId;

  return <LoanSituation />;
};

export default Page;
