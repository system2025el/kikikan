'use server';

import { subDays } from 'date-fns';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { PoolClient } from 'pg';

import pool from '@/app/_lib/db/postgres';
import { selectMeisaiEqts } from '@/app/_lib/db/tables/m-kizai';
import { selectFilteredLocs } from '@/app/_lib/db/tables/m-koenbasho';
import { selectFilteredCustomers, selectKokyaku } from '@/app/_lib/db/tables/m-kokyaku';
import {
  deleteIdoDenJuchuFromOrder,
  insertIdoDenJuchu,
  selectIdoDenJuchuMaxId,
} from '@/app/_lib/db/tables/t-ido-den-juchu';
import { deleteJuchuCtnMeisaiFromOrder, insertJuchuContainerMeisai } from '@/app/_lib/db/tables/t-juchu-ctn-meisai';
import { insertJuchuHead, selectJuchuHead, selectMaxId, updateJuchuHead } from '@/app/_lib/db/tables/t-juchu-head';
import {
  deleteJuchuKizaiHead,
  insertJuchuKizaiHead,
  selectJuchuKizaiHead,
  selectJuchuKizaiHeadMaxId,
} from '@/app/_lib/db/tables/t-juchu-kizai-head';
import { deleteJuchuKizaiHonbanbiFromOrder, insertAllHonbanbi } from '@/app/_lib/db/tables/t-juchu-kizai-honbanbi';
import {
  deleteJuchuKizaiMeisaiFromOrder,
  insertJuchuKizaiMeisai,
  selectJuchuKizaiMeisaiKizaiTanka,
} from '@/app/_lib/db/tables/t-juchu-kizai-meisai';
import {
  deleteJuchuKizaiNyushukoFromOrder,
  insertJuchuKizaiNyushuko,
} from '@/app/_lib/db/tables/t-juchu-kizai-nyushuko';
import { selectJuchuSharyoMeisai } from '@/app/_lib/db/tables/t-juchu-sharyo-head';
import { deleteNyushukoCtnResultFromOrder } from '@/app/_lib/db/tables/t-nyushuko-ctn-result';
import { deleteNyushukoDenFromOrder, insertNyushukoDen } from '@/app/_lib/db/tables/t-nyushuko-den';
import { deleteNyushukoFixFromOrder } from '@/app/_lib/db/tables/t-nyushuko-fix';
import { deleteNyushukoResultFromOrder } from '@/app/_lib/db/tables/t-nyushuko-result';
import { selectJuchuContainerMeisai } from '@/app/_lib/db/tables/v-juchu-ctn-meisai';
import { selectJuchuKizaiHeadList } from '@/app/_lib/db/tables/v-juchu-kizai-head-lst';
import { selectJuchuKizaiMeisai } from '@/app/_lib/db/tables/v-juchu-kizai-meisai';
import { selectIdoJuchuKizaiMeisai } from '@/app/_lib/db/tables/v-juchu-kizai-meisai-sum';
import { selectJuchuSharyoHeadList } from '@/app/_lib/db/tables/v-juchu-sharyo-head-lst';
import { JuchuCtnMeisai } from '@/app/_lib/db/types/t_juchu_ctn_meisai-type';
import { IdoDenJuchu } from '@/app/_lib/db/types/t-ido-den-juchu-type';
import { JuchuHead } from '@/app/_lib/db/types/t-juchu-head-type';
import { JuchuKizaiHead } from '@/app/_lib/db/types/t-juchu-kizai-head-type';
import { JuchuKizaiHonbanbi } from '@/app/_lib/db/types/t-juchu-kizai-honbanbi-type';
import { JuchuKizaiMeisai } from '@/app/_lib/db/types/t-juchu-kizai-meisai-type';
import { JuchuKizaiNyushuko } from '@/app/_lib/db/types/t-juchu-kizai-nyushuko-type';
import { NyushukoDen } from '@/app/_lib/db/types/t-nyushuko-den-type';
import { toJapanTimeStampString, toJapanTimeString, toJapanYMDString } from '@/app/(main)/_lib/date-conversion';
import { getShukoDate } from '@/app/(main)/_lib/date-funcs';
import { FAKE_NEW_ID } from '@/app/(main)/(masters)/_lib/constants';

import {
  CopyDialogValue,
  CopyIdoJuchuKizaiMeisaiValues,
  CopyJuchuContainerMeisaiValues,
  CopyJuchuKizaiHeadValue,
  CopyJuchuKizaiHonbanbiValues,
  CopyJuchuKizaiMeisaiValues,
  CustomersDialogValues,
  EqTableValues,
  LocsDialogValues,
  OrderValues,
  VehicleTableValues,
} from './types';

/**
 * 受注ヘッダー取得
 * @param juchuHeadId 受注ヘッダーID
 * @returns 受注ヘッダーデータ
 */
export const getJuchuHead = async (juchuHeadId: number) => {
  try {
    const juchuData = await selectJuchuHead(juchuHeadId);

    if (juchuData.error || !juchuData.data) {
      console.error('GetOrder juchu error : ', juchuData.error, juchuHeadId);
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
    const order: OrderValues = {
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
        // kokyakuRank: kokyakuData.data.kokyaku_rank,
      },
      kokyakuTantoNam: juchuData.data.kokyaku_tanto_nam,
      mem: juchuData.data.mem,
      // nebikiAmt: juchuData.data.nebiki_amt,
      zeiKbn: juchuData.data.zei_kbn ?? 2,
    };
    console.log('GetOrder order : ', order);
    return order;
  } catch (e) {
    console.log(e);
  }
};

/**
 * 受注ヘッダーid最大値取得
 * @returns 受注ヘッダーid最大値
 */
export const getMaxId = async () => {
  try {
    const { data, error } = await selectMaxId();
    if (error) {
      if (error.code === 'PGRST116') {
        return null;
      }
      throw error;
    }
    console.log('GetMaxId data : ', data);
    return data;
  } catch (e) {
    console.error(e);
  }
};

/**
 * 受注ヘッダー情報新規追加
 * @param juchuHeadId 受注ヘッダーid
 */
export const addJuchuHead = async (juchuHeadId: number, juchuHeadData: OrderValues, userNam: string) => {
  const newData: JuchuHead = {
    juchu_head_id: juchuHeadId,
    del_flg: juchuHeadData.delFlg,
    juchu_sts: juchuHeadData.juchuSts,
    juchu_dat: toJapanYMDString(juchuHeadData.juchuDat, '-'),
    juchu_str_dat: juchuHeadData.juchuRange && toJapanYMDString(juchuHeadData.juchuRange[0], '-'),
    juchu_end_dat: juchuHeadData.juchuRange && toJapanYMDString(juchuHeadData.juchuRange[1], '-'),
    nyuryoku_user: juchuHeadData.nyuryokuUser,
    koen_nam: juchuHeadData.koenNam,
    koenbasho_nam: juchuHeadData.koenbashoNam,
    kokyaku_id: juchuHeadData.kokyaku.kokyakuId,
    kokyaku_tanto_nam: juchuHeadData.kokyakuTantoNam,
    mem: juchuHeadData.mem,
    // nebiki_amt: juchuHeadData.nebikiAmt,
    zei_kbn: juchuHeadData.zeiKbn,
    add_dat: toJapanTimeString(),
    add_user: userNam,
  };

  try {
    const { error } = await insertJuchuHead(newData);

    if (error) {
      console.error('Error adding new order:', error.message);
      throw error;
    } else {
      console.log('New order added successfully:', newData);
      await revalidatePath('/eqpt-order-list');
    }
  } catch (e) {
    console.error('Exception while adding new order:', e);
  }
};

/**
 * 受注ヘッダー情報更新
 * @param data 受注ヘッダーデータ
 * @returns 正誤
 */
export const updJuchuHead = async (data: OrderValues) => {
  const updateData: JuchuHead = {
    juchu_head_id: data.juchuHeadId,
    del_flg: data.delFlg,
    juchu_sts: data.juchuSts,
    juchu_dat: toJapanYMDString(data.juchuDat, '-'),
    juchu_str_dat: data.juchuRange && toJapanYMDString(data.juchuRange[0], '-'),
    juchu_end_dat: data.juchuRange && toJapanYMDString(data.juchuRange[1], '-'),
    nyuryoku_user: data.nyuryokuUser,
    koen_nam: data.koenNam,
    koenbasho_nam: data.koenbashoNam,
    kokyaku_id: data.kokyaku.kokyakuId,
    kokyaku_tanto_nam: data.kokyakuTantoNam,
    mem: data.mem,
    // nebiki_amt: data.nebikiAmt,
    zei_kbn: data.zeiKbn,
    upd_dat: toJapanTimeString(),
    upd_user: 'test_user',
  };

  try {
    const { error } = await updateJuchuHead(updateData);

    if (error) {
      console.error('Error updating order:', error.message);
      throw error;
    }
    console.log('Order updated successfully:', updateData);
    await revalidatePath('/eqpt-order-list');
    return true;
  } catch (e) {
    console.error('Exception while updating order:', e);
    return false;
  }
};

/**
 * 受注ヘッダー削除
 * @param juchuHeadId 受注ヘッダーid
 * @returns
 */
export const delJuchuHead = async (juchuHeadId: number) => {
  const deleteData: JuchuHead = {
    juchu_head_id: juchuHeadId,
    del_flg: 1,
  };
  try {
    const { error } = await updateJuchuHead(deleteData);

    if (error) {
      throw error;
    }

    console.log('Juchu head deleted successfully:', juchuHeadId);
    await revalidatePath('/eqpt-order-list');
  } catch (e) {
    console.error(e);
    return false;
  }

  await redirect('/order/0/edit');
};

/**
 * 受注機材ヘッダーリスト取得
 * @param juchuHeadId 受注機材ヘッダーid
 * @returns
 */
export const getJuchuKizaiHeadList = async (juchuHeadId: number) => {
  try {
    const { data, error } = await selectJuchuKizaiHeadList(juchuHeadId);

    if (error) {
      console.error('GetOrder juchu error : ', error);
      throw error;
    }

    if (!data || data.length === 0) return [];

    const EqTableData: EqTableValues[] = data.map((d) => ({
      juchuHeadId: d.juchu_head_id,
      juchuKizaiHeadId: d.juchu_kizai_head_id,
      headNam: d.head_nam,
      kicsShukoDat: d.kics_shuko_dat,
      kicsNyukoDat: d.kics_nyuko_dat,
      yardShukoDat: d.yard_shuko_dat,
      yardNyukoDat: d.yard_nyuko_dat,
      sikomibi: d.sikomibi,
      rihabi: d.rihabi,
      genebi: d.genebi,
      honbanbi: d.honbanbi,
      juchuHonbanbiCalcQty: d.juchu_honbanbi_calc_qty,
      shokei: d.shokei,
      nebikiAmt: d.nebiki_amt,
      nebikiRat: d.nebiki_rat,
      oyaJuchuKizaiHeadId: d.oya_juchu_kizai_head_id,
      htKbn: d.ht_kbn ?? 0,
      juchuKizaiHeadKbn: d.juchu_kizai_head_kbn,
      mem: d.mem,
      kicsShukoFixFlg: d.kics_shuko_fix_flg,
      yardShukoFixFlg: d.yard_shuko_fix_flg,
    }));

    const childrenMap: { [key: number]: EqTableValues[] } = {};
    const parents = [];

    for (const data of EqTableData) {
      if (data.oyaJuchuKizaiHeadId === null) {
        parents.push(data);
      } else {
        if (!childrenMap[data.oyaJuchuKizaiHeadId]) {
          childrenMap[data.oyaJuchuKizaiHeadId] = [];
        }
        childrenMap[data.oyaJuchuKizaiHeadId].push(data);
      }
    }

    const result = [];

    for (const parent of parents) {
      result.push(parent);
      const children = childrenMap[parent.juchuKizaiHeadId];
      if (children) {
        result.push(...children);
      }
    }

    return result;
  } catch (e) {
    console.error('Exception while selecting eqlist:', e);
  }
};

export const getJuchuSharyoHeadList = async (juchuHeadId: number) => {
  try {
    const { data, error } = await selectJuchuSharyoHeadList(juchuHeadId);
    if (error) {
      console.error('GetOrder juchu error : ', error);
      throw error;
    }

    if (!data || data.length === 0) return [];

    const sharyoData: VehicleTableValues[] = data.map((d) => ({
      juchuHeadId: d.juchu_head_id ?? FAKE_NEW_ID,
      sharyoHeadId: d.juchu_sharyo_head_id ?? FAKE_NEW_ID,
      sharyoHeadNam: d.head_nam ?? '',
      shubetsuId: d.nyushuko_shubetu_id ?? FAKE_NEW_ID,
      shubetuNam: d.nyushuko_shubetu_nam ?? '',
      basho: d.shozoku_nam,
      nyushukoDat: d.nyushuko_dat ? toJapanTimeString(d.nyushuko_dat) : '',
      headMem: d.mem,
    }));

    return sharyoData;
  } catch (e) {
    throw e;
  }
};

/**
 * 新規受注用顧客データを取得する関数
 * @param query 検索キーワード
 * @returns {Promise<CustomersDialogValues[]>} 公演場所マスタテーブルに表示するデータ（ 検索キーワードが空の場合は全て ）
 */
export const getFilteredOrderCustomers = async (query: string) => {
  try {
    const { data, error } = await selectFilteredCustomers(query);
    if (!error) {
      console.log('I got a datalist from db', data.length);
      if (!data || data.length === 0) {
        return [];
      } else {
        const filteredCustomers: CustomersDialogValues[] = data.map((d, index) => ({
          kokyakuId: d.kokyaku_id,
          kokyakuNam: d.kokyaku_nam,
          // kokyakuRank: d.kokyaku_rank,
          adrShozai: d.adr_shozai ?? '',
          adrTatemono: d.adr_tatemono ?? '',
          adrSonota: d.adr_sonota ?? '',
          tel: d.tel ?? '',
          fax: d.fax ?? '',
          mem: d.mem ?? '',
          dspFlg: Boolean(d.dsp_flg),
          tblDspId: index + 1,
        }));
        console.log(filteredCustomers.length);
        return filteredCustomers;
      }
    } else {
      console.error('顧客情報取得エラー。', { message: error.message, code: error.code });
      throw error;
    }
  } catch (e) {
    console.error('例外が発生しました:', e);
  }
};

/**
 * 新規受注用公演場所データ取得
 * @param query 検索キーワード
 * @returns
 */
export const getFilteredOrderLocs = async (query: string = '') => {
  try {
    const { data, error } = await selectFilteredLocs(query);
    if (error) {
      console.error('DB情報取得エラー', error.message, error.cause, error.hint);
      throw error;
    }
    if (!data || data.length === 0) {
      return [];
    }
    const filteredLocs: LocsDialogValues[] = data.map((d, index) => ({
      locId: d.koenbasho_id,
      locNam: d.koenbasho_nam,
      adrShozai: d.adr_shozai,
      adrTatemono: d.adr_tatemono,
      adrSonota: d.adr_sonota,
      tel: d.tel,
      fax: d.fax,
      mem: d.mem,
      dspFlg: Boolean(d.dsp_flg),
      tblDspId: index + 1,
      delFlg: Boolean(d.del_flg),
    }));
    console.log(filteredLocs.length);
    return filteredLocs;
  } catch (e) {
    console.error('例外が発生しました:', e);
    throw e;
  }
};

/**
 * 受注明細削除
 * @param juchuHeadId 受注ヘッダーid
 * @param juchuKizaiHeadId 受注機材ヘッダーid
 * @returns
 */
export const delJuchuMeisai = async (juchuHeadId: number, juchuKizaiHeadId: number) => {
  const connection = await pool.connect();

  try {
    await connection.query('BEGIN');

    // 移動受注伝票削除
    await delIdoDenJuchu(juchuHeadId, juchuKizaiHeadId, connection);

    // 入出庫実績削除
    await delNyushukoResult(juchuHeadId, juchuKizaiHeadId, connection);

    // 入出庫コンテナ実績削除
    await delNyushukoCtnResult(juchuHeadId, juchuKizaiHeadId, connection);

    // 入出庫伝票削除
    await delNyushukoDen(juchuHeadId, juchuKizaiHeadId, connection);

    // 入出庫確定削除
    await delNyushukoFix(juchuHeadId, juchuKizaiHeadId, connection);

    // 受注機材明細削除
    await delJuchuKizaiMeisai(juchuHeadId, juchuKizaiHeadId, connection);

    // 受注コンテナ明細削除
    await delJuchuCtnMeisai(juchuHeadId, juchuKizaiHeadId, connection);

    // 受注機材本番日削除
    await delJuchuKizaiHonbanbi(juchuHeadId, juchuKizaiHeadId, connection);

    // 受注機材入出庫削除
    await delJuchuKizaiNyushuko(juchuHeadId, juchuKizaiHeadId, connection);

    // 受注機材ヘッダー削除
    await delJuchuKizaiHead(juchuHeadId, juchuKizaiHeadId, connection);

    await connection.query('COMMIT');

    await revalidatePath('/eqpt-order-list');
    await revalidatePath('/shuko-list');
    await revalidatePath('/nyuko-list');
    await revalidatePath('/ido-list');
    return true;
  } catch (e) {
    console.error(e);
    await connection.query('ROLLBACK');
    return false;
  } finally {
    connection.release();
  }
};

/**
 * 受注機材ヘッダー削除
 * @param juchuHeadId 受注ヘッダーid
 * @param juchuKizaiHeadId 受注機材ヘッダーid
 * @param connection
 */
export const delJuchuKizaiHead = async (juchuHeadId: number, juchuKizaiHeadId: number, connection: PoolClient) => {
  try {
    await deleteJuchuKizaiHead(juchuHeadId, juchuKizaiHeadId, connection);
  } catch (e) {
    console.error('受注機材ヘッダー削除エラー', e);
    throw e;
  }
};

/**
 * 受注機材入出庫削除
 * @param juchuHeadId 受注ヘッダーid
 * @param juchuKizaiHeadId 受注機材ヘッダーid
 * @param connection
 */
export const delJuchuKizaiNyushuko = async (juchuHeadId: number, juchuKizaiHeadId: number, connection: PoolClient) => {
  try {
    await deleteJuchuKizaiNyushukoFromOrder(juchuHeadId, juchuKizaiHeadId, connection);
  } catch (e) {
    console.error('受注機材入出庫削除エラー', e);
    throw e;
  }
};

/**
 * 受注機材明細削除
 * @param juchuHeadId 受注ヘッダーid
 * @param juchuKizaiHeadId 受注機材ヘッダーid
 * @param connection
 */
export const delJuchuKizaiMeisai = async (juchuHeadId: number, juchuKizaiHeadId: number, connection: PoolClient) => {
  try {
    await deleteJuchuKizaiMeisaiFromOrder(juchuHeadId, juchuKizaiHeadId, connection);
  } catch (e) {
    console.error('受注機材明細削除エラー', e);
    throw e;
  }
};

/**
 * 受注コンテナ明細削除
 * @param juchuHeadId 受注ヘッダーid
 * @param juchuKizaiHeadId 受注機材ヘッダーid
 * @param connection
 */
export const delJuchuCtnMeisai = async (juchuHeadId: number, juchuKizaiHeadId: number, connection: PoolClient) => {
  try {
    await deleteJuchuCtnMeisaiFromOrder(juchuHeadId, juchuKizaiHeadId, connection);
  } catch (e) {
    console.error('受注コンテナ明細削除エラー', e);
    throw e;
  }
};

/**
 * 受注機材本番日削除
 * @param juchuHeadId 受注ヘッダーid
 * @param juchuKizaiHeadId 受注機材ヘッダーid
 * @param connection
 */
export const delJuchuKizaiHonbanbi = async (juchuHeadId: number, juchuKizaiHeadId: number, connection: PoolClient) => {
  try {
    await deleteJuchuKizaiHonbanbiFromOrder(juchuHeadId, juchuKizaiHeadId, connection);
  } catch (e) {
    console.error('受注機材本番日削除エラー', e);
    throw e;
  }
};

/**
 * 入出庫伝票削除
 * @param juchuHeadId 受注ヘッダーid
 * @param juchuKizaiHeadId 受注機材ヘッダーid
 * @param connection
 */
export const delNyushukoDen = async (juchuHeadId: number, juchuKizaiHeadId: number, connection: PoolClient) => {
  try {
    await deleteNyushukoDenFromOrder(juchuHeadId, juchuKizaiHeadId, connection);
  } catch (e) {
    console.error('入出庫伝票削除エラー', e);
    throw e;
  }
};

/**
 * 入出庫実績削除
 * @param juchuHeadId 受注ヘッダーid
 * @param juchuKizaiHeadId 受注機材ヘッダーid
 * @param connection
 */
export const delNyushukoResult = async (juchuHeadId: number, juchuKizaiHeadId: number, connection: PoolClient) => {
  try {
    await deleteNyushukoResultFromOrder(juchuHeadId, juchuKizaiHeadId, connection);
  } catch (e) {
    console.error('入出庫実績削除エラー', e);
    throw e;
  }
};

/**
 * コンテナ入出庫実績削除
 * @param juchuHeadId 受注ヘッダーid
 * @param juchuKizaiHeadId 受注機材ヘッダーid
 * @param connection
 */
export const delNyushukoCtnResult = async (juchuHeadId: number, juchuKizaiHeadId: number, connection: PoolClient) => {
  try {
    await deleteNyushukoCtnResultFromOrder(juchuHeadId, juchuKizaiHeadId, connection);
  } catch (e) {
    console.error('コンテナ入出庫実績削除エラー', e);
    throw e;
  }
};

/**
 * 入出庫確定削除
 * @param juchuHeadId 受注ヘッダーid
 * @param juchuKizaiHeadId 受注機材ヘッダーid
 * @param connection
 */
export const delNyushukoFix = async (juchuHeadId: number, juchuKizaiHeadId: number, connection: PoolClient) => {
  try {
    await deleteNyushukoFixFromOrder(juchuHeadId, juchuKizaiHeadId, connection);
  } catch (e) {
    console.error('入出庫確定削除エラー', e);
    throw e;
  }
};

/**
 * 移動伝票受注削除
 * @param juchuHeadId 受注ヘッダーid
 * @param juchuKizaiHeadId 受注機材ヘッダーid
 * @param connection
 */
export const delIdoDenJuchu = async (juchuHeadId: number, juchuKizaiHeadId: number, connection: PoolClient) => {
  try {
    await deleteIdoDenJuchuFromOrder(juchuHeadId, juchuKizaiHeadId, connection);
  } catch (e) {
    console.error('移動伝票受注削除エラー', e);
    throw e;
  }
};

export const copyJuchuKizaiHeadMeisai = async (
  originJuchuKizaiHead: EqTableValues,
  juchuHeadId: number,
  data: CopyDialogValue,
  shukoDate: Date,
  nyukoDate: Date,
  dateRange: string[],
  userNam: string
) => {
  const connection = await pool.connect();

  try {
    await connection.query('BEGIN');

    // 受注機材ヘッダーid最大値
    const JuchuKizaiHeadMaxId = await getJuchuKizaiHeadMaxId(juchuHeadId);
    // 受注機材ヘッダーid
    const newJuchuKizaiHeadId = JuchuKizaiHeadMaxId ? JuchuKizaiHeadMaxId.juchu_kizai_head_id + 1 : 1;

    // 受注機材ヘッダーデータ
    const newJuchuKizaiHeadData: CopyJuchuKizaiHeadValue = {
      juchuHeadId: juchuHeadId,
      mem: originJuchuKizaiHead.mem,
      headNam: data.headNam,
      kicsShukoDat: data.kicsShukoDat,
      kicsNyukoDat: data.kicsNyukoDat,
      yardShukoDat: data.yardShukoDat,
      yardNyukoDat: data.yardNyukoDat,
      juchuKizaiHeadKbn: 1,
      juchuKizaiHeadId: newJuchuKizaiHeadId,
      juchuHonbanbiQty: 0,
      nebikiAmt: originJuchuKizaiHead.nebikiAmt,
      nebikiRat: originJuchuKizaiHead.nebikiRat,
    };

    // 受注機材ヘッダー追加
    const headResult = await addJuchuKizaiHead(newJuchuKizaiHeadId, newJuchuKizaiHeadData, 1, userNam, connection);
    console.log('受注機材ヘッダー追加', headResult);

    // 受注機材入出庫追加
    const nyushukoResult = await addJuchuKizaiNyushuko(
      juchuHeadId,
      newJuchuKizaiHeadId,
      data.kicsShukoDat,
      data.yardShukoDat,
      data.kicsNyukoDat,
      data.yardNyukoDat,
      userNam,
      connection
    );
    console.log('受注機材入出庫追加', nyushukoResult);

    // 受注機材本番日(入出庫、使用中)追加
    const addJuchuSiyouHonbanbiData: CopyJuchuKizaiHonbanbiValues[] = dateRange.map((d) => ({
      juchuHeadId: juchuHeadId,
      juchuKizaiHeadId: newJuchuKizaiHeadId,
      juchuHonbanbiShubetuId: 1,
      juchuHonbanbiDat: new Date(d),
      mem: '',
      juchuHonbanbiAddQty: 0,
    }));
    const addJuchuHonbanbiData: CopyJuchuKizaiHonbanbiValues[] = [
      {
        juchuHeadId: juchuHeadId,
        juchuKizaiHeadId: newJuchuKizaiHeadId,
        juchuHonbanbiShubetuId: 2,
        juchuHonbanbiDat: shukoDate,
        mem: '',
        juchuHonbanbiAddQty: 0,
      },
      {
        juchuHeadId: juchuHeadId,
        juchuKizaiHeadId: newJuchuKizaiHeadId,
        juchuHonbanbiShubetuId: 3,
        juchuHonbanbiDat: nyukoDate,
        mem: '',
        juchuHonbanbiAddQty: 0,
      },
    ];
    const mergeHonbanbiData: CopyJuchuKizaiHonbanbiValues[] = [...addJuchuSiyouHonbanbiData, ...addJuchuHonbanbiData];
    const addHonbanbiResult = await addAllHonbanbi(
      juchuHeadId,
      newJuchuKizaiHeadId,
      mergeHonbanbiData,
      userNam,
      connection
    );
    console.log('入出庫、使用本番日追加', addHonbanbiResult);

    // 受注機材明細
    const juchuKizaiMeisai: CopyJuchuKizaiMeisaiValues[] = await getJuchuKizaiMeisai(
      originJuchuKizaiHead.juchuHeadId,
      originJuchuKizaiHead.juchuKizaiHeadId
    );
    if (juchuKizaiMeisai.length > 0) {
      // 受注機材明細id
      let newJuchuKizaiMeisaiId = 1;

      const newJuchuKizaiMeisai: CopyJuchuKizaiMeisaiValues[] = juchuKizaiMeisai.map((d) => ({
        ...d,
        juchuHeadId: juchuHeadId,
        juchuKizaiHeadId: newJuchuKizaiHeadId,
        juchuKizaiMeisaiId: newJuchuKizaiMeisaiId++,
      }));

      // 受注機材明細追加
      const addMeisaiResult = await addJuchuKizaiMeisai(newJuchuKizaiMeisai, userNam, connection);
      console.log('受注機材明細追加', addMeisaiResult);

      // 機材入出庫伝票追加
      const addNyushukoDenResult = await addNyushukoDen(
        newJuchuKizaiHeadData,
        newJuchuKizaiMeisai,
        userNam,
        connection
      );
      console.log('入出庫伝票追加', addNyushukoDenResult);
    }

    // 受注コンテナ明細
    const juchuCtnMeisai: CopyJuchuContainerMeisaiValues[] = await getJuchuContainerMeisai(
      originJuchuKizaiHead.juchuHeadId,
      originJuchuKizaiHead.juchuKizaiHeadId
    );
    if (juchuCtnMeisai.length > 0) {
      // 受注コンテナ明細id
      let newJuchuContainerMeisaiId = 1;

      const newJuchuCtnMeisai: CopyJuchuContainerMeisaiValues[] = juchuCtnMeisai.map((d) => ({
        ...d,
        juchuHeadId: juchuHeadId,
        juchuKizaiHeadId: newJuchuKizaiHeadId,
        juchuKizaiMeisaiId: newJuchuContainerMeisaiId++,
      }));

      // 受注コンテナ明細追加
      const addCtnMeisaiResult = await addJuchuContainerMeisai(newJuchuCtnMeisai, userNam, connection);
      console.log('受注コンテナ明細追加', addCtnMeisaiResult);

      // コンテナ入出庫伝票追加
      if (data.kicsShukoDat && data.kicsNyukoDat) {
        const addCtnNyushukoDenResult = await addCtnNyushukoDen(
          newJuchuCtnMeisai,
          data.kicsShukoDat,
          data.kicsNyukoDat,
          1,
          userNam,
          connection
        );
        console.log('KICSコンテナ入出庫伝票追加', addCtnNyushukoDenResult);
      }
      if (data.yardShukoDat && data.yardNyukoDat) {
        const addCtnNyushukoDenResult = await addCtnNyushukoDen(
          newJuchuCtnMeisai,
          data.yardShukoDat,
          data.yardNyukoDat,
          2,
          userNam,
          connection
        );
        console.log('YARDコンテナ入出庫伝票追加', addCtnNyushukoDenResult);
      }
    }

    // 移動受注機材明細
    const JuchuKizaiMeisaiSum = await getIdoJuchuKizaiMeisai(
      originJuchuKizaiHead.juchuHeadId,
      originJuchuKizaiHead.juchuKizaiHeadId
    );
    const idoJuchuKizaiMeisai = JuchuKizaiMeisaiSum.filter((d) => d.sagyoDenDat);
    if (idoJuchuKizaiMeisai.length > 0) {
      const idoDenMaxId = await getIdoDenJuchuMaxId();
      const newIdoDenId = idoDenMaxId ? idoDenMaxId + 1 : 1;

      const kickIdoDat =
        data.yardShukoDat !== null && data.yardShukoDat.getHours() < 12
          ? subDays(data.yardShukoDat, 1)
          : data.yardShukoDat !== null && data.yardShukoDat.getHours() >= 12
            ? data.yardShukoDat
            : null;
      const yardIdoDat = data.kicsShukoDat !== null ? subDays(data.kicsShukoDat, 1) : null;

      const newIdoList = idoJuchuKizaiMeisai.map((d) => ({
        ...d,
        juchuHeadId: juchuHeadId,
        juchuKizaiHeadId: newJuchuKizaiHeadId,
        sagyoDenDat: d.shozokuId === 1 ? yardIdoDat : kickIdoDat,
      }));

      // 移動受注機材明細追加
      const addIdoDenResult = await addIdoDenJuchu(newIdoDenId, newIdoList, userNam, connection);
      console.log('移動伝票受注追加', addIdoDenResult);
    }

    await connection.query('COMMIT');

    await revalidatePath('/eqpt-order-list');
    await revalidatePath('/ido-list');
    await revalidatePath('/shuko-list');
    await revalidatePath('/nyuko-list');

    return true;
  } catch (e) {
    console.error(e);
    await connection.query('ROLLBACK');
    return false;
  } finally {
    connection.release();
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
      if (error.code === 'PGRST116') {
        return null;
      }
      throw error;
    }
    console.log('GetMaxId : ', data);
    return data;
  } catch (e) {
    console.error(e);
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
  juchuKizaiHeadData: CopyJuchuKizaiHeadValue,
  juchuKizaiHeadKbn: number,
  userNam: string,
  connection: PoolClient
) => {
  const newData: JuchuKizaiHead = {
    juchu_head_id: juchuKizaiHeadData.juchuHeadId,
    juchu_kizai_head_id: juchuKizaiHeadId,
    juchu_kizai_head_kbn: juchuKizaiHeadKbn,
    juchu_honbanbi_qty: juchuKizaiHeadData.juchuHonbanbiQty,
    nebiki_amt: juchuKizaiHeadData.nebikiAmt,
    nebiki_rat: juchuKizaiHeadData.nebikiRat,
    mem: juchuKizaiHeadData.mem,
    head_nam: juchuKizaiHeadData.headNam,
    oya_juchu_kizai_head_id: null,
    ht_kbn: 0,
    add_dat: toJapanTimeString(),
    add_user: userNam,
  };
  try {
    await insertJuchuKizaiHead(newData, connection);

    console.log('New juchuKizaiHead added successfully:', newData);
    return true;
  } catch (e) {
    console.error('Error adding new juchuKizaiHead:', e);
    throw e;
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
  userNam: string,
  connection: PoolClient
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
      await insertJuchuKizaiNyushuko(newData, connection);
    } catch (e) {
      console.error('Exception while adding kizai Nyushuko:', e);
      throw e;
    }
  }
  console.log('kizai Nyushuko added successfully:', dates);
  return true;
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
  juchuHonbanbiData: CopyJuchuKizaiHonbanbiValues[],
  userNam: string,
  connection: PoolClient
) => {
  const newData: JuchuKizaiHonbanbi[] = juchuHonbanbiData.map((d) => ({
    juchu_head_id: juchuHeadId,
    juchu_kizai_head_id: juchuKizaiHeadId,
    juchu_honbanbi_shubetu_id: d.juchuHonbanbiShubetuId,
    juchu_honbanbi_dat: toJapanYMDString(d.juchuHonbanbiDat, '-'),
    mem: d.mem ? d.mem : null,
    juchu_honbanbi_add_qty: d.juchuHonbanbiAddQty,
    add_dat: toJapanTimeString(),
    add_user: userNam,
  }));
  try {
    await insertAllHonbanbi(newData, connection);
    console.log('honbanbi add all successfully:', newData);
    return true;
  } catch (e) {
    console.error('Error Add honbanbi:', e);
    throw e;
  }
};

/**
 * メイン受注機材明細取得
 * @param juchuHeadId 受注ヘッダーid
 * @param juchuKizaiHeadId 受注機材ヘッダーid
 * @returns
 */
export const getJuchuKizaiMeisai = async (juchuHeadId: number, juchuKizaiHeadId: number) => {
  try {
    const { data: eqList, error: eqListError } = await selectJuchuKizaiMeisai(juchuHeadId, juchuKizaiHeadId);
    if (eqListError) {
      console.error('getJuchuKizaiMeisai eqList error : ', eqListError);
      throw eqListError;
    }
    const uniqueIds = new Set();
    const uniqueEqList = eqList.filter((item) => {
      if (uniqueIds.has(item.juchu_kizai_meisai_id)) {
        return false;
      }
      uniqueIds.add(item.juchu_kizai_meisai_id);
      return true;
    });

    const eqIds = [...new Set(eqList.map((data) => data.kizai_id))];

    const { data: mKizai, error: mKizaiError } = await selectMeisaiEqts(eqIds);

    if (mKizaiError) {
      console.error('GetEqList eqShozokuId error : ', mKizaiError);
      throw mKizaiError;
    }

    const { data: eqTanka, error: eqTankaError } = await selectJuchuKizaiMeisaiKizaiTanka(
      juchuHeadId,
      juchuKizaiHeadId
    );
    if (eqTankaError) {
      console.error('GetEqHeader eqTanka error : ', eqTankaError);
      throw eqTankaError;
    }

    const juchuKizaiMeisaiData: CopyJuchuKizaiMeisaiValues[] = uniqueEqList.map((d, i) => ({
      juchuHeadId: d.juchu_head_id,
      juchuKizaiHeadId: d.juchu_kizai_head_id,
      juchuKizaiMeisaiId: d.juchu_kizai_meisai_id,
      mShozokuId: mKizai.find((data) => data.kizai_id === d.kizai_id)?.shozoku_id ?? 0,
      shozokuId: d.shozoku_id,
      mem: d.mem,
      mem2: d.mem2,
      kizaiId: d.kizai_id,
      kizaiTankaAmt: eqTanka.find((t) => t.kizai_id === d.kizai_id)?.kizai_tanka_amt || 0,
      kizaiNam: d.kizai_nam ?? '',
      planKizaiQty: d.plan_kizai_qty ?? 0,
      planYobiQty: d.plan_yobi_qty ?? 0,
      planQty: d.plan_qty ?? 0,
      dspOrdNum: d.dsp_ord_num ?? 0,
      indentNum: d.indent_num ?? 0,
      delFlag: false,
      saveFlag: true,
    }));
    return juchuKizaiMeisaiData;
  } catch (e) {
    console.error(e);
    throw e;
  }
};

/**
 * 受注機材明細新規追加
 * @param juchuKizaiMeisaiData 受注機材明細データ
 * @param userNam ユーザー名
 * @returns
 */
export const addJuchuKizaiMeisai = async (
  juchuKizaiMeisaiData: CopyJuchuKizaiMeisaiValues[],
  userNam: string,
  connection: PoolClient
) => {
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
    dsp_ord_num: d.dspOrdNum,
    indent_num: d.indentNum,
  }));

  try {
    await insertJuchuKizaiMeisai(newData, connection);

    console.log('kizai meisai added successfully:', newData);
    return true;
  } catch (e) {
    console.error('Exception while adding kizai meisai:', e);
    throw e;
  }
};

/**
 * 入出庫伝票新規追加
 * @param juchuKizaiHeadData 受注機材ヘッダーデータ
 * @param juchuKizaiMeisaiData 受注機材明細データ
 * @param userNam ユーザー名
 * @returns
 */
export const addNyushukoDen = async (
  juchuKizaiHeadData: CopyJuchuKizaiHeadValue,
  juchuKizaiMeisaiData: CopyJuchuKizaiMeisaiValues[],
  userNam: string,
  connection: PoolClient
) => {
  const newShukoStandbyData: NyushukoDen[] = juchuKizaiMeisaiData.map((d) => ({
    juchu_head_id: d.juchuHeadId,
    juchu_kizai_head_id: d.juchuKizaiHeadId,
    juchu_kizai_meisai_id: d.juchuKizaiMeisaiId,
    sagyo_kbn_id: 10,
    sagyo_den_dat:
      d.shozokuId === 1
        ? toJapanTimeStampString(juchuKizaiHeadData.kicsShukoDat as Date)
        : toJapanTimeStampString(juchuKizaiHeadData.yardShukoDat as Date),
    sagyo_id: d.shozokuId,
    kizai_id: d.kizaiId,
    plan_qty: d.planQty,
    dsp_ord_num: d.dspOrdNum,
    indent_num: d.indentNum,
    add_dat: toJapanTimeString(),
    add_user: userNam,
  }));

  const newShukoCheckData: NyushukoDen[] = juchuKizaiMeisaiData.map((d) => ({
    juchu_head_id: d.juchuHeadId,
    juchu_kizai_head_id: d.juchuKizaiHeadId,
    juchu_kizai_meisai_id: d.juchuKizaiMeisaiId,
    sagyo_kbn_id: 20,
    sagyo_den_dat:
      d.shozokuId === 1
        ? toJapanTimeStampString(juchuKizaiHeadData.kicsShukoDat as Date)
        : toJapanTimeStampString(juchuKizaiHeadData.yardShukoDat as Date),
    sagyo_id: d.shozokuId,
    kizai_id: d.kizaiId,
    plan_qty: d.planQty,
    dsp_ord_num: d.dspOrdNum,
    indent_num: d.indentNum,
    add_dat: toJapanTimeString(),
    add_user: userNam,
  }));

  const newNyukoCheckData: NyushukoDen[] = juchuKizaiMeisaiData.map((d) => ({
    juchu_head_id: d.juchuHeadId,
    juchu_kizai_head_id: d.juchuKizaiHeadId,
    juchu_kizai_meisai_id: d.juchuKizaiMeisaiId,
    sagyo_kbn_id: 30,
    sagyo_den_dat:
      d.shozokuId === 1
        ? toJapanTimeStampString(juchuKizaiHeadData.kicsNyukoDat as Date)
        : toJapanTimeStampString(juchuKizaiHeadData.yardNyukoDat as Date),
    sagyo_id: d.shozokuId,
    kizai_id: d.kizaiId,
    plan_qty: d.planQty,
    dsp_ord_num: d.dspOrdNum,
    indent_num: d.indentNum,
    add_dat: toJapanTimeString(),
    add_user: userNam,
  }));

  const mergeData = [...newShukoStandbyData, ...newShukoCheckData, ...newNyukoCheckData];

  try {
    await insertNyushukoDen(mergeData, connection);

    console.log('nyushuko den added successfully:', mergeData);
    return true;
  } catch (e) {
    console.error('Exception while adding nyushuko den:', e);
    throw e;
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
      throw containerError;
    }

    const juchuContainerMeisaiData: CopyJuchuContainerMeisaiValues[] = containerData.map((d) => ({
      juchuHeadId: d.juchu_head_id ?? 0,
      juchuKizaiHeadId: d.juchu_kizai_head_id ?? 0,
      juchuKizaiMeisaiId: d.juchu_kizai_meisai_id ?? 0,
      kizaiId: d.kizai_id ?? 0,
      kizaiNam: d.kizai_nam ?? '',
      planKicsKizaiQty: d.kics_plan_kizai_qty ?? 0,
      planYardKizaiQty: d.yard_plan_kizai_qty ?? 0,
      planQty: (d.kics_plan_kizai_qty ?? 0) + (d.yard_plan_kizai_qty ?? 0),
      mem: d.mem,
      dspOrdNum: d.dsp_ord_num ?? 0,
      indentNum: 0,
      delFlag: false,
      saveFlag: true,
    }));

    return juchuContainerMeisaiData;
  } catch (e) {
    console.error(e);
    throw e;
  }
};

/**
 * 受注コンテナ明細新規追加
 * @param juchuContainerMeisaiData 受注コンテナ明細データ
 * @param userNam ユーザー名
 * @returns
 */
export const addJuchuContainerMeisai = async (
  juchuContainerMeisaiData: CopyJuchuContainerMeisaiValues[],
  userNam: string,
  connection: PoolClient
) => {
  const newKicsData: JuchuCtnMeisai[] = juchuContainerMeisaiData.map((d) => ({
    juchu_head_id: d.juchuHeadId,
    juchu_kizai_head_id: d.juchuKizaiHeadId,
    juchu_kizai_meisai_id: d.juchuKizaiMeisaiId,
    kizai_id: d.kizaiId,
    plan_kizai_qty: d.planKicsKizaiQty,
    shozoku_id: 1,
    mem: d.mem,
    dsp_ord_num: d.dspOrdNum,
    indent_num: d.indentNum,
    add_dat: toJapanTimeString(),
    add_user: userNam,
  }));

  const newYardData: JuchuCtnMeisai[] = juchuContainerMeisaiData.map((d) => ({
    juchu_head_id: d.juchuHeadId,
    juchu_kizai_head_id: d.juchuKizaiHeadId,
    juchu_kizai_meisai_id: d.juchuKizaiMeisaiId,
    kizai_id: d.kizaiId,
    plan_kizai_qty: d.planYardKizaiQty,
    shozoku_id: 2,
    mem: d.mem,
    dsp_ord_num: d.dspOrdNum,
    indent_num: d.indentNum,
    add_dat: toJapanTimeString(),
    add_user: userNam,
  }));

  const mergeData = [...newKicsData, ...newYardData];

  try {
    await insertJuchuContainerMeisai(mergeData, connection);
    console.log('container meisai added successfully:', mergeData);
    return true;
  } catch (e) {
    console.error('Exception while adding container meisai:', e);
    throw e;
  }
};

/**
 * コンテナ入出庫伝票新規追加
 * @param juchuCtnMeisaiData 受注コンテナ明細データ
 * @param shukoDat 出庫日
 * @param nyukoDat 入庫日
 * @param sagyoId 作業id
 * @param userNam ユーザー名
 * @param connection
 * @returns
 */
export const addCtnNyushukoDen = async (
  juchuCtnMeisaiData: CopyJuchuContainerMeisaiValues[],
  shukoDat: Date,
  nyukoDat: Date,
  sagyoId: number,
  userNam: string,
  connection: PoolClient
) => {
  const newCtnShukoStandbyData: NyushukoDen[] = juchuCtnMeisaiData.map((d) => ({
    juchu_head_id: d.juchuHeadId,
    juchu_kizai_head_id: d.juchuKizaiHeadId,
    juchu_kizai_meisai_id: d.juchuKizaiMeisaiId,
    sagyo_kbn_id: 10,
    sagyo_den_dat: toJapanTimeStampString(shukoDat),
    sagyo_id: sagyoId,
    kizai_id: d.kizaiId,
    plan_qty: sagyoId === 1 ? d.planKicsKizaiQty : d.planYardKizaiQty,
    dsp_ord_num: d.dspOrdNum,
    indent_num: d.indentNum,
    add_dat: toJapanTimeString(),
    add_user: userNam,
  }));

  const newCtnShukoCheckData: NyushukoDen[] = juchuCtnMeisaiData.map((d) => ({
    juchu_head_id: d.juchuHeadId,
    juchu_kizai_head_id: d.juchuKizaiHeadId,
    juchu_kizai_meisai_id: d.juchuKizaiMeisaiId,
    sagyo_kbn_id: 20,
    sagyo_den_dat: toJapanTimeStampString(shukoDat),
    sagyo_id: sagyoId,
    kizai_id: d.kizaiId,
    plan_qty: sagyoId === 1 ? d.planKicsKizaiQty : d.planYardKizaiQty,
    dsp_ord_num: d.dspOrdNum,
    indent_num: d.indentNum,
    add_dat: toJapanTimeString(),
    add_user: userNam,
  }));

  const newCtnNyukoCheckData: NyushukoDen[] = juchuCtnMeisaiData.map((d) => ({
    juchu_head_id: d.juchuHeadId,
    juchu_kizai_head_id: d.juchuKizaiHeadId,
    juchu_kizai_meisai_id: d.juchuKizaiMeisaiId,
    sagyo_kbn_id: 30,
    sagyo_den_dat: toJapanTimeStampString(nyukoDat),
    sagyo_id: sagyoId,
    kizai_id: d.kizaiId,
    plan_qty: sagyoId === 1 ? d.planKicsKizaiQty : d.planYardKizaiQty,
    dsp_ord_num: d.dspOrdNum,
    indent_num: d.indentNum,
    add_dat: toJapanTimeString(),
    add_user: userNam,
  }));

  const mergeData = [...newCtnShukoStandbyData, ...newCtnShukoCheckData, ...newCtnNyukoCheckData];

  try {
    await insertNyushukoDen(mergeData, connection);

    console.log('ctn nyushuko den added successfully:', mergeData);
    return true;
  } catch (e) {
    console.error('Exception while adding ctn nyushuko den:', e);
    throw e;
  }
};

/**
 * 移動受注機材明細リスト取得
 * @param juchuHeadId 受注ヘッダーid
 * @param juchuKizaiHeadId 受注機材ヘッダーid
 * @returns 受注機材明細リスト
 */
export const getIdoJuchuKizaiMeisai = async (juchuHeadId: number, juchuKizaiHeadId: number) => {
  try {
    const { data: eqList, error: eqListError } = await selectIdoJuchuKizaiMeisai(juchuHeadId, juchuKizaiHeadId);
    if (eqListError) {
      console.error('GetEqList eqList error : ', eqListError);
      throw eqListError;
    }

    const uniqueIds = new Set();
    const uniqueEqList = eqList.filter((item) => {
      if (uniqueIds.has(item.kizai_id)) {
        return false;
      }
      uniqueIds.add(item.kizai_id);
      return true;
    });

    const eqIds = uniqueEqList.map((data) => data.kizai_id).filter((id) => id !== null);

    const { data: mKizai, error: mKizaiError } = await selectMeisaiEqts(eqIds);

    if (mKizaiError) {
      console.error('GetEqList eqShozokuId error : ', mKizaiError);
      throw mKizaiError;
    }

    const juchuKizaiMeisaiData: CopyIdoJuchuKizaiMeisaiValues[] = uniqueEqList.map((d) => ({
      juchuHeadId: d.juchu_head_id ?? 0,
      juchuKizaiHeadId: d.juchu_kizai_head_id ?? 0,
      idoDenId: d.ido_den_id,
      sagyoDenDat: d.sagyo_den_dat ? new Date(d.sagyo_den_dat) : null,
      sagyoSijiId: d.sagyo_siji_id === 'K→Y' ? 1 : d.sagyo_siji_id === 'Y→K' ? 2 : null,
      mShozokuId: mKizai.find((data) => data.kizai_id === d.kizai_id)?.shozoku_id ?? 0,
      shozokuId: d.shozoku_id ?? 0,
      shozokuNam: d.shozoku_nam ?? '',
      kizaiId: d.kizai_id ?? 0,
      kizaiNam: d.kizai_nam ?? '',
      kizaiQty: d.kizai_qty ?? 0,
      planKizaiQty: d.plan_kizai_qty ?? 0,
      planYobiQty: d.plan_yobi_qty ?? 0,
      planQty: d.plan_qty ?? 0,
      delFlag: false,
      saveFlag: true,
    }));
    return juchuKizaiMeisaiData;
  } catch (e) {
    console.error(e);
    throw e;
  }
};

/**
 * 移動伝票受注id最大値取得
 * @returns 移動伝票受注id最大値
 */
export const getIdoDenJuchuMaxId = async () => {
  try {
    const { data, error } = await selectIdoDenJuchuMaxId();
    if (error) {
      if (error.code === 'PGRST116') {
        return null;
      }
      throw error;
    }
    console.log('getIdoDenJuchuMaxId: ', data);
    return data.ido_den_id;
  } catch (e) {
    console.error(e);
    throw e;
  }
};

/**
 * 移動伝票受注新規追加
 * @param newIdoDenId 新規移動伝票受注id
 * @param idoKizaiData 移動伝票受注データ
 * @param userNam ユーザー名
 * @returns
 */
export const addIdoDenJuchu = async (
  newIdoDenId: number,
  idoKizaiData: CopyIdoJuchuKizaiMeisaiValues[],
  userNam: string,
  connection: PoolClient
) => {
  const newLoadData: IdoDenJuchu[] = idoKizaiData.map((d, index) => ({
    ido_den_id: newIdoDenId + index,
    sagyo_den_dat: toJapanYMDString(d.sagyoDenDat as Date, '-'),
    sagyo_siji_id: d.mShozokuId,
    sagyo_id: d.mShozokuId,
    sagyo_kbn_id: 40,
    kizai_id: d.kizaiId,
    plan_qty: d.planQty,
    juchu_head_id: d.juchuHeadId,
    juchu_kizai_head_id: d.juchuKizaiHeadId,
    add_dat: toJapanTimeString(),
    add_user: userNam,
  }));

  const newUnloadData: IdoDenJuchu[] = idoKizaiData.map((d, index) => ({
    ido_den_id: newIdoDenId + index,
    sagyo_den_dat: toJapanYMDString(d.sagyoDenDat as Date, '-'),
    sagyo_siji_id: d.mShozokuId,
    sagyo_id: d.mShozokuId === 1 ? 2 : 1,
    sagyo_kbn_id: 50,
    kizai_id: d.kizaiId,
    plan_qty: d.planQty,
    juchu_head_id: d.juchuHeadId,
    juchu_kizai_head_id: d.juchuKizaiHeadId,
    add_dat: toJapanTimeString(),
    add_user: userNam,
  }));

  const mergeData = [...newLoadData, ...newUnloadData];

  try {
    await insertIdoDenJuchu(mergeData, connection);
    console.log('ido den added successfully:', mergeData);
    return true;
  } catch (e) {
    console.error('Exception while adding ido den:', e);
    throw e;
  }
};
