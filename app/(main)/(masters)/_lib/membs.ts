import z from 'zod';

export const zodNumberText = z
  .string()
  .refine((val) => !val || /^(0|[1-9]\d*)$/.test(val), {
    message: '数字を入力してください',
  })
  .transform((val) => (val ? Number(val) : undefined))
  .optional();
