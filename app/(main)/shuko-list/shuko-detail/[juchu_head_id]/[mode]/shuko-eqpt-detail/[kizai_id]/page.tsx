import { ShukoEqptDetail } from './_ui/shuko-eqpt-detail';

const Page = async (props: { params: Promise<{ kizai_id: number }> }) => {
  const params = await props.params;
  return <ShukoEqptDetail />;
};
export default Page;
