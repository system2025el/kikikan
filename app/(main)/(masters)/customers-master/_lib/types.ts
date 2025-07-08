import { z } from 'zod';

export const customerMaterDialogDetailsSchema = z.object({
  kokyakuId: z.number().optional(),
  kokyakuNam: z.string(),
  kana: z.string(),
  kokyakuRank: z.number(),
  delFlg: z.boolean().optional(),
  dspOrder: z.number().optional(),
  keisho: z.string().optional(),
  adrPost: z.string().optional(),
  adrShozai: z.string().optional(),
  adrTatemono: z.string().optional(),
  adrSonota: z.string().optional(),
  tel: z.string().optional(),
  telMobile: z.string().optional(),
  fax: z.string().optional(),
  mail: z.string().optional(),
  mem: z.string().optional(),
  dspFlg: z.boolean().optional(),
  closeDay: z.number().optional(),
  siteDay: z.number().optional(),
  kizaiNebikiFlg: z.boolean().optional(),
});
export type customerMasterDialogDetailsValues = z.infer<typeof customerMaterDialogDetailsSchema>;

export const CustomerMasterTableSchema = z.object({
  kokyakuId: z.number(),
  kokyakuNam: z.string().optional(),
  adrShozai: z.string().optional(),
  adrTatemono: z.string().optional(),
  adrSonota: z.string().optional(),
  tel: z.string().optional(),
  fax: z.string().optional(),
  mem: z.string().optional(),
  delFlg: z.boolean().optional(),
});
export type CustomerMasterTableValues = z.infer<typeof CustomerMasterTableSchema>;
