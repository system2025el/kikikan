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
  const cellDate = toJapanYMDString(date);

  const juchuColor = juchuColorMap.get(cellDate);
  if (juchuColor) return juchuColor;

  if (cellDate === dateRange[dateRange.length - 1]) return shubetuColorMap.get(3) ?? 'yellow';
  if (cellDate === dateRange[0]) return shubetuColorMap.get(2) ?? 'lightblue';
  if (dateRange.includes(cellDate)) return shubetuColorMap.get(1) ?? '#ACB9CA';
  // 事前準備の期間（準備日〜出庫日の前日）。本番日・出入庫日・使用期間の色が無い日だけ塗る
  // 色マスタに行が無い環境では白のまま
  if (jizenRange.includes(cellDate)) return shubetuColorMap.get(HONBANBI_SHUBETU_ID.jizen) ?? 'white';

  return 'white';
};
