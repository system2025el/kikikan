export type WeeklyScheduleValues = {
  calDat: string;
  mem: string | null;
  tantoNam: string | null;
  holidayFlg: number | null;
  timeDatas: {
    juchuHeadId: number;
    juchuSharyoId: number;
    sharyoHeadNam: string | null;
    nyushukoDat: string | null;
    nyushukoShubetuId: number | null;
    koenNam: string | null;
    kokyakuNam: string | null;
    sharyos: string[];
  }[];
};
