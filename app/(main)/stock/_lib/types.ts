export type Bumon = {
  bumonId: number;
  bumonNam: string;
};

export type EqTableValues = {
  kizaiId: number;
  kizaiNam: string | null;
  kizaiQty: number | null;
  bumonId: number | null;
  bumonNam: string | null;
};

export type StockTableValues = {
  calDat: Date;
  kizaiId: number;
  zaikoQty: number;
};
