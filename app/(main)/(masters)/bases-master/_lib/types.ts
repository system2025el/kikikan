import { z } from 'zod';

import { BasesMasterDialog } from '../_ui/bases-master-dailog';

const basesMasterSChema = z.object({
  kyotenId: z.number().optional(),
  kyotenNam: z.string(),
  delFlg: z.boolean().optional(),
  mem: z.string().optional(),
  dspFlg: z.boolean().optional(),
  dspOrdNum: z.number().optional(),
  addDate: z.date(),
  addUser: z.string(),
  updDate: z.date(),
  updUser: z.string(),
});

export const BaseMasterTableSchema = basesMasterSChema.omit({
  dspOrdNum: true,
  addDate: true,
  addUser: true,
  updDate: true,
  updUser: true,
  dspFlg: true,
});

export type BaseMasterTableValues = z.infer<typeof BaseMasterTableSchema>;

export const BaseMasterDialogSchema = basesMasterSChema.omit({
  //DB   kyotenId: true,
  dspOrdNum: true,
  addDate: true,
  addUser: true,
  updDate: true,
  updUser: true,
  dspFlg: true,
});

export type BaseMasterDialogValues = z.infer<typeof BaseMasterDialogSchema>;

// export type BasesMasterValues = { kyotenId: number; kyotenNam: string; dspOrdNum: number };
export type BasesMasterValues = z.infer<typeof BaseMasterDialogSchema>;

export const basesList: BaseMasterDialogValues[] = [
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
  //     addDate: new Date(),
  //     addUser: '',
  //     updDate: new Date(''),
  //     updUser: '',
  //   },
];

export const bMHeader = [
  { key: 'kyotenNam', label: '名称' },
  { key: 'mem', label: 'メモ' },
  { key: 'up', label: '' },
  { key: 'down', label: '' },
  { key: 'description', label: '' },
];
