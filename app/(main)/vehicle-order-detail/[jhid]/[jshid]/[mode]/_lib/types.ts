import z from 'zod';

import { validationMessages } from '../../../../../_lib/validation-messages';

/**
 * 受注車両ヘッダ入力フォームのスキーマ
 */
export const JuchuSharyoHeadSchema = z.object({
  juchuHeadId: z.number(),
  juchuShryoHeadId: z.number(),
  headNam: z
    .string({ message: validationMessages.required() })
    .min(1, { message: validationMessages.required() })
    .max(20, { message: validationMessages.maxStringLength(20) }),
  nyushukoKbn: z.number(),
  nyushukoDat: z.date({ message: validationMessages.required() }).nullable(),
  nyushukoBashoId: z.number().min(0),
  headMem: z.string().nullable(),
  meisai: z.array(
    z.object({
      sharyoId: z.number().nullable(),
      sharyoQty: z
        .number({ message: validationMessages.number() })
        .int({ message: validationMessages.int() })
        .nullable(),
      sharyoMem: z.string().nullable(),
    })
  ),
});
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
