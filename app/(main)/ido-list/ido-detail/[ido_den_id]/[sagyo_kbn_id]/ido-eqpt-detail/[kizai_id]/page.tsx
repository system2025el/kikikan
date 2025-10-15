import { IdoEqptDetail } from './_ui/ido-eqpt-detail';

const Page = async (props: {
  params: Promise<{
    ido_den_id: string;
    sagyo_kbn_id: string;
    kizai_id: string;
  }>;
}) => {
  const params = await props.params;
  return <IdoEqptDetail />;
};
export default Page;
