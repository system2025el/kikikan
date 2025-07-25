import { FormItemsType } from '@/app/(main)/_ui/form-box';

import { UsersMasterDialogValues, UsersMasterTableValues } from './types';
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
  { key: 'deleted', label: '無効' },
];
export const emptyUser: UsersMasterDialogValues = {
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
export const users: UsersMasterTableValues[] = [
  {
    tantouId: 1,
    tantouNam: '田中',
    tblDspId: 0,
    delFlg: false,
  },
  {
    tantouId: 2,
    tantouNam: '鈴木',
    tblDspId: 0,
    delFlg: false,
  },
  {
    tantouId: 3,
    tantouNam: '佐藤',
    tblDspId: 0,
    delFlg: false,
  },
  {
    tantouId: 4,
    tantouNam: '山田',
    tblDspId: 0,
    delFlg: false,
  },
  {
    tantouId: 5,
    tantouNam: '新規',
    tblDspId: 0,
    delFlg: false,
  },
];
