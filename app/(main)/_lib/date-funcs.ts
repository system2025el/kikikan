import { toJapanYMDString } from './date-conversion';

export const getShukoDate = (kicsShukoDat: Date | null, yardShukoDat: Date | null) => {
  if (kicsShukoDat && yardShukoDat) {
    return kicsShukoDat <= yardShukoDat ? kicsShukoDat : yardShukoDat;
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

export const getNyukoDate = (kicsNyukoDat: Date | null, yardNyukoDat: Date | null) => {
  if (kicsNyukoDat && yardNyukoDat) {
    return kicsNyukoDat <= yardNyukoDat ? yardNyukoDat : kicsNyukoDat;
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
      const dateStr = toJapanYMDString(current);
      range.push(dateStr);
      current.setDate(current.getDate() + 1);
    }

    return range;
  }
  return [];
};
