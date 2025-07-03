import { z } from 'zod';

export const managerMaterDialogDetailsSchema = z.object({
  tantouId: z.number().optional(),
  tantouNam: z.string().optional(),
});
export type ManagerMasterDialogDetailsValues = z.infer<typeof managerMaterDialogDetailsSchema>;

export const mMHeader = [
  {
    key: 'name',
    label: '担当者名',
  },
];

export const managerMasterTableSchema = z.object({
  tantouId: z.number(),
  tantouNam: z.string().optional(),
  delFlg: z.boolean().optional(),
});
export type ManagerMasterTableValues = z.infer<typeof managerMasterTableSchema>;
