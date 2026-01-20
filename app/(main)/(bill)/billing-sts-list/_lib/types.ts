/**
 * 請求状況一覧テーブルのタイプ
 */
export type BillingStsTableValues = {
  juchuId: number;
  kokyakuNam: string;
  kokyakuTantoNam: string;
  koenNam: string;
  sts: string;
  ordNum: number;
  heads: {
    kziHeadId: number;
    ordNum: number;
    headNam: string;
    shukoDat: string;
    nyukoDat: string;
    seikyuDat: string | null;
  }[];
};

export type BillingStsSearchValues = {
  //kokyaku: number | null;
  kokyaku: string | null;
  kokyakuTantoNam: string | null;
  sts: string[];
};
