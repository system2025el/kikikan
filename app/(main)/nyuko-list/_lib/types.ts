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
  plan_qty: number;
  mem2: string;
  kizai_grp_cod: number;
  dsp_ord_num: number;
};

/**
 * 入庫セット機材グループ
 */
export type EqptGroup = {
  parent: NyukoKizai;
  children: NyukoKizai[];
};
