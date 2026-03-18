export type LoanKizai = {
  kizaiId: number;
  kizaiNam: string;
  regAmt: number;
  kizaiQty: number;
  ngQty: number;
};

export type LoanJuchu = {
  juchuHeadId: number;
  juchuKizaiHeadId: number;
  juchuKizaiHeadKbn: number | null;
  kizaiId: number;
  koenNam: string;
  headNam: string;
  shukoDat: Date | null;
  nyukoDat: Date | null;
  oyaJuchuKizaiHeadId: number | null;
};

export type LoanUseTableValues = {
  juchuHeadId: number;
  juchuKizaiHeadId: number;
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
