export type BillSearchValues = {
  billId: number | null | undefined;
  billingSts: number | null | undefined;
  range: { str: Date | null | undefined; end: Date | null | undefined };
  kokyaku: string | null | undefined;
  kokyakuTantoNam: string | null | undefined;
};

export type BillsListTableValues = {
  billHeadId: number;
  billingSts: string | null;
  billHeadNam: string | null;
  kokyaku: string | null;
  seikyuDat: string | null;
};
