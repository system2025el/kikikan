import { z } from 'zod';

const daibumonsMasterSchema = z.object({
  daibumonId: z.number().optional(),
  daibumonNam: z.string(),
  delFlg: z.boolean().optional(),
  mem: z.string().optional(),
  dspFlg: z.boolean().optional(),
  dspOrdNum: z.number().optional(),
  addDat: z.date(),
  addUser: z.string(),
  updDat: z.date(),
  updUser: z.string(),
});

export const DaibumonsMasterTableSchema = daibumonsMasterSchema.omit({
  dspOrdNum: true,
  addDat: true,
  addUser: true,
  updDat: true,
  updUser: true,
  dspFlg: true,
});

export type DaibumonsMasterTableValues = z.infer<typeof DaibumonsMasterTableSchema>;

export const DaibumonsMasterDialogSchema = DaibumonsMasterTableSchema.omit({
  //DB   daibumonId: true,
});

export type DaibumonsMasterDialogValues = z.infer<typeof DaibumonsMasterDialogSchema>;

// export type daibumonsMasterValues = { daibumonId: number; daibumonNam: string; dspOrdNum: number };

export const daibumonsList: DaibumonsMasterDialogValues[] = [
  {
    daibumonId: 1,
    daibumonNam: '照明',
    mem: 'XXXXXXXXXXX',
    delFlg: false,
  },
  {
    daibumonId: 2,
    daibumonNam: 'Moving Light',
    mem: 'XXXXXXXX',
    delFlg: false,
  },
  {
    daibumonNam: 'ムービング ゴボ',
    mem: 'XXXXXXX',
    daibumonId: 3,
    delFlg: false,
  },
  {
    daibumonNam: '空（カラ）ケース',
    daibumonId: 4,
    mem: '',
    delFlg: false,
  },
];

export const daibumonMHeader = [
  { key: 'daibumonNam', label: '名称' },
  { key: 'mem', label: 'メモ' },
  { key: 'up', label: '' },
  { key: 'down', label: '' },
  { key: 'description', label: '' },
];
