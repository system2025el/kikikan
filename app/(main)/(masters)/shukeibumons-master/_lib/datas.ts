import { FormItemsType } from '@/app/(main)/_ui/form-box';

import { ShukeibumonsMasterDialogValues, ShukeibumonsMasterTableValues } from './types';

/* 集計部門マスタテーブルヘッダー */
export const shukeibumonMHeader = [
  { key: 'name', label: '名称' },
  { key: 'mem', label: 'メモ' },
];

/* */
export const formItems: FormItemsType[] = [
  {
    label: '集計部門名',
    exsample: '例）照明部',
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
    constraints: '',
  },
];

/* 新規登録用の初期化値（空の集計部門） */
export const emptyShukeibumon: ShukeibumonsMasterDialogValues = {
  shukeibumonNam: '',
  delFlg: false,
  mem: '',
};

/*モック削除delete */
export const shukeibumonsList: ShukeibumonsMasterTableValues[] = [
  {
    shukeibumonNam: '照明部',
    mem: 'XXXXXXXXXXX',
    shukeibumonId: 1,
    dspOrdNum: 0,
  },
  {
    shukeibumonNam: 'L課（Control）',
    mem: 'XXXXXXXX',
    shukeibumonId: 2,
    dspOrdNum: 0,
  },
  {
    shukeibumonNam: 'L課（SPOT）',
    mem: 'XXXXXXX',
    shukeibumonId: 3,
    dspOrdNum: 0,
  },
];
