import { z } from 'zod';

import { validationMessages } from '@/app/(main)/_lib/validation-messages';

/**
 * 一式マスタダイアログのフォームスキーマ
 */
export const IsshikisMasterDialogSchema = z.object({
  isshikiNam: z
    .string()
    .max(100, { message: validationMessages.maxStringLength(100) })
    .min(1, { message: validationMessages.required() }),
  regAmt: z
    .number({ message: validationMessages.number() })
    .int({ message: validationMessages.int() })
    .max(9999999999, { message: validationMessages.maxNumberLength(10) })
    .nullish(),
  delFlg: z.boolean().optional(),
  mem: z
    .string()
    .max(200, { message: validationMessages.maxStringLength(200) })
    .nullish(),
  kizaiList: z.array(z.object({ id: z.number(), nam: z.string() })),
});

/**
 * 一式マスタダイアログのフォームの型
 */
export type IsshikisMasterDialogValues = z.infer<typeof IsshikisMasterDialogSchema>;

/**
 * 一式マスタ一覧テーブルの型
 */
export type IsshikisMasterTableValues = {
  isshikiId: number;
  isshikiNam: string;
  regAmt: number | null;
  delFlg: boolean | null;
  mem: string | null;
  tblDspId: number;
};
