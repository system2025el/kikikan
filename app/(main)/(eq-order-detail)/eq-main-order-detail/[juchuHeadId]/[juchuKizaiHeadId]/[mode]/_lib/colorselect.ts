import { HONBANBI_SHUBETU_ID } from '@/app/_lib/constants';
import { dispColors, honbanbiFallbackColors } from '@/app/(main)/_lib/colors';
import { toJapanYMDString } from '@/app/(main)/_lib/date-conversion';

export const getDateHeaderBackgroundColor = (date: string, dateRange: string[]): string => {
  const isMatched = dateRange.some((targetDate) => targetDate === date);
  return isMatched ? dispColors.dateInRange : dispColors.dateOutOfRange;
};

const stockDateKeyCache = new Map<number, string>();

/**
 * 在庫セルの日付を YYYY/MM/DD の文字列にする
 * 在庫テーブルは 機材数×表示日数 のセルごとに日付を比べるので、dayjs のタイムゾーン変換は日付ごとに1回で済ませる
 * @param date 在庫データの日付
 * @returns YYYY/MM/DD
 */
export const toStockDateKey = (date: Date): string => {
  const time = new Date(date).getTime();
  let key = stockDateKeyCache.get(time);
  if (key === undefined) {
    key = toJapanYMDString(date);
    stockDateKeyCache.set(time, key);
  }
  return key;
};

/**
 * 在庫セルの背景色のうち、日付だけで決まるもの（本番日・出入庫日・使用期間）
 * どの機材の行でも同じなので、在庫テーブルでは日付ごとに1回だけ求める
 * @param cellDate YYYY/MM/DD
 * @returns 色。どれにも当たらなければ null（事前準備の期間か白になる）
 */
export const getStockBaseBackgroundColor = (
  cellDate: string,
  dateRange: string[],
  shubetuColorMap: Map<number, string>,
  juchuColorMap: Map<string, string>
): string | null => {
  const juchuColor = juchuColorMap.get(cellDate);
  if (juchuColor) return juchuColor;

  if (cellDate === dateRange[dateRange.length - 1]) return shubetuColorMap.get(3) ?? honbanbiFallbackColors.nyuko;
  if (cellDate === dateRange[0]) return shubetuColorMap.get(2) ?? honbanbiFallbackColors.shuko;
  if (dateRange.includes(cellDate)) return shubetuColorMap.get(1) ?? honbanbiFallbackColors.use;
  return null;
};

/**
 * 事前準備の期間の背景色
 * 色マスタに行が無い環境では白のまま
 */
export const getJizenBackgroundColor = (shubetuColorMap: Map<number, string>): string =>
  shubetuColorMap.get(HONBANBI_SHUBETU_ID.jizen) ?? 'white';
