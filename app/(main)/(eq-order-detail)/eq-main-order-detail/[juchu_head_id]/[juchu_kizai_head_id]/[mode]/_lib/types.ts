import { nullable, z } from 'zod';

export const JuchuKizaiHeadSchema = z
  .object({
    juchuHeadId: z.number(),
    juchuKizaiHeadId: z.number(),
    juchuKizaiHeadKbn: z.number(),
    juchuHonbanbiQty: z.number().nullable(),
    nebikiAmt: z.number().nullable(),
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

export type JuchuKizaiHeadValues = z.infer<typeof JuchuKizaiHeadSchema>;

export const JuchuKizaiMeisaiSchema = z.object({
  juchuHeadId: z.number(),
  juchuKizaiHeadId: z.number(),
  juchuKizaiMeisaiId: z.number(),
  idoDenId: z.number().nullable(),
  idoDenDat: z.date().nullable(),
  idoSijiId: z.string().nullable(),
  shozokuId: z.number(),
  shozokuNam: z.string(),
  mem: z.string().nullable(),
  kizaiId: z.number(),
  kizaiTankaAmt: z.number(),
  kizaiNam: z.string(),
  kizaiQty: z.number(),
  planKizaiQty: z.number(),
  planYobiQty: z.number().nullable(),
  planQty: z.number(),
  delFlag: z.boolean(),
  saveFlag: z.boolean(),
});

export type JuchuKizaiMeisaiValues = z.infer<typeof JuchuKizaiMeisaiSchema>;

export type StockTableValues = {
  calDat: Date;
  kizaiId: number;
  kizaiQty: number;
  juchuQty: number;
  zaikoQty: number;
  juchuHonbanbiShubetuId: number;
  juchuHonbanbiColor: string;
};

export type JuchuKizaiHonbanbiValues = {
  juchuHeadId: number;
  juchuKizaiHeadId: number;
  juchuHonbanbiShubetuId: number;
  juchuHonbanbiDat: Date;
  mem: string;
  juchuHonbanbiAddQty: number;
};
