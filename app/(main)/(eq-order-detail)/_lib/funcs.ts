'use server';

import { QueryResult } from 'pg';

import { SelectStockList } from '@/app/_lib/db/tables/stock-table';
import { DeleteIdoDen, InsertIdoDen, SelectIdoDenMaxId, UpdateIdoDen } from '@/app/_lib/db/tables/t-ido-den';
import {
  InsertJuchuKizaiHead,
  SelectJuchuKizaiHead,
  SelectJuchuKizaiHeadMaxId,
  UpdateJuchuKizaiHead,
} from '@/app/_lib/db/tables/t-juchu-kizai-head';
import {
  DeleteHonbanbi,
  DeleteSiyouHonbanbi,
  InsertAllHonbanbi,
  InsertHonbanbi,
  SelectHonbanbi,
  SelectHonbanbiConfirm,
  UpdateHonbanbi,
  UpdateNyushukoHonbanbi,
} from '@/app/_lib/db/tables/t-juchu-kizai-honbanbi';
import {
  DeleteJuchuKizaiMeisai,
  InsertJuchuKizaiMeisai,
  SelectJuchuKizaiMeisaiKizaiTanka,
  SelectJuchuKizaiMeisaiMaxId,
  UpdateJuchuKizaiMeisai,
} from '@/app/_lib/db/tables/t-juchu-kizai-meisai';
import {
  DeleteJchuKizaiNyushuko,
  InsertJuchuKizaiNyushuko,
  SelectJuchuKizaiNyushuko,
  SelectJuchuKizaiNyushukoConfirm,
  UpdateJuchuKizaiNyushuko,
} from '@/app/_lib/db/tables/t-juchu-kizai-nyushuko';
import { SelectJuchuKizaiMeisai } from '@/app/_lib/db/tables/v-juchu-kizai-meisai';
import { IdoDen } from '@/app/_lib/db/types/t-ido-den-type';
import { JuchuKizaiHead } from '@/app/_lib/db/types/t-juchu-kizai-head-type';
import { JuchuKizaiHonbanbi } from '@/app/_lib/db/types/t-juchu-kizai-honbanbi-type';
import { JuchuKizaiMeisai } from '@/app/_lib/db/types/t-juchu-kizai-meisai-type';
import { JuchuKizaiNyushuko } from '@/app/_lib/db/types/t-juchu-kizai-nyushuko-type';

import { toISOStringYearMonthDay, toJapanTimeString } from '../../_lib/date-conversion';
import {
  JuchuKizaiHeadValues,
  JuchuKizaiHonbanbiValues,
  JuchuKizaiMeisaiValues,
  StockTableValues,
} from '../eq-main-order-detail/[juchu_head_id]/[juchu_kizai_head_id]/[mode]/_lib/types';

/**
 * 受注機材ヘッダーid最大値取得
 * @returns 受注機材ヘッダーid最大値
 */
export const GetJuchuKizaiHeadMaxId = async (juchuHeadId: number) => {
  try {
    const { data, error } = await SelectJuchuKizaiHeadMaxId(juchuHeadId);
    if (error) {
      return null;
    }
    console.log('GetMaxId : ', data);
    return data;
  } catch (e) {
    console.error(e);
  }
};

/**
 * 受注機材ヘッダー取得
 * @param juchuHeadId 受注ヘッダーid
 * @param juchuKizaiHeadId 受注機材ヘッダーid
 * @returns 受注機材ヘッダーデータ
 */
export const GetJuchuKizaiHead = async (juchuHeadId: number, juchuKizaiHeadId: number) => {
  try {
    const juchuKizaiHeadData = await SelectJuchuKizaiHead(juchuHeadId, juchuKizaiHeadId);

    if (juchuKizaiHeadData.error) {
      console.error('GetEqHeader juchuKizaiHead error : ', juchuKizaiHeadData.error);
      return null;
    }

    const juchuDate = await GetJuchuKizaiNyushuko(juchuHeadId, juchuKizaiHeadId);

    if (!juchuDate) throw new Error('受注機材入出庫日が存在しません');

    const jucuKizaiHeadData: JuchuKizaiHeadValues = {
      juchuHeadId: juchuKizaiHeadData.data.juchu_head_id,
      juchuKizaiHeadId: juchuKizaiHeadData.data.juchu_kizai_head_id,
      juchuKizaiHeadKbn: juchuKizaiHeadData.data.juchu_kizai_head_kbn,
      juchuHonbanbiQty: juchuKizaiHeadData.data.juchu_honbanbi_qty,
      nebikiAmt: juchuKizaiHeadData.data.nebiki_amt,
      mem: juchuKizaiHeadData.data.mem ? juchuKizaiHeadData.data.mem : '',
      headNam: juchuKizaiHeadData.data.head_nam ?? '',
      kicsShukoDat: juchuDate.kicsShukoDat ? new Date(juchuDate.kicsShukoDat) : null,
      kicsNyukoDat: juchuDate.kicsNyukoDat ? new Date(juchuDate.kicsNyukoDat) : null,
      yardShukoDat: juchuDate.yardShukoDat ? new Date(juchuDate.yardShukoDat) : null,
      yardNyukoDat: juchuDate.yardNyukoDat ? new Date(juchuDate.yardNyukoDat) : null,
    };
    return jucuKizaiHeadData;
  } catch (e) {
    console.log(e);
  }
};

/**
 * 受注機材ヘッダー新規追加
 * @param juchuKizaiHeadId 受注機材ヘッダーid
 * @param juchuKizaiHeadData 受注機材ヘッダーデータ
 * @param dspOrdNum 表示順
 * @param userNam ユーザー名
 * @returns
 */
export const AddJuchuKizaiHead = async (
  juchuKizaiHeadId: number,
  juchuKizaiHeadData: JuchuKizaiHeadValues,
  juchuKizaiHeadKbn: number,
  userNam: string
) => {
  const newData: JuchuKizaiHead = {
    juchu_head_id: juchuKizaiHeadData.juchuHeadId,
    juchu_kizai_head_id: juchuKizaiHeadId,
    juchu_kizai_head_kbn: juchuKizaiHeadKbn,
    juchu_honbanbi_qty: juchuKizaiHeadData.juchuHonbanbiQty,
    nebiki_amt: juchuKizaiHeadData.nebikiAmt,
    mem: juchuKizaiHeadData.mem,
    head_nam: juchuKizaiHeadData.headNam,
    oya_juchu_kizai_head_id: null,
    ht_kbn: 0,
    add_dat: toJapanTimeString(),
    add_user: userNam,
  };
  try {
    const { error } = await InsertJuchuKizaiHead(newData);

    if (error) {
      console.error('Error adding new juchuKizaiHead:', error.message);
      return false;
    } else {
      console.log('New juchuKizaiHead added successfully:', newData);
      return true;
    }
  } catch (e) {
    console.error(e);
    return false;
  }
};

/**
 * 受注機材ヘッダー更新
 * @param juchuKizaiHeadData 受注機材ヘッダーデータ
 * @param userNam ユーザー名
 * @returns
 */
export const UpdJuchuKizaiHead = async (juchuKizaiHeadData: JuchuKizaiHeadValues, userNam: string) => {
  const updateData: JuchuKizaiHead = {
    juchu_head_id: juchuKizaiHeadData.juchuHeadId,
    juchu_kizai_head_id: juchuKizaiHeadData.juchuKizaiHeadId,
    juchu_kizai_head_kbn: juchuKizaiHeadData.juchuKizaiHeadKbn,
    juchu_honbanbi_qty: juchuKizaiHeadData.juchuHonbanbiQty,
    nebiki_amt: juchuKizaiHeadData.nebikiAmt,
    mem: juchuKizaiHeadData.mem,
    head_nam: juchuKizaiHeadData.headNam,
    oya_juchu_kizai_head_id: null,
    ht_kbn: 0,
    upd_dat: toJapanTimeString(),
    upd_user: userNam,
  };

  try {
    const { error } = await UpdateJuchuKizaiHead(updateData);

    if (error) {
      console.error('Error updating juchu kizai head:', error.message);
      return false;
    }
    console.log('juchu kizai head updated successfully');
    return true;
  } catch (e) {
    console.error('Exception while updating juchu kizai head:', e);
    return false;
  }
};

/**
 * 受注機材入出庫データ取得
 * @param juchuHeadId 受注ヘッダーid
 * @param juchuKizaiHeadId 受注機材ヘッダーid
 * @returns 受注機材入出庫データ
 */
export const GetJuchuKizaiNyushuko = async (juchuHeadId: number, juchuKizaiHeadId: number) => {
  try {
    const { data, error } = await SelectJuchuKizaiNyushuko(juchuHeadId, juchuKizaiHeadId);
    if (error) {
      console.error('GetEqHeader juchuDate error: ', error);
      return null;
    }

    const kicsShukoDat =
      data.find((d) => d.nyushuko_shubetu_id === 1 && d.nyushuko_basho_id === 1)?.nyushuko_dat ?? null;
    const kicsNyukoDat =
      data.find((d) => d.nyushuko_shubetu_id === 2 && d.nyushuko_basho_id === 1)?.nyushuko_dat ?? null;
    const yardShukoDat =
      data.find((d) => d.nyushuko_shubetu_id === 1 && d.nyushuko_basho_id === 2)?.nyushuko_dat ?? null;
    const yardNyukoDat =
      data.find((d) => d.nyushuko_shubetu_id === 2 && d.nyushuko_basho_id === 2)?.nyushuko_dat ?? null;

    const juchuKizaiNyushukoData = {
      juchuHeadId: juchuHeadId,
      juchuKizaiHeadId: juchuKizaiHeadId,
      kicsShukoDat: kicsShukoDat ? new Date(kicsShukoDat) : null,
      kicsNyukoDat: kicsNyukoDat ? new Date(kicsNyukoDat) : null,
      yardShukoDat: yardShukoDat ? new Date(yardShukoDat) : null,
      yardNyukoDat: yardNyukoDat ? new Date(yardNyukoDat) : null,
    };

    return juchuKizaiNyushukoData;
  } catch (e) {
    console.error(e);
    return null;
  }
};

/**
 * 受注機材入出庫新規追加
 * @param juchuKizaiHeadId 受注機材ヘッダーid
 * @param juchuKizaiHeadData 受注機材ヘッダーデータ
 * @param userNam ユーザー名
 * @returns
 */
export const AddJuchuKizaiNyushuko = async (
  juchuHeadId: number,
  juchuKizaiHeadId: number,
  kicsShukoDat: Date | null,
  yardShukoDat: Date | null,
  kicsNyukoDat: Date | null,
  yardNyukoDat: Date | null,
  userNam: string
) => {
  const dates = [kicsShukoDat, yardShukoDat, kicsNyukoDat, yardNyukoDat];
  for (let i = 0; i < dates.length; i++) {
    const currentDate = dates[i];
    if (!currentDate) continue;
    const newData: JuchuKizaiNyushuko = {
      juchu_head_id: juchuHeadId,
      juchu_kizai_head_id: juchuKizaiHeadId,
      nyushuko_shubetu_id: i === 0 || i === 1 ? 1 : 2,
      nyushuko_basho_id: i === 0 || i === 2 ? 1 : 2,
      nyushuko_dat: toJapanTimeString(currentDate),
      add_dat: toJapanTimeString(),
      add_user: userNam,
    };

    try {
      const { error } = await InsertJuchuKizaiNyushuko(newData);

      if (error) {
        console.error('Error adding kizai Nyushuko:', error.message);
        return false;
      } else {
        console.log('kizai Nyushuko added successfully:', newData);
      }
    } catch (e) {
      console.error('Exception while adding kizai Nyushuko:', e);
    }
  }
  return true;
};

/**
 * 受注機材入出庫更新
 * @param juchuKizaiHeadData 受注機材ヘッダーデータ
 * @param userNam ユーザー名
 * @returns
 */
export const UpdJuchuKizaiNyushuko = async (
  juchuHeadId: number,
  juchuKizaiHeadId: number,
  kicsShukoDat: Date | null,
  yardShukoDat: Date | null,
  kicsNyukoDat: Date | null,
  yardNyukoDat: Date | null,
  userNam: string
) => {
  const dates = [kicsShukoDat, yardShukoDat, kicsNyukoDat, yardNyukoDat];
  for (let i = 0; i < dates.length; i++) {
    const currentDate = dates[i];
    const data =
      currentDate !== null
        ? {
            juchu_head_id: juchuHeadId,
            juchu_kizai_head_id: juchuKizaiHeadId,
            nyushuko_shubetu_id: i === 0 || i === 1 ? 1 : 2,
            nyushuko_basho_id: i === 0 || i === 2 ? 1 : 2,
            nyushuko_dat: toJapanTimeString(currentDate),
          }
        : null;

    const confirmData = {
      juchu_head_id: juchuHeadId,
      juchu_kizai_head_id: juchuKizaiHeadId,
      nyushuko_shubetu_id: i === 0 || i === 1 ? 1 : 2,
      nyushuko_basho_id: i === 0 || i === 2 ? 1 : 2,
    };

    try {
      const selectData = await SelectJuchuKizaiNyushukoConfirm(confirmData);

      if (selectData.data && data) {
        const { error: updateError } = await UpdateJuchuKizaiNyushuko({
          ...data,
          upd_dat: toJapanTimeString(),
          upd_user: userNam,
        });
        if (updateError) {
          console.error('Error updating kizai nyushuko:', updateError.message);
          continue;
        }
      } else if (selectData && !data) {
        const { error: deleteError } = await DeleteJchuKizaiNyushuko(confirmData);
        if (deleteError) {
          console.error('Error delete kizai nyushuko:', deleteError.message);
          continue;
        }
      } else if (!selectData && data) {
        const { error: insertError } = await InsertJuchuKizaiNyushuko({
          ...data,
          add_dat: toJapanTimeString(),
          add_user: userNam,
        });
        if (insertError) {
          console.error('Error updating kizai nyushuko:', insertError.message);
          continue;
        }
      }
      console.log('kizai nyushuko updated successfully:', data);
    } catch (e) {
      console.error('Exception while updating kizai nyushuko:', e);
      break;
    }
  }
  return true;
};

/**
 * 受注機材明細リスト取得
 * @param juchuHeadId 受注ヘッダーid
 * @param juchuKizaiHeadId 受注機材ヘッダーid
 * @returns 受注機材明細リスト
 */
export const GetJuchuKizaiMeisai = async (juchuHeadId: number, juchuKizaiHeadId: number) => {
  try {
    const { data: eqList, error: eqListError } = await SelectJuchuKizaiMeisai(juchuHeadId, juchuKizaiHeadId);
    if (eqListError) {
      console.error('GetEqList eqList error : ', eqListError);
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

    const juchuKizaiMeisaiData: JuchuKizaiMeisaiValues[] = eqList.map((d) => ({
      juchuHeadId: d.juchu_head_id,
      juchuKizaiHeadId: d.juchu_kizai_head_id,
      juchuKizaiMeisaiId: d.juchu_kizai_meisai_id,
      idoDenId: d.ido_den_id,
      idoDenDat: d.ido_den_dat ? new Date(d.ido_den_dat) : null,
      idoSijiId: d.ido_siji_id,
      shozokuId: d.shozoku_id,
      shozokuNam: d.shozoku_nam ?? '',
      mem: d.mem,
      kizaiId: d.kizai_id,
      kizaiTankaAmt: eqTanka.find((t) => t.kizai_id === d.kizai_id)?.kizai_tanka_amt || 0,
      kizaiNam: d.kizai_nam ?? '',
      kizaiQty: d.kizai_qty ?? 0,
      planKizaiQty: d.plan_kizai_qty,
      planYobiQty: d.plan_yobi_qty,
      planQty: d.plan_qty,
      delFlag: false,
      saveFlag: true,
    }));
    return juchuKizaiMeisaiData;
  } catch (e) {
    console.log(e);
  }
};

/**
 * 受注機材明細id最大値取得
 * @param juchuHeadId 受注ヘッダーid
 * @param juchuKizaiHeadId 受注機材ヘッダーid
 * @returns 受注機材明細id最大値
 */
export const GetJuchuKizaiMeisaiMaxId = async (juchuHeadId: number, juchuKizaiHeadId: number) => {
  try {
    const { data, error } = await SelectJuchuKizaiMeisaiMaxId(juchuHeadId, juchuKizaiHeadId);
    if (!error) {
      console.log('GetMaxId : ', data);
      return data;
    }
  } catch (e) {
    console.error(e);
  }
};

/**
 * 受注機材明細新規追加
 * @param juchuKizaiMeisaiData 受注機材明細データ
 * @param userNam ユーザー名
 * @returns
 */
export const AddJuchuKizaiMeisai = async (juchuKizaiMeisaiData: JuchuKizaiMeisaiValues[], userNam: string) => {
  const newData: JuchuKizaiMeisai[] = juchuKizaiMeisaiData.map((d) => ({
    juchu_head_id: d.juchuHeadId,
    juchu_kizai_head_id: d.juchuKizaiHeadId,
    juchu_kizai_meisai_id: d.juchuKizaiMeisaiId,
    kizai_id: d.kizaiId,
    kizai_tanka_amt: d.kizaiTankaAmt,
    plan_kizai_qty: d.planKizaiQty,
    plan_yobi_qty: d.planYobiQty,
    mem: d.mem,
    keep_qty: null,
    add_dat: toJapanTimeString(),
    add_user: userNam,
    shozoku_id: d.shozokuId,
  }));

  try {
    const { error } = await InsertJuchuKizaiMeisai(newData);

    if (error) {
      console.error('Error adding kizai meisai:', error.message);
      return false;
    } else {
      console.log('kizai meisai added successfully:', newData);
      return true;
    }
  } catch (e) {
    console.error('Exception while adding kizai meisai:', e);
    return false;
  }
};

/**
 * 受注機材明細更新
 * @param juchuKizaiMeisaiData 受注機材明細データ
 * @param userNam ユーザー名
 * @returns
 */
export const UpdJuchuKizaiMeisai = async (juchuKizaiMeisaiData: JuchuKizaiMeisaiValues[], userNam: string) => {
  const updateData: JuchuKizaiMeisai[] = juchuKizaiMeisaiData.map((d) => ({
    juchu_head_id: d.juchuHeadId,
    juchu_kizai_head_id: d.juchuKizaiHeadId,
    juchu_kizai_meisai_id: d.juchuKizaiMeisaiId,
    kizai_id: d.kizaiId,
    kizai_tanka_amt: d.kizaiTankaAmt,
    plan_kizai_qty: d.planKizaiQty,
    plan_yobi_qty: d.planYobiQty,
    mem: d.mem,
    keep_qty: null,
    upd_dat: toJapanTimeString(),
    upd_user: userNam,
    shozoku_id: d.shozokuId,
  }));

  try {
    for (const data of updateData) {
      const { error } = await UpdateJuchuKizaiMeisai(data);

      if (error) {
        console.error('Error updating juchu kizai meisai:', error.message);
        continue;
      }
      console.log('juchu kizai meisai updated successfully:', data);
    }
    return true;
  } catch (e) {
    console.error('Exception while updating juchu kizai meisai:', e);
    return false;
  }
};

/**
 * 受注機材明細削除
 * @param juchuHeadId 受注ヘッダーid
 * @param juchuKizaiHeadId 受注機材ヘッダーid
 * @param juchuKizaiMeisaiIds 受注機材明細id
 */
export const DelJuchuKizaiMeisai = async (
  juchuHeadId: number,
  juchuKizaiHeadId: number,
  juchuKizaiMeisaiIds: number[]
) => {
  try {
    const { error } = await DeleteJuchuKizaiMeisai(juchuHeadId, juchuKizaiHeadId, juchuKizaiMeisaiIds);

    if (error) {
      console.error('Error delete kizai meisai:', error.message);
    }
  } catch (e) {
    console.error(e);
  }
};

/**
 * 移動伝票id最大値取得
 * @returns 移動伝票id最大値
 */
export const GetIdoDenMaxId = async () => {
  try {
    const { data, error } = await SelectIdoDenMaxId();
    if (error) {
      return null;
    }
    console.log('GetMaxId : ', data);
    return data;
  } catch (e) {
    console.error(e);
  }
};

/**
 * 移動伝票新規追加
 * @param newIdoDenId 新規移動伝票id
 * @param idoKizaiData 移動伝票データ
 * @param userNam ユーザー名
 * @returns
 */
export const AddIdoDen = async (newIdoDenId: number, idoKizaiData: JuchuKizaiMeisaiValues[], userNam: string) => {
  const newData: IdoDen[] = idoKizaiData.map((d, index) => ({
    ido_den_id: newIdoDenId + index,
    ido_den_dat: toISOStringYearMonthDay(d.idoDenDat as Date),
    ido_siji_id: d.shozokuId,
    ido_sagyo_id: d.shozokuId,
    ido_sagyo_nam: d.shozokuNam,
    kizai_id: d.kizaiId,
    plan_qty: d.planQty,
    result_qty: null,
    juchu_head_id: d.juchuHeadId,
    juchu_kizai_head_id: d.juchuKizaiHeadId,
    juchu_kizai_meisai_id: d.juchuKizaiMeisaiId,
    add_dat: toJapanTimeString(),
    add_user: userNam,
  }));

  try {
    const { error } = await InsertIdoDen(newData);

    if (error) {
      console.error('Error adding ido den:', error.message);
      return false;
    } else {
      console.log('ido den added successfully:', newData);
      return true;
    }
  } catch (e) {
    console.error('Exception while adding ido den:', e);
    return false;
  }
};

/**
 * 移動伝票更新
 * @param idoKizaiData 移動伝票データ
 * @param userNam ユーザー名
 * @returns
 */
export const UpdIdoDen = async (idoKizaiData: JuchuKizaiMeisaiValues[], userNam: string) => {
  const updateData: IdoDen[] = idoKizaiData.map((d) => {
    if (!d.idoDenId) {
      throw new Error();
    }
    return {
      ido_den_id: d.idoDenId,
      ido_den_dat: toISOStringYearMonthDay(d.idoDenDat as Date),
      ido_siji_id: d.shozokuId,
      ido_sagyo_id: d.shozokuId,
      ido_sagyo_nam: d.shozokuNam,
      kizai_id: d.kizaiId,
      plan_qty: d.planQty,
      result_qty: null,
      juchu_head_id: d.juchuHeadId,
      juchu_kizai_head_id: d.juchuKizaiHeadId,
      juchu_kizai_meisai_id: d.juchuKizaiMeisaiId,
      upd_dat: toJapanTimeString(),
      upd_user: userNam,
    };
  });

  try {
    for (const data of updateData) {
      const { error } = await UpdateIdoDen(data);
      if (error) {
        console.error('Error updating ido den:', error.message);
        continue;
      }
      console.log('ido den updated successfully:', data);
    }
    return true;
  } catch (e) {
    console.error('Exception while updating ido den:', e);
    return false;
  }
};

/**
 * 移動伝票削除
 * @param idoDenIds 移動伝票id
 */
export const DelIdoDen = async (idoDenIds: number[]) => {
  try {
    const { error } = await DeleteIdoDen(idoDenIds);

    if (error) {
      console.error('Error delete ido den:', error.message);
    }
  } catch (e) {
    console.error(e);
  }
};

/**
 * 機材在庫テーブル用データ取得
 * @param juchuHeadId 受注ヘッダーid
 * @param juchuKizaiHeadId 受注機材ヘッダーid
 * @param kizaiId 機材id
 * @param planQty 使用数
 * @param date 開始日
 * @returns 機材在庫テーブル用データ
 */
export const GetStockList = async (juchuHeadId: number, juchuKizaiHeadId: number, kizaiId: number, date: Date) => {
  const stringDate = toISOStringYearMonthDay(date);
  try {
    //console.log('DB Connected');
    const result: QueryResult<StockTableValues> = await SelectStockList(
      juchuHeadId,
      juchuKizaiHeadId,
      kizaiId,
      stringDate
    );
    const data: StockTableValues[] = result.rows;
    return data;
  } catch (e) {
    console.error(e);
    return [];
  }
};

/**
 * 受注機材本番日取得
 * @param juchuHeadId 受注ヘッダーid
 * @param juchuKizaiHeadId 受注機材ヘッダーid
 * @returns 受注機材本番日
 */
export const GetHonbanbi = async (juchuHeadId: number, juchuKizaiHeadId: number) => {
  try {
    const { data, error } = await SelectHonbanbi(juchuHeadId, juchuKizaiHeadId);
    if (error) {
      console.error('GetHonbanbi honbanbi error : ', error);
      return [];
    }

    const juchuKizaiHonbanbiData: JuchuKizaiHonbanbiValues[] = data.map((d) => ({
      juchuHeadId: d.juchu_head_id,
      juchuKizaiHeadId: d.juchu_kizai_head_id,
      juchuHonbanbiShubetuId: d.juchu_honbanbi_shubetu_id,
      juchuHonbanbiDat: new Date(d.juchu_honbanbi_dat),
      mem: d.mem,
      juchuHonbanbiAddQty: d.juchu_honbanbi_add_qty,
    }));

    return juchuKizaiHonbanbiData;
  } catch (e) {
    console.error(e);
  }
};

/**
 * 受注機材本番日データの存在確認
 * @param juchuHeadId 受注ヘッダーid
 * @param juchuKizaiHeadId 受注機材ヘッダーid
 * @param juchuHonbanbiData 受注機材本番日データ
 * @returns あり：true　なし：false
 */
export const ConfirmHonbanbi = async (
  juchuHeadId: number,
  juchuKizaiHeadId: number,
  juchuHonbanbiShubetuId: number,
  juchuHonbanbiDat: Date
) => {
  try {
    const { error } = await SelectHonbanbiConfirm(
      juchuHeadId,
      juchuKizaiHeadId,
      juchuHonbanbiShubetuId,
      toISOStringYearMonthDay(juchuHonbanbiDat)
    );
    if (error) {
      console.error('ConfirmHonbanbi error : ', error);
      return false;
    }
    return true;
  } catch (e) {
    console.error(e);
    return false;
  }
};

/**
 * 受注機材本番日新規追加(1件)
 * @param juchuHeadId 受注ヘッダーid
 * @param juchuKizaiHeadId 受注機材ヘッダーid
 * @param juchuHonbanbiData 受注機材本番日データ
 * @param userNam ユーザー名
 * @returns
 */
export const AddHonbanbi = async (
  juchuHeadId: number,
  juchuKizaiHeadId: number,
  juchuHonbanbiData: JuchuKizaiHonbanbiValues,
  userNam: string
) => {
  const newData: JuchuKizaiHonbanbi = {
    juchu_head_id: juchuHeadId,
    juchu_kizai_head_id: juchuKizaiHeadId,
    juchu_honbanbi_shubetu_id: juchuHonbanbiData.juchuHonbanbiShubetuId,
    juchu_honbanbi_dat: toISOStringYearMonthDay(juchuHonbanbiData.juchuHonbanbiDat),
    mem: juchuHonbanbiData.mem ? juchuHonbanbiData.mem : null,
    juchu_honbanbi_add_qty: juchuHonbanbiData.juchuHonbanbiAddQty,
    add_dat: toJapanTimeString(),
    add_user: userNam,
  };
  try {
    const { error } = await InsertHonbanbi(newData);
    if (error) {
      console.log('Error Add honbanbi:', error.message);
      return false;
    }
    console.log('honbanbi add successfully:', newData);
    return true;
  } catch (e) {
    console.log(e);
  }
};

/**
 * 受注機材本番日新規追加(複数件)
 * @param juchuHeadId 受注ヘッダーid
 * @param juchuKizaiHeadId 受注機材ヘッダーid
 * @param juchuHonbanbiData 受注機材本番日データ
 * @param userNam ユーザー名
 * @returns
 */
export const AddAllHonbanbi = async (
  juchuHeadId: number,
  juchuKizaiHeadId: number,
  juchuHonbanbiData: JuchuKizaiHonbanbiValues[],
  userNam: string
) => {
  const newData: JuchuKizaiHonbanbi[] = juchuHonbanbiData.map((d) => ({
    juchu_head_id: juchuHeadId,
    juchu_kizai_head_id: juchuKizaiHeadId,
    juchu_honbanbi_shubetu_id: d.juchuHonbanbiShubetuId,
    juchu_honbanbi_dat: toISOStringYearMonthDay(d.juchuHonbanbiDat),
    mem: d.mem ? d.mem : null,
    juchu_honbanbi_add_qty: d.juchuHonbanbiAddQty,
    add_dat: toJapanTimeString(),
    add_user: userNam,
  }));
  try {
    const { error } = await InsertAllHonbanbi(newData);
    if (error) {
      console.error('Error Add honbanbi:', error.message);
      return false;
    }
    console.log('honbanbi addall successfully:', newData);
    return true;
  } catch (e) {
    console.log(e);
  }
};

/**
 * 受注機材入出庫本番日更新
 * @param juchuHeadId 受注ヘッダーid
 * @param juchuKizaiHeadId 受注機材ヘッダーid
 * @param juchuHonbanbiData 受注機材本番日データ
 * @param userNam ユーザー名
 * @returns
 */
export const UpdNyushukoHonbanbi = async (
  juchuHeadId: number,
  juchuKizaiHeadId: number,
  juchuHonbanbiData: JuchuKizaiHonbanbiValues,
  userNam: string
) => {
  const updateData: JuchuKizaiHonbanbi = {
    juchu_head_id: juchuHeadId,
    juchu_kizai_head_id: juchuKizaiHeadId,
    juchu_honbanbi_shubetu_id: juchuHonbanbiData.juchuHonbanbiShubetuId,
    juchu_honbanbi_dat: toISOStringYearMonthDay(juchuHonbanbiData.juchuHonbanbiDat),
    mem: juchuHonbanbiData.mem ? juchuHonbanbiData.mem : null,
    juchu_honbanbi_add_qty: juchuHonbanbiData.juchuHonbanbiAddQty,
    upd_dat: toJapanTimeString(),
    upd_user: userNam,
  };

  try {
    const { error } = await UpdateNyushukoHonbanbi(updateData);
    if (error) {
      console.error('Error updating honbanbi:', error.message);
      return false;
    }
    console.log('honbanbi updated successfully:', updateData);
    return true;
  } catch (e) {
    console.error(e);
    return false;
  }
};

/**
 * 受注機材本番日更新
 * @param juchuHeadId 受注ヘッダーid
 * @param juchuKizaiHeadId 受注機材ヘッダーid
 * @param juchuHonbanbiData 受注機材本番日データ
 * @param userNam ユーザー名
 * @returns
 */
export const UpdHonbanbi = async (
  juchuHeadId: number,
  juchuKizaiHeadId: number,
  juchuHonbanbiData: JuchuKizaiHonbanbiValues,
  userNam: string
) => {
  const updateData: JuchuKizaiHonbanbi = {
    juchu_head_id: juchuHeadId,
    juchu_kizai_head_id: juchuKizaiHeadId,
    juchu_honbanbi_shubetu_id: juchuHonbanbiData.juchuHonbanbiShubetuId,
    juchu_honbanbi_dat: toISOStringYearMonthDay(juchuHonbanbiData.juchuHonbanbiDat),
    mem: juchuHonbanbiData.mem ? juchuHonbanbiData.mem : null,
    juchu_honbanbi_add_qty: juchuHonbanbiData.juchuHonbanbiAddQty,
    upd_dat: toJapanTimeString(),
    upd_user: userNam,
  };

  try {
    const { error } = await UpdateHonbanbi(updateData);
    if (error) {
      console.error('Error updating honbanbi:', error.message);
      return false;
    }
    console.log('honbanbi updated successfully:', updateData);
    return true;
  } catch (e) {
    console.error(e);
    return false;
  }
};

/**
 * 受注機材本番日削除
 * @param juchuHeadId 受注ヘッダーid
 * @param juchuKizaiHeadId 受注機材ヘッダーid
 * @param juchuHonbanbiData 受注機材本番日データ
 */
export const DelHonbanbi = async (
  juchuHeadId: number,
  juchuKizaiHeadId: number,
  juchuHonbanbiShubetuId: number,
  juchuHonbanbiDat: Date
) => {
  try {
    const { error } = await DeleteHonbanbi(
      juchuHeadId,
      juchuKizaiHeadId,
      juchuHonbanbiShubetuId,
      toISOStringYearMonthDay(juchuHonbanbiDat)
    );

    if (error) {
      console.error('Error delete honbanbi:', error.message);
    }
  } catch (e) {
    console.error(e);
  }
};

/**
 * 受注機材本番日(使用中)削除
 * @param juchuHeadId 受注ヘッダーid
 * @param juchuKizaiHeadId 受注機材ヘッダーid
 * @param juchuHonbanbiData 受注機材本番日データ
 */
export const DelSiyouHonbanbi = async (juchuHeadId: number, juchuKizaiHeadId: number) => {
  try {
    const { error } = await DeleteSiyouHonbanbi(juchuHeadId, juchuKizaiHeadId);

    if (error) {
      console.error('Error delete honbanbi:', error.message);
    }
  } catch (e) {
    console.error(e);
  }
};
