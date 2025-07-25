import { FormItemsType } from '@/app/(main)/_ui/form-box';

import { BumonsMasterDialogValues, BumonsMasterTableValues } from './types';
/* 部門マスタテーブルヘッダー */
export const BumonsMHeader = [
  { key: 'name', label: '名称' },
  { key: 'mem', label: 'メモ' },
  { key: 'deleted', label: '無効' },
];

export const formItems: FormItemsType[] = [
  {
    label: '部門名',
    exsample: '例）ムービングライト',
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
  {
    label: '大部門',
    exsample: '例）ムービング ゴボ',
    constraints: 'リスト選択、または、入力（100文字まで）',
  },
  {
    label: '集計部門',
    exsample: '例）照明部',
    constraints: 'リスト選択、または、入力（100文字まで）',
  },
];

export const emptyBumon: BumonsMasterDialogValues = {
  bumonNam: '',
  delFlg: false,
  mem: '',
  daibumonId: 0,
  shukeibumonId: 0,
};

/*モック削除delete */
export const bumonsList: BumonsMasterTableValues[] = [
  {
    bumonId: 1,
    bumonNam: 'ムービングライト',
    mem: 'あえいうえおあおかけきくけこかこ',
    tblDspId: 0,
    delFlg: false,
  },
  {
    bumonId: 2,
    bumonNam: 'スポットライト',
    mem: '',
    tblDspId: 0,
    delFlg: false,
  },
  {
    bumonId: 3,
    bumonNam: 'その他',
    mem: '',
    tblDspId: 0,
    delFlg: false,
  },
];
