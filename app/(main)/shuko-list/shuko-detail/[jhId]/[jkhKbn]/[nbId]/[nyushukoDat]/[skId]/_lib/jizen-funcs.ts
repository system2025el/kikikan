'use server';

import { JUCHU_KIZAI_HEAD_KBN, NYUSHUKO_SHUBETU_ID, toHonbanSagyoKbn } from '@/app/_lib/constants';
import pool, { refreshVRfid } from '@/app/_lib/db/postgres';
import { updateHonbanAdjFromJizen, updateNyushukoDen } from '@/app/_lib/db/tables/t-nyushuko-den';
import { selectHonbanShukoFixed } from '@/app/_lib/db/tables/t-nyushuko-fix';
import { selectJizenNyushukoOne } from '@/app/_lib/db/tables/v-nyushuko-den2-head';
import { selectJizenNyushukoDetail } from '@/app/_lib/db/tables/v-nyushuko-den2-lst';

import { calcShukoDiff } from './shuko-diff';
import { ShukoDetailTableValues, ShukoDetailValues } from './types';

/**
 * 事前明細（事前ピッキング・事前最終確認）のヘッダー情報取得
 * @param juchuHeadId 受注ヘッダーid
 * @param juchuKizaiHeadId 受注機材ヘッダーid
 * @param nyushukoBashoId 作業場所
 * @param nyushukoDat 準備日時
 * @param sagyoKbnId 作業区分（80/90）
 * @returns 見つからなければ null
 */
export const getJizenDetail = async (
  juchuHeadId: number,
  juchuKizaiHeadId: number,
  nyushukoBashoId: number,
  nyushukoDat: string,
  sagyoKbnId: number
) => {
  try {
    const data = await selectJizenNyushukoOne(juchuHeadId, juchuKizaiHeadId, nyushukoBashoId, nyushukoDat);
    if (data.length === 0) return null;

    const jizenDetailData: ShukoDetailValues = {
      juchuHeadId: juchuHeadId,
      juchuKizaiHeadKbn: JUCHU_KIZAI_HEAD_KBN.normal,
      nyushukoBashoId: nyushukoBashoId,
      nyushukoDat: nyushukoDat,
      sagyoKbnId: sagyoKbnId,
      juchuKizaiHeadIds: [juchuKizaiHeadId],
      juchuKizaiHeadNams: [{ juchuKizaiHeadId: juchuKizaiHeadId, headNam: data[0].head_namv }],
      nyushukoShubetuId: NYUSHUKO_SHUBETU_ID.jizen,
      headNamv: data[0].head_namv,
      koenNam: data[0].koen_nam,
      koenbashoNam: data[0].koenbasho_nam,
      kokyakuNam: data[0].kokyaku_nam,
      juchuDat: data[0].juchu_dat,
      memv: data[0].memv,
      nyuryokuUser: data[0].nyuryoku_user,
    };
    return jizenDetailData;
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
 * 事前明細の行取得
 * @param juchuHeadId 受注ヘッダーid
 * @param juchuKizaiHeadId 受注機材ヘッダーid
 * @param nyushukoBashoId 作業場所
 * @param nyushukoDat 準備日時
 * @param sagyoKbnId 作業区分（80/90）
 * @returns
 */
export const getJizenDetailTable = async (
  juchuHeadId: number,
  juchuKizaiHeadId: number,
  nyushukoBashoId: number,
  nyushukoDat: string,
  sagyoKbnId: number
) => {
  try {
    const data = await selectJizenNyushukoDetail(
      juchuHeadId,
      juchuKizaiHeadId,
      nyushukoBashoId,
      nyushukoDat,
      sagyoKbnId
    );
    return data.map(
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
 * 本番の出庫（同じ受注機材ヘッダー・作業場所）が出発済みか
 * 事前には出発が無いので、本番が出発済みなら事前の画面での補正・実績クリアを止める
 * @param juchuHeadId 受注ヘッダーid
 * @param juchuKizaiHeadId 受注機材ヘッダーid
 * @param nyushukoBashoId 作業場所
 * @returns 出発済みなら true
 */
export const getHonbanShukoFixed = async (juchuHeadId: number, juchuKizaiHeadId: number, nyushukoBashoId: number) => {
  try {
    return await selectHonbanShukoFixed(juchuHeadId, juchuKizaiHeadId, nyushukoBashoId);
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
 * 事前明細の一括補正（不足の行の補正数を 準備数 − 読取数 にする）
 * 出庫明細の一括補正（updShukoAdjust）から、作業区分が 80/90 のときに呼ばれる
 * 本番（80→10、90→20 の同じ明細・機材・作業場所の伝票）の補正も同じ値で上書きする（片方向）。
 * 本番が出発済みなら何もしない
 * @param adjustData 補正する行（不足の行）
 * @param userNam ユーザー名
 * @returns 補正したら true（本番が出発済みなら false）
 */
export const updJizenAdjust = async (adjustData: ShukoDetailTableValues[], userNam: string) => {
  if (adjustData.length === 0) return true;
  const head = adjustData[0];
  const connection = await pool.connect();
  try {
    if (await selectHonbanShukoFixed(head.juchuHeadId, head.juchuKizaiHeadId, head.nyushukoBashoId)) {
      return false;
    }

    await connection.query('BEGIN');
    for (const d of adjustData) {
      const resultAdjQty = (d.planQty ?? 0) - (d.resultQty ?? 0);
      await updateNyushukoDen(
        {
          juchu_head_id: d.juchuHeadId,
          juchu_kizai_head_id: d.juchuKizaiHeadId,
          juchu_kizai_meisai_id: d.juchuKizaiMeisaiId,
          kizai_id: d.kizaiId,
          sagyo_kbn_id: d.sagyoKbnId ?? 0,
          sagyo_den_dat: d.nyushukoDat,
          sagyo_id: d.nyushukoBashoId,
          result_adj_qty: resultAdjQty,
          upd_dat: new Date().toISOString(),
          upd_user: userNam,
        },
        connection
      );
      await updateHonbanAdjFromJizen(
        {
          juchu_head_id: d.juchuHeadId,
          juchu_kizai_head_id: d.juchuKizaiHeadId,
          juchu_kizai_meisai_id: d.juchuKizaiMeisaiId,
          kizai_id: d.kizaiId,
        },
        toHonbanSagyoKbn(d.sagyoKbnId ?? 0),
        d.nyushukoBashoId,
        resultAdjQty,
        userNam,
        connection
      );
    }
    await connection.query('COMMIT');
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
    throw e;
  } finally {
    refreshVRfid().catch((err) => {
      console.error('バックグラウンドでのマテビュー更新に失敗:', err);
    });
    connection.release();
  }
};
