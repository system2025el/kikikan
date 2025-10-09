import { FormItemsType } from '@/app/(main)/_ui/form-box';

import { UsersMasterDialogValues, UsersMasterTableValues } from './types';
/* 担当者マスタテーブルヘッダー */
export const userMHeader = [
  { key: 'name', label: '担当者名' },
  { key: 'mailAdr', label: 'メールアドレス' },
  { key: 'shainCod', label: '社員番号' },
  { key: 'mem', label: 'メモ' },
  { key: 'lastLogin', label: '最終ログイン' },
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
