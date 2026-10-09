'use server';

import { revalidatePath } from 'next/cache';
import { PoolClient } from 'pg';

import { JUCHU_KIZAI_HEAD_KBN, NYUSHUKO_SHUBETU_ID, SAGYO_KBN_ID } from '@/app/_lib/constants';
import pool, { refreshVRfid } from '@/app/_lib/db/postgres';
import {
  deleteJuchuContainerMeisaiShozoku,
  selectJuchuContainerMeisaiRowsTx,
  selectMeisaiMaxDspOrdNumTx,
  updateJuchuContainerMeisaiMem,
  upsertJuchuContainerMeisaiColumns,
} from '@/app/_lib/db/tables/t-juchu-ctn-meisai';
import {
  selectChildJuchuKizaiHeadConfirm,
  selectChildJuchuKizaiHeadCountTx,
} from '@/app/_lib/db/tables/t-juchu-kizai-head';
import {
  selectJuchuKizaiNyushukoConfirmList,
  selectJuchuKizaiNyushukoMatchTx,
} from '@/app/_lib/db/tables/t-juchu-kizai-nyushuko';
import { deleteShukoCtnResult } from '@/app/_lib/db/tables/t-nyushuko-ctn-result';
import {
  deleteShukoCtnDen,
  selectShukoCtnDenRowsTx,
  selectShukoDenMaxMeisaiIdTx,
  updateNyushukoDen,
  upsertNyushukoDen,
} from '@/app/_lib/db/tables/t-nyushuko-den';
import {
  deleteNyushukoFix,
  insertNyushukoFix,
  selectFixedJuchuKizaiHeadIdsTx,
  selectFixedSagyoIdsTx,
} from '@/app/_lib/db/tables/t-nyushuko-fix';
import { selectActiveEqpts } from '@/app/_lib/db/tables/v-kizai-lst-sel';
import { selectNyushukoOne } from '@/app/_lib/db/tables/v-nyushuko-den2-head';
import { selectCtnNyushukoDetail, selectNyushukoDetail } from '@/app/_lib/db/tables/v-nyushuko-den2-lst';
import { JuchuCtnMeisai } from '@/app/_lib/db/types/t_juchu_ctn_meisai-type';
import { NyushukoDen } from '@/app/_lib/db/types/t-nyushuko-den-type';
import { NyushukoFix } from '@/app/_lib/db/types/t-nyushuko-fix-type';
import { syncNyukoCtnAfterDelete } from '@/app/(main)/_lib/ctn-nyuko-funcs';
import {
  NYUSHUKO_FIX_ERROR,
  NyushukoFixError,
  NyushukoFixResult,
  toNyushukoFixErrorReason,
} from '@/app/(main)/_lib/nyushuko-fix-error';

import { calcShukoDiff, hasShukoDiff } from './shuko-diff';
import {
  NyukoValues,
  ShukoCtnSaveResult,
  ShukoCtnSelectionValues,
  ShukoDetailTableValues,
  ShukoDetailValues,
} from './types';

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
      juchuMeisaiDelFlg: d.juchu_meisai_del_flg ?? 0,
      saveFlag: true,
      delFlag: false,
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
    // ※読取数は DB から取り直した明細を使う（画面を開いた後に HT・ゲートから送信された分も確定に含めるため）
    const targetTableData = currentTableData.filter((d) => unfixedJuchuKizaiHeadIds.includes(d.juchuKizaiHeadId));
    // コンテナデータ
    const allCtnData = targetTableData.filter((data) => data.ctnFlg);

    // 読取数＋補正数が0のコンテナは、その場所の出庫伝票・実績・受注コンテナ明細を削除して出発する（入庫伝票も作らない）
    const zeroCtnData =
      shukoDetailData.juchuKizaiHeadKbn !== JUCHU_KIZAI_HEAD_KBN.keep
        ? allCtnData.filter((d) => (d.resultQty ?? 0) + (d.resultAdjQty ?? 0) === 0)
        : [];
    for (const d of zeroCtnData) {
      await deleteShukoCtnDen(d, shukoDetailData.nyushukoBashoId, connection);
      await deleteShukoCtnResult(
        d.juchuHeadId,
        d.juchuKizaiHeadId,
        d.kizaiId,
        shukoDetailData.nyushukoBashoId,
        connection
      );
      await deleteJuchuContainerMeisaiShozoku(d, shukoDetailData.nyushukoBashoId, connection);
    }
    await syncNyukoCtnAfterDelete(zeroCtnData, shukoDetailData.nyushukoBashoId, userNam, connection);
    const ctnData = allCtnData.filter((d) => !zeroCtnData.includes(d));

    // キープ以外は明細、伝票を更新
    if (shukoDetailData.juchuKizaiHeadKbn !== JUCHU_KIZAI_HEAD_KBN.keep && ctnData && ctnData.length > 0) {
      // コンテナ明細の予定数を確定（読取数＋補正数）
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

          // もう一方の出庫場所の数量を足すのは、その場所が出発済みのときだけ（確定した数量だけを入庫予定にする）
          // 未出発の場所の分は、その場所の出発時に（こちらの確定値と合わせて）入庫伝票に入る
          const departedBashoIds = await selectFixedSagyoIdsTx(
            shukoDetailData.juchuHeadId,
            juchuKizaiHeadId,
            SAGYO_KBN_ID.shukoConfirmed,
            connection
          );
          let otherShukoData: Awaited<ReturnType<typeof selectCtnNyushukoDetail>>['data'] = [];
          if (departedBashoIds.includes(otherShukoDat.nyushuko_basho_id)) {
            const { data, error: otherShukoDataError } = await selectCtnNyushukoDetail(
              shukoDetailData.juchuHeadId,
              juchuKizaiHeadId,
              shukoDetailData.juchuKizaiHeadKbn,
              otherShukoDat.nyushuko_basho_id,
              otherShukoDat.nyushuko_dat,
              shukoDetailData.sagyoKbnId
            );

            if (otherShukoDataError) throw otherShukoDataError;
            otherShukoData = data;
          }

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
 * 受注コンテナ明細の予定数確定（出発時）
 * 既にある行は予定数（読取数＋補正数）だけを更新し、表示順・メモは変えない。
 * 行が無いとき（改修前の予定外コンテナなど）だけ追加する。表示順は伝票の表示順（K と Y でそろえた値）を使う
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
    await upsertJuchuContainerMeisaiColumns(upsertCtnData, ['plan_kizai_qty'], connection);

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

    // 子伝票（返却・キープ）があると解除できない。画面でも確認しているが、確認の後に作られた分も含めて確かめ直す
    const childCount = await selectChildJuchuKizaiHeadCountTx(
      shukoDetailData.juchuHeadId,
      juchuKizaiHeadIds,
      connection
    );
    if (childCount > 0) {
      throw new NyushukoFixError(NYUSHUKO_FIX_ERROR.hasChild, '[delShukoFix] 子伝票があるため出発解除できません');
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
    await connection.query('BEGIN');

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

/**
 * コンテナ保存で、画面に出す理由がある失敗
 */
class ShukoCtnSaveError extends Error {}

/**
 * コンテナ選択ダイアログの選択肢（有効なコンテナ）
 * @returns
 */
export const getShukoCtnSelection = async (): Promise<ShukoCtnSelectionValues[]> => {
  try {
    const data = await selectActiveEqpts('');
    return data.rows
      .filter((d) => d.ctnFlg === 1)
      .map((d) => ({ kizaiId: d.kizaiId as number, kizaiNam: (d.kizaiNam as string) ?? '' }));
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
 * コンテナ保存（出庫明細・最終確認）
 * 追加：出庫チェック伝票（sagyo_kbn_id = 20）とその場所の受注コンテナ明細を作る
 * 更新：予定数（伝票・受注コンテナ明細）とメモ（受注コンテナ明細）。出発済みのヘッダーはメモだけ
 * 削除：その場所の出庫伝票（ピッキング・最終確認）・コンテナ実績・受注コンテナ明細
 * 採番は HT・ゲートの送信RPC（nyushuko_send_20261009_1）と同じ規則（K と Y で明細ID・表示順をそろえる）
 * @param shukoDetailData 出庫データ
 * @param ctnRows 保存するコンテナの行（追加・削除・変更があった行だけ）
 * @param userNam ユーザー名
 * @returns 成功したときは取り直した出庫明細テーブルデータ、失敗したときは画面に出す文言
 */
export const saveShukoCtn = async (
  shukoDetailData: ShukoDetailValues,
  ctnRows: ShukoDetailTableValues[],
  userNam: string
): Promise<ShukoCtnSaveResult> => {
  if (
    shukoDetailData.sagyoKbnId !== SAGYO_KBN_ID.shukoConfirmation ||
    shukoDetailData.juchuKizaiHeadKbn === JUCHU_KIZAI_HEAD_KBN.keep
  ) {
    return { ok: false, message: 'この画面ではコンテナを編集できません' };
  }

  const juchuHeadId = shukoDetailData.juchuHeadId;
  const bashoId = shukoDetailData.nyushukoBashoId;
  const nyushukoDat = shukoDetailData.nyushukoDat;

  const targets = ctnRows.filter((d) => d.ctnFlg === 1);
  const addRows = targets.filter((d) => !d.saveFlag && !d.delFlag);
  const delRows = targets.filter((d) => d.saveFlag && d.delFlag);
  const updRows = targets.filter((d) => d.saveFlag && !d.delFlag);

  if ([...addRows, ...updRows].some((d) => d.planQty === null || !Number.isInteger(d.planQty) || d.planQty < 0)) {
    return { ok: false, message: '予定数は0以上の整数で入力してください' };
  }

  const connection = await pool.connect();

  try {
    await connection.query('BEGIN');

    const juchuKizaiHeadIds = [...new Set(targets.map((d) => d.juchuKizaiHeadId))];
    if (juchuKizaiHeadIds.some((id) => !shukoDetailData.juchuKizaiHeadIds.includes(id))) {
      throw new ShukoCtnSaveError('この出庫明細に無い受注明細が含まれています。開き直してください');
    }

    // 画面を開いた後にメイン明細で出庫日時・出庫場所が変えられていないか
    const matchedJuchuKizaiHeadIds = await selectJuchuKizaiNyushukoMatchTx(
      juchuHeadId,
      juchuKizaiHeadIds,
      NYUSHUKO_SHUBETU_ID.shuko,
      bashoId,
      nyushukoDat,
      connection
    );
    if (juchuKizaiHeadIds.some((id) => !matchedJuchuKizaiHeadIds.includes(id))) {
      throw new ShukoCtnSaveError('出庫日時・場所が変更されています。開き直してください');
    }

    // 出発済みのヘッダーは、追加・削除・予定数の変更ができない（メモは変更できる）
    const fixedJuchuKizaiHeadIds = await selectFixedJuchuKizaiHeadIdsTx(
      juchuHeadId,
      juchuKizaiHeadIds,
      SAGYO_KBN_ID.shukoConfirmed,
      nyushukoDat,
      bashoId,
      connection
    );
    if ([...addRows, ...delRows].some((d) => fixedJuchuKizaiHeadIds.includes(d.juchuKizaiHeadId))) {
      throw new ShukoCtnSaveError('出発済みのため、コンテナの追加・削除はできません。開き直してください');
    }

    const now = new Date().toISOString();

    // 追加
    for (const juchuKizaiHeadId of [...new Set(addRows.map((d) => d.juchuKizaiHeadId))]) {
      const rows = addRows.filter((d) => d.juchuKizaiHeadId === juchuKizaiHeadId);
      const ctnMeisaiRows = await selectJuchuContainerMeisaiRowsTx(juchuHeadId, juchuKizaiHeadId, connection);
      const ctnDenRows = await selectShukoCtnDenRowsTx(juchuHeadId, juchuKizaiHeadId, connection);

      // 画面を開いた後に HT・ゲートや別の人が同じコンテナを付けていたら、予定数を上書きしないよう中止する
      if (rows.some((r) => ctnDenRows.some((d) => d.sagyo_id === bashoId && d.kizai_id === r.kizaiId))) {
        throw new ShukoCtnSaveError('既に追加されているコンテナがあります。開き直してください');
      }

      let maxMeisaiId =
        (await selectShukoDenMaxMeisaiIdTx(juchuHeadId, juchuKizaiHeadId, bashoId, nyushukoDat, connection)) ?? 0;
      let maxDspOrdNum = await selectMeisaiMaxDspOrdNumTx(juchuHeadId, juchuKizaiHeadId, connection);

      const newDen: NyushukoDen[] = [];
      const newCtnMeisai: JuchuCtnMeisai[] = [];
      for (const r of rows) {
        // 同じコンテナが別の場所（受注コンテナ明細・出庫チェック伝票）にあれば、明細ID・表示順をそろえる
        const sameKizai = [
          ...ctnMeisaiRows
            .filter((c) => c.kizai_id === r.kizaiId)
            .map((c) => ({ meisaiId: c.juchu_kizai_meisai_id, dspOrdNum: c.dsp_ord_num })),
          ...ctnDenRows
            .filter((d) => d.sagyo_id !== bashoId && d.kizai_id === r.kizaiId)
            .map((d) => ({ meisaiId: d.juchu_kizai_meisai_id, dspOrdNum: d.dsp_ord_num })),
        ];
        const meisaiId = sameKizai.length > 0 ? Math.min(...sameKizai.map((s) => s.meisaiId)) : ++maxMeisaiId;
        const sameDspOrdNums = sameKizai.map((s) => s.dspOrdNum).filter((n): n is number => n !== null);
        const dspOrdNum = sameDspOrdNums.length > 0 ? Math.min(...sameDspOrdNums) : ++maxDspOrdNum;

        newDen.push({
          juchu_head_id: juchuHeadId,
          juchu_kizai_head_id: juchuKizaiHeadId,
          juchu_kizai_meisai_id: meisaiId,
          kizai_id: r.kizaiId,
          plan_qty: r.planQty ?? 0,
          sagyo_den_dat: nyushukoDat,
          sagyo_id: bashoId,
          sagyo_kbn_id: SAGYO_KBN_ID.shukoConfirmation,
          dsp_ord_num: dspOrdNum,
          indent_num: 0,
          add_dat: now,
          add_user: userNam,
        });
        newCtnMeisai.push({
          juchu_head_id: juchuHeadId,
          juchu_kizai_head_id: juchuKizaiHeadId,
          juchu_kizai_meisai_id: meisaiId,
          kizai_id: r.kizaiId,
          shozoku_id: bashoId,
          plan_kizai_qty: r.planQty ?? 0,
          mem: r.mem2 ? r.mem2 : null,
          dsp_ord_num: dspOrdNum,
          indent_num: 0,
          add_dat: now,
          add_user: userNam,
        });
      }

      await upsertNyushukoDen(newDen, connection);
      await upsertJuchuContainerMeisaiColumns(newCtnMeisai, ['plan_kizai_qty', 'mem'], connection);
    }

    // 更新
    for (const r of updRows) {
      if (fixedJuchuKizaiHeadIds.includes(r.juchuKizaiHeadId)) {
        // 出発済みはメモだけ
        await updateJuchuContainerMeisaiMem(
          {
            juchuHeadId: r.juchuHeadId,
            juchuKizaiHeadId: r.juchuKizaiHeadId,
            juchuKizaiMeisaiId: r.juchuKizaiMeisaiId,
            kizaiId: r.kizaiId,
            shozokuId: bashoId,
            mem: r.mem2 ? r.mem2 : null,
          },
          userNam,
          connection
        );
        continue;
      }

      await updateNyushukoDen(
        {
          juchu_head_id: r.juchuHeadId,
          juchu_kizai_head_id: r.juchuKizaiHeadId,
          juchu_kizai_meisai_id: r.juchuKizaiMeisaiId,
          kizai_id: r.kizaiId,
          sagyo_kbn_id: SAGYO_KBN_ID.shukoConfirmation,
          sagyo_id: bashoId,
          sagyo_den_dat: nyushukoDat,
          plan_qty: r.planQty ?? 0,
          upd_dat: now,
          upd_user: userNam,
        },
        connection
      );
      // 受注コンテナ明細が無い行（改修前に HT・ゲートで送られた予定外コンテナ）は、ここで作る
      await upsertJuchuContainerMeisaiColumns(
        [
          {
            juchu_head_id: r.juchuHeadId,
            juchu_kizai_head_id: r.juchuKizaiHeadId,
            juchu_kizai_meisai_id: r.juchuKizaiMeisaiId,
            kizai_id: r.kizaiId,
            shozoku_id: bashoId,
            plan_kizai_qty: r.planQty ?? 0,
            mem: r.mem2 ? r.mem2 : null,
            dsp_ord_num: r.dspOrdNumMeisai,
            indent_num: r.indentNum,
            add_dat: now,
            add_user: userNam,
          },
        ],
        ['plan_kizai_qty', 'mem'],
        connection
      );
    }

    // 削除
    for (const r of delRows) {
      await deleteShukoCtnDen(r, bashoId, connection);
      await deleteShukoCtnResult(r.juchuHeadId, r.juchuKizaiHeadId, r.kizaiId, bashoId, connection);
      await deleteJuchuContainerMeisaiShozoku(r, bashoId, connection);
    }
    await syncNyukoCtnAfterDelete(delRows, bashoId, userNam, connection);

    await connection.query('COMMIT');

    await revalidatePath('/shuko-list');

    const data = await getShukoDetailTable(
      juchuHeadId,
      shukoDetailData.juchuKizaiHeadKbn,
      bashoId,
      nyushukoDat,
      shukoDetailData.sagyoKbnId
    );

    return { ok: true, data };
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
    return { ok: false, message: e instanceof ShukoCtnSaveError ? e.message : '保存に失敗しました' };
  } finally {
    if (delRows.length > 0) {
      refreshVRfid().catch((err) => {
        console.error('バックグラウンドでのマテビュー更新に失敗:', err);
      });
    }
    connection.release();
  }
};
