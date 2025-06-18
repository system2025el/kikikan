/** ----------------顧客マスタ-------------------------- */

import { CustomerMasterTableValues } from '../(main)/customers-master/_lib/types';

export const customers: CustomerMasterTableValues[] = [
  {
    kokyakuId: 1,
    kokyakuNam: 'エンジニアライティング',
    adrShozai: '東京都世田谷区',
    adrTatemono: 'えんじにあらいてぃんぐ',
    // adrPost: '154-0004',
    adrSonota: '太子堂1-12-38 藤和三軒茶屋コープ205号',
    tel: '03-3413-8441',
    fax: '03-3413-8466',
    // mail: 'FFFFFFFFFFFFF@EEEEEEEEEEEEEEEEEE',
    // keishou: '御中',
    mem: 'あああああああああああああああああああ',
  },
  {
    kokyakuId: 2,
    kokyakuNam: '(株)スペースエンジニアリング',
    adrShozai: '東京都新宿区',
    adrTatemono: 'すぺーすえんじにありんぐ',
    // postnum: '162-0041',
    adrSonota: '早稲田鶴巻町５２３',
    tel: '03-5292-2380',
    fax: '03-5292-2382',
    // mail: 'YYYYYYYYYYYYYYYYYYYYYY@DDDDDDDDD',
    // keishou: '御中',
    mem: 'あいうえおかきくけこさしすせそたちつてとなにぬねのはひふへほまみむめもやいゆえよらりるれろわいうえをあいうえおかきくけこさしすせそたちつてとなにぬねのはひふへほまみむめもやいゆえよらりるれろわいうえをあいうえおかきくけこさしすせそたちつてとなにぬねのはひふへほまみむめもやいゆえよらりるれろわいうえをあいうえおかきくけこさしすせそたちつてとなにぬねのはひふへほまみむめもやいゆえよらりるれろわいうえをあいうえおかきくけこさしすせそたちつてとなにぬねのはひふへほまみむめもやいゆえよらりるれろわいうえをあいうえおかきくけこさしすせそたちつてとなにぬねのはひふへほまみむめもやいゆえよらりるれろわいうえを',
  },
  {
    kokyakuId: 3,
    kokyakuNam: '(株)シアタープレーン',
    adrShozai: 'しあたーぷれーん',
    // postnum: 'XXX-XXXX',
    adrTatemono: 'XXXXXXXXXX',
    adrSonota: 'XXXXXXXXXXXXXXXXXXXXXXX',
    tel: '999-999-9999',
    fax: '999-999-9999',
    // mail: 'aaaaaaaaaa@eeeeeeeeeeeeee',
    // keishou: '御中',
    mem: '',
  },
];

/** 場所マスタデータ */
type Location = {
  name: string;
  shortName: string;
  address: string;
  tel: string;
  fax: string;
};
export const locationList: Location[] = [
  {
    name: '日比谷音楽堂',
    shortName: 'ヒビ',
    address: '千代田区日比谷公園１－５',
    tel: '',
    fax: '',
  },
  {
    name: '日本武道館',
    shortName: 'ブド',
    address: '',
    tel: '',
    fax: '',
  },
  {
    name: 'ＮＨＫホール',
    shortName: 'エヌ',
    address: '',
    tel: '',
    fax: '',
  },
  {
    name: '東京厚生年金会館ホール',
    shortName: 'コウ',
    address: '',
    tel: '',
    fax: '',
  },
  {
    name: '中野サンプラザ',
    shortName: 'サン',
    address: '',
    tel: '',
    fax: '',
  },
  {
    name: '渋谷公会堂',
    shortName: 'シブ',
    address: '',
    tel: '',
    fax: '',
  },
];

/** -------見積-------- */
const enum QuotationStatus {
  processing = '処理中',
  processed = '処理済み',
}

type QuotaionData = {
  id: number;
  quoteNumber: string;
  status: QuotationStatus;
  name: string;
  customerName: string;
  quotationDate: string;
  invoiceNumber: string;
  quotationmemo: string;
};

export const quotaionList: QuotaionData[] = [
  {
    id: 1,

    status: QuotationStatus.processed,
    name: 'A / Zepp Tour',
    customerName: '(株)シアターブレーン',
    quoteNumber: '81694',
    quotationDate: '2025/10/01',
    invoiceNumber: '',
    quotationmemo: 'XXXXXXXXXXXXX',
  },
  {
    id: 2,
    status: QuotationStatus.processing,
    name: 'A / Zepp Tour',
    customerName: '(株)シアターブレーン',
    quoteNumber: '81695',
    quotationDate: '2025/10/02',
    invoiceNumber: '9999999',
    quotationmemo: 'XXXXXXXX',
  },
  {
    id: 3,
    status: QuotationStatus.processed,
    name: '公演1',
    customerName: '顧客A',
    quoteNumber: '81696',
    quotationDate: '2025/10/03',
    invoiceNumber: '',
    quotationmemo: 'X',
  },
];

/**---------車両データ------------ */
type VehicleData = {
  id: number;
  vehicleType: string;
  memo: string;
};

export const vehicles: VehicleData[] = [
  {
    id: 1,
    vehicleType: '不明',
    memo: '',
  },
  {
    id: 2,
    vehicleType: '1t',
    memo: '',
  },
  {
    id: 3,
    vehicleType: '2t',
    memo: '',
  },
  {
    id: 4,
    vehicleType: '3t',
    memo: '',
  },
  {
    id: 5,
    vehicleType: '4t',
    memo: '',
  },
  {
    id: 6,
    vehicleType: '11t',
    memo: '',
  },
  {
    id: 7,
    vehicleType: 'ハイエース',
    memo: '',
  },
];
