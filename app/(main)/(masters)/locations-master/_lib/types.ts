import { z } from 'zod';

export const LocsMasterDialogSchema = z.object({
  locNam: z.string().max(100, { message: '100文字以内で入力してください' }).min(1, { message: '必須項目です' }),
  kana: z.string().max(100, { message: '100文字以内で入力してください' }).min(1, { message: '必須項目です' }),
  delFlg: z.boolean().optional(),
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
    .refine((val) => val === '' || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val), { message: '無効なメールアドレスです' })
    .optional(),
  mem: z.string().max(200, { message: '200文字以内で入力してください' }).optional(),
  dspFlg: z.boolean().optional(),
});

export type LocsMasterDialogValues = z.infer<typeof LocsMasterDialogSchema>;

export type LocsMasterTableValues = {
  locId: number;
  locNam: string;
  adrShozai: string;
  adrTatemono: string;
  adrSonota: string;
  tel: string;
  fax: string;
  mem: string;
  dspFlg: boolean;
  tblDspId: number;
  delFlg: boolean;
};

/* 検索用スキーマ */
export const LocsMasterSearchSchema = z.object({
  query: z.string().optional(),
});
export type LocsMasterSearchValues = z.infer<typeof LocsMasterSearchSchema>;
