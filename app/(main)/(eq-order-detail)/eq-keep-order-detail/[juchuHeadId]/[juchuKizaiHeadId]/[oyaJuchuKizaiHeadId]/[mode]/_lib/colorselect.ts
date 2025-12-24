import { toJapanMDString } from '@/app/(main)/_lib/date-conversion';

export const getDateHeaderBackgroundColor = (date: string, dateRange: string[]): string => {
  const isMatched = dateRange.some((targetDate) => targetDate === date);
  return isMatched ? 'blue' : 'black';
};

export const getDateRowBackgroundColor = (date: string, startDate: Date | null, endDate: Date | null): string => {
  const issueDate = startDate !== null ? toJapanMDString(new Date(startDate)) : '';
  const returnDate = endDate !== null ? toJapanMDString(new Date(endDate)) : '';

  if (date === returnDate) return 'yellow';
  if (date === issueDate) return 'lightblue';
  return 'white';
};
