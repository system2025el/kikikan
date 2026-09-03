'use server';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { PoolClient } from 'pg';

import {
  BASHO_ID,
  HONBANBI_SHUBETU_ID,
  JUCHU_KIZAI_HEAD_KBN,
  MEMO_MAX_LENGTH,
  NYUSHUKO_SHUBETU_ID,
  SAGYO_KBN_ID,
  SAGYO_SIJI_ID,
} from '@/app/_lib/constants';
import pool from '@/app/_lib/db/postgres';
import { selectKizaiRegAmts, selectMeisaiEqts } from '@/app/_lib/db/tables/m-kizai';
import { selectFilteredLocs } from '@/app/_lib/db/tables/m-koenbasho';
import { selectFilteredCustomers, selectKokyaku } from '@/app/_lib/db/tables/m-kokyaku';
import { selectActiveUsers } from '@/app/_lib/db/tables/m-user';
import {
  deleteIdoDenJuchuFromOrder,
  insertIdoDenJuchu,
  selectIdoDenJuchuMaxId,
} from '@/app/_lib/db/tables/t-ido-den-juchu';
import { deleteJuchuCtnMeisaiFromOrder, insertJuchuContainerMeisai } from '@/app/_lib/db/tables/t-juchu-ctn-meisai';
import { insertJuchuHead, selectJuchuHead, selectMaxId, updateJuchuHead } from '@/app/_lib/db/tables/t-juchu-head';
import {
  deleteJuchuHonbanbi,
  insertAllJuchuHonbanbi,
  selectJuchuHonbanbi,
} from '@/app/_lib/db/tables/t-juchu-honbanbi';
import {
  deleteJuchuKizaiHead,
  insertJuchuKizaiHead,
  selectJuchuKizaiHead,
  selectJuchuKizaiHeadMaxId,
  selectKizaiHeadRangesForHonbanbi,
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
import { toJapanStartOfDay, toJapanTimeString, toJapanYMDString } from '@/app/(main)/_lib/date-conversion';
import { getRange } from '@/app/(main)/_lib/date-funcs';
import { expandHonbanbiTemplate, getHonbanbiTemplate } from '@/app/(main)/_lib/honbanbi-funcs';
import { permission } from '@/app/(main)/_lib/permission';
import { HonbanbiValues } from '@/app/(main)/_lib/types';
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
  UsersValue,
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

    if (juchuData.error) {
      if (juchuData.error.code === 'PGRST116') {
        return null;
      }
      throw new Error('[selectJuchuHead] DBエラー:', { cause: juchuData.error });
    }

    if (!juchuData.data.kokyaku_id) {
      throw new Error('不正な受注ヘッダーです');
    }

    const kokyakuData = await selectKokyaku(juchuData.data.kokyaku_id);

    if (kokyakuData.error) {
      if (kokyakuData.error.code === 'PGRST116') {
        return null;
      }
      throw new Error('[selectKokyaku] DBエラー:', { cause: kokyakuData.error });
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
    return order;
  } catch (e) {
    if (e instanceof Error) {
      console.error(`[ERROR] ${e.message}`);
      if (e.cause) {
        console.error(`[CAUSE]`, e.cause);
      }
    } else {
      console.error(e);
    }
    throw e;
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
    return data;
  } catch (e) {
    if (e instanceof Error) {
      console.error(`[ERROR] ${e.message}`);
      if (e.cause) {
        console.error(`[CAUSE]`, e.cause);
      }
    } else {
      console.error(e);
    }
    throw e;
  }
};

/**
 * 受注ヘッダー情報新規追加
 * @param juchuHeadId 受注ヘッダーid
 */
export const addJuchuHead = async (juchuHeadData: OrderValues, userNam: string) => {
  try {
    const maxId = await getMaxId();
    const newOrderId = maxId && maxId.juchu_head_id >= 90000 ? maxId.juchu_head_id + 1 : 90000;

    const newData: JuchuHead = {
      juchu_head_id: newOrderId,
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
      add_dat: new Date().toISOString(),
      add_user: userNam,
    };

    const { error } = await insertJuchuHead(newData);

    if (error) {
      throw new Error('[insertJuchuHead] DBエラー:', { cause: error });
    } else {
      await revalidatePath('/eqpt-order-list');
      return newOrderId;
    }
  } catch (e) {
    if (e instanceof Error) {
      console.error(`[ERROR] ${e.message}`);
      if (e.cause) {
        console.error(`[CAUSE]`, e.cause);
      }
    } else {
      console.error(e);
    }
    return false;
  }
};

/**
 * 受注ヘッダー情報更新
 * @param data 受注ヘッダーデータ
 * @returns 正誤
 */
export const updJuchuHead = async (data: OrderValues, userNam: string) => {
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
    upd_dat: new Date().toISOString(),
    upd_user: userNam,
  };

  try {
    const { error } = await updateJuchuHead(updateData);

    if (error) {
      throw new Error('[updateJuchuHead] DBエラー:', { cause: error });
    }
    await revalidatePath('/eqpt-order-list');
    return true;
  } catch (e) {
    if (e instanceof Error) {
      console.error(`[ERROR] ${e.message}`);
      if (e.cause) {
        console.error(`[CAUSE]`, e.cause);
      }
    } else {
      console.error(e);
    }
    return false;
  }
};

/**
 * 受注ヘッダー削除
 * @param juchuHeadId 受注ヘッダーid
 * @returns
 */
export const delJuchuHead = async (juchuHeadId: number, userNam: string) => {
  const deleteData: JuchuHead = {
    juchu_head_id: juchuHeadId,
    del_flg: 1,
    upd_dat: new Date().toISOString(),
    upd_user: userNam,
  };
  try {
    const { error } = await updateJuchuHead(deleteData);

    if (error) {
      throw error;
    }

    await revalidatePath('/eqpt-order-list');
  } catch (e) {
    if (e instanceof Error) {
      console.error(`[ERROR] ${e.message}`);
      if (e.cause) {
        console.error(`[CAUSE]`, e.cause);
      }
    } else {
      console.error(e);
    }
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
      throw new Error('[selectJuchuKizaiHeadList] DBエラー:', { cause: error });
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
      kicsNyukoFixFlg: d.kics_nyuko_fix_flg,
      yardNyukoFixFlg: d.yard_nyuko_fix_flg,
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
    if (e instanceof Error) {
      console.error(`[ERROR] ${e.message}`);
      if (e.cause) {
        console.error(`[CAUSE]`, e.cause);
      }
    } else {
      console.error(e);
    }
    throw e;
  }
};

export const getJuchuSharyoHeadList = async (juchuHeadId: number) => {
  try {
    const { data, error } = await selectJuchuSharyoHeadList(juchuHeadId);
    if (error) {
      throw new Error('[selectJuchuSharyoHeadList] DBエラー:', { cause: error });
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
    if (e instanceof Error) {
      console.error(`[ERROR] ${e.message}`);
      if (e.cause) {
        console.error(`[CAUSE]`, e.cause);
      }
    } else {
      console.error(e);
    }
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
      if (!data || data.length === 0) {
        return [];
      } else {
        const filteredCustomers: CustomersDialogValues[] = data
          .filter((d) => d.del_flg !== 1)
          .map((d, index) => ({
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
        return filteredCustomers;
      }
    } else {
      throw new Error('[selectFilteredCustomers] DBエラー:', { cause: error });
    }
  } catch (e) {
    if (e instanceof Error) {
      console.error(`[ERROR] ${e.message}`);
      if (e.cause) {
        console.error(`[CAUSE]`, e.cause);
      }
    } else {
      console.error(e);
    }
    throw e;
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
      throw new Error('[selectFilteredLocs] DBエラー:', { cause: error });
    }
    if (!data || data.length === 0) {
      return [];
    }
    const filteredLocs: LocsDialogValues[] = data
      .filter((d) => d.del_flg !== 1)
      .map((d, index) => ({
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
    return filteredLocs;
  } catch (e) {
    if (e instanceof Error) {
      console.error(`[ERROR] ${e.message}`);
      if (e.cause) {
        console.error(`[CAUSE]`, e.cause);
      }
    } else {
      console.error(e);
    }
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
    if (e instanceof Error) {
      console.error(`[ERROR] ${e.message}`);
      if (e.cause) {
        console.error(`[CAUSE]`, e.cause);
      }
    } else {
      console.error(e);
    }
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
    if (e instanceof Error) {
      console.error(`[ERROR] ${e.message}`);
      if (e.cause) {
        console.error(`[CAUSE]`, e.cause);
      }
    } else {
      console.error(e);
    }
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
    if (e instanceof Error) {
      console.error(`[ERROR] ${e.message}`);
      if (e.cause) {
        console.error(`[CAUSE]`, e.cause);
      }
    } else {
      console.error(e);
    }
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
    if (e instanceof Error) {
      console.error(`[ERROR] ${e.message}`);
      if (e.cause) {
        console.error(`[CAUSE]`, e.cause);
      }
    } else {
      console.error(e);
    }
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
    if (e instanceof Error) {
      console.error(`[ERROR] ${e.message}`);
      if (e.cause) {
        console.error(`[CAUSE]`, e.cause);
      }
    } else {
      console.error(e);
    }
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
    if (e instanceof Error) {
      console.error(`[ERROR] ${e.message}`);
      if (e.cause) {
        console.error(`[CAUSE]`, e.cause);
      }
    } else {
      console.error(e);
    }
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
    if (e instanceof Error) {
      console.error(`[ERROR] ${e.message}`);
      if (e.cause) {
        console.error(`[CAUSE]`, e.cause);
      }
    } else {
      console.error(e);
    }
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
    if (e instanceof Error) {
      console.error(`[ERROR] ${e.message}`);
      if (e.cause) {
        console.error(`[CAUSE]`, e.cause);
      }
    } else {
      console.error(e);
    }
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
    if (e instanceof Error) {
      console.error(`[ERROR] ${e.message}`);
      if (e.cause) {
        console.error(`[CAUSE]`, e.cause);
      }
    } else {
      console.error(e);
    }
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
    if (e instanceof Error) {
      console.error(`[ERROR] ${e.message}`);
      if (e.cause) {
        console.error(`[CAUSE]`, e.cause);
      }
    } else {
      console.error(e);
    }
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
    if (e instanceof Error) {
      console.error(`[ERROR] ${e.message}`);
      if (e.cause) {
        console.error(`[CAUSE]`, e.cause);
      }
    } else {
      console.error(e);
    }
    throw e;
  }
};

/** 合算後の受注機材明細1行（複数の元明細行がここに集約される） */
type MergedKizaiMeisai = {
  kizaiId: number;
  kizaiNam: string;
  mShozokuId: number;
  indentNum: number;
  planKizaiQty: number;
  planYobiQty: number;
  mems: (string | null)[];
  mem2s: (string | null)[];
};

/**
 * メモの合算。空を除き、重複を1つにまとめて改行で連結する
 * 連結結果がカラムの上限を超えるとINSERTに失敗しコピー全体がロールバックされるため、上限で切り詰める
 */
const mergeMem = (mems: (string | null)[]) => {
  const uniqueMems = [...new Set(mems.filter((m): m is string => !!m && m.trim() !== ''))];
  return uniqueMems.length > 0 ? uniqueMems.join('\n').slice(0, MEMO_MAX_LENGTH) : null;
};

/**
 * 受注機材明細をセット単位にまとめる
 * indent_num = 0 の行がセット親（単独機材含む）、直後に続く indent_num ≠ 0 の行がそのセットのオプション
 */
const toKizaiSets = (meisaiList: CopyJuchuKizaiMeisaiValues[]) => {
  const sets: CopyJuchuKizaiMeisaiValues[][] = [];
  for (const d of [...meisaiList].sort((a, b) => a.dspOrdNum - b.dspOrdNum)) {
    if (d.indentNum === 0 || sets.length === 0) {
      sets.push([d]);
    } else {
      sets[sets.length - 1].push(d);
    }
  }
  return sets;
};

/** セットの同一判定キー。セット親の機材id＋オプションの機材id構成が完全一致した場合のみ合算する */
const toKizaiSetKey = (set: CopyJuchuKizaiMeisaiValues[]) =>
  [
    set[0].kizaiId,
    ...set
      .slice(1)
      .map((d) => d.kizaiId)
      .sort((a, b) => a - b),
  ].join('|');

const toMergedKizaiMeisai = (d: CopyJuchuKizaiMeisaiValues): MergedKizaiMeisai => ({
  kizaiId: d.kizaiId,
  kizaiNam: d.kizaiNam,
  mShozokuId: d.mShozokuId,
  indentNum: d.indentNum,
  planKizaiQty: d.planKizaiQty,
  planYobiQty: d.planYobiQty,
  mems: [d.mem],
  mem2s: [d.mem2],
});

const addMergedKizaiMeisai = (target: MergedKizaiMeisai, d: CopyJuchuKizaiMeisaiValues) => {
  target.planKizaiQty += d.planKizaiQty;
  target.planYobiQty += d.planYobiQty;
  target.mems.push(d.mem);
  target.mem2s.push(d.mem2);
};

/** 返却分を引く。機材数から引き、機材数が0になったら予備数から引く（0で止める） */
const subMergedKizaiMeisai = (target: MergedKizaiMeisai, qty: number) => {
  const fromKizaiQty = Math.min(qty, Math.max(0, target.planKizaiQty));
  target.planKizaiQty -= fromKizaiQty;
  target.planYobiQty = Math.max(0, target.planYobiQty - (qty - fromKizaiQty));
};

/**
 * 選択された受注機材ヘッダーの明細をセット単位で合算する
 * @param normalHeads メイン受注機材ヘッダー
 * @param returnHeads 返却受注機材ヘッダー（親の明細から数量を引く）
 * @returns 合算後の明細（セット親→オプションの並びのフラットな配列）
 */
const mergeJuchuKizaiMeisai = async (normalHeads: EqTableValues[], returnHeads: EqTableValues[]) => {
  const sourceRowKey = (juchuKizaiHeadId: number, dspOrdNum: number) => `${juchuKizaiHeadId}:${dspOrdNum}`;
  const mergedSets: { key: string; rows: MergedKizaiMeisai[] }[] = [];
  // 「元の明細行 → 合算先の行」の対応。返却分をどの行から引くかの判定に使う
  const mergedBySourceRow = new Map<string, MergedKizaiMeisai>();

  for (const head of normalHeads) {
    const meisaiList = await getJuchuKizaiMeisai(head.juchuHeadId, head.juchuKizaiHeadId);

    for (const set of toKizaiSets(meisaiList)) {
      const key = toKizaiSetKey(set);
      const target = mergedSets.find((m) => m.key === key);

      if (!target) {
        const rows = set.map(toMergedKizaiMeisai);
        mergedSets.push({ key, rows });
        set.forEach((d, i) => mergedBySourceRow.set(sourceRowKey(head.juchuKizaiHeadId, d.dspOrdNum), rows[i]));
        continue;
      }

      addMergedKizaiMeisai(target.rows[0], set[0]);
      mergedBySourceRow.set(sourceRowKey(head.juchuKizaiHeadId, set[0].dspOrdNum), target.rows[0]);

      // キーが一致している＝オプションの機材id構成は同じなので、機材idで1対1に突き合わせる
      const usedRowIdxes = new Set<number>();
      for (const d of set.slice(1)) {
        const idx = target.rows.findIndex((r, i) => i > 0 && !usedRowIdxes.has(i) && r.kizaiId === d.kizaiId);
        if (idx < 0) continue;
        usedRowIdxes.add(idx);
        addMergedKizaiMeisai(target.rows[idx], d);
        mergedBySourceRow.set(sourceRowKey(head.juchuKizaiHeadId, d.dspOrdNum), target.rows[idx]);
      }
    }
  }

  // 返却明細は親明細と同じ dsp_ord_num を持つので、それを辿って対応する行から引く
  for (const head of returnHeads) {
    if (head.oyaJuchuKizaiHeadId === null) continue;
    const meisaiList = await getJuchuKizaiMeisai(head.juchuHeadId, head.juchuKizaiHeadId);

    for (const d of meisaiList) {
      const target = mergedBySourceRow.get(sourceRowKey(head.oyaJuchuKizaiHeadId, d.dspOrdNum));
      if (!target) continue;
      // 返却明細の数量はマイナス値で入っている
      subMergedKizaiMeisai(target, Math.abs(d.planKizaiQty) + Math.abs(d.planYobiQty));
    }
  }

  return mergedSets.flatMap((m) => m.rows);
};

/**
 * 選択された受注機材ヘッダーのコンテナ明細を機材idごとに合算する
 * 返却明細はマイナス値で入っているため、そのまま加算すると減算になる
 */
const mergeJuchuContainerMeisai = async (originJuchuKizaiHeads: EqTableValues[]) => {
  const merged = new Map<number, { kizaiNam: string; qty: number; mems: (string | null)[] }>();

  for (const head of originJuchuKizaiHeads) {
    const isReturn = head.juchuKizaiHeadKbn === JUCHU_KIZAI_HEAD_KBN.return;
    const ctnList = await getJuchuContainerMeisai(head.juchuHeadId, head.juchuKizaiHeadId);

    for (const d of ctnList) {
      const current = merged.get(d.kizaiId) ?? { kizaiNam: d.kizaiNam, qty: 0, mems: [] };
      current.qty += d.planKicsKizaiQty + d.planYardKizaiQty;
      if (!isReturn) current.mems.push(d.mem);
      merged.set(d.kizaiId, current);
    }
  }

  return merged;
};

/** 機材マスタの現在の定価（reg_amt）を機材idごとに引けるMapで取得する */
const getKizaiRegAmts = async (kizaiIds: number[]) => {
  if (kizaiIds.length === 0) return new Map<number, number>();

  const { data, error } = await selectKizaiRegAmts(kizaiIds);
  if (error) {
    throw new Error('[selectKizaiRegAmts] DBエラー:', { cause: error });
  }
  return new Map(data.map((d) => [d.kizai_id, d.reg_amt ?? 0]));
};

/** コピー先受注の顧客に設定されている割引率を取得する */
const getKokyakuNebikiRat = async (juchuHeadId: number) => {
  const juchuData = await selectJuchuHead(juchuHeadId);
  if (juchuData.error) {
    throw new Error('[selectJuchuHead] DBエラー:', { cause: juchuData.error });
  }
  if (!juchuData.data.kokyaku_id) return null;

  const kokyakuData = await selectKokyaku(juchuData.data.kokyaku_id);
  if (kokyakuData.error) {
    throw new Error('[selectKokyaku] DBエラー:', { cause: kokyakuData.error });
  }
  return kokyakuData.data.nebiki_rat;
};

/**
 * 受注機材ヘッダー・明細のコピー
 * 複数選択された明細をセット単位で合算して1つの受注機材ヘッダーにまとめる。
 * 出庫日・入庫日は年月日のみ（0:00固定）で、コピー先の明細はすべてYARD所属で作成する。
 * @param originJuchuKizaiHeads コピー元の受注機材ヘッダー（メイン＋返却）
 * @param juchuHeadId コピー先の受注ヘッダーid
 * @param data コピーダイアログの入力値
 * @param userNam ユーザー名
 */
export const copyJuchuKizaiHeadMeisai = async (
  originJuchuKizaiHeads: EqTableValues[],
  juchuHeadId: number,
  data: CopyDialogValue,
  userNam: string
) => {
  const normalHeads = originJuchuKizaiHeads.filter((d) => d.juchuKizaiHeadKbn === JUCHU_KIZAI_HEAD_KBN.normal);
  const returnHeads = originJuchuKizaiHeads.filter((d) => d.juchuKizaiHeadKbn === JUCHU_KIZAI_HEAD_KBN.return);
  const normalHeadIds = normalHeads.map((d) => d.juchuKizaiHeadId);

  // 画面側と同じ選択条件をサーバー側でも確認する
  if (normalHeads.length === 0 || !data.shukoDat || !data.nyukoDat) {
    console.error('[copyJuchuKizaiHeadMeisai] メイン明細または出庫日・入庫日が指定されていません');
    return false;
  }
  if (normalHeads.length + returnHeads.length !== originJuchuKizaiHeads.length) {
    console.error('[copyJuchuKizaiHeadMeisai] メイン・返却以外の明細が含まれています');
    return false;
  }
  if (returnHeads.some((d) => d.oyaJuchuKizaiHeadId === null || !normalHeadIds.includes(d.oyaJuchuKizaiHeadId))) {
    console.error('[copyJuchuKizaiHeadMeisai] 親メイン明細が選択されていない返却明細が含まれています');
    return false;
  }

  // 出庫日・入庫日は0:00固定でYARDに登録する
  const shukoDate = toJapanStartOfDay(data.shukoDat);
  const nyukoDate = toJapanStartOfDay(data.nyukoDat);
  const dateRange = getRange(shukoDate, nyukoDate);

  const connection = await pool.connect();

  try {
    // 参照系はトランザクションを開始する前に済ませる
    // 割引率はコピー先受注の顧客マスタの値を初期値にする
    const nebikiRat = await getKokyakuNebikiRat(juchuHeadId);
    // 受注機材明細（選択された明細をセット単位で合算し、返却分を引いたもの）
    const mergedKizaiMeisai = await mergeJuchuKizaiMeisai(normalHeads, returnHeads);
    // 単価はコピー元の値ではなく機材マスタの現在の定価を入れ直す
    const regAmtByKizaiId = await getKizaiRegAmts([...new Set(mergedKizaiMeisai.map((d) => d.kizaiId))]);
    // 受注コンテナ明細（機材idごとに合算。数量はYARDに寄せ、KICSは0で作成する）
    const mergedCtnMeisai = await mergeJuchuContainerMeisai(originJuchuKizaiHeads);

    await connection.query('BEGIN');

    // 受注機材ヘッダーid最大値
    const JuchuKizaiHeadMaxId = await getJuchuKizaiHeadMaxId(juchuHeadId);
    // 受注機材ヘッダーid
    const newJuchuKizaiHeadId = JuchuKizaiHeadMaxId ? JuchuKizaiHeadMaxId.juchu_kizai_head_id + 1 : 1;

    // 受注機材ヘッダーデータ
    const newJuchuKizaiHeadData: CopyJuchuKizaiHeadValue = {
      juchuHeadId: juchuHeadId,
      mem: mergeMem(originJuchuKizaiHeads.map((d) => d.mem)),
      headNam: data.headNam,
      kicsShukoDat: null,
      kicsNyukoDat: null,
      yardShukoDat: shukoDate,
      yardNyukoDat: nyukoDate,
      juchuKizaiHeadKbn: JUCHU_KIZAI_HEAD_KBN.normal,
      juchuKizaiHeadId: newJuchuKizaiHeadId,
      juchuHonbanbiQty: 0,
      nebikiAmt: null,
      nebikiRat: nebikiRat,
    };

    // 受注機材ヘッダー追加
    await addJuchuKizaiHead(
      newJuchuKizaiHeadId,
      newJuchuKizaiHeadData,
      JUCHU_KIZAI_HEAD_KBN.normal,
      userNam,
      connection
    );

    // 受注機材入出庫追加
    await addJuchuKizaiNyushuko(
      juchuHeadId,
      newJuchuKizaiHeadId,
      null,
      shukoDate,
      null,
      nyukoDate,
      userNam,
      connection
    );

    // 受注機材本番日(入出庫、使用中)追加
    const addJuchuSiyouHonbanbiData: CopyJuchuKizaiHonbanbiValues[] = dateRange.map((d: string) => ({
      juchuHeadId: juchuHeadId,
      juchuKizaiHeadId: newJuchuKizaiHeadId,
      juchuHonbanbiShubetuId: HONBANBI_SHUBETU_ID.use,
      juchuHonbanbiDat: new Date(d),
      mem: '',
      juchuHonbanbiAddQty: 0,
    }));
    const addJuchuHonbanbiData: CopyJuchuKizaiHonbanbiValues[] = [
      {
        juchuHeadId: juchuHeadId,
        juchuKizaiHeadId: newJuchuKizaiHeadId,
        juchuHonbanbiShubetuId: HONBANBI_SHUBETU_ID.shuko,
        juchuHonbanbiDat: shukoDate,
        mem: '',
        juchuHonbanbiAddQty: 0,
      },
      {
        juchuHeadId: juchuHeadId,
        juchuKizaiHeadId: newJuchuKizaiHeadId,
        juchuHonbanbiShubetuId: HONBANBI_SHUBETU_ID.nyuko,
        juchuHonbanbiDat: nyukoDate,
        mem: '',
        juchuHonbanbiAddQty: 0,
      },
    ];
    const mergeHonbanbiData: CopyJuchuKizaiHonbanbiValues[] = [...addJuchuSiyouHonbanbiData, ...addJuchuHonbanbiData];
    await addAllHonbanbi(juchuHeadId, newJuchuKizaiHeadId, mergeHonbanbiData, userNam, connection);

    // 受注本番日(仕込・RH・GP・本番)を受注本番日テンプレートから展開
    const honbanbiTemplate = await getHonbanbiTemplate(juchuHeadId);
    await expandHonbanbiTemplate(
      juchuHeadId,
      newJuchuKizaiHeadId,
      shukoDate,
      nyukoDate,
      honbanbiTemplate,
      userNam,
      connection
    );

    // 表示順。受注機材明細に1から振り、続けて受注コンテナ明細に振る
    let dspOrdNum = 1;

    const newJuchuKizaiMeisai: CopyJuchuKizaiMeisaiValues[] = mergedKizaiMeisai.map((d, index) => ({
      juchuHeadId: juchuHeadId,
      juchuKizaiHeadId: newJuchuKizaiHeadId,
      juchuKizaiMeisaiId: index + 1,
      mShozokuId: d.mShozokuId,
      // コピー先はすべてYARD所属で作成する
      shozokuId: BASHO_ID.yard,
      mem: mergeMem(d.mems),
      mem2: mergeMem(d.mem2s),
      kizaiId: d.kizaiId,
      kizaiTankaAmt: regAmtByKizaiId.get(d.kizaiId) ?? 0,
      kizaiNam: d.kizaiNam,
      planKizaiQty: d.planKizaiQty,
      planYobiQty: d.planYobiQty,
      planQty: d.planKizaiQty + d.planYobiQty,
      dspOrdNum: dspOrdNum++,
      indentNum: d.indentNum,
      delFlag: false,
      saveFlag: true,
    }));

    if (newJuchuKizaiMeisai.length > 0) {
      // 受注機材明細追加
      await addJuchuKizaiMeisai(newJuchuKizaiMeisai, userNam, connection);

      // 機材入出庫伝票追加
      await addNyushukoDen(newJuchuKizaiHeadData, newJuchuKizaiMeisai, userNam, connection);
    }

    const newJuchuCtnMeisai: CopyJuchuContainerMeisaiValues[] = [...mergedCtnMeisai.entries()].map(
      ([kizaiId, d], index) => ({
        juchuHeadId: juchuHeadId,
        juchuKizaiHeadId: newJuchuKizaiHeadId,
        juchuKizaiMeisaiId: index + 1,
        kizaiId: kizaiId,
        kizaiNam: d.kizaiNam,
        planKicsKizaiQty: 0,
        planYardKizaiQty: Math.max(0, d.qty),
        planQty: Math.max(0, d.qty),
        mem: mergeMem(d.mems),
        dspOrdNum: dspOrdNum++,
        indentNum: 0,
        delFlag: false,
        saveFlag: true,
      })
    );

    if (newJuchuCtnMeisai.length > 0) {
      // 受注コンテナ明細追加
      await addJuchuContainerMeisai(newJuchuCtnMeisai, userNam, connection);

      // コンテナ入出庫伝票追加(YARDのみ)
      await addCtnShukoDen(newJuchuCtnMeisai, shukoDate, BASHO_ID.yard, userNam, connection);
      await addCtnNyukoDen(newJuchuCtnMeisai, nyukoDate, BASHO_ID.yard, BASHO_ID.yard, userNam, connection);
    }

    // 移動受注機材明細
    // 明細はYARDで作成するため、機材マスタの所属がKICSの機材は出庫日に移動させる
    const idoPlanQtyByKizaiId = new Map<number, number>();
    for (const d of newJuchuKizaiMeisai) {
      if (d.mShozokuId !== BASHO_ID.kics) continue;
      idoPlanQtyByKizaiId.set(d.kizaiId, (idoPlanQtyByKizaiId.get(d.kizaiId) ?? 0) + d.planQty);
    }

    const newIdoList: CopyIdoJuchuKizaiMeisaiValues[] = [...idoPlanQtyByKizaiId.entries()]
      .filter(([, planQty]) => planQty > 0)
      .map(([kizaiId, planQty]) => ({
        juchuHeadId: juchuHeadId,
        juchuKizaiHeadId: newJuchuKizaiHeadId,
        idoDenId: null,
        sagyoDenDat: shukoDate,
        sagyoSijiId: SAGYO_SIJI_ID.ky,
        mShozokuId: BASHO_ID.kics,
        shozokuId: BASHO_ID.yard,
        shozokuNam: '',
        kizaiId: kizaiId,
        kizaiNam: newJuchuKizaiMeisai.find((d) => d.kizaiId === kizaiId)?.kizaiNam ?? '',
        kizaiQty: 0,
        planKizaiQty: 0,
        planYobiQty: 0,
        planQty: planQty,
        delFlag: false,
        saveFlag: true,
      }));

    if (newIdoList.length > 0) {
      const idoDenMaxId = await getIdoDenJuchuMaxId();
      const newIdoDenId = idoDenMaxId ? idoDenMaxId + 1 : 1;

      // 移動受注機材明細追加
      await addIdoDenJuchu(newIdoDenId, newIdoList, userNam, connection);
    }

    await connection.query('COMMIT');

    await revalidatePath('/eqpt-order-list');
    await revalidatePath('/ido-list');
    await revalidatePath('/shuko-list');
    await revalidatePath('/nyuko-list');

    return true;
  } catch (e) {
    if (e instanceof Error) {
      console.error(`[ERROR] ${e.message}`);
      if (e.cause) {
        console.error(`[CAUSE]`, e.cause);
      }
    } else {
      console.error(e);
    }
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
    return data;
  } catch (e) {
    if (e instanceof Error) {
      console.error(`[ERROR] ${e.message}`);
      if (e.cause) {
        console.error(`[CAUSE]`, e.cause);
      }
    } else {
      console.error(e);
    }
    throw e;
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
    add_dat: new Date().toISOString(),
    add_user: userNam,
  };
  try {
    await insertJuchuKizaiHead(newData, connection);

    return true;
  } catch (e) {
    if (e instanceof Error) {
      console.error(`[ERROR] ${e.message}`);
      if (e.cause) {
        console.error(`[CAUSE]`, e.cause);
      }
    } else {
      console.error(e);
    }
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
      nyushuko_shubetu_id: i === 0 || i === 1 ? NYUSHUKO_SHUBETU_ID.shuko : NYUSHUKO_SHUBETU_ID.nyuko,
      nyushuko_basho_id: i === 0 || i === 2 ? BASHO_ID.kics : BASHO_ID.yard,
      nyushuko_dat: currentDate.toISOString(),
      add_dat: new Date().toISOString(),
      add_user: userNam,
    };

    try {
      await insertJuchuKizaiNyushuko(newData, connection);
    } catch (e) {
      if (e instanceof Error) {
        console.error(`[ERROR] ${e.message}`);
        if (e.cause) {
          console.error(`[CAUSE]`, e.cause);
        }
      } else {
        console.error(e);
      }
      throw e;
    }
  }
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
    add_dat: new Date().toISOString(),
    add_user: userNam,
  }));
  try {
    await insertAllHonbanbi(newData, connection);
    return true;
  } catch (e) {
    if (e instanceof Error) {
      console.error(`[ERROR] ${e.message}`);
      if (e.cause) {
        console.error(`[CAUSE]`, e.cause);
      }
    } else {
      console.error(e);
    }
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
    const /*{ data: eqList, error: eqListError }*/ eqList = await selectJuchuKizaiMeisai(juchuHeadId, juchuKizaiHeadId);
    // if (eqListError) {
    //   console.error('getJuchuKizaiMeisai eqList error : ', eqListError);
    //   throw eqListError;
    // }
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
      throw new Error('[selectMeisaiEqts] DBエラー:', { cause: mKizaiError });
    }

    const { data: eqTanka, error: eqTankaError } = await selectJuchuKizaiMeisaiKizaiTanka(
      juchuHeadId,
      juchuKizaiHeadId
    );
    if (eqTankaError) {
      throw new Error('[selectJuchuKizaiMeisaiKizaiTanka] DBエラー:', { cause: eqTankaError });
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
    if (e instanceof Error) {
      console.error(`[ERROR] ${e.message}`);
      if (e.cause) {
        console.error(`[CAUSE]`, e.cause);
      }
    } else {
      console.error(e);
    }
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
    mem2: d.mem2,
    keep_qty: null,
    add_dat: new Date().toISOString(),
    add_user: userNam,
    shozoku_id: d.shozokuId,
    dsp_ord_num: d.dspOrdNum,
    indent_num: d.indentNum,
  }));

  try {
    await insertJuchuKizaiMeisai(newData, connection);

    return true;
  } catch (e) {
    if (e instanceof Error) {
      console.error(`[ERROR] ${e.message}`);
      if (e.cause) {
        console.error(`[CAUSE]`, e.cause);
      }
    } else {
      console.error(e);
    }
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
    sagyo_kbn_id: SAGYO_KBN_ID.shukoPicking,
    sagyo_den_dat:
      d.shozokuId === BASHO_ID.kics
        ? juchuKizaiHeadData.kicsShukoDat!.toISOString()
        : juchuKizaiHeadData.yardShukoDat!.toISOString(),
    sagyo_id: d.shozokuId,
    kizai_id: d.kizaiId,
    plan_qty: d.planQty,
    dsp_ord_num: d.dspOrdNum,
    indent_num: d.indentNum,
    add_dat: new Date().toISOString(),
    add_user: userNam,
  }));

  const newShukoCheckData: NyushukoDen[] = juchuKizaiMeisaiData.map((d) => ({
    juchu_head_id: d.juchuHeadId,
    juchu_kizai_head_id: d.juchuKizaiHeadId,
    juchu_kizai_meisai_id: d.juchuKizaiMeisaiId,
    sagyo_kbn_id: SAGYO_KBN_ID.shukoConfirmation,
    sagyo_den_dat:
      d.shozokuId === BASHO_ID.kics
        ? juchuKizaiHeadData.kicsShukoDat!.toISOString()
        : juchuKizaiHeadData.yardShukoDat!.toISOString(),
    sagyo_id: d.shozokuId,
    kizai_id: d.kizaiId,
    plan_qty: d.planQty,
    dsp_ord_num: d.dspOrdNum,
    indent_num: d.indentNum,
    add_dat: new Date().toISOString(),
    add_user: userNam,
  }));

  const newNyukoCheckData: NyushukoDen[] = juchuKizaiMeisaiData.map((d) => ({
    juchu_head_id: d.juchuHeadId,
    juchu_kizai_head_id: d.juchuKizaiHeadId,
    juchu_kizai_meisai_id: d.juchuKizaiMeisaiId,
    sagyo_kbn_id: SAGYO_KBN_ID.nyukoCount,
    // sagyo_den_dat:
    //   d.shozokuId === BASHO_ID.kics
    //     ? juchuKizaiHeadData.kicsNyukoDat!.toISOString()
    //     : juchuKizaiHeadData.yardNyukoDat!.toISOString(),
    sagyo_den_dat:
      juchuKizaiHeadData.kicsNyukoDat && juchuKizaiHeadData.yardNyukoDat && d.mShozokuId === BASHO_ID.kics
        ? juchuKizaiHeadData.kicsNyukoDat.toISOString()
        : juchuKizaiHeadData.kicsNyukoDat && juchuKizaiHeadData.yardNyukoDat && d.mShozokuId === BASHO_ID.yard
          ? juchuKizaiHeadData.yardNyukoDat.toISOString()
          : juchuKizaiHeadData.kicsNyukoDat && !juchuKizaiHeadData.yardNyukoDat
            ? juchuKizaiHeadData.kicsNyukoDat.toISOString()
            : !juchuKizaiHeadData.kicsNyukoDat && juchuKizaiHeadData.yardNyukoDat
              ? juchuKizaiHeadData.yardNyukoDat.toISOString()
              : '',
    // sagyo_id: d.shozokuId,
    sagyo_id:
      juchuKizaiHeadData.kicsNyukoDat && juchuKizaiHeadData.yardNyukoDat && d.mShozokuId === BASHO_ID.kics
        ? BASHO_ID.kics
        : juchuKizaiHeadData.kicsNyukoDat && juchuKizaiHeadData.yardNyukoDat && d.mShozokuId === BASHO_ID.yard
          ? BASHO_ID.yard
          : juchuKizaiHeadData.kicsNyukoDat && !juchuKizaiHeadData.yardNyukoDat
            ? BASHO_ID.kics
            : !juchuKizaiHeadData.kicsNyukoDat && juchuKizaiHeadData.yardNyukoDat
              ? BASHO_ID.yard
              : BASHO_ID.others,
    kizai_id: d.kizaiId,
    plan_qty: d.planQty,
    dsp_ord_num: d.dspOrdNum,
    indent_num: d.indentNum,
    add_dat: new Date().toISOString(),
    add_user: userNam,
  }));

  const mergeData = [...newShukoStandbyData, ...newShukoCheckData, ...newNyukoCheckData];

  try {
    await insertNyushukoDen(mergeData, connection);

    return true;
  } catch (e) {
    if (e instanceof Error) {
      console.error(`[ERROR] ${e.message}`);
      if (e.cause) {
        console.error(`[CAUSE]`, e.cause);
      }
    } else {
      console.error(e);
    }
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
      throw new Error('[selectOyaJuchuContainerMeisai] DBエラー:', { cause: containerError });
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
    if (e instanceof Error) {
      console.error(`[ERROR] ${e.message}`);
      if (e.cause) {
        console.error(`[CAUSE]`, e.cause);
      }
    } else {
      console.error(e);
    }
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
    shozoku_id: BASHO_ID.kics,
    mem: d.mem,
    dsp_ord_num: d.dspOrdNum,
    indent_num: d.indentNum,
    add_dat: new Date().toISOString(),
    add_user: userNam,
  }));

  const newYardData: JuchuCtnMeisai[] = juchuContainerMeisaiData.map((d) => ({
    juchu_head_id: d.juchuHeadId,
    juchu_kizai_head_id: d.juchuKizaiHeadId,
    juchu_kizai_meisai_id: d.juchuKizaiMeisaiId,
    kizai_id: d.kizaiId,
    plan_kizai_qty: d.planYardKizaiQty,
    shozoku_id: BASHO_ID.yard,
    mem: d.mem,
    dsp_ord_num: d.dspOrdNum,
    indent_num: d.indentNum,
    add_dat: new Date().toISOString(),
    add_user: userNam,
  }));

  const mergeData = [...newKicsData, ...newYardData];

  try {
    await insertJuchuContainerMeisai(mergeData, connection);
    return true;
  } catch (e) {
    if (e instanceof Error) {
      console.error(`[ERROR] ${e.message}`);
      if (e.cause) {
        console.error(`[CAUSE]`, e.cause);
      }
    } else {
      console.error(e);
    }
    throw e;
  }
};

/**
 * コンテナ出庫伝票新規追加
 * @param juchuCtnMeisaiData 受注コンテナ明細データ
 * @param shukoDat 出庫日
 * @param sagyoId 作業id
 * @param userNam ユーザー名
 * @param connection
 * @returns
 */
export const addCtnShukoDen = async (
  juchuCtnMeisaiData: CopyJuchuContainerMeisaiValues[],
  shukoDat: Date,
  sagyoId: number,
  userNam: string,
  connection: PoolClient
) => {
  const newCtnShukoStandbyData: NyushukoDen[] = juchuCtnMeisaiData.map((d) => ({
    juchu_head_id: d.juchuHeadId,
    juchu_kizai_head_id: d.juchuKizaiHeadId,
    juchu_kizai_meisai_id: d.juchuKizaiMeisaiId,
    sagyo_kbn_id: SAGYO_KBN_ID.shukoPicking,
    sagyo_den_dat: shukoDat.toISOString(),
    sagyo_id: sagyoId,
    kizai_id: d.kizaiId,
    plan_qty: sagyoId === BASHO_ID.kics ? d.planKicsKizaiQty : d.planYardKizaiQty,
    dsp_ord_num: d.dspOrdNum,
    indent_num: d.indentNum,
    add_dat: new Date().toISOString(),
    add_user: userNam,
  }));

  const newCtnShukoCheckData: NyushukoDen[] = juchuCtnMeisaiData.map((d) => ({
    juchu_head_id: d.juchuHeadId,
    juchu_kizai_head_id: d.juchuKizaiHeadId,
    juchu_kizai_meisai_id: d.juchuKizaiMeisaiId,
    sagyo_kbn_id: SAGYO_KBN_ID.shukoConfirmation,
    sagyo_den_dat: shukoDat.toISOString(),
    sagyo_id: sagyoId,
    kizai_id: d.kizaiId,
    plan_qty: sagyoId === BASHO_ID.kics ? d.planKicsKizaiQty : d.planYardKizaiQty,
    dsp_ord_num: d.dspOrdNum,
    indent_num: d.indentNum,
    add_dat: new Date().toISOString(),
    add_user: userNam,
  }));

  const mergeData = [...newCtnShukoStandbyData, ...newCtnShukoCheckData];

  try {
    await insertNyushukoDen(mergeData, connection);

    return true;
  } catch (e) {
    if (e instanceof Error) {
      console.error(`[ERROR] ${e.message}`);
      if (e.cause) {
        console.error(`[CAUSE]`, e.cause);
      }
    } else {
      console.error(e);
    }
    throw e;
  }
};

/**
 * コンテナ入庫伝票新規追加
 * @param juchuCtnMeisaiData 受注コンテナ明細データ
 * @param nyukoDat 入庫日
 * @param sagyoId 作業id
 * @param userNam ユーザー名
 * @param connection
 * @returns
 */
export const addCtnNyukoDen = async (
  juchuCtnMeisaiData: CopyJuchuContainerMeisaiValues[],
  nyukoDat: Date,
  sagyoId: number,
  planQtyId: number,
  userNam: string,
  connection: PoolClient
) => {
  const newCtnNyukoData: NyushukoDen[] = juchuCtnMeisaiData.map((d) => ({
    juchu_head_id: d.juchuHeadId,
    juchu_kizai_head_id: d.juchuKizaiHeadId,
    juchu_kizai_meisai_id: d.juchuKizaiMeisaiId,
    sagyo_kbn_id: SAGYO_KBN_ID.nyukoCount,
    sagyo_den_dat: nyukoDat.toISOString(),
    sagyo_id: sagyoId,
    kizai_id: d.kizaiId,
    plan_qty:
      planQtyId === BASHO_ID.kics ? d.planKicsKizaiQty : planQtyId === BASHO_ID.yard ? d.planYardKizaiQty : d.planQty,
    dsp_ord_num: d.dspOrdNum,
    indent_num: d.indentNum,
    add_dat: new Date().toISOString(),
    add_user: userNam,
  }));

  try {
    await insertNyushukoDen(newCtnNyukoData, connection);

    return true;
  } catch (e) {
    if (e instanceof Error) {
      console.error(`[ERROR] ${e.message}`);
      if (e.cause) {
        console.error(`[CAUSE]`, e.cause);
      }
    } else {
      console.error(e);
    }
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
    sagyo_kbn_id: SAGYO_KBN_ID.shukoPicking,
    sagyo_den_dat: shukoDat.toISOString(),
    sagyo_id: sagyoId,
    kizai_id: d.kizaiId,
    plan_qty: sagyoId === BASHO_ID.kics ? d.planKicsKizaiQty : d.planYardKizaiQty,
    dsp_ord_num: d.dspOrdNum,
    indent_num: d.indentNum,
    add_dat: new Date().toISOString(),
    add_user: userNam,
  }));

  const newCtnShukoCheckData: NyushukoDen[] = juchuCtnMeisaiData.map((d) => ({
    juchu_head_id: d.juchuHeadId,
    juchu_kizai_head_id: d.juchuKizaiHeadId,
    juchu_kizai_meisai_id: d.juchuKizaiMeisaiId,
    sagyo_kbn_id: SAGYO_KBN_ID.shukoConfirmation,
    sagyo_den_dat: shukoDat.toISOString(),
    sagyo_id: sagyoId,
    kizai_id: d.kizaiId,
    plan_qty: sagyoId === BASHO_ID.kics ? d.planKicsKizaiQty : d.planYardKizaiQty,
    dsp_ord_num: d.dspOrdNum,
    indent_num: d.indentNum,
    add_dat: new Date().toISOString(),
    add_user: userNam,
  }));

  const newCtnNyukoCheckData: NyushukoDen[] = juchuCtnMeisaiData.map((d) => ({
    juchu_head_id: d.juchuHeadId,
    juchu_kizai_head_id: d.juchuKizaiHeadId,
    juchu_kizai_meisai_id: d.juchuKizaiMeisaiId,
    sagyo_kbn_id: SAGYO_KBN_ID.nyukoCount,
    sagyo_den_dat: nyukoDat.toISOString(),
    sagyo_id: sagyoId,
    kizai_id: d.kizaiId,
    plan_qty: sagyoId === BASHO_ID.kics ? d.planKicsKizaiQty : d.planYardKizaiQty,
    dsp_ord_num: d.dspOrdNum,
    indent_num: d.indentNum,
    add_dat: new Date().toISOString(),
    add_user: userNam,
  }));

  const mergeData = [...newCtnShukoStandbyData, ...newCtnShukoCheckData, ...newCtnNyukoCheckData];

  try {
    await insertNyushukoDen(mergeData, connection);

    return true;
  } catch (e) {
    if (e instanceof Error) {
      console.error(`[ERROR] ${e.message}`);
      if (e.cause) {
        console.error(`[CAUSE]`, e.cause);
      }
    } else {
      console.error(e);
    }
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
    const /*{ data: eqList, error: eqListError }*/ eqList = await selectIdoJuchuKizaiMeisai(
        juchuHeadId,
        juchuKizaiHeadId
      );
    // if (eqListError) {
    //   console.error('GetEqList eqList error : ', eqListError);
    //   throw eqListError;
    // }

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
      throw new Error('[selectMeisaiEqts] DBエラー:', { cause: mKizaiError });
    }

    const juchuKizaiMeisaiData: CopyIdoJuchuKizaiMeisaiValues[] = uniqueEqList.map((d) => ({
      juchuHeadId: d.juchu_head_id ?? 0,
      juchuKizaiHeadId: d.juchu_kizai_head_id ?? 0,
      idoDenId: d.ido_den_id,
      sagyoDenDat: d.sagyo_den_dat ? new Date(d.sagyo_den_dat) : null,
      sagyoSijiId: d.sagyo_siji_id === 'K→Y' ? SAGYO_SIJI_ID.ky : d.sagyo_siji_id === 'Y→K' ? SAGYO_SIJI_ID.yk : null,
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
    if (e instanceof Error) {
      console.error(`[ERROR] ${e.message}`);
      if (e.cause) {
        console.error(`[CAUSE]`, e.cause);
      }
    } else {
      console.error(e);
    }
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
      throw new Error('[selectIdoDenJuchuMaxId] DBエラー:', { cause: error });
    }
    return data.ido_den_id;
  } catch (e) {
    if (e instanceof Error) {
      console.error(`[ERROR] ${e.message}`);
      if (e.cause) {
        console.error(`[CAUSE]`, e.cause);
      }
    } else {
      console.error(e);
    }
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
    sagyo_kbn_id: SAGYO_KBN_ID.idoShuko,
    kizai_id: d.kizaiId,
    plan_qty: d.planQty,
    juchu_head_id: d.juchuHeadId,
    juchu_kizai_head_id: d.juchuKizaiHeadId,
    add_dat: new Date().toISOString(),
    add_user: userNam,
  }));

  const newUnloadData: IdoDenJuchu[] = idoKizaiData.map((d, index) => ({
    ido_den_id: newIdoDenId + index,
    sagyo_den_dat: toJapanYMDString(d.sagyoDenDat as Date, '-'),
    sagyo_siji_id: d.mShozokuId,
    sagyo_id: d.mShozokuId === BASHO_ID.kics ? BASHO_ID.yard : BASHO_ID.kics,
    sagyo_kbn_id: SAGYO_KBN_ID.idoNyuko,
    kizai_id: d.kizaiId,
    plan_qty: d.planQty,
    juchu_head_id: d.juchuHeadId,
    juchu_kizai_head_id: d.juchuKizaiHeadId,
    add_dat: new Date().toISOString(),
    add_user: userNam,
  }));

  const mergeData = [...newLoadData, ...newUnloadData];

  try {
    await insertIdoDenJuchu(mergeData, connection);
    return true;
  } catch (e) {
    if (e instanceof Error) {
      console.error(`[ERROR] ${e.message}`);
      if (e.cause) {
        console.error(`[CAUSE]`, e.cause);
      }
    } else {
      console.error(e);
    }
    throw e;
  }
};

/**
 * ユーザー情報取得
 * @param query
 * @returns
 */
export const getUsers = async () => {
  try {
    const rows = await selectActiveUsers();
    if (!rows || rows.length === 0) {
      return [];
    }
    const filteredUsers: UsersValue[] = rows
      .filter((d) => d.del_flg !== 1 && d.permission & permission.juchu_upd)
      .map((d, index) => ({
        tantouNam: d.user_nam,
        mailAdr: d.mail_adr,
      }));
    return filteredUsers;
  } catch (e) {
    if (e instanceof Error) {
      console.error(`[ERROR] ${e.message}`);
      if (e.cause) {
        console.error(`[CAUSE]`, e.cause);
      }
    } else {
      console.error(e);
    }
    throw e;
  }
};

/**
 * 受注本番日テンプレート取得
 * @param juchuHeadId 受注ヘッダーid
 * @returns 受注本番日テンプレート
 */
export const getJuchuHonbanbi = async (juchuHeadId: number) => {
  try {
    const { data, error } = await selectJuchuHonbanbi(juchuHeadId);

    if (error) {
      throw new Error('[getJuchuHonbanbi] DBエラー:', { cause: error });
    }

    const honbanbiList: HonbanbiValues[] = data.map((d) => ({
      juchuHonbanbiShubetuId: d.juchu_honbanbi_shubetu_id,
      juchuHonbanbiDat: new Date(d.juchu_honbanbi_dat),
      mem: d.mem,
      juchuHonbanbiAddQty: d.juchu_honbanbi_add_qty,
    }));

    return honbanbiList;
  } catch (e) {
    if (e instanceof Error) {
      console.error(`[ERROR] ${e.message}`);
      if (e.cause) {
        console.error(`[CAUSE]`, e.cause);
      }
    } else {
      console.error(e);
    }
    throw e;
  }
};

/**
 * 受注本番日を保存する。
 * 入力内容を受注ヘッダー単位のテンプレートとして作り直し、
 * 通常の受注機材ヘッダーそれぞれの出庫日〜入庫日に重なる日付を、そのヘッダーの本番日として展開する。
 * @param juchuHeadId 受注ヘッダーid
 * @param honbanbiList 受注本番日リスト
 * @param userNam ユーザー名
 * @returns 成功：true　失敗：false
 */
export const saveJuchuHonbanbi = async (juchuHeadId: number, honbanbiList: HonbanbiValues[], userNam: string) => {
  const connection = await pool.connect();
  const now = new Date().toISOString();

  try {
    await connection.query('BEGIN');

    // 受注本番日テンプレートを作り直す
    await deleteJuchuHonbanbi(juchuHeadId, connection);

    if (honbanbiList.length > 0) {
      await insertAllJuchuHonbanbi(
        honbanbiList.map((d) => ({
          juchu_head_id: juchuHeadId,
          juchu_honbanbi_shubetu_id: d.juchuHonbanbiShubetuId,
          juchu_honbanbi_dat: toJapanYMDString(d.juchuHonbanbiDat, '-'),
          mem: d.mem ? d.mem : null,
          juchu_honbanbi_add_qty: d.juchuHonbanbiAddQty,
          add_dat: now,
          add_user: userNam,
          upd_dat: now,
          upd_user: userNam,
        })),
        connection
      );
    }

    // 通常・返却の受注機材ヘッダーへ展開する（キープは対象外）
    // 返却ヘッダーは本番日の行を持たせず、金額算出用の本番日数だけを更新する
    const { rows: heads } = await selectKizaiHeadRangesForHonbanbi(juchuHeadId, connection);

    for (const head of heads) {
      await expandHonbanbiTemplate(
        juchuHeadId,
        head.juchuKizaiHeadId,
        head.startDat,
        head.endDat,
        honbanbiList,
        userNam,
        connection,
        head.juchuKizaiHeadKbn === JUCHU_KIZAI_HEAD_KBN.return
      );
    }

    await connection.query('COMMIT');

    return true;
  } catch (e) {
    await connection.query('ROLLBACK');

    if (e instanceof Error) {
      console.error(`[ERROR] ${e.message}`);
      if (e.cause) {
        console.error(`[CAUSE]`, e.cause);
      }
    } else {
      console.error(e);
    }
    return false;
  } finally {
    connection.release();
  }
};
