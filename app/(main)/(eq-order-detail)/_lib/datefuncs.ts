import { toISOStringWithTimezoneMonthDay } from '../../_ui/date';

export const GetShukoDate = (kicsShukoDat: Date | null, yardShukoDat: Date | null) => {
  if (kicsShukoDat && yardShukoDat) {
    return kicsShukoDat < yardShukoDat ? kicsShukoDat : yardShukoDat;
  }

  if (kicsShukoDat && !yardShukoDat) {
    return kicsShukoDat;
  }

  if (!kicsShukoDat && yardShukoDat) {
    return yardShukoDat;
  }
  return null;
  //return new Date();
};

export const GetNyukoDate = (kicsNyukoDat: Date | null, yardNyukoDat: Date | null) => {
  if (kicsNyukoDat && yardNyukoDat) {
    return kicsNyukoDat < yardNyukoDat ? yardNyukoDat : kicsNyukoDat;
  }

  if (kicsNyukoDat && !yardNyukoDat) {
    return kicsNyukoDat;
  }

  if (!kicsNyukoDat && yardNyukoDat) {
    return yardNyukoDat;
  }
  return null;
  //return new Date();
};

// 開始日から終了日までの日付配列の作成
export const getRange = (start: Date | null, end: Date | null): string[] => {
  if (start !== null && end !== null) {
    const range: string[] = [];
    const current = new Date(start);

    while (current <= end) {
      range.push(toISOStringYearMonthDay(current));
      current.setDate(current.getDate() + 1);
    }

    return range;
  }
  return [];
};

export const toISOStringYearMonthDay = (date: Date) => {
  const pad = function (str: string): string {
    return ('0' + str).slice(-2);
  };
  const year = date.getFullYear().toString();
  const month = pad((date.getMonth() + 1).toString());
  const day = pad(date.getDate().toString());
  return `${year}/${month}/${day}`;
};
