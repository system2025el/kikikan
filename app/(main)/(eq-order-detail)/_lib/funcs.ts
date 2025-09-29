'use server';

import { QueryResult } from 'pg';

import { selectKokyaku } from '@/app/_lib/db/tables/m-kokyaku';
import { selectDetailStockList } from '@/app/_lib/db/tables/stock-table';
import { deleteIdoDen, insertIdoDen, selectIdoDenMaxId, updateIdoDen } from '@/app/_lib/db/tables/t-ido-den';
import {
  deleteJuchuContainerMeisai,
  insertJuchuContainerMeisai,
  selectJuchuContainerMeisaiMaxId,
  updateJuchuContainerMeisai,
} from '@/app/_lib/db/tables/t-juchu-ctn-meisai';
import { selectJuchuHead } from '@/app/_lib/db/tables/t-juchu-head';
import {
  insertJuchuKizaiHead,
  selectJuchuKizaiHead,
  selectJuchuKizaiHeadMaxId,
  updateJuchuKizaiHead,
} from '@/app/_lib/db/tables/t-juchu-kizai-head';
import {
  deleteHonbanbi,
  deleteSiyouHonbanbi,
  insertAllHonbanbi,
  insertHonbanbi,
  selectHonbanbi,
  selectHonbanbiConfirm,
  updateHonbanbi,
  updateNyushukoHonbanbi,
} from '@/app/_lib/db/tables/t-juchu-kizai-honbanbi';
import {
  deleteJuchuKizaiMeisai,
  insertJuchuKizaiMeisai,
  selectJuchuKizaiMeisaiKizaiTanka,
  selectJuchuKizaiMeisaiMaxId,
  updateJuchuKizaiMeisai,
} from '@/app/_lib/db/tables/t-juchu-kizai-meisai';
import {
  deleteJchuKizaiNyushuko,
  insertJuchuKizaiNyushuko,
  selectJuchuKizaiNyushuko,
  selectJuchuKizaiNyushukoConfirm,
  updateJuchuKizaiNyushuko,
} from '@/app/_lib/db/tables/t-juchu-kizai-nyushuko';
import { selectJuchuContainerMeisai } from '@/app/_lib/db/tables/v-juchu-ctn-meisai';
import { selectJuchuKizaiMeisai, selectOyaJuchuKizaiMeisai } from '@/app/_lib/db/tables/v-juchu-kizai-meisai';
import { JuchuCtnMeisai } from '@/app/_lib/db/types/t_juchu_ctn_meisai-type';
import { IdoDen } from '@/app/_lib/db/types/t-ido-den-type';
import { JuchuKizaiHead } from '@/app/_lib/db/types/t-juchu-kizai-head-type';
import { JuchuKizaiHonbanbi } from '@/app/_lib/db/types/t-juchu-kizai-honbanbi-type';
import { JuchuKizaiMeisai } from '@/app/_lib/db/types/t-juchu-kizai-meisai-type';
import { JuchuKizaiNyushuko } from '@/app/_lib/db/types/t-juchu-kizai-nyushuko-type';

import { toISOStringYearMonthDay, toJapanTimeString } from '../../_lib/date-conversion';
import {
  JuchuContainerMeisaiValues,
  JuchuKizaiHeadValues,
  JuchuKizaiHonbanbiValues,
  JuchuKizaiMeisaiValues,
  StockTableValues,
} from '../eq-main-order-detail/[juchu_head_id]/[juchu_kizai_head_id]/[mode]/_lib/types';
import { DetailOerValues, OyaJuchuKizaiMeisaiValues } from './types';

/**
 * 明細用受注ヘッダー取得
 * @param juchuHeadId 受注ヘッダーID
 * @returns 受注ヘッダーデータ
 */
export const getDetailJuchuHead = async (juchuHeadId: number) => {
  try {
    const juchuData = await selectJuchuHead(juchuHeadId);

    if (juchuData.error || !juchuData.data) {
      console.error('GetOrder juchu error : ', juchuData.error);
      throw new Error('受注ヘッダーが存在しません');
    }

    if (!juchuData.data.kokyaku_id) {
      console.error('GetOrder juchu error : ', juchuData.error);
      throw new Error('不正な受注ヘッダーです');
    }

    const kokyakuData = await selectKokyaku(juchuData.data.kokyaku_id);

    if (kokyakuData.error || !kokyakuData.data) {
      console.error('GetOrder kokyaku error : ', kokyakuData.error);
      throw new Error('顧客が存在しません');
    }
    const order: DetailOerValues = {
      juchuHeadId: juchuData.data.juchu_head_id,
      delFlg: juchuData.data.del_flg ?? 0,
      juchuSts: juchuData.data.juchu_sts ?? 0,
      juchuDat: juchuData.data.juchu_dat ? new Date(juchuData.data.juchu_dat) : new Date(),
      juchuRange:
        juchuData.data.juchu_str_dat && juchuData.data.juchu_end_dat
          ? [new Date(juchuData.data.juchu_str_dat), new Date(juchuData.data.juchu_end_dat)]
          : null,
      nyuryokuUser: juchuData.data.nyuryoku_user ?? '',
      koenNam: juchuData.data.koen_nam ?? '',
      koenbashoNam: juchuData.data.koenbasho_nam,
      kokyaku: {
        kokyakuId: juchuData.data.kokyaku_id,
        kokyakuNam: kokyakuData.data.kokyaku_nam,
        kokyakuRank: kokyakuData.data.kokyaku_rank,
      },
      kokyakuTantoNam: juchuData.data.kokyaku_tanto_nam,
      mem: juchuData.data.mem,
      nebikiAmt: juchuData.data.nebiki_amt,
      zeiKbn: juchuData.data.zei_kbn ?? 2,
    };
    console.log('GetOrder order : ', order);
    return order;
  } catch (e) {
    console.log(e);
  }
};

/**
 * 受注機材ヘッダーid最大値取得
 * @returns 受注機材ヘッダーid最大値
 */
export const getJuchuKizaiHeadMaxId = async (juchuHeadId: number) => {
  try {
    const { data, error } = await selectJuchuKizaiHeadMaxId(juchuHeadId);
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
 * 受注機材入出庫データ取得
 * @param juchuHeadId 受注ヘッダーid
 * @param juchuKizaiHeadId 受注機材ヘッダーid
 * @returns 受注機材入出庫データ
 */
export const getJuchuKizaiNyushuko = async (juchuHeadId: number, juchuKizaiHeadId: number) => {
  try {
    const { data, error } = await selectJuchuKizaiNyushuko(juchuHeadId, juchuKizaiHeadId);
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
export const addJuchuKizaiNyushuko = async (
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
      const { error } = await insertJuchuKizaiNyushuko(newData);

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
export const updJuchuKizaiNyushuko = async (
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
      const selectData = await selectJuchuKizaiNyushukoConfirm(confirmData);

      if (selectData.data && data) {
        const { error: updateError } = await updateJuchuKizaiNyushuko({
          ...data,
          upd_dat: toJapanTimeString(),
          upd_user: userNam,
        });
        if (updateError) {
          console.error('Error updating kizai nyushuko:', updateError.message);
          continue;
        }
      } else if (selectData.data && !data) {
        const { error: deleteError } = await deleteJchuKizaiNyushuko(confirmData);
        if (deleteError) {
          console.error('Error delete kizai nyushuko:', deleteError.message);
          continue;
        }
      } else if (!selectData.data && data) {
        const { error: insertError } = await insertJuchuKizaiNyushuko({
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
 * 親受注機材明細リスト取得
 * @param juchuHeadId 受注ヘッダーid
 * @param juchuKizaiHeadId 受注機材ヘッダーid
 * @returns 受注機材明細リスト
 */
export const getOyaJuchuKizaiMeisai = async (juchuHeadId: number, juchuKizaiHeadId: number) => {
  try {
    const { data: eqList, error: eqListError } = await selectOyaJuchuKizaiMeisai(juchuHeadId, juchuKizaiHeadId);
    if (eqListError) {
      console.error('GetEqList eqList error : ', eqListError);
      return [];
    }

    const { data: eqTanka, error: eqTankaError } = await selectJuchuKizaiMeisaiKizaiTanka(
      juchuHeadId,
      juchuKizaiHeadId
    );
    if (eqTankaError) {
      console.error('GetEqHeader eqTanka error : ', eqTankaError);
      return [];
    }

    const juchuKizaiMeisaiData: OyaJuchuKizaiMeisaiValues[] = eqList.map((d) => ({
      juchuHeadId: d.juchu_head_id,
      juchuKizaiHeadId: d.juchu_kizai_head_id,
      juchuKizaiMeisaiId: d.juchu_kizai_meisai_id,
      shozokuId: d.shozoku_id,
      shozokuNam: d.shozoku_nam ?? '',
      kizaiId: d.kizai_id,
      kizaiTankaAmt: eqTanka.find((t) => t.kizai_id === d.kizai_id)?.kizai_tanka_amt || 0,
      kizaiNam: d.kizai_nam ?? '',
      planKizaiQty: d.plan_kizai_qty,
      planYobiQty: d.plan_yobi_qty,
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
export const getJuchuKizaiMeisaiMaxId = async (juchuHeadId: number, juchuKizaiHeadId: number) => {
  try {
    const { data, error } = await selectJuchuKizaiMeisaiMaxId(juchuHeadId, juchuKizaiHeadId);
    if (!error) {
      console.log('GetMaxId : ', data);
      return data;
    }
  } catch (e) {
    console.error(e);
  }
};

/**
 * 受注コンテナ明細id最大値取得
 * @param juchuHeadId 受注ヘッダーid
 * @param juchuKizaiHeadId 受注機材ヘッダーid
 * @returns 受注コンテナ明細id最大値
 */
export const getJuchuContainerMeisaiMaxId = async (juchuHeadId: number, juchuKizaiHeadId: number) => {
  try {
    const { data, error } = await selectJuchuContainerMeisaiMaxId(juchuHeadId, juchuKizaiHeadId);
    if (!error) {
      console.log('GetContainerMaxId : ', data);
      return data;
    }
  } catch (e) {
    console.error(e);
  }
};

/**
 * 受注コンテナ明細リスト取得
 * @param juchuHeadId 受注ヘッダーid
 * @param juchuKizaiHeadId 受注機材ヘッダーid
 * @returns 受注コンテナ明細リスト
 */
export const getJuchuContainerMeisai = async (juchuHeadId: number, juchuKizaiHeadId: number) => {
  try {
    const { data: containerData, error: containerError } = await selectJuchuContainerMeisai(
      juchuHeadId,
      juchuKizaiHeadId
    );

    if (containerError) {
      console.error('GetJuchuContainerMeisai containerData error : ', containerError);
      return [];
    }

    const juchuContainerMeisaiData: JuchuContainerMeisaiValues[] = containerData.map((d) => ({
      juchuHeadId: d.juchu_head_id,
      juchuKizaiHeadId: d.juchu_kizai_head_id,
      juchuKizaiMeisaiId: d.juchu_kizai_meisai_id,
      kizaiId: d.kizai_id,
      kizaiNam: d.kizai_nam,
      planKicsKizaiQty: d.kics_plan_kizai_qty,
      planYardKizaiQty: d.yard_plan_kizai_qty,
      planQty: d.kics_plan_kizai_qty + d.yard_plan_kizai_qty,
      mem: d.mem,
      delFlag: false,
      saveFlag: true,
    }));

    return juchuContainerMeisaiData;
  } catch (e) {
    console.error(e);
    return [];
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
export const getStockList = async (juchuHeadId: number, juchuKizaiHeadId: number, kizaiId: number, date: Date) => {
  const stringDate = toISOStringYearMonthDay(date);
  try {
    //console.log('DB Connected');
    const result: QueryResult<StockTableValues> = await selectDetailStockList(
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
 * 受注機材本番日新規追加(複数件)
 * @param juchuHeadId 受注ヘッダーid
 * @param juchuKizaiHeadId 受注機材ヘッダーid
 * @param juchuHonbanbiData 受注機材本番日データ
 * @param userNam ユーザー名
 * @returns
 */
export const addAllHonbanbi = async (
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
    const { error } = await insertAllHonbanbi(newData);
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
 * 受注機材本番日(使用中)削除
 * @param juchuHeadId 受注ヘッダーid
 * @param juchuKizaiHeadId 受注機材ヘッダーid
 * @param juchuHonbanbiData 受注機材本番日データ
 */
export const delSiyouHonbanbi = async (juchuHeadId: number, juchuKizaiHeadId: number) => {
  try {
    const { error } = await deleteSiyouHonbanbi(juchuHeadId, juchuKizaiHeadId);

    if (error) {
      console.error('Error delete honbanbi:', error.message);
    }
  } catch (e) {
    console.error(e);
  }
};
