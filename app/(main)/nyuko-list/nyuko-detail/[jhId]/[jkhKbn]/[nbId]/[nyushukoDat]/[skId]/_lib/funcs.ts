'use server';

import { revalidatePath } from 'next/cache';
import { PoolClient } from 'pg';

import { BASHO_ID, JUCHU_KIZAI_HEAD_KBN, NYUSHUKO_SHUBETU_ID, SAGYO_KBN_ID } from '@/app/_lib/constants';
import pool, { refreshVRfid } from '@/app/_lib/db/postgres';
import { selectJuchuContainerMeisaiMaxId, upsertJuchuContainerMeisai } from '@/app/_lib/db/tables/t-juchu-ctn-meisai';
import { selectJuchuKizaiMeisaiMaxId, upsertJuchuKizaiMeisai } from '@/app/_lib/db/tables/t-juchu-kizai-meisai';
import {
  selectJuchuKizaiNyushukoConfirmSingle,
  selectOyaJuchuKizaiNyushukoConfirm,
} from '@/app/_lib/db/tables/t-juchu-kizai-nyushuko';
import {
  clearNyukoFixQty,
  selectNyukoFixQty,
  updateNyushukoDen,
  updateOyaCtnNyukoDen,
  updateOyaKizaiNyukoDen,
  upsertNyushukoDen,
} from '@/app/_lib/db/tables/t-nyushuko-den';
import {
  deleteNyushukoFix,
  insertNyushukoFix,
  selectFixedJuchuKizaiHeadIdsTx,
  updateNyushukoFix,
} from '@/app/_lib/db/tables/t-nyushuko-fix';
import { selectJuchuContainerMeisai } from '@/app/_lib/db/tables/v-juchu-ctn-meisai';
import { selectNyushukoOne } from '@/app/_lib/db/tables/v-nyushuko-den2-head';
import { selectNyushukoDetail } from '@/app/_lib/db/tables/v-nyushuko-den2-lst';
import { JuchuCtnMeisai } from '@/app/_lib/db/types/t_juchu_ctn_meisai-type';
import { JuchuKizaiMeisai } from '@/app/_lib/db/types/t-juchu-kizai-meisai-type';
import { NyushukoDen } from '@/app/_lib/db/types/t-nyushuko-den-type';
import { NyushukoFix } from '@/app/_lib/db/types/t-nyushuko-fix-type';
import {
  NYUSHUKO_FIX_ERROR,
  NyushukoFixError,
  NyushukoFixResult,
  toNyushukoFixErrorReason,
} from '@/app/(main)/_lib/nyushuko-fix-error';

import { NyukoDetailTableValues, NyukoDetailValues, OyaNyukoReflectItem } from './types';

/**
 * 入庫明細取得
 * @param juchuHeadId 受注ヘッダーid
 * @param juchuKizaiHeadKbn 受注機材ヘッダー区分
 * @param nyushukoBashoId 入出庫場所id
 * @param nyushukoDat 入出庫日時
 * @param sagyoKbnId 作業区分id
 * @returns
 */
export const getNyukoDetail = async (
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
      NYUSHUKO_SHUBETU_ID.nyuko
    );

    const nyukoDetailData: NyukoDetailValues = {
      juchuHeadId: juchuHeadId,
      juchuKizaiHeadKbn: juchuKizaiHeadKbn,
      nyushukoBashoId: nyushukoBashoId,
      nyushukoDat: nyushukoDat,
      sagyoKbnId: sagyoKbnId,
      juchuKizaiHeadIds: data[0].juchu_kizai_head_idv.split(',').map((id: string) => parseInt(id)) || [],
      nyushukoShubetuId: NYUSHUKO_SHUBETU_ID.nyuko,
      headNamv: data[0].head_namv,
      koenNam: data[0].koen_nam,
      koenbashoNam: data[0].koenbasho_nam,
      kokyakuNam: data[0].kokyaku_nam,
      juchuDat: data[0].juchu_dat,
      memv: data[0].memv,
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
 * 入庫明細テーブルデータ取得
 * @param juchuHeadId 受注ヘッダーid
 * @param nyushukoBashoId 入出庫場所id
 * @param nyushukoDat 入出庫日
 * @returns
 */
export const getNyukoDetailTable = async (
  juchuHeadId: number,
  juchuKizaiHeadKbn: number,
  nyushukoBashoId: number,
  nyushukoDat: string,
  sagyoKbnId: number
) => {
  try {
    const data = await selectNyushukoDetail(juchuHeadId, juchuKizaiHeadKbn, nyushukoBashoId, nyushukoDat, sagyoKbnId);

    const nyukoDetailTableData: NyukoDetailTableValues[] = data.map((d) => ({
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
      planQty: d.plan_qty as number,
      resultAdjQty: d.result_adj_qty as number,
      resultQty: d.result_qty as number,
      sagyoKbnId: d.sagyo_kbn_id,
      diff: ((d.result_qty as number) ?? 0) + ((d.result_adj_qty as number) ?? 0) - ((d.plan_qty as number) ?? 0),
      ctnFlg: d.ctn_flg,
      dspOrdNumMeisai: d.dsp_ord_num_meisai,
      indentNum: d.indent_num ?? 0,
      mem2: d.mem2 ?? '',
    }));

    return nyukoDetailTableData;
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
 * 入庫明細の行を特定するキー（受注機材ヘッダーid・受注機材明細id・機材id）
 */
const nyukoRowKey = (juchuKizaiHeadId: number, juchuKizaiMeisaiId: number, kizaiId: number) =>
  `${juchuKizaiHeadId}_${juchuKizaiMeisaiId}_${kizaiId}`;

/**
 * 入庫明細画面に合体している受注機材ヘッダーid（画面のヘッダー一覧と明細行の両方から集める）
 * @param nyukoDetailData 入庫データ
 * @param nyukoDetailTableData 入庫テーブルデータ
 * @returns
 */
const collectJuchuKizaiHeadIds = (
  nyukoDetailData: NyukoDetailValues,
  nyukoDetailTableData: NyukoDetailTableValues[]
) => [
  ...new Set(
    [...nyukoDetailData.juchuKizaiHeadIds, ...nyukoDetailTableData.map((d) => d.juchuKizaiHeadId)].filter(
      (id) => id !== null && id !== undefined && !Number.isNaN(id)
    )
  ),
];

/**
 * 返却の入庫伝票の「到着で親から引いた読取数」を行ごとに取得
 * @param nyukoDetailData 入庫データ
 * @param juchuKizaiHeadIds 受注機材ヘッダーid
 * @param connection
 * @returns キー（nyukoRowKey）→ nyuko_fix_qty（未反映は null）
 */
const getNyukoFixQtyMap = async (
  nyukoDetailData: NyukoDetailValues,
  juchuKizaiHeadIds: number[],
  connection: PoolClient
) => {
  const rows = await selectNyukoFixQty(
    nyukoDetailData.juchuHeadId,
    juchuKizaiHeadIds,
    nyukoDetailData.nyushukoDat,
    nyukoDetailData.nyushukoBashoId,
    connection
  );
  return new Map(
    rows.map((r) => [nyukoRowKey(r.juchu_kizai_head_id, r.juchu_kizai_meisai_id, r.kizai_id), r.nyuko_fix_qty])
  );
};

/**
 * 到着解除で親に戻す行を DB から作る（画面のデータは使わない）
 * 画面を開いた後に作られた行（HT・ゲートの再送信）でも、ほかの画面から到着されて nyuko_fix_qty が入っていれば戻す
 * @param nyukoDetailData 入庫データ
 * @param juchuKizaiHeadIds 受注機材ヘッダーid
 * @param connection
 * @returns before = nyuko_fix_qty、after = 0
 */
const getNyukoFixReleaseItems = async (
  nyukoDetailData: NyukoDetailValues,
  juchuKizaiHeadIds: number[],
  connection: PoolClient
): Promise<OyaNyukoReflectItem[]> => {
  const rows = await selectNyukoFixQty(
    nyukoDetailData.juchuHeadId,
    juchuKizaiHeadIds,
    nyukoDetailData.nyushukoDat,
    nyukoDetailData.nyushukoBashoId,
    connection
  );
  // 機材id 0 は伝票のダミー行なので親には反映しない（selectFinishedReturn と同じ）
  return rows.flatMap((r) =>
    r.nyuko_fix_qty === null || r.kizai_id === 0
      ? []
      : [
          {
            data: {
              juchuHeadId: r.juchu_head_id,
              juchuKizaiHeadId: r.juchu_kizai_head_id,
              juchuKizaiMeisaiId: r.juchu_kizai_meisai_id,
              kizaiId: r.kizai_id,
              nyushukoDat: new Date(r.sagyo_den_dat).toISOString(),
              nyushukoBashoId: r.sagyo_id,
              ctnFlg: r.ctn_flg,
              dspOrdNumMeisai: r.dsp_ord_num,
              indentNum: r.indent_num ?? 0,
            },
            before: r.nyuko_fix_qty,
            after: 0,
          },
        ]
  );
};

/**
 * 返却の入庫明細を、親（メイン）の入庫伝票へ反映する（到着・到着解除共通）
 * 親から after − before を引く（負なら戻す）。機材は同じ dsp_ord_num の親の行、コンテナは KICS・YARD に振り分ける
 * @param nyukoDetailData 入庫データ
 * @param items 反映する行と量
 * @param userNam ユーザー名
 * @param connection
 */
const reflectOyaNyukoDen = async (
  nyukoDetailData: NyukoDetailValues,
  items: OyaNyukoReflectItem[],
  userNam: string,
  connection: PoolClient
) => {
  // 親機材入庫伝票更新
  const kizaiItems = items.filter((i) => !i.data.ctnFlg);
  await updOyaKizaiNyukoDen(kizaiItems, userNam, connection);

  // 親コンテナ入庫伝票更新（コンテナがある受注機材ヘッダーごとに、親の入庫場所を確認して振り分ける）
  const ctnItems = items.filter((i) => i.data.ctnFlg);
  const ctnJuchuKizaiHeadIds = [...new Set(ctnItems.map((i) => i.data.juchuKizaiHeadId))];
  for (const juchuKizaiHeadId of ctnJuchuKizaiHeadIds) {
    const headItems = ctnItems.filter((i) => i.data.juchuKizaiHeadId === juchuKizaiHeadId);
    if (headItems.every((i) => i.after === i.before)) {
      continue;
    }

    // 親入庫日確認
    const oyaNyukoDat = await selectOyaJuchuKizaiNyushukoConfirm(
      {
        juchu_head_id: nyukoDetailData.juchuHeadId,
        juchu_kizai_head_id: juchuKizaiHeadId,
        nyushuko_shubetu_id: NYUSHUKO_SHUBETU_ID.nyuko,
      },
      connection
    );

    if (!oyaNyukoDat || oyaNyukoDat.length === 0) {
      throw new Error('親入庫日が見つかりません');
    }

    const oyaJuchuCtnMeisaiData = await getOyaJuchuContainerMeisai(
      nyukoDetailData.juchuHeadId,
      oyaNyukoDat[0].juchu_kizai_head_id
    );

    if (oyaNyukoDat.length === 2) {
      await updOyaCtnNyukoDen(
        headItems,
        oyaJuchuCtnMeisaiData,
        nyukoDetailData.nyushukoBashoId,
        BASHO_ID.kics,
        oyaNyukoDat.length,
        userNam,
        connection
      );
      await updOyaCtnNyukoDen(
        headItems,
        oyaJuchuCtnMeisaiData,
        nyukoDetailData.nyushukoBashoId,
        BASHO_ID.yard,
        oyaNyukoDat.length,
        userNam,
        connection
      );
    } else {
      await updOyaCtnNyukoDen(
        headItems,
        oyaJuchuCtnMeisaiData,
        nyukoDetailData.nyushukoBashoId,
        oyaNyukoDat[0].nyushuko_basho_id,
        oyaNyukoDat.length,
        userNam,
        connection
      );
    }
  }
};

/**
 * メイン入庫伝票到着処理
 * @param nyukoDetailData 入庫データ
 * @param unfixedJuchuKizaiHeadIds 未到着の受注機材ヘッダーid
 * @param userNam ユーザー名
 * @param connection
 */
export const updMainNyukoDetail = async (
  nyukoDetailData: NyukoDetailValues,
  unfixedJuchuKizaiHeadIds: number[],
  userNam: string,
  connection: PoolClient
) => {
  try {
    // 入庫確定追加（未到着のヘッダーのみ）
    await addNyukoFix(nyukoDetailData, unfixedJuchuKizaiHeadIds, userNam, connection);
  } catch (e) {
    throw e;
  }
};

/**
 * 返却入庫伝票到着処理
 * 一部のヘッダーが到着済みでも到着できる。親からは「今回の読取数 − 前回到着で引いた読取数」だけ引くので、
 * 到着済みの分が二重に引かれず、到着後に追加で読んだ分だけが引かれる
 * @param nyukoDetailData 入庫データ
 * @param nyukoDetailTableData 入庫テーブルデータ
 * @param juchuKizaiHeadIds 画面に合体している受注機材ヘッダーid
 * @param unfixedJuchuKizaiHeadIds 未到着の受注機材ヘッダーid
 * @param userNam ユーザー名
 * @param connection
 */
export const updReturnNyukoDetail = async (
  nyukoDetailData: NyukoDetailValues,
  nyukoDetailTableData: NyukoDetailTableValues[],
  juchuKizaiHeadIds: number[],
  unfixedJuchuKizaiHeadIds: number[],
  userNam: string,
  connection: PoolClient
) => {
  // 機材データ
  const kizaiData = nyukoDetailTableData.filter((d) => !d.ctnFlg);
  // コンテナデータ
  const ctnData = nyukoDetailTableData.filter((data) => data.ctnFlg);
  try {
    // 前回到着で親から引いた読取数（予定数・nyuko_fix_qty を上書きする前に取る）
    const fixQtyMap = await getNyukoFixQtyMap(nyukoDetailData, juchuKizaiHeadIds, connection);
    const items: OyaNyukoReflectItem[] = nyukoDetailTableData.map((d) => ({
      data: d,
      before: fixQtyMap.get(nyukoRowKey(d.juchuKizaiHeadId, d.juchuKizaiMeisaiId, d.kizaiId)) ?? 0,
      after: (d.resultQty ?? 0) + (d.resultAdjQty ?? 0),
    }));

    // 返却入庫伝票更新（予定数と「親から引いた読取数」を今回の読取数にする）
    await updNyukoDen(nyukoDetailTableData, userNam, connection, true);

    // 親入庫伝票更新（差分のみ）
    await reflectOyaNyukoDen(nyukoDetailData, items, userNam, connection);

    // 機材明細追加更新
    if (kizaiData && kizaiData.length > 0) {
      await upsJuchuKizaiMeisai(kizaiData, userNam, connection);
    }

    // コンテナ明細追加更新
    if (ctnData && ctnData.length > 0) {
      await upsJuchuCtnMeisai(ctnData, userNam, connection);
    }

    // 入庫確定追加（未到着のヘッダーのみ）
    await addNyukoFix(nyukoDetailData, unfixedJuchuKizaiHeadIds, userNam, connection);
  } catch (e) {
    throw e;
  }
};

/**
 * キープ入庫伝票到着処理
 * @param nyukoDetailData 入庫データ
 * @param nyukoDetailTableData 入庫テーブルデータ
 * @param unfixedJuchuKizaiHeadIds 未到着の受注機材ヘッダーid
 * @param userNam ユーザー名
 * @param connection
 */
export const updKeepNyukoDetail = async (
  nyukoDetailData: NyukoDetailValues,
  nyukoDetailTableData: NyukoDetailTableValues[],
  unfixedJuchuKizaiHeadIds: number[],
  userNam: string,
  connection: PoolClient
) => {
  const juchuKizaiHeadIds = [
    ...new Set(nyukoDetailTableData.map((d) => d.juchuKizaiHeadId).filter((id) => id !== null)),
  ];
  // 機材データ
  const kizaiData = nyukoDetailTableData.filter((d) => !d.ctnFlg);
  // コンテナデータ
  const ctnData = nyukoDetailTableData.filter((data) => data.ctnFlg);

  try {
    // 入庫伝票更新
    await updNyukoDen(nyukoDetailTableData, userNam, connection);

    // 出庫日があれば出庫伝票追加更新
    for (const juchuKizaiHeadId of juchuKizaiHeadIds) {
      // 出庫日確認
      const shukoDat = await selectJuchuKizaiNyushukoConfirmSingle({
        juchu_head_id: nyukoDetailData.juchuHeadId,
        juchu_kizai_head_id: juchuKizaiHeadId,
        nyushuko_shubetu_id: NYUSHUKO_SHUBETU_ID.shuko,
        nyushuko_basho_id: nyukoDetailData.nyushukoBashoId,
      });

      if (shukoDat.data) {
        await upsShukoDen(nyukoDetailTableData, shukoDat.data.nyushuko_dat, userNam, connection);
      }
    }

    // 機材明細追加更新
    if (kizaiData && kizaiData.length > 0) {
      await upsJuchuKizaiMeisai(kizaiData, userNam, connection);
    }

    // コンテナ明細追加更新
    if (ctnData && ctnData.length > 0) {
      await upsJuchuCtnMeisai(ctnData, userNam, connection);
    }

    // 入庫確定追加（未到着のヘッダーのみ）
    await addNyukoFix(nyukoDetailData, unfixedJuchuKizaiHeadIds, userNam, connection);
  } catch (e) {
    throw e;
  }
};

/**
 * 受注機材明細追加更新
 * @param nyukoDetailTableData 入庫テーブルデータ
 * @param userNam ユーザー名
 * @param connection
 */
export const upsJuchuKizaiMeisai = async (
  nyukoDetailTableData: NyukoDetailTableValues[],
  userNam: string,
  connection: PoolClient
) => {
  const upsertKizaiData: JuchuKizaiMeisai[] = nyukoDetailTableData.map((d) => ({
    juchu_head_id: d.juchuHeadId,
    juchu_kizai_head_id: d.juchuKizaiHeadId,
    juchu_kizai_meisai_id: d.juchuKizaiMeisaiId,
    keep_qty: d.juchuKizaiHeadKbn === JUCHU_KIZAI_HEAD_KBN.keep ? (d.resultQty ?? 0) + (d.resultAdjQty ?? 0) : null,
    kizai_id: d.kizaiId,
    plan_kizai_qty:
      d.juchuKizaiHeadKbn === JUCHU_KIZAI_HEAD_KBN.return ? -1 * ((d.resultQty ?? 0) + (d.resultAdjQty ?? 0)) : null,
    shozoku_id: d.nyushukoShubetuId ?? 0,
    dsp_ord_num: d.dspOrdNumMeisai,
    indent_num: d.indentNum,
    add_dat: new Date().toISOString(),
    add_user: userNam,
    upd_dat: null,
    upd_user: null,
  }));

  try {
    await upsertJuchuKizaiMeisai(upsertKizaiData, connection);

    return true;
  } catch (e) {
    throw e;
  }
};

/**
 * 受注コンテナ明細追加更新
 * @param nyukoDetailTableData 入庫テーブルデータ
 * @param userNam ユーザー名
 * @param connection
 */
export const upsJuchuCtnMeisai = async (
  nyukoDetailTableData: NyukoDetailTableValues[],
  userNam: string,
  connection: PoolClient
) => {
  const upsertCtnData: JuchuCtnMeisai[] = nyukoDetailTableData.map((d) => ({
    juchu_head_id: d.juchuHeadId,
    juchu_kizai_head_id: d.juchuKizaiHeadId,
    juchu_kizai_meisai_id: d.juchuKizaiMeisaiId,
    keep_qty: d.juchuKizaiHeadKbn === JUCHU_KIZAI_HEAD_KBN.keep ? (d.resultQty ?? 0) + (d.resultAdjQty ?? 0) : null,
    kizai_id: d.kizaiId,
    plan_kizai_qty:
      d.juchuKizaiHeadKbn === JUCHU_KIZAI_HEAD_KBN.return ? -1 * ((d.resultQty ?? 0) + (d.resultAdjQty ?? 0)) : null,
    shozoku_id: d.nyushukoBashoId ?? 0,
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
 * 入庫伝票更新
 * @param nyukoDetailTableData 入庫テーブルデータ
 * @param userNam ユーザー名
 * @param connection
 * @param withNyukoFixQty true のとき「到着で親から引いた読取数」（nyuko_fix_qty）も今回の読取数にする（返却の到着のみ）
 * @returns
 */
export const updNyukoDen = async (
  nyukoDetailTableData: NyukoDetailTableValues[],
  userNam: string,
  connection: PoolClient,
  withNyukoFixQty: boolean = false
) => {
  const upsertNyukoData: NyushukoDen[] = nyukoDetailTableData.map((d) => ({
    juchu_head_id: d.juchuHeadId,
    juchu_kizai_head_id: d.juchuKizaiHeadId,
    juchu_kizai_meisai_id: d.juchuKizaiMeisaiId,
    kizai_id: d.kizaiId,
    plan_qty: (d.resultQty ?? 0) + (d.resultAdjQty ?? 0),
    ...(withNyukoFixQty ? { nyuko_fix_qty: (d.resultQty ?? 0) + (d.resultAdjQty ?? 0) } : {}),
    sagyo_den_dat: d.nyushukoDat,
    sagyo_id: d.nyushukoBashoId,
    sagyo_kbn_id: SAGYO_KBN_ID.nyukoCount,
    dsp_ord_num: d.dspOrdNumMeisai,
    indent_num: d.indentNum,
    add_dat: new Date().toISOString(),
    add_user: userNam,
    upd_dat: null,
    upd_user: null,
  }));

  try {
    for (const data of upsertNyukoData) {
      await updateNyushukoDen(data, connection);
    }

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
 * @param nyukoDetailTableData 入庫テーブルデータ
 * @param userNam ユーザー名
 * @param connection
 * @returns
 */
export const upsShukoDen = async (
  nyukoDetailTableData: NyukoDetailTableValues[],
  shukoDat: string,
  userNam: string,
  connection: PoolClient
) => {
  const upsertShukoStandbyData: NyushukoDen[] = nyukoDetailTableData.map((d) => ({
    juchu_head_id: d.juchuHeadId,
    juchu_kizai_head_id: d.juchuKizaiHeadId,
    juchu_kizai_meisai_id: d.juchuKizaiMeisaiId,
    kizai_id: d.kizaiId,
    plan_qty: (d.resultQty ?? 0) + (d.resultAdjQty ?? 0),
    sagyo_den_dat: shukoDat,
    sagyo_id: d.nyushukoBashoId,
    sagyo_kbn_id: SAGYO_KBN_ID.shukoPicking,
    dsp_ord_num: d.dspOrdNumMeisai,
    indent_num: d.indentNum,
    add_dat: new Date().toISOString(),
    add_user: userNam,
    upd_dat: null,
    upd_user: null,
  }));

  const upsertShukoCheckData: NyushukoDen[] = nyukoDetailTableData.map((d) => ({
    juchu_head_id: d.juchuHeadId,
    juchu_kizai_head_id: d.juchuKizaiHeadId,
    juchu_kizai_meisai_id: d.juchuKizaiMeisaiId,
    kizai_id: d.kizaiId,
    plan_qty: (d.resultQty ?? 0) + (d.resultAdjQty ?? 0),
    sagyo_den_dat: shukoDat,
    sagyo_id: d.nyushukoBashoId,
    sagyo_kbn_id: SAGYO_KBN_ID.shukoConfirmation,
    dsp_ord_num: d.dspOrdNumMeisai,
    indent_num: d.indentNum,
    add_dat: new Date().toISOString(),
    add_user: userNam,
    upd_dat: null,
    upd_user: null,
  }));

  const mergeData = [...upsertShukoStandbyData, ...upsertShukoCheckData];

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
 * 親機材入庫伝票更新
 * 親の入庫伝票の予定数から after − before を引く（負なら戻す）
 * @param items 反映する行と量
 * @param userNam ユーザー名
 * @param connection
 */
export const updOyaKizaiNyukoDen = async (items: OyaNyukoReflectItem[], userNam: string, connection: PoolClient) => {
  const updateNyukoData: NyushukoDen[] = items
    .filter(({ before, after }) => after !== before)
    .map(({ data: d, before, after }) => ({
      juchu_head_id: d.juchuHeadId,
      juchu_kizai_head_id: d.juchuKizaiHeadId,
      juchu_kizai_meisai_id: d.juchuKizaiMeisaiId,
      kizai_id: d.kizaiId,
      plan_qty: after - before,
      sagyo_den_dat: d.nyushukoDat,
      sagyo_id: d.nyushukoBashoId,
      sagyo_kbn_id: SAGYO_KBN_ID.nyukoCount,
      dsp_ord_num: d.dspOrdNumMeisai,
      indent_num: d.indentNum,
      upd_dat: new Date().toISOString(),
      upd_user: userNam,
    }));

  try {
    for (const data of updateNyukoData) {
      await updateOyaKizaiNyukoDen(data, connection);
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
 * 返却のコンテナの読取数のうち、親の1つの入庫場所（oyaSagyoId）に振り分ける数
 * 親の入庫場所が2か所（KICS・YARD）のとき、返却の入庫場所と同じ場所には親のその場所の予定数まで、
 * 超えた分はもう一方の場所に振り分ける。1か所のときは全部その場所
 * @param qty 返却の読取数（読取＋補正）
 * @param oyaPlanQty 返却の入庫場所の、親の予定数
 * @param sagyoId 返却の入庫場所
 * @param oyaSagyoId 振り分け先の親の入庫場所
 * @param oyaNyukoDatLength 親の入庫場所の数
 * @returns
 */
const calcOyaCtnQty = (
  qty: number,
  oyaPlanQty: number,
  sagyoId: number,
  oyaSagyoId: number,
  oyaNyukoDatLength: number
) => {
  if (oyaNyukoDatLength !== 2) {
    return qty;
  }
  return sagyoId === oyaSagyoId ? Math.min(qty, oyaPlanQty) : Math.max(0, qty - oyaPlanQty);
};

/**
 * 親コンテナ入庫伝票更新
 * 親の入庫場所（oyaSagyoId）の予定数から、振り分け後の after − before を引く（負なら戻す）
 * @param items 反映する行と量
 * @param oyaJuchuContainerMeisaiData 親のコンテナ明細（場所ごとの予定数）
 * @param sagyoId 返却の入庫場所
 * @param oyaSagyoId 更新する親の入庫場所
 * @param oyaNyukoDatLength 親の入庫場所の数
 * @param userNam ユーザー名
 * @param connection
 * @returns
 */
export const updOyaCtnNyukoDen = async (
  items: OyaNyukoReflectItem[],
  oyaJuchuContainerMeisaiData: {
    juchuHeadId: number;
    juchuKizaiHeadId: number;
    juchuKizaiMeisaiId: number;
    kizaiId: number;
    planKicsKizaiQty: number;
    planYardKizaiQty: number;
  }[],
  sagyoId: number,
  oyaSagyoId: number,
  oyaNyukoDatLength: number,
  userNam: string,
  connection: PoolClient
) => {
  const updateNyukoData: NyushukoDen[] = items
    .map(({ data: d, before, after }) => {
      const oyaPlanQty =
        sagyoId === BASHO_ID.kics
          ? (oyaJuchuContainerMeisaiData.find((c) => c.kizaiId === d.kizaiId)?.planKicsKizaiQty ?? 0)
          : (oyaJuchuContainerMeisaiData.find((c) => c.kizaiId === d.kizaiId)?.planYardKizaiQty ?? 0);
      const planQty =
        calcOyaCtnQty(after, oyaPlanQty, sagyoId, oyaSagyoId, oyaNyukoDatLength) -
        calcOyaCtnQty(before, oyaPlanQty, sagyoId, oyaSagyoId, oyaNyukoDatLength);
      return {
        juchu_head_id: d.juchuHeadId,
        juchu_kizai_head_id: d.juchuKizaiHeadId,
        juchu_kizai_meisai_id: d.juchuKizaiMeisaiId,
        kizai_id: d.kizaiId,
        plan_qty: planQty,
        sagyo_den_dat: d.nyushukoDat,
        sagyo_id: oyaSagyoId,
        sagyo_kbn_id: SAGYO_KBN_ID.nyukoCount,
        dsp_ord_num: d.dspOrdNumMeisai,
        indent_num: d.indentNum,
        upd_dat: new Date().toISOString(),
        upd_user: userNam,
      };
    })
    .filter((d) => d.plan_qty !== 0);

  try {
    for (const data of updateNyukoData) {
      await updateOyaCtnNyukoDen(data, connection);
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
 * 入庫確定新規追加
 * 確定は受注機材ヘッダー単位。合体した明細で到着済みのヘッダーまで追加すると主キー違反になるため、
 * 呼び出し元で未到着のヘッダーに絞って渡す
 * @param nyukoDetailData 入庫データ
 * @param juchuKizaiHeadIds 確定を追加する受注機材ヘッダーid（未到着のもの）
 * @param userNam ユーザー名
 * @param connection
 */
export const addNyukoFix = async (
  nyukoDetailData: NyukoDetailValues,
  juchuKizaiHeadIds: number[],
  userNam: string,
  connection: PoolClient
) => {
  const targetIds = [...new Set(juchuKizaiHeadIds.filter((id) => id !== null))];
  if (targetIds.length === 0) {
    return;
  }

  const newFixData: NyushukoFix[] = targetIds.map((id) => ({
    juchu_head_id: nyukoDetailData.juchuHeadId,
    juchu_kizai_head_id: id,
    sagyo_kbn_id: SAGYO_KBN_ID.nyukoConfirmed,
    sagyo_den_dat: nyukoDetailData.nyushukoDat,
    sagyo_id: nyukoDetailData.nyushukoBashoId,
    sagyo_fix_flg: 1,
    upd_dat: new Date().toISOString(),
    upd_user: userNam,
  }));

  try {
    await insertNyushukoFix(newFixData, connection);
  } catch (e) {
    throw e;
  }
};

/**
 * 親受注コンテナ明細データ取得
 * @param juchuHeadId 受注ヘッダーid
 * @param juchuKizaiHeadId 受注機材ヘッダーid
 * @returns 返却受注コンテナ明細データ
 */
export const getOyaJuchuContainerMeisai = async (juchuHeadId: number, juchuKizaiHeadId: number) => {
  try {
    const { data: containerData, error: containerError } = await selectJuchuContainerMeisai(
      juchuHeadId,
      juchuKizaiHeadId
    );
    if (containerError) {
      throw new Error('[selectJuchuContainerMeisai] DBエラー:', { cause: containerError });
    }

    const oyaJuchuContainerMeisaiData = containerData.map((d) => ({
      juchuHeadId: d.juchu_head_id ?? 0,
      juchuKizaiHeadId: d.juchu_kizai_head_id ?? 0,
      juchuKizaiMeisaiId: d.juchu_kizai_meisai_id ?? 0,
      kizaiId: d.kizai_id ?? 0,
      planKicsKizaiQty: d.kics_plan_kizai_qty ? d.kics_plan_kizai_qty : 0,
      planYardKizaiQty: d.yard_plan_kizai_qty ? d.yard_plan_kizai_qty : 0,
    }));
    return oyaJuchuContainerMeisaiData;
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
 * 到着
 * 合体している受注機材ヘッダーの一部が到着済みでも到着できる（未到着のヘッダーだけ確定を追加する）
 * @param nyukoDetailData 入庫データ
 * @param nyukoDetailTableData 入庫テーブルデータ
 * @param userNam ユーザー名
 * @returns 失敗したときは理由（画面で文言を出し分ける）
 */
export const updNyukoDetail = async (
  nyukoDetailData: NyukoDetailValues,
  nyukoDetailTableData: NyukoDetailTableValues[],
  userNam: string
): Promise<NyushukoFixResult> => {
  if (nyukoDetailTableData.length === 0) {
    return { ok: false, reason: NYUSHUKO_FIX_ERROR.other };
  }

  const connection = await pool.connect();

  try {
    await connection.query('BEGIN');

    // 画面を開いた後に到着・到着解除された場合に備えて、確定済みのヘッダーをトランザクション内で取り直す
    const juchuKizaiHeadIds = collectJuchuKizaiHeadIds(nyukoDetailData, nyukoDetailTableData);
    const fixedJuchuKizaiHeadIds = await selectFixedJuchuKizaiHeadIdsTx(
      nyukoDetailData.juchuHeadId,
      juchuKizaiHeadIds,
      SAGYO_KBN_ID.nyukoConfirmed,
      nyukoDetailData.nyushukoDat,
      nyukoDetailData.nyushukoBashoId,
      connection
    );
    const unfixedJuchuKizaiHeadIds = juchuKizaiHeadIds.filter((id) => !fixedJuchuKizaiHeadIds.includes(id));
    if (unfixedJuchuKizaiHeadIds.length === 0) {
      throw new NyushukoFixError(NYUSHUKO_FIX_ERROR.allFixed, '[updNyukoDetail] すでにすべて到着済みです');
    }

    switch (nyukoDetailData.juchuKizaiHeadKbn) {
      case JUCHU_KIZAI_HEAD_KBN.normal: // メイン
        await updMainNyukoDetail(nyukoDetailData, unfixedJuchuKizaiHeadIds, userNam, connection);
        break;
      case JUCHU_KIZAI_HEAD_KBN.return: // 返却
        await updReturnNyukoDetail(
          nyukoDetailData,
          nyukoDetailTableData,
          juchuKizaiHeadIds,
          unfixedJuchuKizaiHeadIds,
          userNam,
          connection
        );
        break;
      case JUCHU_KIZAI_HEAD_KBN.keep: // キープ
        await updKeepNyukoDetail(nyukoDetailData, nyukoDetailTableData, unfixedJuchuKizaiHeadIds, userNam, connection);
        break;
    }

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
 * 到着解除
 * @param nyukoDetailData
 * @param nyukoDetailTableData
 * @param userNam
 * @returns 失敗したときは理由（画面で文言を出し分ける）
 */
export const delNyukoFix = async (
  nyukoDetailData: NyukoDetailValues,
  nyukoDetailTableData: NyukoDetailTableValues[],
  userNam: string
): Promise<NyushukoFixResult> => {
  if (nyukoDetailTableData.length === 0) {
    return { ok: false, reason: NYUSHUKO_FIX_ERROR.other };
  }

  const connection = await pool.connect();

  try {
    await connection.query('BEGIN');

    const juchuKizaiHeadIds = collectJuchuKizaiHeadIds(nyukoDetailData, nyukoDetailTableData);

    // ほかの人が先に到着解除していないか、トランザクション内で確定済みのヘッダーを取り直す
    const fixedJuchuKizaiHeadIds = await selectFixedJuchuKizaiHeadIdsTx(
      nyukoDetailData.juchuHeadId,
      juchuKizaiHeadIds,
      SAGYO_KBN_ID.nyukoConfirmed,
      nyukoDetailData.nyushukoDat,
      nyukoDetailData.nyushukoBashoId,
      connection
    );
    if (fixedJuchuKizaiHeadIds.length === 0) {
      throw new NyushukoFixError(NYUSHUKO_FIX_ERROR.noneFixed, '[delNyukoFix] すでに到着解除されています');
    }

    // 返却の到着解除の場合は親入庫伝票更新
    // 解除時点の読取数ではなく、到着で実際に親から引いた読取数（nyuko_fix_qty）だけを戻す。
    // 到着後に追加で読んだ分や、到着後に作られた行（nyuko_fix_qty が NULL）は親から引いていないので戻さない。
    // 戻す行は画面のデータではなく DB から取り直す（古い画面から解除しても、画面に無い行の分まで戻すため。
    // NULL に戻すのは DB の全行なので、画面のデータで決めると戻さないまま記録だけ消える）
    if (nyukoDetailData.juchuKizaiHeadKbn === JUCHU_KIZAI_HEAD_KBN.return) {
      const items = await getNyukoFixReleaseItems(nyukoDetailData, juchuKizaiHeadIds, connection);

      await reflectOyaNyukoDen(nyukoDetailData, items, userNam, connection);

      // 親から引いた読取数を消す
      await clearNyukoFixQty(
        nyukoDetailData.juchuHeadId,
        juchuKizaiHeadIds,
        nyukoDetailData.nyushukoDat,
        nyukoDetailData.nyushukoBashoId,
        connection
      );
    }

    const deleteFixData = juchuKizaiHeadIds.map((d) => ({
      juchu_head_id: nyukoDetailData.juchuHeadId,
      juchu_kizai_head_id: d,
      sagyo_kbn_id: SAGYO_KBN_ID.nyukoConfirmed,
      sagyo_id: nyukoDetailData.nyushukoBashoId,
    }));

    // 入庫確定削除
    for (const data of deleteFixData) {
      await deleteNyushukoFix(data, connection);
    }

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
