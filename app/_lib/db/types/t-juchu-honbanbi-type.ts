import { JuchuKizaiHonbanbi } from './t-juchu-kizai-honbanbi-type';

/**
 * 受注ヘッダー単位の本番日テンプレート。
 * 受注機材ヘッダーには属さないため juchu_kizai_head_id を持たない。
 */
export type JuchuHonbanbi = Omit<JuchuKizaiHonbanbi, 'juchu_kizai_head_id'>;
