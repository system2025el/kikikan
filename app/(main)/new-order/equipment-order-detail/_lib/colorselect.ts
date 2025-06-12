import { Dayjs } from 'dayjs';

import { toISOStringWithTimezoneMonthDay } from '@/app/(main)/_ui/date';

import { EquipmentData } from '../_ui/equipment-order-detail';

export const getEquipmentRowBackgroundColor = (rowIndex: number, colIndex: number): string => {
  switch (colIndex) {
    case 3:
      return 'lightgrey';
    case 4:
      return 'lightgrey';
    case 7:
      return 'lightgrey';
    default:
      return 'white';
  }
};

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
  actual: EquipmentData[]
): string => {
  if (startKICSDate !== null && endKICSDate !== null) {
    const startDate = toISOStringWithTimezoneMonthDay(new Date(startKICSDate)).split('T')[0];
    const endDate = toISOStringWithTimezoneMonthDay(new Date(endKICSDate)).split('T')[0];
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
    if (date === startDate) return 'lightblue';
    if (date === endDate) return 'yellow';
    if (preparationDate.includes(date)) return 'purple';
    if (RHDate.includes(date)) return 'orange';
    if (GPDate.includes(date)) return 'green';
    if (actualDate.includes(date)) return 'pink';
    return 'white';
  }
  return 'white';
};
