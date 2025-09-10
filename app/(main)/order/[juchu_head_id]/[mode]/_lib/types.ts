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
