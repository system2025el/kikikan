import z from 'zod';

// ユーザーログイン用ヴァリデーション
export const UserSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});
// ログイン用型定義
export type UserValues = z.infer<typeof UserSchema>;
