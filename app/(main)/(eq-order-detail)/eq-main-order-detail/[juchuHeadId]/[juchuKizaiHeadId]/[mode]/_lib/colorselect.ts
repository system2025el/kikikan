import { Dayjs } from 'dayjs';

import { toJapanYMDString } from '@/app/(main)/_lib/date-conversion';

import { JuchuKizaiHonbanbiValues } from './types';

export const getDateHeaderBackgroundColor = (date: string, dateRange: string[]): string => {
  const isMatched = dateRange.some((targetDate) => targetDate === date);
  return isMatched ? 'blue' : 'black';
};

export const getStockRowBackgroundColor = (
  date: Date,
  dateRange: string[],
  juchuHonbanbiList: JuchuKizaiHonbanbiValues[]
): string => {
  const cellDate = toJapanYMDString(date);

  if (cellDate === dateRange[dateRange.length - 1]) return 'yellow';
  if (cellDate === dateRange[0]) return 'lightblue';

  if (juchuHonbanbiList.some((date) => toJapanYMDString(date.juchuHonbanbiDat) === cellDate)) {
    const shubetuIds = juchuHonbanbiList
      .filter((date) => toJapanYMDString(date.juchuHonbanbiDat) === cellDate)
      .sort((a, b) => b.juchuHonbanbiShubetuId - a.juchuHonbanbiShubetuId);

    switch (shubetuIds[0].juchuHonbanbiShubetuId) {
      case 40:
        return 'pink';
      case 30:
        return 'lightgreen';
      case 20:
        return 'orange';
      case 10:
        return 'mediumpurple';
      default:
        return 'white';
    }
  }

  if (dateRange.includes(cellDate)) return '#ACB9CA';
  return 'white';
};
