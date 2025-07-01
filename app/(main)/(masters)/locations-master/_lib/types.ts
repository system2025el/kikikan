import { z } from 'zod';

export const LocMasterSchema = z.object({
  locId: z.number().optional(),
  locNam: z.string(),
  kana: z.string(),
  delFlg: z.number().optional(),
  dspOrder: z.number().optional(),
  adrPost: z.string().optional(),
  adrShozai: z.string().optional(),
  adrTatemono: z.string().optional(),
  adrSonota: z.string().optional(),
  tel: z.string().optional(),
  telMobile: z.string().optional(),
  fax: z.string().optional(),
  mail: z.string().email().optional(),
  mem: z.string().optional(),
  dspFlg: z.number().optional(),
  addDate: z.date().optional(),
  addUser: z.string().optional(),
  apdDate: z.date().optional(),
  updUser: z.string().optional(),
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
/**
 * 場所マスタテーブルヘッダー
 */
export const lMHeader = [
  { key: 'check', label: '' },
  { key: 'locNam', label: '場所' },
  { key: 'address', label: '住所' },
  { key: 'tel', label: 'Tel' },
  { key: 'fax', label: 'Fax' },
  { key: 'up', label: '' },
  { key: 'down', label: '' },
];
/**モック削除delete */
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
