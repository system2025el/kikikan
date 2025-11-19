import { FormItemsType } from '@/app/(main)/_ui/form-box';

import { IsshikisMasterDialogValues, IsshikisMasterTableValues } from './types';

/* 一式マスタテーブルヘッダー */
export const isshikiMHeader = [
  { key: 'name', label: '名称' },
  { key: 'regAmt', label: '単価' },
  { key: 'mem', label: 'メモ' },
  { key: 'hidden', label: '表示' },
  { key: 'deleted', label: '無効' },
];

/* 新規登録用の初期化値（空の一式） */
export const emptyIsshiki: IsshikisMasterDialogValues = {
  isshikiNam: '',
  regAmt: null,
  delFlg: false,
  mem: '',
  kizaiList: [],
};

export const formItems: FormItemsType[] = [
  {
    label: '一式名',
    exsample: '例）照明',
    constraints: '100文字まで',
  },
  {
    label: '単価',
    exsample: '数字',
    constraints: '10桁まで',
  },

  {
    label: 'メモ',
    exsample: '',
    constraints: '200文字まで',
  },
  // {
  //   label: '表示フラグ',
  //   exsample: '',
  //   constraints: '',
  // },
  // {
  //   label: '削除フラグ',
  //   exsample: '',
  //   constraints: '論理削除（データは物理削除されません）',
  // },
];
