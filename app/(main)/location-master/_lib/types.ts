import { z } from 'zod';

export const LocMasterSchema = z.object({
  locId: z.number(),
  locNam: z.string(),
  kana: z.string(),
  delFlg: z.number(),
  dspOrder: z.number(),
  adrPost: z.string(),
  adrShozai: z.string(),
  adrTatemono: z.string(),
  adrSonota: z.string(),
  tel: z.string(),
  telMobile: z.string(),
  fax: z.string(),
  mail: z.string().email(),
  mem: z.string(),
  dspFlg: z.number(),
  addDate: z.date(),
  addUser: z.string(),
  apdDate: z.date(),
  updUser: z.string(),
});

export type LocMasterValues = z.infer<typeof LocMasterSchema>;

export const LocMasterTableSchema = z.object({
  locId: z.number(),
  locNam: z.string(),
  dspOrder: z.number(),
  adrShozai: z.string(),
  adrTatemono: z.string(),
  adrSonota: z.string(),
  tel: z.string(),
  fax: z.string(),
  mem: z.string(),
});

export type LocMasterTableValues = z.infer<typeof LocMasterTableSchema>;

/** 場所マスタデータ */

export const lMHeader = [
  { key: 'check', label: '' },
  { key: 'locNam', label: '場所' },
  { key: 'address', label: '住所' },
  { key: 'tel', label: 'Tel' },
  { key: 'fax', label: 'Fax' },
  { key: 'up', label: '' },
  { key: 'down', label: '' },
];

export const locationList: LocMasterTableValues[] = [
  {
    locNam: '日比谷音楽堂',
    tel: '000-000-0000',
    fax: '000-111-2222',
    locId: 1,
    dspOrder: 0,
    adrShozai: '東京都千代田区日比谷公園',
    adrTatemono: '',
    adrSonota: '１－５',
    mem: 'ばばばばばばっばばばばっばばばばば',
  },
  {
    locNam: '日本武道館',
    tel: '',
    fax: '',
    locId: 2,
    dspOrder: 0,
    adrShozai: '',
    adrTatemono: '',
    adrSonota: '',
    mem: '',
  },
  {
    locNam: 'ＮＨＫホール',
    tel: '',
    fax: '',
    locId: 3,
    dspOrder: 0,
    adrShozai: '',
    adrTatemono: '',
    adrSonota: '',
    mem: '',
  },
  {
    locNam: '東京厚生年金会館ホール',
    tel: '',
    fax: '',
    locId: 4,
    dspOrder: 0,
    adrShozai: '',
    adrTatemono: '',
    adrSonota: '',
    mem: '',
  },
  {
    locNam: '中野サンプラザ',
    tel: '',
    fax: '',
    locId: 5,
    dspOrder: 0,
    adrShozai: '',
    adrTatemono: '',
    adrSonota: '',
    mem: '',
  },
  {
    locNam: '渋谷公会堂',
    tel: '',
    fax: '',
    locId: 6,
    dspOrder: 0,
    adrShozai: '',
    adrTatemono: '',
    adrSonota: '',
    mem: '',
  },
];
