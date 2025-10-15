import { IdoDetail } from './_ui/ido-detail';

const Page = async (props: {
  params: Promise<{
    ido_den_id: string;
    sagyo_kbn_id: string;
  }>;
}) => {
  const params = await props.params;
  const sagyoKbnId = Number(params.sagyo_kbn_id);
  if (sagyoKbnId !== 40 && sagyoKbnId !== 50) {
    <div>不正な作業区分IDです</div>;
  }
  return <IdoDetail sagyoKbnId={sagyoKbnId} />;
};
export default Page;
