'use server';

import { PoolClient } from 'pg';

import { HONBANBI_SHUBETU_ID } from '@/app/_lib/constants';
import { selectJuchuHonbanbi } from '@/app/_lib/db/tables/t-juchu-honbanbi';
import { updateJuchuHonbanbiQty } from '@/app/_lib/db/tables/t-juchu-kizai-head';
import { deleteEventHonbanbi, insertAllHonbanbi } from '@/app/_lib/db/tables/t-juchu-kizai-honbanbi';

import { toJapanYMDString } from './date-conversion';
import { HonbanbiValues } from './types';

/**
 * 受注本番日テンプレートを取得する
 * @param juchuHeadId 受注ヘッダーid
 * @returns 受注本番日テンプレート
 */
export const getHonbanbiTemplate = async (juchuHeadId: number) => {
  try {
    const { data, error } = await selectJuchuHonbanbi(juchuHeadId);

    if (error) {
      throw new Error('[getHonbanbiTemplate] DBエラー:', { cause: error });
    }

    const template: HonbanbiValues[] = data.map((d) => ({
      juchuHonbanbiShubetuId: d.juchu_honbanbi_shubetu_id,
      juchuHonbanbiDat: new Date(d.juchu_honbanbi_dat),
      mem: d.mem,
      juchuHonbanbiAddQty: d.juchu_honbanbi_add_qty,
    }));

    return template;
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
 * 受注本番日テンプレートを受注機材ヘッダー1本へ展開する。
 * そのヘッダーの仕込・RH・GP・本番を一旦削除し、適用期間に重なるテンプレートの日付だけを作り直す。
 * 金額算出に使う本番日数（本番の件数＋全種別の追加日数）も合わせて更新する。
 *
 * qtyOnly を指定した場合は t_juchu_kizai_honbanbi を一切変更せず、本番日数だけを更新する。
 * 返却ヘッダー向け。返却ヘッダーは使用日（種別1）だけを持ち、金額も
 * v_juchu_kizai_head_lst で juchu_honbanbi_qty の直値を参照するため、行を作る必要がない。
 *
 * 呼び出し元のトランザクションに参加するため、必ず connection を渡すこと。
 * @param juchuHeadId 受注ヘッダーid
 * @param juchuKizaiHeadId 受注機材ヘッダーid
 * @param startDate 適用期間の開始日（通常ヘッダーは出庫日、返却ヘッダーは返却日）
 * @param endDate 適用期間の終了日（通常ヘッダーは入庫日、返却ヘッダーは親の入庫日）
 * @param template 受注本番日テンプレート
 * @param userNam ユーザー名
 * @param connection コネクション
 * @param qtyOnly 本番日数のみ更新する場合はtrue
 */
export const expandHonbanbiTemplate = async (
  juchuHeadId: number,
  juchuKizaiHeadId: number,
  startDate: Date | string | null,
  endDate: Date | string | null,
  template: HonbanbiValues[],
  userNam: string,
  connection: PoolClient,
  qtyOnly: boolean = false
) => {
  const now = new Date().toISOString();

  // 適用期間が揃っていないヘッダーには展開しない
  const inRange =
    startDate && endDate
      ? template.filter((d) => {
          const dat = toJapanYMDString(d.juchuHonbanbiDat);
          return dat >= toJapanYMDString(startDate) && dat <= toJapanYMDString(endDate);
        })
      : [];

  if (!qtyOnly) {
    // 展開し直すため、対象ヘッダーの仕込・RH・GP・本番を一旦消す
    await deleteEventHonbanbi(juchuHeadId, juchuKizaiHeadId, connection);

    if (inRange.length > 0) {
      await insertAllHonbanbi(
        inRange.map((d) => ({
          juchu_head_id: juchuHeadId,
          juchu_kizai_head_id: juchuKizaiHeadId,
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
  }

  const honbanbiQty = inRange.filter((d) => d.juchuHonbanbiShubetuId === HONBANBI_SHUBETU_ID.honban).length;
  const addQty = inRange.reduce((sum, d) => sum + (d.juchuHonbanbiAddQty ?? 0), 0);
  await updateJuchuHonbanbiQty(juchuHeadId, juchuKizaiHeadId, honbanbiQty + addQty, userNam, connection);
};
