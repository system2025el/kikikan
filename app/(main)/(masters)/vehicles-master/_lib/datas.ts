import { FormItemsType } from '@/app/(main)/_ui/form-box';

import { VehsMasterDialogValues, VehsMasterTableValues } from './types';
/**
 * 車両マスタテーブルのヘッダー
 */
export const vMHeader = [
  { key: 'name', label: '車両タイプ' },
  { key: 'mem', label: 'メモ' },
  { key: 'hidden', label: '非表示' },
  { key: 'deleted', label: '無効' },
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
