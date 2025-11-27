'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { PoolClient } from 'pg';

import pool from '@/app/_lib/db/postgres';
import { selectFilteredLocs } from '@/app/_lib/db/tables/m-koenbasho';
import { selectFilteredCustomers, selectKokyaku } from '@/app/_lib/db/tables/m-kokyaku';
import { deleteIdoDenJuchuFromOrder } from '@/app/_lib/db/tables/t-ido-den-juchu';
import { deleteJuchuCtnMeisaiFromOrder } from '@/app/_lib/db/tables/t-juchu-ctn-meisai';
import { insertJuchuHead, selectJuchuHead, selectMaxId, updateJuchuHead } from '@/app/_lib/db/tables/t-juchu-head';
import { deleteJuchuKizaiHead } from '@/app/_lib/db/tables/t-juchu-kizai-head';
import { deleteJuchuKizaiHonbanbiFromOrder } from '@/app/_lib/db/tables/t-juchu-kizai-honbanbi';
import { deleteJuchuKizaiMeisaiFromOrder } from '@/app/_lib/db/tables/t-juchu-kizai-meisai';
import { deleteJuchuKizaiNyushukoFromOrder } from '@/app/_lib/db/tables/t-juchu-kizai-nyushuko';
import { selectJuchuSharyoMeisai } from '@/app/_lib/db/tables/t-juchu-sharyo-head';
import { deleteNyushukoCtnResultFromOrder } from '@/app/_lib/db/tables/t-nyushuko-ctn-result';
import { deleteNyushukoDenFromOrder } from '@/app/_lib/db/tables/t-nyushuko-den';
import { deleteNyushukoFixFromOrder } from '@/app/_lib/db/tables/t-nyushuko-fix';
import { deleteNyushukoResultFromOrder } from '@/app/_lib/db/tables/t-nyushuko-result';
import { selectJuchuKizaiHeadList } from '@/app/_lib/db/tables/v-juchu-kizai-head-lst';
import { selectJuchuSharyoHeadList } from '@/app/_lib/db/tables/v-juchu-sharyo-head-lst';
import { JuchuHead } from '@/app/_lib/db/types/t-juchu-head-type';
import { toJapanTimeString, toJapanYMDString } from '@/app/(main)/_lib/date-conversion';
import { FAKE_NEW_ID } from '@/app/(main)/(masters)/_lib/constants';

import { CustomersDialogValues, EqTableValues, LocsDialogValues, OrderValues, VehicleTableValues } from './types';

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
      await revalidatePath('/order-list');
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
    await revalidatePath('/order-list');
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

export const copyJuchuHead = async (juchuHeadId: number, data: OrderValues, userNam: string) => {
  const copyData: JuchuHead = {
    juchu_head_id: juchuHeadId,
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
    add_dat: toJapanTimeString(),
    add_user: userNam,
  };

  try {
    const { error } = await insertJuchuHead(copyData);

    if (error) {
      console.error('Error adding new order:', error.message);
      throw error;
    } else {
      console.log('New order added successfully:', copyData);
    }
  } catch (e) {
    console.error('Exception while adding new order:', e);
  }
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
      oyaJuchuKizaiHeadId: d.oya_juchu_kizai_head_id,
      htKbn: d.ht_kbn ?? 0,
      juchuKizaiHeadKbn: d.juchu_kizai_head_kbn,
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
