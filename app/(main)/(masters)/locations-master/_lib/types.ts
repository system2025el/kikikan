import { z } from 'zod';

export const LocsMasterSchema = z.object({
  locId: z.number().optional(),
  locNam: z.string().max(100, { message: '100文字以内で入力してください' }).min(1, { message: '必須項目です' }),
  kana: z.string().max(100, { message: '100文字以内で入力してください' }),
  delFlg: z.boolean().optional(),
  dspOrdNum: z.number().optional(),
  adrPost: z.string().max(20, { message: '20文字以内で入力してください' }).optional(),
  adrShozai: z.string().max(100, { message: '100文字以内で入力してください' }).optional(),
  adrTatemono: z.string().max(100, { message: '100文字以内で入力してください' }).optional(),
  adrSonota: z.string().max(100, { message: '100文字以内で入力してください' }).optional(),
  tel: z.string().max(20, { message: '20文字以内で入力してください' }).optional(),
  telMobile: z.string().max(20, { message: '20文字以内で入力してください' }).optional(),
  fax: z.string().max(20, { message: '20文字以内で入力してください' }).optional(),
  mail: z
    .string()
    .max(100, { message: '100文字以内で入力してください' })
    .email({ message: '正しいメールアドレスではありません' })
    .optional(),
  mem: z.string().max(200, { message: '200文字以内で入力してください' }).optional(),
  dspFlg: z.boolean().optional(),
  addDate: z.date().optional(),
  addUser: z.string().optional(),
  apdDate: z.date().optional(),
  updUser: z.string().optional(),
});

export type LocsMasterValues = z.infer<typeof LocsMasterSchema>;

export const LocsMasterTableSchema = z.object({
  locId: z.number(),
  locNam: z.string(),
  dspOrdNum: z.number().optional(),
  delFlg: z.boolean().optional(),
  adrShozai: z.string().optional(),
  adrTatemono: z.string().optional(),
  adrSonota: z.string().optional(),
  tel: z.string().optional(),
  fax: z.string().optional(),
  mem: z.string().optional(),
});

export type LocsMasterTableValues = z.infer<typeof LocsMasterTableSchema>;

export const LocsMasterDialogSchema = LocsMasterSchema.omit({
  dspOrdNum: true,
  addDate: true,
  addUser: true,
  apdDate: true,
  updUser: true,
});

export type LocsMasterDialogValues = z.infer<typeof LocsMasterDialogSchema>;

/* 検索用スキーマ */
export const LocsMasterSearchSchema = z.object({
  query: z.string().optional(),
});
export type LocsMasterSearchValues = z.infer<typeof LocsMasterSearchSchema>;
