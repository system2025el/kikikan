export type JuchuValues = {
  juchuHeadId: number | undefined | null;
  delFlg?: number;
  juchuSts: string | undefined | null;
  juchuDat: Date | undefined | null;
  juchuRange: { strt: Date | undefined | null; end: Date | undefined | null };
  nyuryokuUser: string | undefined | null;
  koenNam: string | undefined | null;
  koenbashoNam: string | undefined | null;
  kokyaku: string | undefined | null;
  kokyakuTantoNam: string | undefined | null;
  mem: string | undefined | null;
  nebikiAmt: number | undefined | null;
  zeiKbn?: string | undefined | null;
};

export type QuotHeadValues = {
  mituHeadId: number | undefined | null;
  juchuHeadId: number | undefined | null;
  mituSts: number | undefined | null;
  mituDat: Date | undefined | null;
  mituYukoDat: Date | undefined | null;
  mituHeadNam: string | undefined | null;
  kokyaku: { id: number | undefined | null; nam: string | undefined | null };
  nyuryokuUser: string | undefined | null;
  lendRange: { strt: Date | undefined | null; end: Date | undefined | null };
  kokyakuTantoNam: string | undefined | null;
  koenNam: string | undefined | null;
  koenbashoNam: string | undefined | null;
  torihikiHoho: string | undefined | null;
  mituHonbanbiQty: number | undefined | null;
  biko: string | undefined | null;
};
