import { z } from 'zod';

export const customerMaterDialogDetailsSchema = z.object({
  kokyakuId: z.number(),
  kokyakuNam: z.string(),
  kana: z.string(),
  kokyakuRank: z.number(),
  delFlg: z.number().optional(),
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
  dspFlg: z.number().optional(),
  closeDay: z.number().optional(),
  siteDay: z.number().optional(),
  kizaiNebikiFlg: z.number().optional(),
});
export type customerMasterDialogDetailsValues = z.infer<typeof customerMaterDialogDetailsSchema>;

export const cMHeader = [
  {
    id: 'check',
    label: '',
  },
  {
    id: 'custName',
    label: '顧客名',
  },
  {
    id: 'address',
    label: '住所',
  },
  {
    id: 'tel',
    label: 'TEL',
  },
  {
    id: 'fax',
    label: 'FAX',
  },
  {
    id: 'memo',
    label: 'メモ',
  },
];

export const customerMasterTableSchema = z.object({
  kokyakuId: z.number(),
  kokyakuNam: z.string().optional(),
  adrShozai: z.string().optional(),
  adrTatemono: z.string().optional(),
  adrSonota: z.string().optional(),
  tel: z.string().optional(),
  fax: z.string().optional(),
  mem: z.string().optional(),
});
export type CustomerMasterTableValues = z.infer<typeof customerMasterTableSchema>;
