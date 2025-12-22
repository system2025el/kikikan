import { getIdoDenDetail, getIdoEqptDetail, getIdoFix } from './_lib/funcs';
import { IdoEqptDetail } from './_ui/ido-eqpt-detail';

const Page = async (props: {
  params: Promise<{
    sagyoKbnId: string;
    nyushukoDat: string;
    sagyoSijiId: string;
    nyushukoBashoId: string;
    kizaiId: string;
  }>;
}) => {
  const params = await props.params;

  // 区分
  const fixKbn = Number(params.sagyoKbnId) === 40 ? 60 : 70;

  // 移動伝票データ、移動機材詳細データ、完了フラグ
  const [idoDenDetailData, idoEqptDetailData, fixFlag] = await Promise.all([
    getIdoDenDetail(
      Number(params.sagyoKbnId),
      Number(params.sagyoSijiId),
      params.nyushukoDat,
      Number(params.nyushukoBashoId),
      Number(params.kizaiId)
    ),
    getIdoEqptDetail(
      Number(params.sagyoKbnId),
      Number(params.sagyoSijiId),
      params.nyushukoDat,
      Number(params.nyushukoBashoId),
      Number(params.kizaiId)
    ),
    getIdoFix(fixKbn, Number(params.sagyoSijiId), params.nyushukoDat, Number(params.nyushukoBashoId)),
  ]);

  return <IdoEqptDetail idoDenDetailData={idoDenDetailData} idoEqptDetailData={idoEqptDetailData} fixFlag={fixFlag} />;
};
export default Page;
