import { FormItemsType } from '@/app/(main)/_ui/form-box';

import { LocsMasterDialogValues, LocsMasterTableValues } from './types';

/* 場所マスタデータ */
/* 場所マスタテーブルヘッダー */
export const lMHeader = [
  { key: 'name', label: '場所' },
  { key: 'address', label: '住所' },
  { key: 'tel', label: 'Tel' },
  { key: 'fax', label: 'Fax' },
];

/* 詳細ダイアログ用データ */
export const formItems: FormItemsType[] = [
  {
    label: '公演場所名',
    exsample: '例）渋谷公会堂',
    constraints: '100文字まで',
  },
  {
    label: '公演場所かな',
    exsample: '例）しぶやこうかいどう',
    constraints: '100文字まで',
  },
  {
    label: '削除フラグ',
    exsample: '',
    constraints: '論理削除（データは物理削除されません）',
  },
  {
    label: '公演場所住所（郵便番号）',
    exsample: '例）242-0018 ',
    constraints: '20文字まで',
  },
  {
    label: '公演場所住所（所在地）',
    exsample: '例）神奈川県大和市深見西9-99-99',
    constraints: '100文字まで',
  },
  {
    label: '公演場所住所（建物名）',
    exsample: '例）XXビル 11F',
    constraints: '100文字まで',
  },
  {
    label: '公演場所住所（その他）',
    exsample: 'その他の住所情報',
    constraints: '100文字まで',
  },
  {
    label: '代表電話',
    exsample: '例）046-999-1234',
    constraints: '20文字まで',
  },
  {
    label: '代表携帯',
    exsample: '例）070-9999-9999',
    constraints: '20文字まで',
  },
  {
    label: '代表FAX',
    exsample: '例）046-999-1235',
    constraints: '20文字まで',
  },
  {
    label: '代表メールアドレス',
    exsample: '例）abc@zzz.co.jp',
    constraints: '100文字まで',
  },
  {
    label: 'メモ',
    exsample: '',
    constraints: '200文字まで',
  },
  {
    label: '表示フラグ',
    exsample: '',
    constraints: '選択リストへの表示',
  },
];

// 新規登録用の初期化値（空の公演場所）
export const emptyLoc: LocsMasterDialogValues = {
  locId: -100,
  locNam: '',
  adrPost: '',
  adrShozai: '',
  adrTatemono: '',
  adrSonota: '',
  tel: '',
  fax: '',
  mem: '',
  kana: '',
  dspFlg: true,
  telMobile: '',
  delFlg: false,
};

/**モック削除delete */
export const locationList: LocsMasterTableValues[] = [
  {
    locNam: '日比谷音楽堂',
    tel: '000-000-0000',
    fax: '000-111-2222',
    locId: 1,
    dspOrdNum: 0,
    adrShozai: '東京都千代田区日比谷公園',
    adrTatemono: '',
    adrSonota: '１－５',
    mem: 'ばばばばばばっばばばばっばばばばば',
  },
  {
    locNam: '日本武道館',
    tel: '',
    fax: '',
    locId: 2,
    dspOrdNum: 0,
    adrShozai: '',
    adrTatemono: '',
    adrSonota: '',
    mem: '',
  },
  {
    locNam: 'ＮＨＫホール',
    tel: '',
    fax: '',
    locId: 3,
    dspOrdNum: 0,
    adrShozai: '',
    adrTatemono: '',
    adrSonota: '',
    mem: '',
  },
  {
    locNam: '東京厚生年金会館ホール',
    tel: '',
    fax: '',
    locId: 4,
    dspOrdNum: 0,
    adrShozai: '',
    adrTatemono: '',
    adrSonota: '',
    mem: '',
  },
  {
    locNam: '中野サンプラザ',
    tel: '',
    fax: '',
    locId: 5,
    dspOrdNum: 0,
    adrShozai: '',
    adrTatemono: '',
    adrSonota: '',
    mem: '',
  },
  {
    locNam: '渋谷公会堂',
    tel: '',
    fax: '',
    locId: 6,
    dspOrdNum: 0,
    adrShozai: '',
    adrTatemono: '',
    adrSonota: '',
    mem: '',
  },
];
