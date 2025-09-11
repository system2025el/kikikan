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

export const quotMeisaiHeadSchema = z.object({
  mituHeadId: z.number().int().nullish(),
  mituMeisaiHeadId: z.number().int().nullish(),
  mituMeisaiHeadNam: z.string().nullish(),
  headNamDspFlg: z.boolean(),
  meisai: z
    .array(
      z.object({
        nam: z.string().max(50).nullish(),
      })
    )
    .nullish(),
});

// ZodスキーマからTypeScriptの型を生成 (元の型と一致することを確認)
export type QuotMaisaiHeadValues = z.infer<typeof quotMeisaiHeadSchema>;

export const QuotHeadSchema = z.object({
  mituHeadId: z.number().nullish(),
  juchuHeadId: z.number().nullish(),
  mituSts: z.number().nullish(),
  mituDat: z.date().nullish(),
  mituYukoDat: z.date().nullish(),
  mituHeadNam: z.string().max(50).nullish(),
  kokyaku: z.string().max(50).nullish(),
  nyuryokuUser: z.object({
    id: z.string().max(20).nullish(),
    name: z.string().max(20).nullish(),
  }),
  lendRange: z.object({
    strt: z.date().nullish(),
    end: z.date().nullish(),
  }),
  kokyakuTantoNam: z.string().max(20).nullish(),
  koenNam: z.string().max(50).nullish(),
  koenbashoNam: z.string().max(100).nullish(),
  torihikiHoho: z.string().nullish(),
  mituHonbanbiQty: z
    .string()
    .regex(/^[0-9]+$/)
    .max(2, { message: '2桁以下で入力してください。' })
    .nullable()
    .optional(),
  biko: z.string().max(100).nullish(),
  meisaiHeads: z.object({
    kizai: z.array(quotMeisaiHeadSchema),
    labor: z.array(quotMeisaiHeadSchema),
    other: z.array(quotMeisaiHeadSchema),
    comment: z.string().max(100).nullish(),
  }),
});

export type QuotHeadValues = z.infer<typeof QuotHeadSchema>;
