import z3, { z } from 'zod';

import { validationMessages } from '../../_lib/validation-messages';

/**
 * スケジュールの表示用の型
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
 * スケジュール用のスキーマ
 */
export const WeeklySchema = z.object({
  dat: z.string().max(20),
  tantoNam: z
    .string()
    .max(200, { message: validationMessages.maxStringLength(200) })
    .nullable(),
  mem: z
    .string()
    .max(200, { message: validationMessages.maxStringLength(200) })
    .nullable(),
  holidayFlg: z.boolean(),
});

/**
 * スケジュール の日直・メモ・祝日フラグフォームの型
 */
export type WeeklyValues = z.infer<typeof WeeklySchema>;
