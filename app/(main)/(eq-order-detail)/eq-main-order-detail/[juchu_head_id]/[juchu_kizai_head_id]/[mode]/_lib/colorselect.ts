import { Dayjs } from 'dayjs';

import { toISOStringWithTimezoneMonthDay } from '@/app/(main)/_ui/date';

import { EquipmentData } from '../../_ui/main/equipment-order-detail';

export const getDateHeaderBackgroundColor = (date: string, dateRange: string[]): string => {
  const isMatched = dateRange.some((targetDate) => targetDate === date);
  return isMatched ? 'blue' : 'black';
};

export const getDateRowBackgroundColor = (
  date: string,
  dateRange: string[],
  startKICSDate: Date | null,
  endKICSDate: Date | null,
  preparation: EquipmentData[],
  RH: EquipmentData[],
  GP: EquipmentData[],
  actual: EquipmentData[]
): string => {
  const startDate =
    startKICSDate !== null ? toISOStringWithTimezoneMonthDay(new Date(startKICSDate)).split('T')[0] : '';
  const endDate = endKICSDate !== null ? toISOStringWithTimezoneMonthDay(new Date(endKICSDate)).split('T')[0] : '';
  const preparationDate: string[] = [];
  const RHDate: string[] = [];
  const GPDate: string[] = [];
  const actualDate: string[] = [];

  preparation.map((prev) => {
    preparationDate.push(prev.date.slice(5));
  });
  RH.map((prev) => {
    RHDate.push(prev.date.slice(5));
  });
  GP.map((prev) => {
    GPDate.push(prev.date.slice(5));
  });
  actual.map((prev) => {
    actualDate.push(prev.date.slice(5));
  });
  if (actualDate.includes(date)) return 'pink';
  if (GPDate.includes(date)) return 'lightgreen';
  if (RHDate.includes(date)) return 'orange';
  if (preparationDate.includes(date)) return 'mediumpurple';
  if (date === endDate) return 'yellow';
  if (date === startDate) return 'lightblue';
  if (dateRange.includes(date)) return '#ACB9CA';
  return 'white';
};
