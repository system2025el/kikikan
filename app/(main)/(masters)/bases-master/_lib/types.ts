import { z } from 'zod';

const basesMasterSchema = z.object({
  kyotenId: z.number().optional(),
  kyotenNam: z.string(),
  delFlg: z.boolean().optional(),
  mem: z.string().optional(),
  dspFlg: z.boolean().optional(),
  dspOrdNum: z.number().optional(),
  addDat: z.date(),
  addUser: z.string(),
  updDat: z.date(),
  updUser: z.string(),
});

export const BasesMasterTableSchema = basesMasterSchema.omit({
  dspOrdNum: true,
  addDat: true,
  addUser: true,
  updDat: true,
  updUser: true,
  dspFlg: true,
});

export type BasesMasterTableValues = z.infer<typeof BasesMasterTableSchema>;

export const BasesMasterDialogSchema = basesMasterSchema.omit({
  //DB   kyotenId: true,
  dspOrdNum: true,
  addDat: true,
  addUser: true,
  updDat: true,
  updUser: true,
  dspFlg: true,
});

export type BasesMasterDialogValues = z.infer<typeof BasesMasterDialogSchema>;

// export type BasesMasterValues = { kyotenId: number; kyotenNam: string; dspOrdNum: number };
/**モック削除delete */
export const basesList: BasesMasterDialogValues[] = [
  {
    kyotenNam: 'KICS',
    mem: '川崎',
    kyotenId: 1,
    delFlg: false,
  },
  {
    kyotenNam: 'YARD',
    mem: '大和',
    kyotenId: 2,
    delFlg: false,
  },
  {
    kyotenNam: 'その他',
    mem: '厚木など',
    kyotenId: 3,
    delFlg: false,
  },
  //   {
  //     kyotenId: 3,
  //     kyotenNam: 'その他',
  //     dspOrdNum: 3,
  //     mem: '厚木など',
  //     addDat: new Date(),
  //     addUser: '',
  //     updDat: new Date(''),
  //     updUser: '',
  //   },
];
/* 拠点マスタテーブルヘッダー */
export const bMHeader = [
  { key: 'kyotenNam', label: '名称' },
  { key: 'mem', label: 'メモ' },
  { key: 'up', label: '' },
  { key: 'down', label: '' },
  { key: 'description', label: '' },
];
