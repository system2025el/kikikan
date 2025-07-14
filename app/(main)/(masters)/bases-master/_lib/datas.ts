import { FormItemsType } from '@/app/(main)/_ui/form-box';

import { BasesMasterDialogValues, BasesMasterTableValues } from './types';

/* 拠点マスタテーブルヘッダー */
export const bMHeader = [
  { key: 'name', label: '名称' },
  { key: 'mem', label: 'メモ' },
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
  kyotenNam: '',
  delFlg: false,
  mem: '',
};

/**モック削除delete */
export const basesList: BasesMasterTableValues[] = [
  {
    kyotenNam: 'KICS',
    mem: '川崎',
    kyotenId: 1,
    dspFlg: false,
  },
  {
    kyotenNam: 'YARD',
    mem: '大和',
    kyotenId: 2,
    dspFlg: false,
  },
  {
    kyotenNam: 'その他',
    mem: '厚木など',
    kyotenId: 3,
    dspFlg: false,
  },
];
