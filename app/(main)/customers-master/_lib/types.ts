import { z } from 'zod';

export const customerMaterDialogDetailsSchema = z.object({
  kokyakuId: z.number(),
  kokyakuNam: z.string(),
  kana: z.string(),
  kokyakuRank: z.number(),
  delFlg: z.number().optional(),
  dspOrder: z.number().optional(),
  keisho: z.string().optional(),
  adrPost: z.string().optional(),
  adrShozai: z.string().optional(),
  adrTatemono: z.string().optional(),
  adrSonota: z.string().optional(),
  tel: z.string().optional(),
  telMobile: z.string().optional(),
  fax: z.string().optional(),
  mail: z.string().optional(),
  mem: z.string().optional(),
  dspFlg: z.number().optional(),
  closeDay: z.number().optional(),
  siteDay: z.number().optional(),
  kizaiNebikiFlg: z.number().optional(),
});
export type customerMasterDialogDetailsValues = z.infer<typeof customerMaterDialogDetailsSchema>;

export const cMHeader = [
  {
    id: 'check',
    label: '',
  },
  {
    id: 'custName',
    label: '顧客名',
  },
  {
    id: 'address',
    label: '住所',
  },
  {
    id: 'tel',
    label: 'TEL',
  },
  {
    id: 'fax',
    label: 'FAX',
  },
  {
    id: 'memo',
    label: 'メモ',
  },
];

export const customerMasterTableSchema = z.object({
  kokyakuId: z.number(),
  kokyakuNam: z.string().optional(),
  adrShozai: z.string().optional(),
  adrTatemono: z.string().optional(),
  adrSonota: z.string().optional(),
  tel: z.string().optional(),
  fax: z.string().optional(),
  mem: z.string().optional(),
});
export type CustomerMasterTableValues = z.infer<typeof customerMasterTableSchema>;

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
