import { FormItemsType } from '@/app/(main)/_ui/form-box';

import { FAKE_NEW_ID } from '../../_lib/constants';
import { EqptSetsMasterDialogValues } from './types';

/* 機材セットマスタテーブルヘッダー */
export const eqptSetMHeader = [
  { key: 'name', label: '機材名称' },
  { key: 'mem', label: 'メモ' },
  { key: 'deleted', label: '無効' },
];

/* 新規登録用の初期化値（空の機材セット） */
export const emptyEqptSet: EqptSetsMasterDialogValues = {
  delFlg: false,
  eqptId: FAKE_NEW_ID,
  setEqptList: [],
};

export const formItems: FormItemsType[] = [
  {
    label: '機材名',
    exsample: '例）照明',
    constraints: '新規時選択',
  },
  {
    label: 'セット機材選択',
    exsample: '',
    constraints: '機材を選択',
  },
];
