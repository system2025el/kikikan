import { z } from 'zod';

import { zodNumberText } from '../../_lib/membs';

export const CustomersMaterDialogSchema = z.object({
  kokyakuNam: z.string().max(100, { message: '100文字以内で入力してください' }).min(1, { message: '必須項目です' }),
  kana: z.string().max(100, { message: '100文字以内で入力してください' }).min(1, { message: '必須項目です' }),
  kokyakuRank: z.number({ message: '数字を入力してください' }),
  delFlg: z.boolean().optional(),
  keisho: z.string().max(10, { message: '10文字以内で入力してください' }).optional(),
  adrPost: z.string().max(20, { message: '20文字以内で入力してください' }).optional(),
  adrShozai: z.string().max(100, { message: '100文字以内で入力してください' }).optional(),
  adrTatemono: z.string().max(100, { message: '100文字以内で入力してください' }).optional(),
  adrSonota: z.string().max(100, { message: '100文字以内で入力してください' }).optional(),
  tel: z.string().max(20, { message: '20文字以内で入力してください' }).optional(),
  telMobile: z.string().max(20, { message: '20文字以内で入力してください' }).optional(),
  fax: z.string().max(20, { message: '20文字以内で入力してください' }).optional(),
  mail: z.string().max(100, { message: '100文字以内で入力してください' }).optional(),
  mem: z.string().max(200, { message: '200文字以内で入力してください' }).optional(),
  dspFlg: z.boolean().optional(),
  closeDay: zodNumberText,
  siteDay: zodNumberText,
  kizaiNebikiFlg: z.boolean().optional(),
});
export type CustomersMasterDialogValues = z.infer<typeof CustomersMaterDialogSchema>;

export type CustomersMasterTableValues = {
  kokyakuId: number;
  kokyakuNam: string;
  adrShozai: string;
  adrTatemono: string;
  adrSonota: string;
  tel: string;
  fax: string;
  mem: string;
  dspFlg: boolean;
  tblDspId: number;
  delFlg?: boolean; // 受注画面のために？つけてるけどいらないのでは
};
