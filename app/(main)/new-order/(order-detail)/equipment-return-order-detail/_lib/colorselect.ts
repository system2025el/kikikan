import { toISOStringWithTimezoneMonthDay } from '@/app/(main)/_ui/date';

export const getDateHeaderBackgroundColor = (date: string, dateRange: string[]): string => {
  const isMatched = dateRange.some((targetDate) => targetDate === date);
  return isMatched ? 'blue' : 'black';
};

export const getDateRowBackgroundColor = (date: string, endKICSDate: Date): string => {
  if (endKICSDate !== null) {
    const endDate = toISOStringWithTimezoneMonthDay(new Date(endKICSDate)).split('T')[0];

    if (date === endDate) return 'yellow';
    return 'white';
  }
  return 'white';
};
