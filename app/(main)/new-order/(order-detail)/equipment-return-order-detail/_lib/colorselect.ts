import { toISOStringWithTimezoneMonthDay } from '@/app/(main)/_ui/date';

export const getDateHeaderBackgroundColor = (date: string, dateRange: string[]): string => {
  const isMatched = dateRange.some((targetDate) => targetDate === date);
  return isMatched ? 'blue' : 'black';
};

export const getDateRowBackgroundColor = (date: string, startDate: Date | null, endDate: Date | null): string => {
  const issueDate = startDate && toISOStringWithTimezoneMonthDay(new Date(startDate));
  const returnDate = endDate && toISOStringWithTimezoneMonthDay(new Date(endDate)).split('T')[0];

  if (date === returnDate) return 'yellow';
  if (date === issueDate) return 'lightblue';
  return 'white';
};
