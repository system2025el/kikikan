import z from 'zod';

export const KeepJuchuKizaiHeadSchema = z
  .object({
    juchuHeadId: z.number(),
    juchuKizaiHeadId: z.number(),
    juchuKizaiHeadKbn: z.number(),
    mem: z.string().nullable(),
    headNam: z.string().nullable(),
    kicsShukoDat: z.date().nullable(),
    kicsNyukoDat: z.date().nullable(),
    yardShukoDat: z.date().nullable(),
    yardNyukoDat: z.date().nullable(),
  })
  .refine((data) => data.kicsShukoDat || data.yardShukoDat, {
    message: '出庫日時をいずれか一方入力してください',
    path: ['yardShukoDat'],
  })
  .refine((data) => data.kicsNyukoDat || data.yardNyukoDat, {
    message: '入庫日時をいずれか一方入力してください',
    path: ['yardNyukoDat'],
  });

export type KeepJuchuKizaiHeadValues = z.infer<typeof KeepJuchuKizaiHeadSchema>;

export type ReturnJuchuKizaiMeisaiValues = {
  juchuHeadId: number;
  juchuKizaiHeadId: number;
  juchuKizaiMeisaiId: number;
  mem: string;
  kizaiId: number;
  kizaiTankaAmt: number;
  kizaiNam: string;
  oyaPlanKizaiQty: number;
  oyaPlanYobiQty: number;
  plankeepQty: number;
  delFlag: boolean;
  saveFlag: boolean;
};
