import { IdoDen } from '../../../../../../../../_lib/db/types/t-ido-den-type';
export type IdoDetailValues = {
  sagyoKbnId: number;
  nyushukoDat: string;
  sagyoSijiId: number;
  nyushukoBashoId: number;
};

export type IdoDetailTableValues = {
  idoDenId: number;
  sagyoKbnId: number;
  nyushukoDat: string;
  sagyosijiId: number;
  nyushukoBashoId: number;
  juchuFlg: number;
  kizaiId: number;
  kizaiNam: string;
  shozokuId: number;
  rfidYardQty: number;
  rfidKicsQty: number;
  planJuchuQty: number;
  planLowQty: number;
  planQty: number;
  resultAdjQty: number;
  resultQty: number;
  diffQty: number;
  ctnFlg: boolean;
  delFlag: boolean;
  saveFlag: boolean;
};

export type IdoEqptSelection = {
  kizaiId: number;
  kizaiNam: string;
  shozokuNam: string;
  bumonId: number;
  kizaiGrpCod: string;
  ctnFlg: boolean;
};

export type SelectedIdoEqptsValues = {
  kizaiId: number;
  kizaiNam: string;
  shozokuId: number;
  shozokuNam: string;
  kizaiGrpCod: string;
  dspOrdNum: number;
  rfidKicsQty: number;
  rfidYardQty: number;
  ctnFlg: boolean;
};
