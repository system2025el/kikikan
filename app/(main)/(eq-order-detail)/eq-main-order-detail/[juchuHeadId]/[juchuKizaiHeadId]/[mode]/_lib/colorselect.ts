import { HONBANBI_SHUBETU_ID } from '@/app/_lib/constants';
import { toJapanYMDString } from '@/app/(main)/_lib/date-conversion';

import { JuchuKizaiHonbanbiValues } from './types';

export const getDateHeaderBackgroundColor = (date: string, dateRange: string[]): string => {
  const isMatched = dateRange.some((targetDate) => targetDate === date);
  return isMatched ? 'blue' : 'black';
};

export const getStockRowBackgroundColor = (
  date: Date,
  dateRange: string[],
  //juchuHonbanbiList: JuchuKizaiHonbanbiValues[]
  shubetuColorMap: Map<number, string>,
  juchuColorMap: Map<string, string>,
  jizenRange: string[] = []
): string => {
  // const cellDate = toJapanYMDString(date);

  // if (juchuHonbanbiList.some((date) => toJapanYMDString(date.juchuHonbanbiDat) === cellDate)) {
  //   const shubetuIds = juchuHonbanbiList
  //     .filter((date) => toJapanYMDString(date.juchuHonbanbiDat) === cellDate)
  //     .sort((a, b) => b.juchuHonbanbiShubetuId - a.juchuHonbanbiShubetuId);

  //   switch (shubetuIds[0].juchuHonbanbiShubetuId) {
  //     case 40:
  //       return 'pink';
  //     case 30:
  //       return 'lightgreen';
  //     case 20:
  //       return 'orange';
  //     case 10:
  //       return 'mediumpurple';
  //     default:
  //       return 'white';
  //   }
  // }

  // if (cellDate === dateRange[dateRange.length - 1]) return 'yellow';
  // if (cellDate === dateRange[0]) return 'lightblue';
  // if (dateRange.includes(cellDate)) return '#ACB9CA';
  // return 'white';
  const cellDate = toStockDateKey(date);

  const baseColor = getStockBaseBackgroundColor(cellDate, dateRange, shubetuColorMap, juchuColorMap);
  if (baseColor) return baseColor;
  // 事前準備の期間（準備日〜出庫日の前日）。本番日・出入庫日・使用期間の色が無い日だけ塗る
  if (jizenRange.includes(cellDate)) return getJizenBackgroundColor(shubetuColorMap);

  return 'white';
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

  if (cellDate === dateRange[dateRange.length - 1]) return shubetuColorMap.get(3) ?? 'yellow';
  if (cellDate === dateRange[0]) return shubetuColorMap.get(2) ?? 'lightblue';
  if (dateRange.includes(cellDate)) return shubetuColorMap.get(1) ?? '#ACB9CA';
  return null;
};

/**
 * 事前準備の期間の背景色
 * 色マスタに行が無い環境では白のまま
 */
export const getJizenBackgroundColor = (shubetuColorMap: Map<number, string>): string =>
  shubetuColorMap.get(HONBANBI_SHUBETU_ID.jizen) ?? 'white';
