export type IdoEqptDetailValues = {
  //idoDenId: number;
  sagyoKbnId: number;
  sagyoSijiId: number;
  sagyoDenDat: string;
  sagyoId: number;
  planQty: number | null;
  resultQty: number | null;
  resultAdjQty: number | null;
  kizaiId: number;
  kizaiNam: string | null;
  bldCod: string | null;
  tanaCod: string | null;
  edaCod: string | null;
  mem: string | null;
  ctnFlg: boolean | null;
};

export type IdoEqptDetailTableValues = {
  //idoDenId: number;
  rfidElNum: number | null;
  rfidTagId: string;
  rfidKizaiSts: number | null;
  rfidStsNam: string | null;
  rfidMem: string | null;
  rfidDat: string | null;
  rfidUser: string | null;
  rfidDelFlg: number | null;
};
