import { FormItemsType } from '@/app/(main)/_ui/form-box';

import { CustomersMasterDialogValues, CustomersMasterTableValues } from './types';

/* 顧客マスタテーブルのヘッダー */
export const cMHeader = [
  {
    key: 'name',
    label: '顧客名',
  },
  {
    key: 'address',
    label: '住所',
  },
  {
    key: 'tel',
    label: 'TEL',
  },
  {
    key: 'fax',
    label: 'FAX',
  },
  {
    key: 'mem',
    label: 'メモ',
  },
  {
    key: 'hidden',
    label: '非表示',
  },
  { key: 'deleted', label: '無効' },
];

/* 新規登録用の初期化値（空の公演場所） */
export const emptyCustomer: CustomersMasterDialogValues = {
  kokyakuNam: '',
  kana: '',
  kokyakuRank: 0,
  delFlg: false,
  keisho: '',
  adrPost: '',
  adrShozai: '',
  adrTatemono: '',
  adrSonota: '',
  tel: '',
  telMobile: '',
  fax: '',
  mail: '',
  mem: '',
  dspFlg: true,
  closeDay: 0,
  siteDay: 0,
  kizaiNebikiFlg: false,
};
/*  */
export const formItems: FormItemsType[] = [
  {
    label: '顧客名',
    exsample: '例）㈱エンジニア･ライティング',
    constraints: '100文字まで',
  },
  {
    label: '顧客かな',
    exsample: '例）えんじにあ　らいてぃんぐ',
    constraints: '100文字まで',
  },
  {
    label: '顧客ランク',
    exsample: '',
    constraints: '１～５選択',
  },
  {
    label: '削除フラグ',
    exsample: '',
    constraints: '論理削除（データは物理削除されません）',
  },
  {
    label: '顧客敬称',
    exsample: '',
    constraints: '10文字まで',
  },
  {
    label: '顧客住所（郵便番号）',
    exsample: '例）242-0018 ',
    constraints: '20文字まで',
  },
  {
    label: '顧客住所（所在地）',
    exsample: '例）神奈川県大和市深見西9-99-99',
    constraints: '100文字まで',
  },
  {
    label: '顧客住所（建物名）',
    exsample: '例）XXビル 11F',
    constraints: '100文字まで',
  },
  {
    label: '顧客住所（その他）',
    exsample: 'その他の住所情報',
    constraints: '100文字まで',
  },
  {
    label: '電話',
    exsample: '例）046-999-1234',
    constraints: '20文字まで',
  },
  {
    label: '携帯',
    exsample: '例）070-9999-9999',
    constraints: '20文字まで',
  },
  {
    label: 'FAX',
    exsample: '例）046-999-1235',
    constraints: '20文字まで',
  },
  {
    label: 'メールアドレス',
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
  {
    label: '月締日',
    exsample: '例）31、15　※月末締めの場合31を指定',
    constraints: '数字',
  },
  {
    label: '支払サイト日数',
    exsample: '例）月末締め翌月末払いの場合30、翌々月末払いは60を指定',
    constraints: '数字',
  },
  {
    label: '機材値引き対象フラグ',
    exsample: '',
    constraints: '',
  },
];

//モック用削除delete
export const customers: CustomersMasterTableValues[] = [
  {
    kokyakuId: 1,
    kokyakuNam: 'エンジニアライティング',
    adrShozai: '東京都世田谷区太子堂1-12-38',
    adrTatemono: '藤和三軒茶屋コープ205号',
    // adrPost: '154-0004',
    adrSonota: '',
    tel: '03-3413-8441',
    fax: '03-3413-8466',
    // mail: 'FFFFFFFFFFFFF@EEEEEEEEEEEEEEEEEE',
    // keishou: '御中',
    mem: 'あああああああああああああああああああ',
    dspFlg: true,
    tblDspId: 0,
    delFlg: false,
  },
  {
    kokyakuId: 2,
    kokyakuNam: '(株)スペースエンジニアリング',
    adrShozai: '東京都新宿区早稲田鶴巻町５２３',
    adrTatemono: '',
    // postnum: '162-0041',
    adrSonota: '',
    tel: '03-5292-2380',
    fax: '03-5292-2382',
    // mail: 'YYYYYYYYYYYYYYYYYYYYYY@DDDDDDDDD',
    // keishou: '御中',
    mem: 'あいうえおかきくけこさしすせそたちつてとなにぬねのはひふへほまみむめもやいゆえよらりるれろわいうえをあいうえおかきくけこさしすせそたちつてとなにぬねのはひふへほまみむめもやいゆえよらりるれろわいうえをあいうえおかきくけこさしすせそたちつてとなにぬねのはひふへほまみむめもやいゆえよらりるれろわいうえをあいうえおかきくけこさしすせそたちつてとなにぬねのはひふへほまみむめもやいゆえよらりるれろわいうえをあいうえおかきくけこさしすせそたちつてとなにぬねのはひふへほまみむめもやいゆえよらりるれろわいうえをあいうえおかきくけこさしすせそたちつてとなにぬねのはひふへほまみむめもやいゆえよらりるれろわいうえを',
    dspFlg: true,
    tblDspId: 0,
    delFlg: false,
  },
  {
    kokyakuId: 3,
    kokyakuNam: '(株)シアタープレーン',
    adrShozai: 'XXXXXXXXXXXXXXXXXXXXXXX',
    // postnum: 'XXX-XXXX',
    adrTatemono: 'XXXXXXXXXX',
    adrSonota: '',
    tel: '999-999-9999',
    fax: '999-999-9999',
    // mail: 'aaaaaaaaaa@eeeeeeeeeeeeee',
    // keishou: '御中',
    mem: '',
    dspFlg: true,
    tblDspId: 0,
    delFlg: false,
  },
];
