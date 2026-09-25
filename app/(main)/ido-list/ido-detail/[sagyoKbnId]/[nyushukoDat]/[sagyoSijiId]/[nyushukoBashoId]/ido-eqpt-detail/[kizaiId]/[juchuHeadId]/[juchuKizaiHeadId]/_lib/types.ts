export type IdoEqptDetailValues = {
  //idoDenId: number;
  sagyoKbnId: number;
  sagyoSijiId: number;
  sagyoDenDat: string;
  sagyoId: number;
  /** 受注ヘッダーid。手動追加の機材は0 */
  juchuHeadId: number;
  /** 受注機材ヘッダーid。juchuHeadId とのペアで一意。手動追加の機材は0 */
  juchuKizaiHeadId: number;
  /** 公演名。手動追加の機材は空 */
  koenNam: string | null;
  /** 明細名。手動追加の機材は空 */
  headNam: string | null;
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
