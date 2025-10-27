import { Label } from '@mui/icons-material';

import { FormItemsType } from '@/app/(main)/_ui/form-box';

import { FAKE_NEW_ID } from '../../_lib/constants';
import { EqptsMasterDialogValues, EqptsMasterTableValues } from './types';

/* 機材マスタヘッダー */
export const eqptMHeader = [
  { key: 'name', label: '機材名' },
  { key: 'shozokuNam', label: '所属名' },
  { key: 'kizaiQty', label: '保有数' },
  { key: 'ngQty', label: 'NG数' },
  { key: 'yukoQty', label: '有効数' },
  { key: 'bumonNam', label: '部門' },
  { key: 'daibumonNam', label: '大部門' },
  { key: 'shukeibumonNam', label: '集計部門' },
  { key: 'regAmt', label: '定価' },
  // { key: 'rankAmt1', label: '価格1' },
  // { key: 'rankAmt2', label: '価格2' },
  // { key: 'rankAmt3', label: '価格3' },
  // { key: 'rankAmt4', label: '価格4' },
  // { key: 'rankAmt5', label: '価格5' },
  { key: 'mem', label: 'メモ' },
  { key: 'hidden', label: '非表示' },
  { key: 'deleted', label: '無効' },
];

/*  */
export const emptyEqpt: EqptsMasterDialogValues = {
  kizaiNam: '',
  sectionNum: null,
  elNum: null,
  delFlg: false,
  shozokuId: 0,
  bldCod: '',
  tanaCod: '',
  edaCod: '',
  kizaiGrpCod: '',
  dspOrdNum: null,
  mem: '',
  bumonId: FAKE_NEW_ID,
  shukeibumonId: FAKE_NEW_ID,
  dspFlg: true,
  ctnFlg: false,
  defDatQty: null,
  regAmt: 0,
  // rankAmt1: null,
  // rankAmt2: null,
  // rankAmt3: null,
  // rankAmt4: null,
  // rankAmt5: null,
};

/*  */
export const formItems: FormItemsType[] = [
  {
    label: '機材名',
    exsample: '例）MagicQ MQ70 Compact Console',
    constraints: '100文字まで',
  },
  {
    label: '保有数',
    exsample: '',
    constraints: '数字',
  },
  {
    label: 'NG数',
    exsample: '',
    constraints: '数字',
  },
  {
    label: '有効数',
    exsample: '',
    constraints: '数字',
  },
  {
    label: '課',
    exsample: '例）1',
    constraints: '数字',
    other: '所属無[0]、Ⅰ課[1]、Ⅱ課[2]、Ⅲ課[3]、Ⅳ課[4]、Ⅴ課[5]',
  },
  {
    label: '所属',
    exsample: '',
    constraints: 'リスト選択',
  },
  {
    label: '棟フロアコード',
    exsample: '例）A1',
    constraints: '20文字まで',
  },
  {
    label: '棚コード',
    exsample: '例）10000',
    constraints: '20文字まで',
  },
  {
    label: '枝コード',
    exsample: '例）1',
    constraints: '20文字まで',
  },
  {
    label: '機材グループコード',
    exsample: '例）10001',
    constraints: '10文字まで',
  },
  {
    label: 'グループ内表示順',
    exsample: '例）1',
    constraints: '数字',
  },
  {
    label: 'メモ',
    exsample: '',
    constraints: '200文字まで',
  },
  {
    label: '部門',
    exsample: '例）ムービングライト',
    constraints: 'リスト選択',
  },
  {
    label: '集計部門',
    exsample: '例）照明部',
    constraints: 'リスト選択',
  },
  {
    label: '表示フラグ',
    exsample: '',
    constraints: '選択リストへの表示',
  },
  {
    label: 'コンテナフラグ',
    exsample: '',
    constraints: 'コンテナ系の場合チェック（入出庫するザル、台車など）',
  },
  {
    label: '定価',
    exsample: '例）10000',
    constraints: '円貨',
  },
  // {
  //   label: '顧客ランク価格１',
  //   exsample: '例）10000',
  //   constraints: '円貨 当該ランク価格が未入力の場合、受注伝票では定価が適用されます。',
  // },
  // {
  //   label: '顧客ランク価格2',
  //   exsample: '例）10000',
  //   constraints: '円貨 当該ランク価格が未入力の場合、受注伝票では定価が適用されます。',
  // },
  // {
  //   label: '顧客ランク価格3',
  //   exsample: '例）10000',
  //   constraints: '円貨 当該ランク価格が未入力の場合、受注伝票では定価が適用されます。',
  // },
  // {
  //   label: '顧客ランク価格4',
  //   exsample: '例）10000',
  //   constraints: '円貨 当該ランク価格が未入力の場合、受注伝票では定価が適用されます。',
  // },
  // {
  //   label: '顧客ランク価格5',
  //   exsample: '例）10000',
  //   constraints: '円貨 当該ランク価格が未入力の場合、受注伝票では定価が適用されます。',
  // },
];
