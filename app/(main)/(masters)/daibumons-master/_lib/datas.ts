import { FormItemsType } from '@/app/(main)/_ui/form-box';

import { DaibumonsMasterDialogValues, DaibumonsMasterTableValues } from './types';

/* 大部門マスタテーブルヘッダー */
export const daibumonMHeader = [
  { key: 'name', label: '名称' },
  { key: 'mem', label: 'メモ' },
];

/* 新規登録用の初期化値（空の大部門） */
export const emptyDaibumon: DaibumonsMasterDialogValues = {
  daibumonNam: '',
};

export const formItems: FormItemsType[] = [
  {
    label: '大部門名',
    exsample: '例）照明',
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
];

/*モック削除delete */
export const daibumonsList: DaibumonsMasterTableValues[] = [
  {
    daibumonId: 1,
    daibumonNam: '照明',
    mem: 'XXXXXXXXXXX',
    dspFlg: true,
  },
  {
    daibumonId: 2,
    daibumonNam: 'Moving Light',
    mem: 'XXXXXXXX',
    dspFlg: true,
  },
  {
    daibumonNam: 'ムービング ゴボ',
    mem: 'XXXXXXX',
    daibumonId: 3,
    dspFlg: true,
  },
  {
    daibumonNam: '空（カラ）ケース',
    daibumonId: 4,
    mem: '',
    dspFlg: true,
  },
];
