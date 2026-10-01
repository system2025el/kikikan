'use server';

import { revalidatePath } from 'next/cache';
import { PoolClient } from 'pg';

import { JUCHU_KIZAI_HEAD_KBN, NYUSHUKO_SHUBETU_ID, SAGYO_KBN_ID } from '@/app/_lib/constants';
import pool, { refreshVRfid } from '@/app/_lib/db/postgres';
import { selectJuchuContainerMeisaiMaxId, upsertJuchuContainerMeisai } from '@/app/_lib/db/tables/t-juchu-ctn-meisai';
import { selectChildJuchuKizaiHeadConfirm } from '@/app/_lib/db/tables/t-juchu-kizai-head';
import { selectJuchuKizaiNyushukoConfirmList } from '@/app/_lib/db/tables/t-juchu-kizai-nyushuko';
import { updateNyushukoDen, upsertNyushukoDen } from '@/app/_lib/db/tables/t-nyushuko-den';
import {
  deleteNyushukoFix,
  insertNyushukoFix,
  selectFixedJuchuKizaiHeadIdsTx,
} from '@/app/_lib/db/tables/t-nyushuko-fix';
import { selectNyushukoOne } from '@/app/_lib/db/tables/v-nyushuko-den2-head';
import { selectCtnNyushukoDetail, selectNyushukoDetail } from '@/app/_lib/db/tables/v-nyushuko-den2-lst';
import { JuchuCtnMeisai } from '@/app/_lib/db/types/t_juchu_ctn_meisai-type';
import { NyushukoDen } from '@/app/_lib/db/types/t-nyushuko-den-type';
import { NyushukoFix } from '@/app/_lib/db/types/t-nyushuko-fix-type';
import {
  NYUSHUKO_FIX_ERROR,
  NyushukoFixError,
  NyushukoFixResult,
  toNyushukoFixErrorReason,
} from '@/app/(main)/_lib/nyushuko-fix-error';

import { calcShukoDiff, hasShukoDiff } from './shuko-diff';
import { NyukoValues, ShukoDetailTableValues, ShukoDetailValues } from './types';

/**
 * 出庫明細取得
 * @param juchuHeadId 受注ヘッダーid
 * @param juchuKizaiHeadKbn 受注機材ヘッダー区分
 * @param nyushukoBashoId 入出庫場所id
 * @param nyushukoDat 入出庫日時
 * @param sagyoKbnId 作業区分id
 * @returns
 */
export const getShukoDetail = async (
  juchuHeadId: number,
  juchuKizaiHeadKbn: number,
  nyushukoBashoId: number,
  nyushukoDat: string,
  sagyoKbnId: number
) => {
  try {
    const data = await selectNyushukoOne(
      juchuHeadId,
      juchuKizaiHeadKbn,
      nyushukoBashoId,
      nyushukoDat,
      NYUSHUKO_SHUBETU_ID.shuko
    );

    // 出庫日時が設定されていてもその場所に出庫伝票が無い場合（例：KICS出庫日時だけあり明細は全てYARD所属）は
    // 該当行が無い。呼び出し元で「見つかりません」を表示させるためnullを返す。
    if (data.length === 0) return null;

    const nyukoDetailData: ShukoDetailValues = {
      juchuHeadId: juchuHeadId,
      juchuKizaiHeadKbn: juchuKizaiHeadKbn,
      nyushukoBashoId: nyushukoBashoId,
      nyushukoDat: nyushukoDat,
      sagyoKbnId: sagyoKbnId,
      juchuKizaiHeadIds: data[0].juchu_kizai_head_idv?.split(',').map((id: string) => parseInt(id)) || [],
      nyushukoShubetuId: NYUSHUKO_SHUBETU_ID.shuko,
      headNamv: data[0].head_namv,
      koenNam: data[0].koen_nam,
      koenbashoNam: data[0].koenbasho_nam,
      kokyakuNam: data[0].kokyaku_nam,
      juchuDat: data[0].juchu_dat,
      memv: data[0].memv,
      nyuryokuUser: data[0].nyuryoku_user,
    };

    return nyukoDetailData;
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
 * 出庫明細テーブルデータ取得
 * @param juchuHeadId 受注ヘッダーid
 * @param nyushukoBashoId 入出庫場所id
 * @param nyushukoDat 入出庫日
 * @param sagyoKbnId 作業区分id
 * @returns
 */
export const getShukoDetailTable = async (
  juchuHeadId: number,
  juchuKizaiHeadKbn: number,
  nyushukoBashoId: number,
  nyushukoDat: string,
  sagyoKbnId: number
) => {
  try {
    const data = await selectNyushukoDetail(juchuHeadId, juchuKizaiHeadKbn, nyushukoBashoId, nyushukoDat, sagyoKbnId);

    return toShukoDetailTableValues(data);
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
 * 出庫明細の行（DB）を画面の形にする
 * @param data selectNyushukoDetail の結果
 * @returns
 */
const toShukoDetailTableValues = (data: Awaited<ReturnType<typeof selectNyushukoDetail>>) =>
  data.map(
    (d): ShukoDetailTableValues => ({
      juchuHeadId: d.juchu_head_id ?? 0,
      juchuKizaiHeadId: d.juchu_kizai_head_id ?? 0,
      juchuKizaiMeisaiId: d.juchu_kizai_meisai_id ?? 0,
      juchuKizaiHeadKbn: d.juchu_kizai_head_kbnv ? parseInt(d.juchu_kizai_head_kbnv) : 0,
      headNamv: d.head_namv,
      kizaiId: d.kizai_id ?? 0,
      kizaiNam: d.kizai_nam,
      koenNam: d.koen_nam,
      koenbashoNam: d.koenbasho_nam,
      kokyakuNam: d.kokyaku_nam,
      nyushukoBashoId: d.nyushuko_basho_id ?? 0,
      nyushukoDat: d.nyushuko_dat ?? '',
      nyushukoShubetuId: d.nyushuko_shubetu_id,
      planQty: d.plan_qty,
      planKizaiQty: d.plan_kizai_qty,
      planYobiQty: d.plan_yobi_qty,
      resultAdjQty: d.result_adj_qty,
      resultQty: d.result_qty,
      sagyoKbnId: d.sagyo_kbn_id,
      diff: calcShukoDiff(d.plan_qty, d.result_qty, d.result_adj_qty),
      ctnFlg: d.ctn_flg,
      dspOrdNumMeisai: d.dsp_ord_num_meisai,
      indentNum: d.indent_num ?? 0,
      mem2: d.mem2 ?? '',
    })
  );

/**
 * 出庫明細画面に合体している受注機材ヘッダーid（画面のヘッダー一覧と明細行の両方から集める）
 * @param shukoDetailData 出庫データ
 * @param shukoDetailTableData 出庫テーブルデータ
 * @returns
 */
const collectJuchuKizaiHeadIds = (
  shukoDetailData: ShukoDetailValues,
  shukoDetailTableData: ShukoDetailTableValues[]
) => [
  ...new Set(
    [...shukoDetailData.juchuKizaiHeadIds, ...shukoDetailTableData.map((d) => d.juchuKizaiHeadId)].filter(
      (id) => id !== null && id !== undefined && !Number.isNaN(id)
    )
  ),
];

/**
 * 出発
 * 合体している受注機材ヘッダーの一部が出発済みでも出発できる。未出発のヘッダーの分だけ処理し、
 * 出発済みのヘッダーのコンテナ明細・伝票・確定には触らない
 * @param shukoDetailData 出庫データ
 * @param shukoDetailTableData 出庫テーブルデータ
 * @param userNam ユーザー名
 * @returns 失敗したときは理由（画面で文言を出し分ける）
 */
export const updShukoDetail = async (
  shukoDetailData: ShukoDetailValues,
  shukoDetailTableData: ShukoDetailTableValues[],
  userNam: string
): Promise<NyushukoFixResult> => {
  if (shukoDetailTableData.length === 0) {
    return { ok: false, reason: NYUSHUKO_FIX_ERROR.other };
  }

  const connection = await pool.connect();

  try {
    await connection.query('BEGIN');

    // 画面を開いた後に出発・出発解除された場合に備えて、確定済みのヘッダーをトランザクション内で取り直す
    const allJuchuKizaiHeadIds = collectJuchuKizaiHeadIds(shukoDetailData, shukoDetailTableData);
    const fixedJuchuKizaiHeadIds = await selectFixedJuchuKizaiHeadIdsTx(
      shukoDetailData.juchuHeadId,
      allJuchuKizaiHeadIds,
      SAGYO_KBN_ID.shukoConfirmed,
      shukoDetailData.nyushukoDat,
      shukoDetailData.nyushukoBashoId,
      connection
    );
    const unfixedJuchuKizaiHeadIds = allJuchuKizaiHeadIds.filter((id) => !fixedJuchuKizaiHeadIds.includes(id));
    if (unfixedJuchuKizaiHeadIds.length === 0) {
      throw new NyushukoFixError(NYUSHUKO_FIX_ERROR.allFixed, '[updShukoDetail] すでにすべて出発済みです');
    }

    // 不足・過剰の確認を DB から取り直した明細でやり直す（画面を開いた後に HT・ゲートから送信された分も含める）
    // 出発するのは未出発のヘッダーだけなので、確認も未出発のヘッダーの行だけで行う（条件は画面と同じ hasShukoDiff）
    const currentTableData = toShukoDetailTableValues(
      await selectNyushukoDetail(
        shukoDetailData.juchuHeadId,
        shukoDetailData.juchuKizaiHeadKbn,
        shukoDetailData.nyushukoBashoId,
        shukoDetailData.nyushukoDat,
        shukoDetailData.sagyoKbnId,
        connection
      )
    );
    if (currentTableData.some((d) => unfixedJuchuKizaiHeadIds.includes(d.juchuKizaiHeadId) && hasShukoDiff(d))) {
      throw new NyushukoFixError(NYUSHUKO_FIX_ERROR.diff, '[updShukoDetail] 不足・過剰があります');
    }

    // 未出発のヘッダーの行だけを対象にする
    const targetTableData = shukoDetailTableData.filter((d) => unfixedJuchuKizaiHeadIds.includes(d.juchuKizaiHeadId));
    // コンテナデータ
    const ctnData = targetTableData.filter((data) => data.ctnFlg);

    // キープ以外は明細、伝票を更新
    if (shukoDetailData.juchuKizaiHeadKbn !== JUCHU_KIZAI_HEAD_KBN.keep && ctnData && ctnData.length > 0) {
      // コンテナ明細追加更新
      const upsertJuchuMeisaiResult = await upsJuchuCtnMeisai(ctnData, userNam, connection);

      // コンテナ出庫伝票追加更新
      const upsertShukoDenResult = await upsShukoDen(ctnData, userNam, connection);

      for (const juchuKizaiHeadId of unfixedJuchuKizaiHeadIds) {
        // 対象のコンテナデータ
        const targetCtnData = ctnData.filter((d) => d.juchuKizaiHeadId === juchuKizaiHeadId);
        if (targetCtnData.length === 0) {
          continue;
        }
        // 出庫日取得
        const { data: shukoDat, error: shukoDataError } = await selectJuchuKizaiNyushukoConfirmList({
          juchu_head_id: shukoDetailData.juchuHeadId,
          juchu_kizai_head_id: juchuKizaiHeadId,
          nyushuko_shubetu_id: NYUSHUKO_SHUBETU_ID.shuko,
        });
        // 入庫日取得
        const { data: nyukoDat, error: nyukoDataError } = await selectJuchuKizaiNyushukoConfirmList({
          juchu_head_id: shukoDetailData.juchuHeadId,
          juchu_kizai_head_id: juchuKizaiHeadId,
          nyushuko_shubetu_id: NYUSHUKO_SHUBETU_ID.nyuko,
        });
        if (shukoDataError) {
          throw new Error('[selectJuchuKizaiNyushukoConfirm] DBエラー:', { cause: shukoDataError });
        }
        if (nyukoDataError) {
          throw new Error('[selectJuchuKizaiNyushukoConfirm] DBエラー:', { cause: nyukoDataError });
        }

        if (nyukoDat.length === 2) {
          const nyushukoDat = nyukoDat.find((d) => d.nyushuko_basho_id === shukoDetailData.nyushukoBashoId);
          if (nyushukoDat) {
            const upsertNyukoDenResult = await upsNyukoDen(
              targetCtnData,
              null,
              nyushukoDat.nyushuko_dat,
              nyushukoDat.nyushuko_basho_id,
              userNam,
              connection
            );
          }
        } else if (nyukoDat.length === 1 && shukoDat.length === 2) {
          const otherShukoDat = shukoDat.find((d) => d.nyushuko_basho_id !== shukoDetailData.nyushukoBashoId);
          // ここで return するとトランザクションを開いたまま接続を返してしまうため、例外にして ROLLBACK させる
          if (!otherShukoDat) {
            throw new Error('[updShukoDetail] もう一方の出庫場所の出庫日が見つかりません');
          }

          const { data: otherShukoData, error: otherShukoDataError } = await selectCtnNyushukoDetail(
            shukoDetailData.juchuHeadId,
            juchuKizaiHeadId,
            shukoDetailData.juchuKizaiHeadKbn,
            otherShukoDat.nyushuko_basho_id,
            otherShukoDat.nyushuko_dat,
            shukoDetailData.sagyoKbnId
          );

          if (otherShukoDataError) throw otherShukoDataError;

          const upsertNyukoDenResult = await upsNyukoDen(
            targetCtnData,
            otherShukoData,
            nyukoDat[0].nyushuko_dat,
            nyukoDat[0].nyushuko_basho_id,
            userNam,
            connection
          );
        } else if (nyukoDat.length === 1 && shukoDat.length === 1) {
          const upsertNyukoDenResult = await upsNyukoDen(
            targetCtnData,
            null,
            nyukoDat[0].nyushuko_dat,
            nyukoDat[0].nyushuko_basho_id,
            userNam,
            connection
          );
        }
      }
    }

    // 入出庫確定追加（未出発のヘッダーのみ）
    const addNyushukoFixResult = await addShukoFix(shukoDetailData, unfixedJuchuKizaiHeadIds, userNam, connection);

    await connection.query('COMMIT');

    await revalidatePath('/shuko-list');
    await revalidatePath('/nyuko-list');

    return { ok: true };
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
    return { ok: false, reason: toNyushukoFixErrorReason(e) };
  } finally {
    refreshVRfid().catch((err) => {
      console.error('バックグラウンドでのマテビュー更新に失敗:', err);
    });
    connection.release();
  }
};

/**
 * 受注コンテナ明細追加更新
 * @param shukoDetailTableData 出庫テーブルデータ
 * @param userNam ユーザー名
 * @param connection
 */
export const upsJuchuCtnMeisai = async (
  shukoDetailTableData: ShukoDetailTableValues[],
  userNam: string,
  connection: PoolClient
) => {
  const upsertCtnData: JuchuCtnMeisai[] = shukoDetailTableData.map((d) => ({
    juchu_head_id: d.juchuHeadId,
    juchu_kizai_head_id: d.juchuKizaiHeadId,
    juchu_kizai_meisai_id: d.juchuKizaiMeisaiId,
    kizai_id: d.kizaiId,
    plan_kizai_qty: (d.resultQty ?? 0) + (d.resultAdjQty ?? 0),
    shozoku_id: d.nyushukoBashoId,
    dsp_ord_num: d.dspOrdNumMeisai,
    indent_num: d.indentNum,
    add_dat: new Date().toISOString(),
    add_user: userNam,
  }));
  try {
    await upsertJuchuContainerMeisai(upsertCtnData, connection);

    return true;
  } catch (e) {
    throw e;
  }
};

/**
 * 入出庫伝票追加更新
 * @param shukoDetailTableData 出庫テーブルデータ
 * @param userNam ユーザー名
 * @param connection
 * @returns
 */
export const upsNyushukoDen = async (
  shukoDetailTableData: ShukoDetailTableValues[],
  nyukoDatas: NyukoValues[],
  userNam: string,
  connection: PoolClient
) => {
  const upsCtnShukoCheckData: NyushukoDen[] = shukoDetailTableData.map((d) => ({
    juchu_head_id: d.juchuHeadId,
    juchu_kizai_head_id: d.juchuKizaiHeadId,
    juchu_kizai_meisai_id: d.juchuKizaiMeisaiId,
    kizai_id: d.kizaiId,
    plan_qty: (d.resultQty ?? 0) + (d.resultAdjQty ?? 0),
    sagyo_den_dat: d.nyushukoDat,
    sagyo_id: d.nyushukoBashoId,
    sagyo_kbn_id: SAGYO_KBN_ID.shukoConfirmation,
    dsp_ord_num: d.dspOrdNumMeisai,
    indent_num: d.indentNum,
    add_dat: new Date().toISOString(),
    add_user: userNam,
    upd_dat: null,
    upd_user: null,
  }));

  const upsCtnNyukoCheckData: NyushukoDen[] = shukoDetailTableData.map((d) => ({
    juchu_head_id: d.juchuHeadId,
    juchu_kizai_head_id: d.juchuKizaiHeadId,
    juchu_kizai_meisai_id: d.juchuKizaiMeisaiId,
    kizai_id: d.kizaiId,
    plan_qty: (d.resultQty ?? 0) + (d.resultAdjQty ?? 0),
    sagyo_den_dat: nyukoDatas.find((data) => data.juchuKizaiHeadId === d.juchuKizaiHeadId)!.nyushukoDat,
    sagyo_id: d.nyushukoBashoId,
    sagyo_kbn_id: SAGYO_KBN_ID.nyukoCount,
    dsp_ord_num: d.dspOrdNumMeisai,
    indent_num: d.indentNum,
    add_dat: new Date().toISOString(),
    add_user: userNam,
    upd_dat: null,
    upd_user: null,
  }));

  const mergeData = [...upsCtnShukoCheckData, ...upsCtnNyukoCheckData];

  try {
    await upsertNyushukoDen(mergeData, connection);

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
 * 出庫伝票追加更新
 * @param shukoDetailTableData
 * @param userNam
 * @param connection
 * @returns
 */
export const upsShukoDen = async (
  shukoDetailTableData: ShukoDetailTableValues[],
  userNam: string,
  connection: PoolClient
) => {
  const upsCtnShukoCheckData: NyushukoDen[] = shukoDetailTableData.map((d) => ({
    juchu_head_id: d.juchuHeadId,
    juchu_kizai_head_id: d.juchuKizaiHeadId,
    juchu_kizai_meisai_id: d.juchuKizaiMeisaiId,
    kizai_id: d.kizaiId,
    plan_qty: (d.resultQty ?? 0) + (d.resultAdjQty ?? 0),
    sagyo_den_dat: d.nyushukoDat,
    sagyo_id: d.nyushukoBashoId,
    sagyo_kbn_id: SAGYO_KBN_ID.shukoConfirmation,
    dsp_ord_num: d.dspOrdNumMeisai,
    indent_num: d.indentNum,
    add_dat: new Date().toISOString(),
    add_user: userNam,
    upd_dat: null,
    upd_user: null,
  }));

  try {
    await upsertNyushukoDen(upsCtnShukoCheckData, connection);

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

export const upsNyukoDen = async (
  shukoDetailTableData: ShukoDetailTableValues[],
  otherShukoData: { juchu_kizai_head_id: number | null; kizai_id: number | null; plan_qty: number | null }[] | null,
  nyukoDat: string,
  nyushukoBashoId: number,
  userNam: string,
  connection: PoolClient
) => {
  const upsCtnNyukoCheckData: NyushukoDen[] = shukoDetailTableData.map((d) => ({
    juchu_head_id: d.juchuHeadId,
    juchu_kizai_head_id: d.juchuKizaiHeadId,
    juchu_kizai_meisai_id: d.juchuKizaiMeisaiId,
    kizai_id: d.kizaiId,
    plan_qty: otherShukoData
      ? (d.resultQty ?? 0) +
        (d.resultAdjQty ?? 0) +
        (otherShukoData.find((data) => data.juchu_kizai_head_id === d.juchuKizaiHeadId && data.kizai_id === d.kizaiId)
          ?.plan_qty ?? 0)
      : (d.resultQty ?? 0) + (d.resultAdjQty ?? 0),
    sagyo_den_dat: nyukoDat,
    sagyo_id: nyushukoBashoId,
    sagyo_kbn_id: SAGYO_KBN_ID.nyukoCount,
    dsp_ord_num: d.dspOrdNumMeisai,
    indent_num: d.indentNum,
    add_dat: new Date().toISOString(),
    add_user: userNam,
    upd_dat: null,
    upd_user: null,
  }));

  try {
    await upsertNyushukoDen(upsCtnNyukoCheckData, connection);

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
 * 出庫確定新規追加
 * 確定は受注機材ヘッダー単位。合体した明細で出発済みのヘッダーまで追加すると主キー違反になるため、
 * 呼び出し元で未出発のヘッダーに絞って渡す
 * @param shukoDetailData 出庫データ
 * @param juchuKizaiHeadIds 確定を追加する受注機材ヘッダーid（未出発のもの）
 * @param userNam ユーザー名
 * @param connection
 */
export const addShukoFix = async (
  shukoDetailData: ShukoDetailValues,
  juchuKizaiHeadIds: number[],
  userNam: string,
  connection: PoolClient
) => {
  const targetIds = [...new Set(juchuKizaiHeadIds.filter((id) => id !== null))];
  if (targetIds.length === 0) {
    return true;
  }

  const newFixData: NyushukoFix[] = targetIds.map((id) => ({
    juchu_head_id: shukoDetailData.juchuHeadId,
    juchu_kizai_head_id: id,
    sagyo_kbn_id: SAGYO_KBN_ID.shukoConfirmed,
    sagyo_den_dat: shukoDetailData.nyushukoDat,
    sagyo_id: shukoDetailData.nyushukoBashoId,
    sagyo_fix_flg: 1,
    upd_dat: new Date().toISOString(),
    upd_user: userNam,
  }));

  try {
    await insertNyushukoFix(newFixData, connection);
    return true;
  } catch (e) {
    throw e;
  }
};

/**
 * 出発解除
 * @param shukoDetailData 出庫データ
 * @param shukoDetailTableData 出庫テーブルデータ
 * @param userNam ユーザー名
 * @returns 失敗したときは理由（画面で文言を出し分ける）
 */
export const delShukoFix = async (
  shukoDetailData: ShukoDetailValues,
  shukoDetailTableData: ShukoDetailTableValues[]
): Promise<NyushukoFixResult> => {
  // 接続を取る前に判定する（取った後に return すると接続が返らない）
  if (shukoDetailTableData.length === 0) {
    return { ok: false, reason: NYUSHUKO_FIX_ERROR.other };
  }

  const connection = await pool.connect();

  const juchuKizaiHeadIds = collectJuchuKizaiHeadIds(shukoDetailData, shukoDetailTableData);

  const deleteFixData = juchuKizaiHeadIds.map((d) => ({
    juchu_head_id: shukoDetailData.juchuHeadId,
    juchu_kizai_head_id: d,
    sagyo_kbn_id: SAGYO_KBN_ID.shukoConfirmed,
    sagyo_id: shukoDetailData.nyushukoBashoId,
  }));

  try {
    await connection.query('BEGIN');

    // ほかの人が先に出発解除していないか、トランザクション内で確定済みのヘッダーを取り直す
    const fixedJuchuKizaiHeadIds = await selectFixedJuchuKizaiHeadIdsTx(
      shukoDetailData.juchuHeadId,
      juchuKizaiHeadIds,
      SAGYO_KBN_ID.shukoConfirmed,
      shukoDetailData.nyushukoDat,
      shukoDetailData.nyushukoBashoId,
      connection
    );
    if (fixedJuchuKizaiHeadIds.length === 0) {
      throw new NyushukoFixError(NYUSHUKO_FIX_ERROR.noneFixed, '[delShukoFix] すでに出発解除されています');
    }

    for (const data of deleteFixData) {
      await deleteNyushukoFix(data, connection);
    }

    await connection.query('COMMIT');

    await revalidatePath('/shuko-list');

    return { ok: true };
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
    return { ok: false, reason: toNyushukoFixErrorReason(e) };
  } finally {
    connection.release();
  }
};

/**
 * 子受注機材ヘッダー確認
 * @param juchuHeadId 受注ヘッダーid
 * @returns
 */
export const confirmChildJuchuKizaiHead = async (juchuHeadId: number, juchuKizaiHeadIdv: number[]) => {
  try {
    const { count, error } = await selectChildJuchuKizaiHeadConfirm(juchuHeadId, juchuKizaiHeadIdv);

    if (error) {
      throw new Error('[selectChildJuchuKizaiHeadConfirm] DBエラー:', { cause: error });
    }

    return count;
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

export const updShukoAdjust = async (adjustData: ShukoDetailTableValues[], userNam: string) => {
  const updateData: NyushukoDen[] = adjustData.map((d) => ({
    juchu_head_id: d.juchuHeadId,
    juchu_kizai_head_id: d.juchuKizaiHeadId,
    juchu_kizai_meisai_id: d.juchuKizaiMeisaiId,
    kizai_id: d.kizaiId,
    plan_qty: d.planQty,
    result_adj_qty: (d.planQty ?? 0) - (d.resultQty ?? 0),
    sagyo_den_dat: d.nyushukoDat,
    sagyo_id: d.nyushukoBashoId,
    sagyo_kbn_id: d.sagyoKbnId ?? 0,
    dsp_ord_num: d.dspOrdNumMeisai,
    indent_num: d.indentNum,
    upd_dat: new Date().toISOString(),
    upd_user: userNam,
  }));
  const connection = await pool.connect();
  try {
    for (const data of updateData) {
      await updateNyushukoDen(data, connection);
    }

    await connection.query('COMMIT');
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
    throw e;
  } finally {
    refreshVRfid().catch((err) => {
      console.error('バックグラウンドでのマテビュー更新に失敗:', err);
    });
    connection.release();
  }
};
