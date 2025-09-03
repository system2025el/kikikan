import { SelectReturnJuchuKizaiHead } from '@/app/_lib/db/tables/t-juchu-kizai-head';
import { SelectJuchuKizaiMeisaiKizaiTanka } from '@/app/_lib/db/tables/t-juchu-kizai-meisai';
import { SelectReturnJuchuKizaiMeisai } from '@/app/_lib/db/tables/v-juchu-kizai-meisai';
import { GetJuchuKizaiNyushuko } from '@/app/(main)/(eq-order-detail)/_lib/funcs';

import { ReturnJuchuKizaiHeadValues, ReturnJuchuKizaiMeisaiValues } from './types';

/**
 * 返却受注機材ヘッダー取得
 * @param juchuHeadId 受注ヘッダーid
 * @param juchuKizaiHeadId 受注機材ヘッダーid
 * @returns 受注機材ヘッダーデータ
 */
export const GetReturnJuchuKizaiHead = async (juchuHeadId: number, juchuKizaiHeadId: number) => {
  try {
    const { data, error } = await SelectReturnJuchuKizaiHead(juchuHeadId, juchuKizaiHeadId);
    if (error || data?.oya_juchu_kizai_head_id === null) {
      console.error('GetEqHeader juchuKizaiHead error : ', error);
      return null;
    }

    const juchuDate = await GetJuchuKizaiNyushuko(juchuHeadId, juchuKizaiHeadId);

    if (!juchuDate) throw new Error('受注機材入出庫日が存在しません');

    const returnJucuKizaiHeadData: ReturnJuchuKizaiHeadValues = {
      juchuHeadId: data.juchu_head_id,
      juchuKizaiHeadId: data.juchu_kizai_head_id,
      juchuKizaiHeadKbn: data.juchu_kizai_head_kbn,
      juchuHonbanbiQty: data.juchu_honbanbi_qty,
      nebikiAmt: data.nebiki_amt,
      mem: data.mem ? data.mem : '',
      headNam: data.head_nam ?? '',
      oyaJuchuKizaiHeadId: data.oya_juchu_kizai_head_id,
      kicsNyukoDat: juchuDate.kicsNyukoDat ? new Date(juchuDate.kicsNyukoDat) : null,
      yardNyukoDat: juchuDate.yardNyukoDat ? new Date(juchuDate.yardNyukoDat) : null,
    };

    console.log('returnJucuKizaiHeadData', returnJucuKizaiHeadData);
    return returnJucuKizaiHeadData;
  } catch (e) {
    console.log(e);
  }
};

export const GetReturnJuchuKizaiMeisai = async (juchuHeadId: number, juchuKizaiHeadId: number) => {
  try {
    const { data: eqList, error: eqListError } = await SelectReturnJuchuKizaiMeisai(juchuHeadId, juchuKizaiHeadId);
    if (eqListError) {
      console.error('GetKeeoEqList keep eqList error : ', eqListError);
      return [];
    }

    const { data: eqTanka, error: eqTankaError } = await SelectJuchuKizaiMeisaiKizaiTanka(
      juchuHeadId,
      juchuKizaiHeadId
    );
    if (eqTankaError) {
      console.error('GetEqHeader eqTanka error : ', eqTankaError);
      return [];
    }

    const returnJuchuKizaiMeisaiData: ReturnJuchuKizaiMeisaiValues[] = eqList.map((d) => ({
      juchuHeadId: d.juchu_head_id,
      juchuKizaiHeadId: d.juchu_kizai_head_id,
      juchuKizaiMeisaiId: d.juchu_kizai_meisai_id,
      shozokuId: d.shozoku_id,
      shozokuNam: d.shozoku_nam ?? '',
      mem: d.mem,
      kizaiId: d.kizai_id,
      kizaiTankaAmt: eqTanka.find((t) => t.kizai_id === d.kizai_id)?.kizai_tanka_amt || 0,
      kizaiNam: d.kizai_nam ?? '',
      oyaPlanKizaiQty: /*d.plan_kizai_qty*/ 5,
      oyaPlanYobiQty: /*d.plan_yobi_qty*/ 5,
      planKizaiQty: d.plan_kizai_qty ? -1 * d.plan_kizai_qty : d.plan_kizai_qty,
      planYobiQty: d.plan_yobi_qty ? -1 * d.plan_yobi_qty : d.plan_yobi_qty,
      planQty: d.plan_qty ? -1 * d.plan_qty : d.plan_qty,
      delFlag: false,
      saveFlag: true,
    }));
    return returnJuchuKizaiMeisaiData;
  } catch (e) {
    console.error(e);
  }
};
