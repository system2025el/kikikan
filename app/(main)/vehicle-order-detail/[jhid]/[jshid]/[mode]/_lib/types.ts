import z from 'zod';

import { FAKE_NEW_ID } from '@/app/(main)/(masters)/_lib/constants';

import { validationMessages } from '../../../../../_lib/validation-messages';

/**
 * 受注車両ヘッダ入力フォームのスキーマ
 */
export const JuchuSharyoHeadSchema = z
  .object({
    juchuHeadId: z.number(),
    juchuShryoHeadId: z.number(),
    headNam: z
      .string({ message: validationMessages.required() })
      .min(1, { message: validationMessages.required() })
      .max(20, { message: validationMessages.maxStringLength(20) }),
    nyushukoKbn: z
      .number({ message: validationMessages.required() })
      .min(0, { message: validationMessages.required() }),
    nyushukoDat: z
      .date({ message: validationMessages.required() })
      .nullable()
      .refine((dat) => dat, { message: validationMessages.required() }),
    nyushukoBashoId: z
      .number({ message: validationMessages.required() })
      .min(0, { message: validationMessages.required() }),
    headMem: z.string().nullable(),
    meisai: z.array(
      z
        .object({
          sharyoId: z.number().nullable(),
          sharyoQty: z
            .number({ message: validationMessages.number() })
            .int({ message: validationMessages.int() })
            .nullable(),
          sharyoMem: z.string().nullable(),
        })
        .superRefine((data, ctx) => {
          if (data.sharyoQty && data.sharyoQty > 0 && (!data.sharyoId || data.sharyoId < 0)) {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              message: '車両を選択してください',
              path: ['sharyoId'],
            });
          }
          if (data.sharyoId && data.sharyoId > 0 && (!data.sharyoQty || data.sharyoQty <= 0)) {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              message: '必須',
              path: ['sharyoQty'],
            });
          }
        })
    ),
  })
  .refine(
    (args) => {
      const { meisai } = args;
      const validItems = meisai.filter(
        (item) => item.sharyoQty && item.sharyoQty > 0 && item.sharyoId && item.sharyoId > 0
      );
      return validItems.length > 0;
    },
    { message: '最低1台登録してください', path: ['meisai'] }
  );
// .refine((data) => data.meisai.v1Id && data.meisai.v1Id > 0, {
//   message: '入力してください',
//   path: ['meisai.v1Id'],
// })
// .refine((data) => data.nyushukoDat, {
//   message: '必須項目です',
//   path: ['nyushukoDat'],
// });

/**
 * 受注車両ヘッダ入力フォームの型
 */
export type JuchuSharyoHeadValues = z.infer<typeof JuchuSharyoHeadSchema>;

// /**
//  * 受注車両のテーブル表示用の型 後で移動move削除delete
//  */
// export type JuchuSharyoHeadTableValues = {
//   sharyoHeadId: number;
//   sharyoHeadNam: string;
//   basho: string | null;
//   shubetsuId: number;
//   shubetuNam: string;
//   nyushukoDat: string;
//   headMem: string | null;
// };
