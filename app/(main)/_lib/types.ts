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
