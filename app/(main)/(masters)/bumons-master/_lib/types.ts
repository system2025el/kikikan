import { z } from 'zod';

const bumonsMasterSchema = z.object({
  bumonId: z.number(),
  bumonNam: z.string(),
  delFlg: z.boolean().optional(),
  dspOrdNum: z.number().optional(),
  mem: z.string().max(200, '200文字以内で入力してくださいTEST。').optional(),
  daibumonId: z.number().optional(),
  shukeibumonId: z.number().optional(),
  addDat: z.date(),
  addUser: z.string(),
  updDat: z.date(),
  updUser: z.string(),
});

export const BumonsMasterTableSchema = bumonsMasterSchema.omit({
  dspOrdNum: true,
  addDat: true,
  addUser: true,
  updDat: true,
  updUser: true,
});

export type BumonsMasterTableValues = z.infer<typeof BumonsMasterTableSchema>;

export const BumonsMasterDialogSchema = BumonsMasterTableSchema.omit({
  //DB   kyotenId: true,
});

export type BumonsMasterDialogValues = z.infer<typeof BumonsMasterDialogSchema>;

/*モック削除delete */
export const bumonsList: BumonsMasterDialogValues[] = [
  {
    bumonId: 1,
    bumonNam: 'ムービングライト',
    delFlg: false,
    mem: 'あえいうえおあおかけきくけこかこ',
    daibumonId: 1,
    shukeibumonId: 1,
  },
  {
    bumonId: 2,
    bumonNam: 'スポットライト',
    delFlg: false,
    mem: '',
    daibumonId: 1,
    shukeibumonId: 1,
  },
  {
    bumonId: 3,
    bumonNam: 'その他',
    delFlg: true,
    mem: '',
    daibumonId: 2,
    shukeibumonId: 2,
  },
];
/* 部門マスタテーブルヘッダー */
export const BumonsMHeader = [
  { key: 'name', label: '名称' },
  { key: 'mem', label: 'メモ' },
];
