import { toJapanMDString } from '@/app/(main)/_lib/date-conversion';

export const getDateHeaderBackgroundColor = (date: string, dateRange: string[]): string => {
  const isMatched = dateRange.some((targetDate) => targetDate === date);
  return isMatched ? 'blue' : 'black';
};

export const getDateRowBackgroundColor = (date: string, startDate: Date | null, endDate: Date | null): string => {
  const issueDate = startDate && toJapanMDString(new Date(startDate));
  const returnDate = endDate && toJapanMDString(new Date(endDate)).split('T')[0];

  if (date === returnDate) return 'yellow';
  if (date === issueDate) return 'lightblue';
  return 'white';
};
