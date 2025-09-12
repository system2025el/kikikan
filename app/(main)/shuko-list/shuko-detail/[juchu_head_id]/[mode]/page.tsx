import { getShukoList } from '../../../_lib/funcs';
import { ShukoListSearchValues } from '../../../_lib/types';
import { ShukoDetail } from './_ui/shuko-detail';

const Page = async (props: { params: Promise<{ juchu_head_id: number; mode: string }> }) => {
  const params = await props.params;
  const mode = params.mode === 'standby' ? 'スタンバイ' : params.mode === 'check' ? '出庫' : '';
  return <ShukoDetail mode={mode} />;
};
export default Page;
