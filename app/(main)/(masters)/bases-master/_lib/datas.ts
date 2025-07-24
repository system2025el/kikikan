import { FormItemsType } from '@/app/(main)/_ui/form-box';

import { BasesMasterDialogValues, BasesMasterTableValues } from './types';

/* 拠点マスタテーブルヘッダー */
export const bMHeader = [
  { key: 'name', label: '名称' },
  { key: 'mem', label: 'メモ' },
  { key: 'hidden', label: '非表示' },
];

/* 詳細ダイアログ用データ */
export const formItems: FormItemsType[] = [
  {
    label: '所属名',
    exsample: '例）YARD',
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

// 新規登録用の初期化値（空の拠点）
export const emptyBase: BasesMasterDialogValues = {
  shozokuNam: '',
  delFlg: false,
  mem: '',
};

/**モック削除delete */
export const basesList: BasesMasterTableValues[] = [
  {
    shozokuNam: 'KICS',
    mem: '川崎',
    shozokuId: 1,
    dspOrdNum: 0,
  },
  {
    shozokuNam: 'YARD',
    mem: '大和',
    shozokuId: 2,
    dspOrdNum: 0,
  },
  {
    shozokuNam: 'その他',
    mem: '厚木など',
    shozokuId: 3,
    dspOrdNum: 0,
  },
];
