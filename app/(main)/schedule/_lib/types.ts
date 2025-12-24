/**
 * Weeklyスケジュールの表示用の型
 */
export type WeeklyScheduleValues = {
  calDat: string;
  mem: string | null;
  tantoNam: string | null;
  holidayFlg: boolean;
  timeDatas: {
    juchuHeadId: number;
    juchuSharyoId: number;
    sharyoHeadNam: string | null;
    nyushukoDat: string | null;
    nyushukoShubetuId: number | null;
    nyushukoBashoId: number | null;
    koenNam: string | null;
    kokyakuNam: string | null;
    sharyos: { nam: string; daisu: number }[];
  }[];
};

export type WeeklySearchValues = {
  startDate: Date | null;
  endDate: Date | null;
  dateCount: number | null;
};

/**
 * weekly の担当者・メモ・祝日フラグフォームの型
 */
export type WeeklyValues = {
  dat: string;
  tantoNam: string | null;
  mem: string | null;
  holidayFlg: boolean;
};
