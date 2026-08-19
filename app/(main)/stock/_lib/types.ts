import { z } from 'zod';

import { FAKE_NEW_ID } from '../../(masters)/_lib/constants';

export const StockSearchSchema = z
  .object({
    bumonId: z.number(),
    keyword: z.string(),
  })
  .refine((data) => !(data.bumonId === FAKE_NEW_ID && !data.keyword.trim()), {
    message: '部門を選択するか、機材名キーワードを入力してください',
    path: ['keyword'],
  });
export type StockSearchValues = z.infer<typeof StockSearchSchema>;

export type Bumon = {
  bumonId: number;
  bumonNam: string;
};

export type EqTableValues = {
  kizaiId: number;
  kizaiNam: string | null;
  kizaiQty: number | null;
  bumonId: number | null;
  bumonNam: string | null;
};

export type StockTableValues = {
  calDat: Date;
  kizaiId: number;
  zaikoQty: number;
};
