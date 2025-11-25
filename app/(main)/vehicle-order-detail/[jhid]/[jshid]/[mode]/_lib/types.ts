import z from 'zod';

import { validationMessages } from '../../../../../_lib/validation-messages';

export const JuchuSharyoHeadSchema = z.object({
  juchuHeadId: z.number(),
  juchuShryoHeadId: z.number(),
  headNam: z
    .string({ message: validationMessages.required() })
    .min(1, { message: validationMessages.required() })
    .max(20, { message: validationMessages.maxStringLength(20) }),
  nyushukoKbn: z.number(),
  nyushukoDat: z.date({ message: validationMessages.required() }),
  nyushukoBashoId: z.number(),
  headMem: z.string().nullable(),
  meisai: z.object({
    v1Id: z.number().nullable(),
    v1Qty: z.number(),
    v1Mem: z.string().nullable(),
    v2Id: z.number().nullable(),
    v2Qty: z.number(),
    v2Mem: z.string().nullable(),
  }),
});

export type JuchuSharyoHeadValues = z.infer<typeof JuchuSharyoHeadSchema>;
