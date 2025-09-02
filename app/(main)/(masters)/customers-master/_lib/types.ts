import { z } from 'zod';

export const CustomersMaterDialogSchema = z.object({
  kokyakuNam: z.string().max(100, { message: '100文字以内で入力してください' }).min(1, { message: '必須項目です' }),
  kana: z.string().max(100, { message: '100文字以内で入力してください' }).min(1, { message: '必須項目です' }),
  kokyakuRank: z.number({ message: '数字を入力してください' }),
  delFlg: z.boolean().optional(),
  keisho: z.string().max(10, { message: '10文字以内で入力してください' }).optional().nullable(),
  adrPost: z.string().max(20, { message: '20文字以内で入力してください' }).optional().nullable(),
  adrShozai: z.string().max(100, { message: '100文字以内で入力してください' }).optional().nullable(),
  adrTatemono: z.string().max(100, { message: '100文字以内で入力してください' }).optional().nullable(),
  adrSonota: z.string().max(100, { message: '100文字以内で入力してください' }).optional().nullable(),
  tel: z.string().max(20, { message: '20文字以内で入力してください' }).optional().nullable(),
  telMobile: z.string().max(20, { message: '20文字以内で入力してください' }).optional().nullable(),
  fax: z.string().max(20, { message: '20文字以内で入力してください' }).optional().nullable(),
  mail: z.string().max(100, { message: '100文字以内で入力してください' }).optional().nullable(),
  mem: z.string().max(200, { message: '200文字以内で入力してください' }).optional().nullable(),
  dspFlg: z.boolean().optional(),
  closeDay: z.number({ message: '数字を入力してください' }).nullable(),
  siteDay: z.number({ message: '数字を入力してください' }).nullable(),
  kizaiNebikiFlg: z.boolean().optional(),
});
export type CustomersMasterDialogValues = z.infer<typeof CustomersMaterDialogSchema>;

export type CustomersMasterTableValues = {
  adrShozai: string | null;
  adrSonota: string | null;
  adrTatemono: string | null;
  delFlg?: boolean | null;
  dspFlg: boolean | null;
  tblDspId: number;
  fax: string | null;
  kokyakuId: number;
  kokyakuNam: string;
  mem: string | null;
  tel: string | null;
};
