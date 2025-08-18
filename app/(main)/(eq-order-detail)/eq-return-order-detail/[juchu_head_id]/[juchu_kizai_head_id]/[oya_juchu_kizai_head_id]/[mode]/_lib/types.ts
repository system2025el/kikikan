import z from 'zod';

export const ReturnJuchuKizaiHeadSchema = z
  .object({
    juchuHeadId: z.number(),
    juchuKizaiHeadId: z.number(),
    juchuKizaiHeadKbn: z.number(),
    juchuHonbanbiQty: z.number().nullable(),
    mem: z.string().nullable(),
    headNam: z.string().nullable(),
    kicsNyukoDat: z.date().nullable(),
    yardNyukoDat: z.date().nullable(),
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
  mem: string;
  kizaiId: number;
  kizaiTankaAmt: number;
  kizaiNam: string;
  oyaPlanKizaiQty: number;
  oyaPlanYobiQty: number;
  planKizaiQty: number;
  planYobiQty: number;
  planQty: number;
  delFlag: boolean;
  saveFlag: boolean;
};
