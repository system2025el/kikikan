import { z } from 'zod';

import { validationMessages } from '@/app/(main)/_lib/validation-messages';

export const KokyakuSchema = z.object({
  kokyakuId: z.number({ message: validationMessages.required() }),
  kokyakuNam: z
    .string({ message: validationMessages.required() })
    .min(1, { message: validationMessages.required() })
    .max(20, { message: validationMessages.maxStringLength(20) }),
  kokyakuRank: z.number(),
});

export type KokyakuValues = z.infer<typeof KokyakuSchema>;

export const OrderSchema = z.object({
  juchuHeadId: z.number(),
  delFlg: z.number(),
  juchuSts: z.number(),
  juchuDat: z.date({ message: validationMessages.required() }),
  juchuRange: z.tuple([z.date(), z.date()]).nullable(),
  nyuryokuUser: z.string({ message: validationMessages.required() }).min(1, { message: validationMessages.required() }),
  koenNam: z
    .string({ message: validationMessages.required() })
    .min(1, { message: validationMessages.required() })
    .max(40, { message: validationMessages.maxStringLength(40) }),
  koenbashoNam: z
    .string()
    .max(40, { message: validationMessages.maxStringLength(40) })
    .nullable(),
  kokyaku: KokyakuSchema,
  kokyakuTantoNam: z
    .string()
    .max(16, { message: validationMessages.maxStringLength(16) })
    .nullable(),
  mem: z.string().nullable(),
  nebikiAmt: z
    .string()
    .max(8, { message: validationMessages.maxNumberLength(8) })
    .nullable(),
  zeiKbn: z.number(),
});

export type OrderValues = z.infer<typeof OrderSchema>;

export type EqTableValues = {
  juchuHeadId: number;
  juchuKizaiHeadId: number;
  headNam: string;
  sagyoStaNam: string;
  shukoDat: string | null;
  nyukoDat: string | null;
  sikomibi: number | null;
  rihabi: number | null;
  genebi: number | null;
  honbanbi: number | null;
  juchuHonbanbiCalcQty: number | null;
  shokei: number | null;
  nebikiAmt: number | null;
  keikoku: string | null;
  oyaJuchuKizaiHeadId: number | null;
  htKbn: number;
  juchuKizaiHeadKbn: number;
};

export type VehicleTableValues = {
  juchuHeadId: number;
  juchuSharyoHeadId: number;
  headNam: string;
  kbn: string;
  dat: Date;
  mem: string;
};

export type CustomersDialogValues = {
  kokyakuId: number;
  kokyakuNam: string;
  kokyakuRank: number;
  adrShozai: string;
  adrTatemono: string;
  adrSonota: string;
  tel: string;
  fax: string;
  mem: string;
  dspFlg: boolean;
  tblDspId: number;
  delFlg?: boolean;
};

export type LocsDialogValues = {
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
