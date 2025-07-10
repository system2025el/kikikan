import { FormItemsType } from '@/app/(main)/_ui/form-box';

import { ManagersMasterDialogValues, ManagersMasterTableValues } from './types';
/* 担当者マスタテーブルヘッダー */
export const mMHeader = [
  {
    key: 'name',
    label: '担当者名',
  },
];
export const emptyManager: ManagersMasterDialogValues = {
  tantouNam: '',
};

export const formItems: FormItemsType[] = [
  {
    label: '担当者名',
    constraints: '100文字まで',
    exsample: 'あいうえお',
  },
];

/* モック削除delete */
export const managers: ManagersMasterTableValues[] = [
  {
    tantouId: 1,
    tantouNam: '田中',
    delFlg: false,
  },
  {
    tantouId: 2,
    tantouNam: '鈴木',
    delFlg: false,
  },
  {
    tantouId: 3,
    tantouNam: '佐藤',
    delFlg: true,
  },
  {
    tantouId: 4,
    tantouNam: '山田',
    delFlg: false,
  },
  {
    tantouId: 5,
    tantouNam: '新規',
    delFlg: false,
  },
];
