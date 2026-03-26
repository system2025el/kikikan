export type NyukoListSearchValues = {
  juchuHeadId: number | null;
  nyukoDat: { from: Date | null; to: Date | null };

  nyukoBasho: number;
  section: string[];
};

export type NyukoTableValues = {
  juchuHeadId: number;
  koenNam: string;
  koenbashoNam: string;
  nyushukoDat: string;
  nyushukoBashoId: number;
  juchuKizaiHeadIdv: string;
  juchuKizaiHeadKbn: number;
  headNamv: string;
  sectionNamv: string;
  kokyakuNam: string;
  nchkSagyoStsId: number;
  nchkSagyoStsNamShort: string;
  nyukoFixFlg: boolean;
  nyuryokuUser: string;
};

export type NyukoKizai = {
  juchu_kizai_head_kbn: number;
  kizai_id: number;
  kizai_nam: string;
  planKizaiQty: number;
  plan_yobi_qty: number;
  plan_qty: number;
};
