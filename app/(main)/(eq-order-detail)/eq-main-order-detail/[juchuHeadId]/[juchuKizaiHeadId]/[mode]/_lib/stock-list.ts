import { StockTableValues } from './types';

/**
 * 機材ごとにまとめて取得した在庫を、明細の並びに合わせて並べ直す
 * 同じ機材の明細が複数あれば、それぞれに同じ在庫を割り当てる
 * @param kizaiIds 明細の機材id（明細の並び順）
 * @param stockData 機材在庫（機材×日付）
 * @returns 明細ごとの在庫。在庫が無い機材は空配列
 */
export const toEqStockList = (kizaiIds: number[], stockData: StockTableValues[]): StockTableValues[][] => {
  const idToStockMap = new Map<number, StockTableValues[]>();
  for (const row of stockData) {
    if (!idToStockMap.has(row.kizaiId)) {
      idToStockMap.set(row.kizaiId, []);
    }
    idToStockMap.get(row.kizaiId)!.push(row);
  }
  return kizaiIds.map((id) => idToStockMap.get(id) ?? []);
};
