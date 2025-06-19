import { Dayjs } from 'dayjs';

import { toISOStringWithTimezoneMonthDay } from '@/app/(main)/_ui/date';

import { EquipmentData } from '../_ui/equipment-order-detail';

export const getDateHeaderBackgroundColor = (date: string, dateRange: string[]): string => {
  const isMatched = dateRange.some((targetDate) => targetDate === date);
  return isMatched ? 'blue' : 'black';
};

export const getDateRowBackgroundColor = (
  date: string,
  startKICSDate: Date,
  endKICSDate: Date,
  preparation: EquipmentData[],
  RH: EquipmentData[],
  GP: EquipmentData[],
  actual: EquipmentData[],
  keep: EquipmentData[]
): string => {
  if (startKICSDate !== null && endKICSDate !== null) {
    const startDate = toISOStringWithTimezoneMonthDay(new Date(startKICSDate)).split('T')[0];
    const endDate = toISOStringWithTimezoneMonthDay(new Date(endKICSDate)).split('T')[0];
    const preparationDate: string[] = [];
    const RHDate: string[] = [];
    const GPDate: string[] = [];
    const actualDate: string[] = [];
    const keepDate: string[] = [];

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
    keep.map((prev) => {
      keepDate.push(prev.date.slice(5));
    });
    if (date === startDate) return 'lightblue';
    if (date === endDate) return 'yellow';
    if (keepDate.includes(date)) return '#ACB9CA';
    if (preparationDate.includes(date)) return 'mediumpurple';
    if (RHDate.includes(date)) return 'orange';
    if (GPDate.includes(date)) return 'lightgreen';
    if (actualDate.includes(date)) return 'pink';
    return 'white';
  }
  return 'white';
};
