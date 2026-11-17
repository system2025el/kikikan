import { dispColors } from '@/app/(main)/_lib/colors';
export const getDateHeaderBackgroundColor = (date: string, dateRange: string[]): string => {
  const isMatched = dateRange.some((targetDate) => targetDate === date);
  return isMatched ? dispColors.dateInRange : dispColors.dateOutOfRange;
};
