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

/* 空白の担当者データ */
export const emptyUser: UsersMasterDialogValues = {
  mailAdr: '',
  tantouNam: '',
  delFlg: false,
  psermission: { juchu: '00', nyushuko: '00', masters: '00', ht: '0', loginSetting: '0' },
  lastLoginAt: null,
};

/* 担当者編集ダイアログのフォームのデータ */
export const formItems: FormItemsType[] = [
  {
    label: '担当者名',
    constraints: '100文字まで',
    exsample: 'あいうえお',
  },
  {
    label: 'メールアドレス',
    exsample: 'aaaa@bbb.com',
    constraints: '',
  },
  {
    label: '社員番号',
    exsample: '例）123456',
    constraints: 'ハンディ作業者は必須',
  },
  {
    label: '担当者権限',
    exsample: '',
    constraints: '',
  },
  {
    label: 'メモ',
    exsample: '部署名、携帯番号等',
    constraints: '200文字まで',
  },
  {
    label: '最終ログイン',
    exsample: '',
    constraints: '',
  },
];

export const radioTrio = [
  { id: '00', label: '無し' },
  { id: '01', label: '参照のみ' },
  { id: '11', label: '参照更新' },
];

export const radioPair = [
  { id: '0', label: '無し' },
  { id: '1', label: '参照更新' },
];
