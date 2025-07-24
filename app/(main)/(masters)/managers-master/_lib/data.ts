import { FormItemsType } from '@/app/(main)/_ui/form-box';

import { ManagersMasterDialogValues, ManagersMasterTableValues } from './types';
/* 担当者マスタテーブルヘッダー */
export const mMHeader = [
  {
    key: 'name',
    label: '担当者名',
  },
  {
    key: 'hidden',
    label: '非表示',
  },
];
export const emptyManager: ManagersMasterDialogValues = {
  tantouNam: '',
  delFlg: false,
};

export const formItems: FormItemsType[] = [
  {
    label: '担当者名',
    constraints: '100文字まで',
    exsample: 'あいうえお',
  },
  {
    label: '削除フラグ',
    exsample: '',
    constraints: '選択',
  },
];

/* モック削除delete */
export const managers: ManagersMasterTableValues[] = [
  {
    tantouId: 1,
    tantouNam: '田中',
    dspFlg: true,
    dspOrdNum: 0,
  },
  {
    tantouId: 2,
    tantouNam: '鈴木',
    dspFlg: true,
    dspOrdNum: 0,
  },
  {
    tantouId: 3,
    tantouNam: '佐藤',
    dspFlg: true,
    dspOrdNum: 0,
  },
  {
    tantouId: 4,
    tantouNam: '山田',
    dspFlg: true,
    dspOrdNum: 0,
  },
  {
    tantouId: 5,
    tantouNam: '新規',
    dspFlg: true,
    dspOrdNum: 0,
  },
];
