import z from 'zod';

export const VehsMasterTableSchema = z.object({
  sharyoId: z.number(),
  sharyoNam: z.string(),
  delFlg: z.boolean(),
  mem: z.string(),
  dspFlg: z.boolean(),
});

export type VehsMasterTableValues = z.infer<typeof VehsMasterTableSchema>;

const vehsMasterDialogSchema = z.object({
  sharyoId: z.number().optional(),
  sharyoNam: z.string(),
  delFlg: z.boolean().optional(),
  mem: z.string().optional(),
  dspFlg: z.boolean().optional(),
  dspOrderNum: z.number().optional(),
  addDate: z.date(),
  addUser: z.string(),
  updDate: z.date(),
  updUser: z.string(),
});

export const VehsMasterDialogSchema = vehsMasterDialogSchema.omit({
  dspOrderNum: true,
  addDate: true,
  addUser: true,
  updDate: true,
  updUser: true,
});

export type VehsAllValues = z.infer<typeof vehsMasterDialogSchema>;
export type VehsMasterDialogValues = z.infer<typeof VehsMasterDialogSchema>;
