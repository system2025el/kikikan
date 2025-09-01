import { z } from 'zod';

export const KokyakuSchema = z.object({
  kokyakuId: z.number({ message: '相手は必須です' }),
  kokyakuNam: z.string({ message: '相手は必須です' }).min(1, { message: '相手は必須です' }),
  kokyakuRank: z.number(),
});

export type KokyakuValues = z.infer<typeof KokyakuSchema>;

export const OrderSchema = z.object({
  juchuHeadId: z.number(),
  delFlg: z.number(),
  juchuSts: z.number(),
  juchuDat: z.date({ message: '受注日は必須です' }),
  juchuRange: z.tuple([z.date(), z.date()]).nullable(),
  nyuryokuUser: z.string({ message: '入力者は必須です' }).min(1, { message: '入力者は必須です' }),
  koenNam: z.string({ message: '公演名は必須です' }).min(1, { message: '公演名は必須です' }),
  koenbashoNam: z.string().nullable(),
  kokyaku: KokyakuSchema,
  kokyakuTantoNam: z.string().nullable(),
  mem: z.string().nullable(),
  nebikiAmt: z.number().nullable(),
  zeiKbn: z.number(),
});

export type OrderValues = z.infer<typeof OrderSchema>;

export type EqTableValues = {
  juchuHeadId: number;
  juchuKizaiHeadId: number;
  headNam: string;
  sagyoStaNam: string;
  shukoDat: Date;
  nyukoDat: Date;
  sikomibi: number;
  rihabi: number;
  genebi: number;
  honbanbi: number;
  juchuHonbanbiCalcQty: number;
  shokei: number;
  keikoku: string;
  oyaJuchuKizaiHeadId: number;
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
