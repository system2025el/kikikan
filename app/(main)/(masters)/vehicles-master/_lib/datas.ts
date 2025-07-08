import { FormItemsType } from '@/app/(main)/_ui/form-box';

import { VehsMasterDialogValues, VehsMasterTableValues } from './types';
/**
 * 車両マスタテーブルのヘッダー
 */
export const vMHeader = [
  { key: 'name', label: '車両タイプ' },
  { key: 'mem', label: 'メモ' },
];

/*  */
export const formItems: FormItemsType[] = [
  {
    label: '車両名',
    exsample: '例）ハイエース',
    constraints: '100文字まで',
  },
  {
    label: '削除フラグ',
    exsample: '',
    constraints: '論理削除（データは物理削除されません）',
  },
  {
    label: 'メモ',
    exsample: '',
    constraints: '200文字まで',
  },
  {
    label: '表示フラグ',
    exsample: '',
    constraints: '選択リストへの表示',
  },
];

/*  */
export const emptyVeh: VehsMasterDialogValues = {
  sharyoNam: '',
};

/* 削除モックdelete */
export const vehicles: VehsMasterTableValues[] = [
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
