import z from 'zod';

import { validationMessages } from '@/app/(main)/_lib/validation-messages';

// ユーザーログイン用ヴァリデーション
export const UserSchema = z.object({
  email: z.string().email({ message: validationMessages.email() }),
  password: z.string(),
});
// ログイン用型定義
export type UserValues = z.infer<typeof UserSchema>;
