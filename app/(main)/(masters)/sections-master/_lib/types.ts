import { z } from 'zod';

import { validationMessages } from '@/app/(main)/_lib/validation-messages';

/**
 * 課マスタ詳細フォームのスキーマ
 */
export const SectionsMasterDialogSchema = z.object({
  sectionNam: z
    .string()
    .max(100, { message: validationMessages.maxStringLength(100) })
    .min(1, { message: validationMessages.required() }),
  sectionNamShort: z
    .string()
    .max(100, { message: validationMessages.maxStringLength(100) })
    .min(1, { message: validationMessages.required() }),
  delFlg: z.boolean().optional(),
  mem: z
    .string()
    .max(200, { message: validationMessages.maxStringLength(200) })
    .nullish(),
  daisectionId: z.number().int().nullish(),
  shukeisectionId: z.number().int().nullish(),
});

/**
 * 課マスタ詳細フォームのタイプ
 */
export type SectionsMasterDialogValues = z.infer<typeof SectionsMasterDialogSchema>;

/**
 * 課マスタ一覧テーブルのタイプ
 */
export type SectionsMasterTableValues = {
  sectionId: number;
  sectionNam: string;
  sectionNamShort: string;
  delFlg: boolean | null;
  mem: string | null;
  tblDspId: number;
};
