import { nullable, z } from 'zod';

export const JuchuKizaiHeadSchema = z
  .object({
    juchuHeadId: z.number(),
    juchuKizaiHeadId: z.number(),
    juchuKizaiHeadKbn: z.number(),
    juchuHonbanbiQty: z.number().nullable(),
    nebikiAmt: z.number().nullable(),
    mem: z.string().nullable(),
    headNam: z.string({ message: '機材明細名は必須です' }).min(1, { message: '機材明細名は必須です' }),
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

export type JuchuKizaiHeadValues = z.infer<typeof JuchuKizaiHeadSchema>;

export type JuchuKizaiMeisaiValues = {
  juchuHeadId: number;
  juchuKizaiHeadId: number;
  juchuKizaiMeisaiId: number;
  idoDenId: number | null;
  sagyoDenDat: Date | null;
  sagyoSijiId: string | null;
  shozokuId: number;
  shozokuNam: string;
  mem: string | null;
  kizaiId: number;
  kizaiTankaAmt: number;
  kizaiNam: string;
  kizaiQty: number;
  planKizaiQty: number | null;
  planYobiQty: number | null;
  planQty: number | null;
  delFlag: boolean;
  saveFlag: boolean;
};

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
  mem: string | null;
  juchuHonbanbiAddQty: number | null;
};
