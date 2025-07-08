import { z } from 'zod';

export const managersMaterDialogSchema = z.object({
  tantouId: z.number().optional(),
  tantouNam: z.string().optional(),
});
export type ManagersMasterDialogValues = z.infer<typeof managersMaterDialogSchema>;

export const managersMasterTableSchema = z.object({
  tantouId: z.number(),
  tantouNam: z.string().optional(),
  delFlg: z.boolean().optional(),
});
export type ManagersMasterTableValues = z.infer<typeof managersMasterTableSchema>;
