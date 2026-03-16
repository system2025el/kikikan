/**
 * URLを取得する関数
 * @returns ログイン画面のURL（開発中はlocalhost:3000）
 */
export const getUrl = () => {
  // let url = process.env.VERCEL_URL ?? 'http://localhost:3000/';
  // url = url.startsWith('http') ? url : `https://${url}`;
  // return url.endsWith('/') ? url : `${url}/`;

  console.log('本番？', process.env.VERCEL_PROJECT_PRODUCTION_URL);
  console.log('場所:', process.env.NEXT_PUBLIC_VERCEL_ENV);

  // 本番環境固定URL
  if (process.env.NEXT_PUBLIC_VERCEL_ENV === 'production') {
    console.log('本番');
    return 'https://kikikan-psi.vercel.app/';
  }

  // 自動生成されたURL
  if (process.env.NEXT_PUBLIC_VERCEL_ENV === 'preview') {
    console.log('開発');
    return `https://${process.env.VERCEL_URL}`;
  }

  // ローカル環境
  console.log('ローカル');
  return 'http://localhost:3000';
};
