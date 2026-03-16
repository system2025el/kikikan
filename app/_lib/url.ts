/**
 * URLを取得する関数
 * @returns ログイン画面のURL（開発中はlocalhost:3000）
 */
export const getUrl = () => {
  let url = process.env.VERCEL_URL ?? 'http://localhost:3000/';
  url = url.startsWith('http') ? url : `https://${url}`;
  return url.endsWith('/') ? url : `${url}/`;

  // 本番環境固定URL
  // if (process.env.NEXT_PUBLIC_SITE_URL) {
  //   return process.env.NEXT_PUBLIC_SITE_URL;
  // }

  // // 自動生成されたURL
  // if (process.env.VERCEL_URL) {
  //   return `https://${process.env.VERCEL_URL}`;
  // }

  // // ローカル環境
  // return 'http://localhost:3000';
};
