import { FormItemsType } from '@/app/(main)/_ui/form-box';

import { SectionsMasterDialogValues } from './types';

/* 課マスタテーブルヘッダー */
export const sectionsMHeader = [
  { key: 'name', label: '名称' },
  { key: 'sectionNamShort', label: '略称' },
  { key: 'mem', label: 'メモ' },
  { key: 'deleted', label: '無効' },
];

export const formItems: FormItemsType[] = [
  {
    label: '課名',
    exsample: '例）Ⅳ課',
    constraints: '100文字まで',
  },
  {
    label: '課名（略）',
    exsample: '例）Ⅳ',
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

export const emptySection: SectionsMasterDialogValues = {
  sectionNam: '',
  sectionNamShort: '',
  delFlg: false,
  mem: '',
};
