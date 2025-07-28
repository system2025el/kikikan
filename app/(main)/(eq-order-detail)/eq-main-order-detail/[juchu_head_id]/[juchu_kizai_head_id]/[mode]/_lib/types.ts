import { z } from 'zod';

export const JuchuKizaiHeadSchema = z
  .object({
    juchuHeadId: z.number(),
    juchuKizaiHeadId: z.number(),
    juchuKizaiHeadKbn: z.number(),
    juchuHonbanbiQty: z.number().nullable(),
    zeiKbn: z.number().nullable(),
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
