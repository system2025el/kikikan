'use server';

import { calcFixSts, FIX_STS, FixSts } from '@/app/_lib/constants';
import { selectFixedJuchuKizaiHeadIds } from '@/app/_lib/db/tables/t-nyushuko-fix';

/**
 * 入出庫明細画面の確定状況
 * 画面は同じ日時・場所の複数の受注機材ヘッダーを合体して表示するが、確定（t_nyushuko_fix）はヘッダー単位のため、
 * 全体の状況（なし／一部／全部）と、確定済みのヘッダーを持つ
 */
export type NyushukoFixState = {
  fixSts: FixSts;
  fixedJuchuKizaiHeadIds: number[];
};

/**
 * 入出庫明細画面の確定状況取得
 * @param juchuHeadId 受注ヘッダーid
 * @param juchuKizaiHeadIds 画面に合体している受注機材ヘッダーid
 * @param sagyoKbnId 作業区分id（出庫確定 60 / 入庫確定 70）
 * @param sagyoDenDat 作業日時
 * @param sagyoId 作業id
 * @returns
 */
export const getNyushukoFixState = async (
  juchuHeadId: number,
  juchuKizaiHeadIds: number[],
  sagyoKbnId: number,
  sagyoDenDat: string,
  sagyoId: number
): Promise<NyushukoFixState> => {
  try {
    const ids = [...new Set(juchuKizaiHeadIds.filter((id) => id !== null && id !== undefined))];
    if (ids.length === 0) {
      return { fixSts: FIX_STS.none, fixedJuchuKizaiHeadIds: [] };
    }

    const { data, error } = await selectFixedJuchuKizaiHeadIds(juchuHeadId, ids, sagyoKbnId, sagyoDenDat, sagyoId);
    if (error) {
      throw new Error('[getNyushukoFixState] DBエラー:', { cause: error });
    }

    const fixedJuchuKizaiHeadIds = [...new Set(data.map((d) => d.juchu_kizai_head_id))];
    return { fixSts: calcFixSts(fixedJuchuKizaiHeadIds.length, ids.length), fixedJuchuKizaiHeadIds };
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
