import { Dayjs } from 'dayjs';

import { toISOStringWithTimezoneMonthDay } from '@/app/(main)/_ui/date';
import { toISOStringYearMonthDay } from '@/app/(main)/(eq-order-detail)/_lib/datefuncs';

import { JuchuKizaiHonbanbiValues } from './types';

export const getDateHeaderBackgroundColor = (date: string, dateRange: string[]): string => {
  const isMatched = dateRange.some((targetDate) => targetDate === date);
  return isMatched ? 'blue' : 'black';
};

export const getStockRowBackgroundColor = (
  date: Date,
  shukoDate: Date | null,
  nyukoDate: Date | null,
  dateRange: string[],
  juchuHonbanbiList: JuchuKizaiHonbanbiValues[]
): string => {
  const cellDate = toISOStringYearMonthDay(date);
  const startDate = shukoDate && toISOStringYearMonthDay(shukoDate);
  const endDate = nyukoDate && toISOStringYearMonthDay(nyukoDate);

  if (juchuHonbanbiList.some((date) => toISOStringYearMonthDay(date.juchuHonbanbiDat) === cellDate)) {
    const shubetuId = juchuHonbanbiList.find(
      (date) => toISOStringYearMonthDay(date.juchuHonbanbiDat) === cellDate
    )?.juchuHonbanbiShubetuId;
    switch (shubetuId) {
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
  if (cellDate === endDate) return 'yellow';
  if (cellDate === startDate) return 'lightblue';
  if (dateRange.includes(cellDate)) return '#ACB9CA';
  return 'white';
};
