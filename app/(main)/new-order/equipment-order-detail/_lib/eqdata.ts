export type Cate = {
  id: number;
  name: string;
};

export const eqCategories: Cate[] = [
  {
    id: 0,
    name: 'KICKS_DMX卓（コントローラー）',
  },
  {
    id: 1,
    name: 'KICKS_卓備品（DMX）',
  },
  {
    id: 2,
    name: 'データ　信号機',
  },
  {
    id: 3,
    name: 'クセノンピン',
  },
  {
    id: 4,
    name: 'PAR64',
  },
  {
    id: 5,
    name: 'PAR36',
  },
  {
    id: 6,
    name: 'フレネルスポット',
  },
  {
    id: 7,
    name: 'スポット',
  },
  {
    id: 8,
    name: 'ホリゾントライト',
  },
  {
    id: 9,
    name: 'ミニブル',
  },
  {
    id: 10,
    name: 'エフェクト',
  },
  {
    id: 11,
    name: 'ストロボ',
  },
  {
    id: 12,
    name: 'LED-Ⅰ',
  },
  {
    id: 13,
    name: 'LED-Ⅱ',
  },
  {
    id: 14,
    name: 'ムービングライト',
  },
  {
    id: 15,
    name: 'ムービングライト備品',
  },
  {
    id: 16,
    name: 'ミラーボール',
  },
  {
    id: 17,
    name: 'カラーチェンジャー',
  },
];

export type eqData = {
  id: number;
  name: string;
  cateId: number;
  setId: string;
};
export const eqList: eqData[] = [
  {
    id: 0,
    name: 'SHRPY X Spot',
    cateId: 14,
    setId: '',
  },
  {
    id: 1,
    name: 'SHARPY PLUS',
    cateId: 14,
    setId: 'a',
  },
  {
    id: 2,
    name: 'ROBIN T2 Profile',
    cateId: 14,
    setId: 'a',
  },
  {
    id: 3,
    name: 'ROBIN Pointe_Ω',
    cateId: 14,
    setId: 'a',
  },
  {
    id: 4,
    name: 'MAC Ultra Wash',
    cateId: 14,
    setId: '',
  },
];

export const bundleData = [
  { id: 1, name: 'MAC Ultra Wash' },
  { id: 2, name: 'MAC Viper XIP' },
  { id: 3, name: 'MAC Viper_Ω' },
  { id: 4, name: 'VL-6000 Beam' },
  { id: 5, name: 'VL-1100 AS' },
];
