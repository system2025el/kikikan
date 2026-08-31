import z from 'zod';

export const LockSchema = z.object({
  lockShubetu: z.number(),
  headId: z.number(),
  addDat: z.string(),
  addUser: z.string(),
  mail_adr: z.string(),
});

export type LockValues = z.infer<typeof LockSchema>;

export type User = {
  id: string;
  name: string;
  email: string;
  permission: {
    juchu: number;
    nyushuko: number;
    masters: number;
    loginSetting: number;
    ht: number;
    schedule: number;
  };
};

/**
 * 本番日（仕込・RH・GP・本番）1件分。
 * 受注ヘッダー単位のテンプレートでも、受注機材ヘッダー単位の展開結果でも同じ形で扱う。
 */
export type HonbanbiValues = {
  juchuHonbanbiShubetuId: number;
  juchuHonbanbiDat: Date;
  mem: string | null;
  juchuHonbanbiAddQty: number | null;
};
