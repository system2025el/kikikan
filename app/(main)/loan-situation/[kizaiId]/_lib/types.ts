export type LoanKizai = {
  kizaiId: number;
  kizaiNam: string;
  regAmt: number;
  kizaiQty: number;
};

export type LoanJuchu = {
  juchuHeadId: number;
  kizaiId: number;
  koenNam: string;
  shukoDat: Date | null;
  nyukoDat: Date | null;
};

export type LoanUseTableValues = {
  calDat: Date;
  kizaiId: number;
  kizaiQty: number;
  zaikoQty: number;
  planQty: number;
  juchuHonbanbiColor: string;
};

export type LoanStockTableValues = {
  calDat: Date;
  kizaiId: number;
  zaikoQty: number;
};

export type LoanConfirmJuchuHeadId = {
  juchuHeadId: number;
};
