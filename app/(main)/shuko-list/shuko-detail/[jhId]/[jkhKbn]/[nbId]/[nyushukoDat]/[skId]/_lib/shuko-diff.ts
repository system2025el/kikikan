import { JUCHU_KIZAI_HEAD_KBN } from '@/app/_lib/constants';

/**
 * 出庫明細の差異（読取 + 補正 − 予定）
 * @param planQty 予定数
 * @param resultQty 読取数
 * @param resultAdjQty 補正数
 * @returns
 */
export const calcShukoDiff = (planQty: number | null, resultQty: number | null, resultAdjQty: number | null) =>
  (resultQty ?? 0) + (resultAdjQty ?? 0) - (planQty ?? 0);

/**
 * 出発を止める不足・過剰がある行か
 * メイン・返却は機材だけ（コンテナは見ない）、キープはコンテナも見る
 * @param row 出庫明細の行
 * @returns
 */
export const hasShukoDiff = (row: { juchuKizaiHeadKbn: number; ctnFlg: number | null; diff: number }) =>
  row.juchuKizaiHeadKbn === JUCHU_KIZAI_HEAD_KBN.keep ? row.diff !== 0 : !row.ctnFlg && row.diff !== 0;
