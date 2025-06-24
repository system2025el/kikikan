import { z } from 'zod';

export const managerMaterDialogDetailsSchema = z.object({
  Id: z.number(),
  Nam: z.string().optional(),
});
export type ManagerMasterDialogDetailsValues = z.infer<typeof managerMaterDialogDetailsSchema>;

export const mMHeader = [
  {
    id: 'check',
    label: '',
  },
  {
    id: 'managerName',
    label: '担当者名',
  },
];

export const managerMasterTableSchema = z.object({
  Id: z.number(),
  Nam: z.string().optional(),
});
export type ManagerMasterTableValues = z.infer<typeof managerMasterTableSchema>;
