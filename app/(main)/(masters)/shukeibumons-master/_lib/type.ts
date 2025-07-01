import { z } from 'zod';

const shukeibumonsMasterSchema = z.object({
  shukeibumonId: z.number().optional(),
  shukeibumonNam: z.string(),
  delFlg: z.boolean().optional(),
  mem: z.string().optional(),
  dspFlg: z.boolean().optional(),
  dspOrdNum: z.number().optional(),
  addDat: z.date(),
  addUser: z.string(),
  updDat: z.date(),
  updUser: z.string(),
});

export const ShukeibumonsMasterTableSchema = shukeibumonsMasterSchema.omit({
  dspOrdNum: true,
  addDat: true,
  addUser: true,
  updDat: true,
  updUser: true,
  dspFlg: true,
});

export type ShukeibumonsMasterTableValues = z.infer<typeof ShukeibumonsMasterTableSchema>;

export const ShukeibumonsMasterDialogSchema = ShukeibumonsMasterTableSchema.omit({
  //DB   shukeibumonId: true,
});

export type ShukeibumonsMasterDialogValues = z.infer<typeof ShukeibumonsMasterDialogSchema>;

// export type ShukeibumonsMasterValues = { shukeibumonId: number; shukeibumonNam: string; dspOrdNum: number };
/*モック削除delete */
export const shukeibumonsList: ShukeibumonsMasterDialogValues[] = [
  {
    shukeibumonId: 1,
    shukeibumonNam: '照明部',
    mem: 'XXXXXXXXXXX',
    delFlg: false,
  },
  {
    shukeibumonId: 2,
    shukeibumonNam: 'L課（Control）',
    mem: 'XXXXXXXX',
    delFlg: false,
  },
  {
    shukeibumonNam: 'L課（SPOT）',
    mem: 'XXXXXXX',
    shukeibumonId: 3,
    delFlg: false,
  },
];
/**
 * 集計部門マスタテーブルヘッダー
 */
export const shukeibumonMHeader = [
  { key: 'shukeibumonNam', label: '名称' },
  { key: 'mem', label: 'メモ' },
  { key: 'up', label: '' },
  { key: 'down', label: '' },
  { key: 'description', label: '' },
];
