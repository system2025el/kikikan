export const validationMessages = {
  maxStringLength: (n: number): string => `${n}文字以内で入力してください`,
  maxNumberLength: (n: number): string => `${n}桁以内で入力してください`,
  required: (): string => '必須項目です',
  email: (): string => '有効なメールアドレスを入力してください',
  number: (): string => '数字を入力してください',
};
