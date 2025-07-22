import { FormItemsType } from '@/app/(main)/_ui/form-box';

import { VehsMasterDialogValues, VehsMasterTableValues } from './types';
/**
 * 車両マスタテーブルのヘッダー
 */
export const vMHeader = [
  { key: 'name', label: '車両タイプ' },
  { key: 'mem', label: 'メモ' },
  { key: 'hidden', label: '非表示' },
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
  delFlg: false,
  mem: '',
  dspFlg: true,
};

/* 削除モックdelete */
export const vehicles: VehsMasterTableValues[] = [
  {
    sharyoId: 1,
    sharyoNam: '不明',
    mem: '',
    dspFlg: true,
    dspOrdNum: 0,
  },
  {
    sharyoId: 2,
    sharyoNam: '1t',
    mem: '',
    dspFlg: true,
    dspOrdNum: 0,
  },
  {
    sharyoId: 3,
    sharyoNam: '2t',
    mem: '',
    dspFlg: true,
    dspOrdNum: 0,
  },
  {
    sharyoId: 4,
    sharyoNam: '3t',
    mem: '',
    dspFlg: true,
    dspOrdNum: 0,
  },
  {
    sharyoId: 5,
    sharyoNam: '4t',
    mem: '',
    dspFlg: true,
    dspOrdNum: 0,
  },
  {
    sharyoId: 6,
    sharyoNam: '11t',
    mem: '',
    dspFlg: true,
    dspOrdNum: 0,
  },
  {
    sharyoId: 7,
    sharyoNam: 'ハイエース',
    mem: '',
    dspFlg: true,
    dspOrdNum: 0,
  },
];
