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

export const permission = {
  none: 0,
  juchu_ref: 1,
  juchu_upd: 2,
  juchu_full: 1 | 2,
  nyushuko_ref: 4,
  nyushuko_upd: 8,
  nyushuko_full: 4 | 8,
  mst_ref: 16,
  mst_upd: 32,
  mst_full: 16 | 32,
  ht: 64,
  login: 128,
  system: 65535,
} as const;

export const juchuRadio = [
  { id: permission.none, label: '無し' },
  { id: permission.juchu_ref, label: '参照のみ' },
  { id: permission.juchu_full, label: '参照更新' },
];

export const nyushukoRadio = [
  { id: permission.none, label: '無し' },
  { id: permission.nyushuko_ref, label: '参照のみ' },
  { id: permission.nyushuko_full, label: '参照更新' },
];

export const mastersRadio = [
  { id: permission.none, label: '無し' },
  { id: permission.mst_ref, label: '参照のみ' },
  { id: permission.mst_full, label: '参照更新' },
];

export const htRadio = [
  { id: permission.none, label: '無し' },
  { id: permission.ht, label: '参照更新' },
];

export const loginSettingRadio = [
  { id: permission.none, label: '無し' },
  { id: permission.login, label: '参照更新' },
];
