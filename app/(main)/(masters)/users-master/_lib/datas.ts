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
  psermission: { juchu: 0, nyushuko: 0, masters: 0, ht: 0, loginSetting: 0 },
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

export const juchuRadio = [
  { id: 0, label: '無し' },
  { id: 1, label: '参照のみ' },
  { id: 3, label: '参照更新' },
];

export const nyushukoRadio = [
  { id: 0, label: '無し' },
  { id: 4, label: '参照のみ' },
  { id: 12, label: '参照更新' },
];

export const mastersRadio = [
  { id: 0, label: '無し' },
  { id: 16, label: '参照のみ' },
  { id: 48, label: '参照更新' },
];

export const htRadio = [
  { id: 0, label: '無し' },
  { id: 64, label: '参照更新' },
];

export const loginSettingRadio = [
  { id: 0, label: '無し' },
  { id: 128, label: '参照更新' },
];
