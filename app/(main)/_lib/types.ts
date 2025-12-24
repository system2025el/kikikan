import z from 'zod';

export const LockSchema = z.object({
  lockShubetu: z.number(),
  headId: z.number(),
  addDat: z.date(),
  addUser: z.string(),
});

export type LockValues = z.infer<typeof LockSchema>;
