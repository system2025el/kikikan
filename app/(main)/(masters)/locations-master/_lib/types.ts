import { z } from 'zod';

export const LocsMasterDialogSchema = z.object({
  locNam: z.string().max(100, { message: '100文字以内で入力してください' }).min(1, { message: '必須項目です' }),
  kana: z.string().max(100, { message: '100文字以内で入力してください' }).min(1, { message: '必須項目です' }),
  delFlg: z.boolean().optional(),
  adrPost: z.string().max(20, { message: '20文字以内で入力してください' }).nullish(),
  adrShozai: z.string().max(100, { message: '100文字以内で入力してください' }).nullish(),
  adrTatemono: z.string().max(100, { message: '100文字以内で入力してください' }).nullish(),
  adrSonota: z.string().max(100, { message: '100文字以内で入力してください' }).nullish(),
  tel: z.string().max(20, { message: '20文字以内で入力してください' }).nullish(),
  telMobile: z.string().max(20, { message: '20文字以内で入力してください' }).nullish(),
  fax: z.string().max(20, { message: '20文字以内で入力してください' }).nullish(),
  mail: z
    .string()
    .max(100, { message: '100文字以内で入力してください' })
    .refine((val) => val === '' || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val), { message: '無効なメールアドレスです' })
    .optional()
    .nullable(),
  mem: z.string().max(200, { message: '200文字以内で入力してください' }).nullish(),
  dspFlg: z.boolean().optional(),
});

export type LocsMasterDialogValues = z.infer<typeof LocsMasterDialogSchema>;

export type LocsMasterTableValues = {
  adrShozai: string | null;
  adrSonota: string | null;
  adrTatemono: string | null;
  delFlg: boolean | null;
  dspFlg: boolean | null;
  tblDspId: number;
  fax: string | null;
  locId: number;
  locNam: string;
  mem: string | null;
  tel: string | null;
};

/* 検索用スキーマ */
export const LocsMasterSearchSchema = z.object({
  query: z.string().optional(),
});
export type LocsMasterSearchValues = z.infer<typeof LocsMasterSearchSchema>;
