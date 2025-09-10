import { selectActiveBumons } from '@/app/_lib/db/tables/m-bumon';
import { selectActiveEqpts, selectBundledEqpts } from '@/app/_lib/db/tables/m-kizai';
import { selectBundledEqptIds } from '@/app/_lib/db/tables/m-kizai-set';
import { deleteIdoDen, insertIdoDen, selectIdoDenMaxId, updateIdoDen } from '@/app/_lib/db/tables/t-ido-den';
import {
  insertJuchuKizaiHead,
  selectJuchuKizaiHead,
  updateJuchuKizaiHead,
} from '@/app/_lib/db/tables/t-juchu-kizai-head';
import {
  deleteHonbanbi,
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
  updateJuchuKizaiMeisai,
} from '@/app/_lib/db/tables/t-juchu-kizai-meisai';
import { selectJuchuKizaiMeisai } from '@/app/_lib/db/tables/v-juchu-kizai-meisai';
import { selectChosenEqptsDetails } from '@/app/_lib/db/tables/v-kizai-list';
import { IdoDen } from '@/app/_lib/db/types/t-ido-den-type';
import { JuchuKizaiHead } from '@/app/_lib/db/types/t-juchu-kizai-head-type';
import { JuchuKizaiHonbanbi } from '@/app/_lib/db/types/t-juchu-kizai-honbanbi-type';
import { JuchuKizaiMeisai } from '@/app/_lib/db/types/t-juchu-kizai-meisai-type';
import { toISOStringYearMonthDay, toJapanTimeString } from '@/app/(main)/_lib/date-conversion';
import { getJuchuKizaiNyushuko } from '@/app/(main)/(eq-order-detail)/_lib/funcs';

import {
  EqptSelection,
  JuchuKizaiHeadValues,
  JuchuKizaiHonbanbiValues,
  JuchuKizaiMeisaiValues,
  SelectedEqptsValues,
} from './types';

/**
 * メイン受注機材ヘッダー取得
 * @param juchuHeadId 受注ヘッダーid
 * @param juchuKizaiHeadId 受注機材ヘッダーid
 * @returns 受注機材ヘッダーデータ
 */
export const getJuchuKizaiHead = async (juchuHeadId: number, juchuKizaiHeadId: number) => {
  try {
    const juchuKizaiHeadData = await selectJuchuKizaiHead(juchuHeadId, juchuKizaiHeadId);

    if (juchuKizaiHeadData.error) {
      console.error('GetEqHeader juchuKizaiHead error : ', juchuKizaiHeadData.error);
      return null;
    }

    const juchuDate = await getJuchuKizaiNyushuko(juchuHeadId, juchuKizaiHeadId);

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
 * メイン受注機材ヘッダー新規追加
 * @param juchuKizaiHeadId 受注機材ヘッダーid
 * @param juchuKizaiHeadData 受注機材ヘッダーデータ
 * @param dspOrdNum 表示順
 * @param userNam ユーザー名
 * @returns
 */
export const addJuchuKizaiHead = async (
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
    const { error } = await insertJuchuKizaiHead(newData);

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
 * メイン受注機材ヘッダー更新
 * @param juchuKizaiHeadData 受注機材ヘッダーデータ
 * @param userNam ユーザー名
 * @returns
 */
export const updJuchuKizaiHead = async (juchuKizaiHeadData: JuchuKizaiHeadValues, userNam: string) => {
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
    const { error } = await updateJuchuKizaiHead(updateData);

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
 * メイン受注機材明細リスト取得
 * @param juchuHeadId 受注ヘッダーid
 * @param juchuKizaiHeadId 受注機材ヘッダーid
 * @returns 受注機材明細リスト
 */
export const getJuchuKizaiMeisai = async (juchuHeadId: number, juchuKizaiHeadId: number) => {
  try {
    const { data: eqList, error: eqListError } = await selectJuchuKizaiMeisai(juchuHeadId, juchuKizaiHeadId);
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

    const juchuKizaiMeisaiData: JuchuKizaiMeisaiValues[] = eqList.map((d) => ({
      juchuHeadId: d.juchu_head_id,
      juchuKizaiHeadId: d.juchu_kizai_head_id,
      juchuKizaiMeisaiId: d.juchu_kizai_meisai_id,
      idoDenId: d.ido_den_id,
      sagyoDenDat: d.sagyo_den_dat ? new Date(d.sagyo_den_dat) : null,
      sagyoSijiId: d.sagyo_siji_id,
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
 * メイン受注機材明細新規追加
 * @param juchuKizaiMeisaiData 受注機材明細データ
 * @param userNam ユーザー名
 * @returns
 */
export const addJuchuKizaiMeisai = async (juchuKizaiMeisaiData: JuchuKizaiMeisaiValues[], userNam: string) => {
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
    const { error } = await insertJuchuKizaiMeisai(newData);

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
 * メイン受注機材明細更新
 * @param juchuKizaiMeisaiData 受注機材明細データ
 * @param userNam ユーザー名
 * @returns
 */
export const updJuchuKizaiMeisai = async (juchuKizaiMeisaiData: JuchuKizaiMeisaiValues[], userNam: string) => {
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
      const { error } = await updateJuchuKizaiMeisai(data);

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
 * メイン受注機材明細削除
 * @param juchuHeadId 受注ヘッダーid
 * @param juchuKizaiHeadId 受注機材ヘッダーid
 * @param juchuKizaiMeisaiIds 受注機材明細id
 */
export const delJuchuKizaiMeisai = async (
  juchuHeadId: number,
  juchuKizaiHeadId: number,
  juchuKizaiMeisaiIds: number[]
) => {
  try {
    const { error } = await deleteJuchuKizaiMeisai(juchuHeadId, juchuKizaiHeadId, juchuKizaiMeisaiIds);

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
export const getIdoDenMaxId = async () => {
  try {
    const { data, error } = await selectIdoDenMaxId();
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
export const addIdoDen = async (newIdoDenId: number, idoKizaiData: JuchuKizaiMeisaiValues[], userNam: string) => {
  const newData: IdoDen[] = idoKizaiData.map((d, index) => ({
    ido_den_id: newIdoDenId + index,
    sagyo_den_dat: toISOStringYearMonthDay(d.sagyoDenDat as Date),
    sagyo_siji_id: d.shozokuId,
    sagyo_id: d.shozokuId,
    sagyo_kbn_id: 40,
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
    const { error } = await insertIdoDen(newData);

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
export const updIdoDen = async (idoKizaiData: JuchuKizaiMeisaiValues[], userNam: string) => {
  const updateData: IdoDen[] = idoKizaiData.map((d) => {
    if (!d.idoDenId) {
      throw new Error();
    }
    return {
      ido_den_id: d.idoDenId,
      sagyo_den_dat: toISOStringYearMonthDay(d.sagyoDenDat as Date),
      sagyo_siji_id: d.shozokuId,
      sagyo_id: d.shozokuId,
      sagyo_kbn_id: 40,
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
      const { error } = await updateIdoDen(data);
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
export const delIdoDen = async (idoDenIds: number[]) => {
  try {
    const { error } = await deleteIdoDen(idoDenIds);

    if (error) {
      console.error('Error delete ido den:', error.message);
    }
  } catch (e) {
    console.error(e);
  }
};

/**
 * 受注機材本番日取得
 * @param juchuHeadId 受注ヘッダーid
 * @param juchuKizaiHeadId 受注機材ヘッダーid
 * @returns 受注機材本番日
 */
export const getHonbanbi = async (juchuHeadId: number, juchuKizaiHeadId: number) => {
  try {
    const { data, error } = await selectHonbanbi(juchuHeadId, juchuKizaiHeadId);
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
export const confirmHonbanbi = async (
  juchuHeadId: number,
  juchuKizaiHeadId: number,
  juchuHonbanbiShubetuId: number,
  juchuHonbanbiDat: Date
) => {
  try {
    const { error } = await selectHonbanbiConfirm(
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
export const addHonbanbi = async (
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
    const { error } = await insertHonbanbi(newData);
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
 * 受注機材入出庫本番日更新
 * @param juchuHeadId 受注ヘッダーid
 * @param juchuKizaiHeadId 受注機材ヘッダーid
 * @param juchuHonbanbiData 受注機材本番日データ
 * @param userNam ユーザー名
 * @returns
 */
export const updNyushukoHonbanbi = async (
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
    const { error } = await updateNyushukoHonbanbi(updateData);
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
export const updHonbanbi = async (
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
    const { error } = await updateHonbanbi(updateData);
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
export const delHonbanbi = async (
  juchuHeadId: number,
  juchuKizaiHeadId: number,
  juchuHonbanbiShubetuId: number,
  juchuHonbanbiDat: Date
) => {
  try {
    const { error } = await deleteHonbanbi(
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
 * 機材選択で使う部門リストを取得する関数
 * @returns 無効化フラグなし、表示順部門の配列
 */
export const getBumonsForEqptSelection = async () => {
  try {
    const { data, error } = await selectActiveBumons();
    if (error) {
      console.error('DB情報取得エラー', error.message, error.cause, error.hint);
      throw error;
    }
    if (!data || data.length === 0) {
      return [];
    }
    const selectElements = data.map((d, index) => ({
      id: d.bumon_id,
      label: d.bumon_nam,
      tblDspNum: index,
    }));
    console.log('部門が', selectElements.length, '件');
    return selectElements;
  } catch (e) {
    console.error('例外が発生しました:', e);
    throw e;
  }
};

/**
 * 選ばれた機材に対するセットオプションを確認する関数
 * @param idList 選ばれた機材たちの機材IDリスト
 * @returns セットオプションの機材の配列、もともと選ばれていたり、なかった場合はから配列を返す
 */
export const checkSetoptions = async (idList: number[]) => {
  try {
    const setIdList = await selectBundledEqptIds(idList);
    console.log('setId List : ', setIdList.rows);
    const setIdListSet = new Set(setIdList.rows);
    const setIdListArray = [...setIdListSet].map((l) => l.kizai_id).filter((kizai_id) => !idList.includes(kizai_id));
    console.log('setIdListArray : ', setIdListArray);
    // セットオプションリストが空なら空配列を返して終了
    if (setIdListArray.length === 0) return [];
    const data = await selectBundledEqpts(setIdListArray);
    console.log('set options : ', data.rows);
    if (!data || data.rowCount === 0) {
      return [];
    }
    return data.rows;
  } catch (e) {
    console.error('例外が発生しました:', e);
    throw e;
  }
};

/**
 * 機材選択に表示するための機材リスト
 * @param query 検索キーワード
 * @returns
 */
export const getEqptsForEqptSelection = async (query: string = ''): Promise<EqptSelection[] | undefined> => {
  try {
    const data = await selectActiveEqpts(query);
    if (!data || data.rowCount === 0) {
      return [];
    }
    return data.rows;
  } catch (e) {
    console.error('例外が発生しました:', e);
    throw e;
  }
};

/**
 * 最終的に選ばれたすべの機材IDから、機材の配列を取得する関数
 * @param idList 最終的に選ばれたすべの機材IDの配列
 * @param rank 顧客ランク
 * @returns {SelectedEqptsValues[]} 表に渡す機材の配列
 */
export const getSelectedEqpts = async (idList: number[], rank: number) => {
  // const rankParse = (rank: number) => {};
  try {
    const { data, error } = await selectChosenEqptsDetails(idList);
    if (error) {
      console.error('DB情報取得エラー', error.message, error.cause, error.hint);
      throw error;
    }
    if (!data) return [];
    const selectedEqpts: SelectedEqptsValues[] = data.map((d) => ({
      kizaiId: d.kizai_id ?? 0,
      kizaiNam: d.kizai_nam ?? '',
      shozokuId: d.shozoku_id ?? 0,
      shozokuNam: d.shozoku_nam ?? '',
      kizaiGrpCod: d.kizai_grp_cod ?? '',
      dspOrdNum: d.dsp_ord_num ?? 0,
      regAmt: d.reg_amt ?? 0,
      rankAmt:
        rank === 1
          ? (d.rank_amt_1 ?? 0)
          : rank === 2
            ? (d.rank_amt_2 ?? 0)
            : rank === 3
              ? (d.rank_amt_3 ?? 0)
              : rank === 4
                ? (d.rank_amt_4 ?? 0)
                : rank === 5
                  ? (d.rank_amt_5 ?? 0)
                  : 0,
      kizaiQty: d.kizai_qty ?? 0,
    }));
    return selectedEqpts;
  } catch (e) {
    console.error('例外が発生しました:', e);
    throw e;
  }
};
