'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { QueryResult } from 'pg';

import { isJizenSagyoKbn, toHonbanSagyoKbn } from '@/app/_lib/constants';
import pool from '@/app/_lib/db/postgres';
import { deleteNyushukoCtnResult } from '@/app/_lib/db/tables/t-nyushuko-ctn-result';
import {
  deleteEmptyNyushukoDen,
  recountNyushukoDenResult,
  updateHonbanAdjFromJizen,
  updateNyushukoDen,
  updateResultAdjQty,
} from '@/app/_lib/db/tables/t-nyushuko-den';
import { selectHonbanShukoFixed, selectSagyoIdFilterNyushukoFixFlag } from '@/app/_lib/db/tables/t-nyushuko-fix';
import { deleteHonbanResultByJizenTags, deleteNyushukoResult } from '@/app/_lib/db/tables/t-nyushuko-result';
import { selectNyushukoDetailOne } from '@/app/_lib/db/tables/v-nyushuko-den2-lst';
import { selectNyushukoEqptDetail } from '@/app/_lib/db/tables/v-nyushuko-den2-result';
import { NyushukoDen } from '@/app/_lib/db/types/t-nyushuko-den-type';

import { ShukoEqptDetailTableValues, ShukoEqptDetailValues } from './types';

/**
 * 出庫機材詳細取得
 * @param juchuHeadId 受注ヘッダーid
 * @param nyushukoBashoId 入出庫場所id
 * @param sagyoDenDat 作業日時
 * @param sagyoKbnId 作業区分id
 * @param kizaiId 機材id
 * @returns
 */
export const getShukoEqptDetail = async (
  juchuHeadId: number,
  juchuKizaiHeadId: number,
  juchuKizaiMeisaiId: number,
  juchuKizaiHeadKbnId: number,
  nyushukoBashoId: number,
  nyushukoDat: string,
  sagyoKbnId: number,
  kizaiId: number
) => {
  try {
    const { data, error } = await selectNyushukoDetailOne(
      juchuHeadId,
      juchuKizaiHeadId,
      juchuKizaiMeisaiId,
      nyushukoBashoId,
      nyushukoDat,
      sagyoKbnId,
      kizaiId
    );

    if (error) {
      if (error.code === 'PGRST116') {
        return null;
      }
      throw new Error('[selectNyushukoDetailOne] DBエラー:', { cause: error });
    }

    const shukoEqptDetaildata: ShukoEqptDetailValues = {
      juchuHeadId: juchuHeadId,
      juchuKizaiHeadId: juchuKizaiHeadId,
      juchuKizaiMeisaiId: juchuKizaiMeisaiId,
      juchuKizaiHeadKbnId: juchuKizaiHeadKbnId,
      nyushukoBashoId: nyushukoBashoId,
      nyushukoDat: nyushukoDat,
      sagyoKbnId: sagyoKbnId,
      planQty: data.plan_qty ?? 0,
      resultQty: data.result_qty ?? 0,
      resultAdjQty: data.result_adj_qty ?? 0,
      kizaiId: kizaiId,
      kizaiNam: data.kizai_nam,
      bldCod: data.bld_cod,
      tanaCod: data.tana_cod,
      edaCod: data.eda_cod,
      kizaiMem: data.kizai_mem,
      ctnFlg: data.ctn_flg === 1 ? true : false,
      indentNum: data.indent_num ?? 0,
      addUser: data.add_user,
      updUser: data.upd_user,
    };

    return shukoEqptDetaildata;
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
 * 出庫読取実績データ取得
 * @param juchuHeadId 受注ヘッダーid
 * @param nyushukoBashoId 入出庫場所id
 * @param nyushukoDat 入出庫日
 * @param sagyoKbnId 作業区分id
 * @param kizaiId 機材id
 * @returns
 */
export const getShukoEqptDetailTable = async (
  juchuHeadId: number,
  juchuKizaiHeadId: number,
  juchuKizaiMeisaiId: number,
  nyushukoBashoId: number,
  nyushukoDat: string,
  sagyoKbnId: number,
  kizaiId: number
) => {
  try {
    const { data, error } = await selectNyushukoEqptDetail(
      juchuHeadId,
      juchuKizaiHeadId,
      juchuKizaiMeisaiId,
      nyushukoBashoId,
      nyushukoDat,
      sagyoKbnId,
      kizaiId
    );

    if (error) {
      throw new Error('[selectNyushukoEqptDetail] DBエラー:', { cause: error });
    }

    const shukoEqptDetailTableData: ShukoEqptDetailTableValues[] = data.map((d) => ({
      nyushukoBashoId: d.nyushuko_basho_id ?? 0,
      rfidDat: d.rfid_dat,
      rfidDelFlg: d.rfid_del_flg,
      rfidElNum: d.rfid_el_num,
      rfidKizaiSts: d.rfid_kizai_sts,
      rfidMem: d.rfid_mem,
      rfidShozokuId: d.rfid_shozoku_id,
      rfidShozokuNam: d.rfid_shozoku_nam,
      rfidStsNam: d.rfid_sts_nam,
      rfidTagId: d.rfid_tag_id,
      rfidUser: d.rfid_user,
    }));

    return shukoEqptDetailTableData;
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
 * 出庫読取実績データ削除
 * @param deleteData 実績クリアデータ
 * @param userNam ユーザー名
 * @returns
 */
export const delshukoResult = async (
  shukoEqptDetailData: ShukoEqptDetailValues,
  deleteData: ShukoEqptDetailTableValues[],
  userNam: string
) => {
  const connection = await pool.connect();

  const deleteTagIds = deleteData.map((d) => d.rfidTagId).filter((id): id is string => id !== null);
  const jizen = isJizenSagyoKbn(shukoEqptDetailData.sagyoKbnId);
  try {
    // 事前の実績は本番の出発後は変えない（本番にコピーした読取も消すため）
    if (
      jizen &&
      (await selectHonbanShukoFixed(
        shukoEqptDetailData.juchuHeadId,
        shukoEqptDetailData.juchuKizaiHeadId,
        shukoEqptDetailData.nyushukoBashoId
      ))
    ) {
      return false;
    }

    await connection.query('BEGIN');

    if (shukoEqptDetailData.ctnFlg) {
      await deleteNyushukoCtnResult(
        shukoEqptDetailData.juchuHeadId,
        shukoEqptDetailData.juchuKizaiHeadId,
        shukoEqptDetailData.juchuKizaiMeisaiId,
        shukoEqptDetailData.sagyoKbnId,
        shukoEqptDetailData.nyushukoDat,
        shukoEqptDetailData.nyushukoBashoId,
        shukoEqptDetailData.kizaiId,
        deleteTagIds,
        connection
      );
    } else {
      await deleteNyushukoResult(
        shukoEqptDetailData.juchuHeadId,
        shukoEqptDetailData.juchuKizaiHeadId,
        shukoEqptDetailData.juchuKizaiMeisaiId,
        shukoEqptDetailData.sagyoKbnId,
        shukoEqptDetailData.nyushukoDat,
        shukoEqptDetailData.nyushukoBashoId,
        shukoEqptDetailData.kizaiId,
        deleteTagIds,
        connection
      );
    }

    const updateNyushukoDenData: NyushukoDen = {
      juchu_head_id: shukoEqptDetailData.juchuHeadId,
      juchu_kizai_head_id: shukoEqptDetailData.juchuKizaiHeadId,
      juchu_kizai_meisai_id: shukoEqptDetailData.juchuKizaiMeisaiId,
      sagyo_kbn_id: shukoEqptDetailData.sagyoKbnId,
      sagyo_den_dat: shukoEqptDetailData.nyushukoDat,
      sagyo_id: shukoEqptDetailData.nyushukoBashoId,
      kizai_id: shukoEqptDetailData.kizaiId,
      result_qty: shukoEqptDetailData.resultQty - deleteData.length,
      upd_dat: new Date().toISOString(),
      upd_user: userNam,
    };

    await updateNyushukoDen(updateNyushukoDenData, connection);

    // 受注明細が無い伝票（受注から削除された行・ハンディが予定外に読み取った行）は、
    // 実績・補正が0になった時点で不要になるので消す
    // 受注明細がある行は対象外なので、コンテナ片側0のような正当な数量0の行は残る
    await deleteEmptyNyushukoDen(
      {
        juchu_head_id: shukoEqptDetailData.juchuHeadId,
        juchu_kizai_head_id: shukoEqptDetailData.juchuKizaiHeadId,
        juchu_kizai_meisai_id: shukoEqptDetailData.juchuKizaiMeisaiId,
        sagyo_kbn_id: shukoEqptDetailData.sagyoKbnId,
        sagyo_den_dat: shukoEqptDetailData.nyushukoDat,
        sagyo_id: shukoEqptDetailData.nyushukoBashoId,
        kizai_id: shukoEqptDetailData.kizaiId,
      },
      connection
    );

    // 事前で削除したタグは本番（80→10、90→20）からも削除し、本番の伝票の読取数を数え直す
    // （本番で削除したタグは事前に影響しない。片方向）
    if (jizen) {
      const honbanSagyoKbnId = toHonbanSagyoKbn(shukoEqptDetailData.sagyoKbnId);
      const honbanDat = await deleteHonbanResultByJizenTags(
        {
          juchu_head_id: shukoEqptDetailData.juchuHeadId,
          juchu_kizai_head_id: shukoEqptDetailData.juchuKizaiHeadId,
          juchu_kizai_meisai_id: shukoEqptDetailData.juchuKizaiMeisaiId,
          kizai_id: shukoEqptDetailData.kizaiId,
        },
        honbanSagyoKbnId,
        shukoEqptDetailData.nyushukoBashoId,
        deleteTagIds,
        connection
      );
      if (honbanDat) {
        await recountNyushukoDenResult(
          shukoEqptDetailData.juchuHeadId,
          honbanSagyoKbnId,
          honbanDat,
          shukoEqptDetailData.nyushukoBashoId,
          shukoEqptDetailData.kizaiId,
          userNam,
          connection
        );
      }
    }

    await await connection.query('COMMIT');
    revalidatePath(
      `shuko-list/shuko-detail/${shukoEqptDetailData.juchuHeadId}/${shukoEqptDetailData.nyushukoBashoId}/${shukoEqptDetailData.nyushukoDat}/${shukoEqptDetailData.sagyoKbnId}`
    );
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
 * 出庫伝票補正数更新
 * @param data 補正数更新データ
 * @param userNam ユーザー名
 * @returns
 */
export const updShukoResultAdjQty = async (
  shukoEqptDetailData: ShukoEqptDetailValues,
  resultAdjQty: number,
  userNam: string
) => {
  const updateData: NyushukoDen = {
    juchu_head_id: shukoEqptDetailData.juchuHeadId,
    juchu_kizai_head_id: shukoEqptDetailData.juchuKizaiHeadId,
    juchu_kizai_meisai_id: shukoEqptDetailData.juchuKizaiMeisaiId,
    sagyo_kbn_id: shukoEqptDetailData.sagyoKbnId,
    sagyo_den_dat: shukoEqptDetailData.nyushukoDat,
    sagyo_id: shukoEqptDetailData.nyushukoBashoId,
    kizai_id: shukoEqptDetailData.kizaiId,
    result_adj_qty: resultAdjQty,
    upd_dat: new Date().toISOString(),
    upd_user: userNam,
  };
  try {
    // 事前の補正は本番（80→10、90→20）の補正を上書きする（本番で入れた補正は事前に影響しない。片方向）
    if (isJizenSagyoKbn(shukoEqptDetailData.sagyoKbnId)) {
      return await updJizenResultAdjQty(shukoEqptDetailData, resultAdjQty, updateData, userNam);
    }

    const { error } = await updateResultAdjQty(updateData);
    if (error) {
      throw new Error('[updateResultAdjQty] DBエラー:', { cause: error });
    }

    // 補正数を0に戻したことで、受注明細が無い伝票が空になる場合は消す
    await deleteEmptyNyushukoDen(
      {
        juchu_head_id: shukoEqptDetailData.juchuHeadId,
        juchu_kizai_head_id: shukoEqptDetailData.juchuKizaiHeadId,
        juchu_kizai_meisai_id: shukoEqptDetailData.juchuKizaiMeisaiId,
        sagyo_kbn_id: shukoEqptDetailData.sagyoKbnId,
        sagyo_den_dat: shukoEqptDetailData.nyushukoDat,
        sagyo_id: shukoEqptDetailData.nyushukoBashoId,
        kizai_id: shukoEqptDetailData.kizaiId,
      },
      pool
    );

    revalidatePath(
      `shuko-list/shuko-detail/${shukoEqptDetailData.juchuHeadId}/${shukoEqptDetailData.juchuKizaiHeadKbnId}/${shukoEqptDetailData.nyushukoBashoId}/${shukoEqptDetailData.nyushukoDat}/${shukoEqptDetailData.sagyoKbnId}`
    );
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
 * 事前（80/90）の補正数更新
 * 事前の伝票の補正を更新し、本番（同じ明細・機材・作業場所の 10/20 の伝票）の補正を同じ値で上書きする。
 * 本番が出発済みなら更新しない。事前は「読取数＋補正数 ≤ 準備数（予定数）」を守る
 * @param shukoEqptDetailData 事前の機材詳細
 * @param resultAdjQty 補正数
 * @param updateData 事前の伝票の更新データ
 * @param userNam ユーザー名
 * @returns 更新できたら true
 */
const updJizenResultAdjQty = async (
  shukoEqptDetailData: ShukoEqptDetailValues,
  resultAdjQty: number,
  updateData: NyushukoDen,
  userNam: string
) => {
  if (shukoEqptDetailData.resultQty + resultAdjQty > shukoEqptDetailData.planQty) return false;
  if (
    await selectHonbanShukoFixed(
      shukoEqptDetailData.juchuHeadId,
      shukoEqptDetailData.juchuKizaiHeadId,
      shukoEqptDetailData.nyushukoBashoId
    )
  ) {
    return false;
  }

  const connection = await pool.connect();
  try {
    await connection.query('BEGIN');
    await updateNyushukoDen(updateData, connection);
    await updateHonbanAdjFromJizen(
      {
        juchu_head_id: shukoEqptDetailData.juchuHeadId,
        juchu_kizai_head_id: shukoEqptDetailData.juchuKizaiHeadId,
        juchu_kizai_meisai_id: shukoEqptDetailData.juchuKizaiMeisaiId,
        kizai_id: shukoEqptDetailData.kizaiId,
      },
      toHonbanSagyoKbn(shukoEqptDetailData.sagyoKbnId),
      shukoEqptDetailData.nyushukoBashoId,
      resultAdjQty,
      userNam,
      connection
    );
    // 補正数を0に戻したことで、受注明細が無い事前の伝票（準備日を消して残した行）が空になる場合は消す
    await deleteEmptyNyushukoDen(
      {
        juchu_head_id: shukoEqptDetailData.juchuHeadId,
        juchu_kizai_head_id: shukoEqptDetailData.juchuKizaiHeadId,
        juchu_kizai_meisai_id: shukoEqptDetailData.juchuKizaiMeisaiId,
        sagyo_kbn_id: shukoEqptDetailData.sagyoKbnId,
        sagyo_den_dat: shukoEqptDetailData.nyushukoDat,
        sagyo_id: shukoEqptDetailData.nyushukoBashoId,
        kizai_id: shukoEqptDetailData.kizaiId,
      },
      connection
    );
    await connection.query('COMMIT');
    return true;
  } catch (e) {
    await connection.query('ROLLBACK');
    throw e;
  } finally {
    connection.release();
  }
};

/**
 * 出庫作業確定フラグ取得
 * @param juchuHeadId 受注ヘッダーid
 * @param juchuKizaiHeadId 受注機材ヘッダーid
 * @param sagyoKbnId 作業区分id
 * @param sagyoDenDat 作業日時
 * @param sagyoId 作業id
 * @returns
 */
export const getShukoFixFlag = async (
  juchuHeadId: number,
  juchuKizaiHeadId: number,
  sagyoKbnId: number,
  sagyoDenDat: string,
  sagyoId: number
) => {
  try {
    const { data, error } = await selectSagyoIdFilterNyushukoFixFlag(
      juchuHeadId,
      juchuKizaiHeadId,
      sagyoKbnId,
      sagyoDenDat,
      sagyoId
    );

    if (error) {
      if (error.code === 'PGRST116') {
        return false;
      }
      throw error;
    }

    return data.sagyo_fix_flg === 0 ? false : true;
  } catch (e) {
    throw e;
  }
};
