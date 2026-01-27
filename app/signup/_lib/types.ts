import z from 'zod';

import { validationMessages } from '@/app/(main)/_lib/validation-messages';

// サインアップ用ヴァリデーション
export const SignupSchema = z.object({
  email: z.string().email({ message: validationMessages.email() }),
  password: z.string(),
  checkPassword: z.string(),
});
// .refine((data) => data.password === data.checkPassword, {
//   message: 'パスワードが一致しません',
//   path: ['checkPassword'],
// });
// サインアップ用型定義
export type SignupValues = z.infer<typeof SignupSchema>;
