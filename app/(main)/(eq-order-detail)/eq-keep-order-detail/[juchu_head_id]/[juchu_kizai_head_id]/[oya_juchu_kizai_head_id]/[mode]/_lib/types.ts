import z from 'zod';

export const KeepJuchuKizaiHeadSchema = z
  .object({
    juchuHeadId: z.number(),
    juchuKizaiHeadId: z.number(),
    juchuKizaiHeadKbn: z.number(),
    mem: z.string().nullable(),
    headNam: z.string({ message: '機材明細名は必須です' }).min(1, { message: '機材明細名は必須です' }),
    oyaJuchuKizaiHeadId: z.number(),
    kicsShukoDat: z.date().nullable(),
    kicsNyukoDat: z.date().nullable(),
    yardShukoDat: z.date().nullable(),
    yardNyukoDat: z.date().nullable(),
  })
  .refine((data) => data.kicsShukoDat || data.yardShukoDat, {
    message: '',
    path: ['kicsShukoDat'],
  })
  .refine((data) => data.kicsShukoDat || data.yardShukoDat, {
    message: '出庫日時をいずれか一方入力してください',
    path: ['yardShukoDat'],
  })
  .refine((data) => data.kicsNyukoDat || data.yardNyukoDat, {
    message: '',
    path: ['kicsNyukoDat'],
  })
  .refine((data) => data.kicsNyukoDat || data.yardNyukoDat, {
    message: '入庫日時をいずれか一方入力してください',
    path: ['yardNyukoDat'],
  });

export type KeepJuchuKizaiHeadValues = z.infer<typeof KeepJuchuKizaiHeadSchema>;

export type KeepJuchuKizaiMeisaiValues = {
  juchuHeadId: number;
  juchuKizaiHeadId: number;
  juchuKizaiMeisaiId: number;
  shozokuId: number;
  shozokuNam: string;
  mem: string;
  kizaiId: number;
  kizaiNam: string;
  oyaPlanKizaiQty: number;
  oyaPlanYobiQty: number;
  keepQty: number;
  delFlag: boolean;
  saveFlag: boolean;
};
