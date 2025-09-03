import z from 'zod';

export const ReturnJuchuKizaiHeadSchema = z
  .object({
    juchuHeadId: z.number(),
    juchuKizaiHeadId: z.number(),
    juchuKizaiHeadKbn: z.number(),
    juchuHonbanbiQty: z.number().nullable(),
    nebikiAmt: z.number().nullable(),
    mem: z.string().nullable(),
    headNam: z.string({ message: '機材明細名は必須です' }).min(1, { message: '機材明細名は必須です' }),
    oyaJuchuKizaiHeadId: z.number(),
    kicsNyukoDat: z.date().nullable(),
    yardNyukoDat: z.date().nullable(),
  })
  .refine((data) => data.kicsNyukoDat || data.yardNyukoDat, {
    message: '',
    path: ['kicsNyukoDat'],
  })
  .refine((data) => data.kicsNyukoDat || data.yardNyukoDat, {
    message: '入庫日時をいずれか一方入力してください',
    path: ['yardNyukoDat'],
  });

export type ReturnJuchuKizaiHeadValues = z.infer<typeof ReturnJuchuKizaiHeadSchema>;

export type ReturnJuchuKizaiMeisaiValues = {
  juchuHeadId: number;
  juchuKizaiHeadId: number;
  juchuKizaiMeisaiId: number;
  shozokuId: number;
  shozokuNam: string;
  mem: string | null;
  kizaiId: number;
  kizaiTankaAmt: number;
  kizaiNam: string;
  oyaPlanKizaiQty: number | null;
  oyaPlanYobiQty: number | null;
  planKizaiQty: number | null;
  planYobiQty: number | null;
  planQty: number | null;
  delFlag: boolean;
  saveFlag: boolean;
};
