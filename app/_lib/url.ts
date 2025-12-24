/**
 * URLを取得する関数
 * @returns ログイン画面のURL（開発中はlocalhost:3000）
 */
export const getUrl = () => {
  let url = process.env.VERCEL_URL ?? 'http://localhost:3000/';
  url = url.startsWith('http') ? url : `https://${url}`;
  return url.endsWith('/') ? url : `${url}/`;
};
