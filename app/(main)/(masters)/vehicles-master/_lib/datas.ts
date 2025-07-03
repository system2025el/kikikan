import z from 'zod';
/**
 * 車両マスタテーブルのヘッダー
 */
export const vMHeader = [
  { key: 'name', label: '車両タイプ' },
  { key: 'mem', label: 'メモ' },
  { key: 'up', label: '' },
  { key: 'down', label: '' },
];

/**---------車両データ------------ */
export const VehMasterTableSchema = z.object({
  sharyoId: z.number(),
  sharyoNam: z.string(),
  delFlg: z.boolean(),
  mem: z.string(),
  dspFlg: z.boolean(),
});

export type VehMasterTableValues = z.infer<typeof VehMasterTableSchema>;

const vehMasterDialogSchema = z.object({
  sharyoId: z.number(),
  sharyoNam: z.string(),
  delFlg: z.boolean().optional(),
  mem: z.string().optional(),
  dspFlg: z.boolean().optional(),
  dspOrderNum: z.number().optional(),
  addDate: z.date(),
  addUser: z.string(),
  updDate: z.date(),
  updUser: z.string(),
});

export const VehMasterDialogSchema = vehMasterDialogSchema.omit({
  sharyoId: true,
  dspOrderNum: true,
  addDate: true,
  addUser: true,
  updDate: true,
  updUser: true,
});

export type VehAllValues = z.infer<typeof vehMasterDialogSchema>;
export type VehMasterDialogValues = z.infer<typeof VehMasterDialogSchema>;

type VehicleData = {
  sharyoId: number;
  sharyoNam: string;
  delFlg: boolean;
  mem: string;
  dspFlg: boolean;
};

/* 削除モックdelete */
export const vehicles: VehicleData[] = [
  {
    sharyoId: 1,
    sharyoNam: '不明',
    delFlg: true,
    mem: '',
    dspFlg: true,
  },
  {
    sharyoId: 2,
    sharyoNam: '1t',
    delFlg: false,
    mem: '',
    dspFlg: true,
  },
  {
    sharyoId: 3,
    sharyoNam: '2t',
    delFlg: false,
    mem: '',
    dspFlg: true,
  },
  {
    sharyoId: 4,
    sharyoNam: '3t',
    delFlg: false,
    mem: '',
    dspFlg: true,
  },
  {
    sharyoId: 5,
    sharyoNam: '4t',
    delFlg: false,
    mem: '',
    dspFlg: true,
  },
  {
    sharyoId: 6,
    sharyoNam: '11t',
    delFlg: false,
    mem: '',
    dspFlg: true,
  },
  {
    sharyoId: 7,
    sharyoNam: 'ハイエース',
    delFlg: false,
    mem: '',
    dspFlg: true,
  },
];
