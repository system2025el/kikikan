import z from 'zod';

export type JuchuValues = {
  juchuHeadId: number | undefined | null;
  delFlg?: number;
  juchuSts: string | undefined | null;
  juchuDat: Date | undefined | null;
  juchuRange: { strt: Date | undefined | null; end: Date | undefined | null };
  nyuryokuUser: string | undefined | null;
  koenNam: string | undefined | null;
  koenbashoNam: string | undefined | null;
  kokyaku: { id: number | undefined | null; name: string | undefined | null };
  kokyakuTantoNam: string | undefined | null;
  mem: string | undefined | null;
  nebikiAmt: number | undefined | null;
  zeiKbn?: string | undefined | null;
};

export const QuotHeadSchema = z.object({
  mituHeadId: z.number().nullable().optional(),
  juchuHeadId: z.number().nullable().optional(),
  mituSts: z.number().nullable().optional(),
  mituDat: z.date().nullable().optional(),
  mituYukoDat: z.date().nullable().optional(),
  mituHeadNam: z.string().nullable().optional(),
  kokyaku: z.object({
    id: z.number().nullable().optional(),
    name: z.string().nullable().optional(),
  }),
  nyuryokuUser: z.string().nullable().optional(),
  lendRange: z.object({
    strt: z.date().nullable().optional(),
    end: z.date().nullable().optional(),
  }),
  kokyakuTantoNam: z.string().nullable().optional(),
  koenNam: z.string().nullable().optional(),
  koenbashoNam: z.string().nullable().optional(),
  torihikiHoho: z.string().nullable().optional(),
  mituHonbanbiQty: z.number().nullable().optional(),
  biko: z.string().nullable().optional(),
});

export type QuotHeadValues = z.infer<typeof QuotHeadSchema>;
