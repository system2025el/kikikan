import { JUCHU_TEMPU } from '@/app/_lib/constants';

import { createAdminClient } from '../supabase-admin';

/**
 * 受注添付ファイル（Storageバケット juchu-tempu）へのアクセス層。
 *
 * ★このファイルには 'use server' を付けないこと。
 *   'use server' を付けるとexportした関数がServer Actionsとして外部から直接呼べるようになり、
 *   任意のパスに対してservice_role権限の署名付きURLを発行できる穴になる。
 *   呼び出しは必ず権限チェックを行う _lib/tempu-funcs.ts を経由させる。
 *
 * ★service_roleクライアントを使うためサーバー専用。クライアントコンポーネントに絶対にimportしないこと。
 *   storage.objects はRLS有効・ポリシー0本なので、anon/authenticatedからは一切アクセスできない。
 *   アップロードも表示も、ここで発行する署名付きURL経由でのみ行う。
 */

/**
 * オブジェクトキーを組み立てる
 * @param juchuHeadId 受注ヘッダーid
 * @returns バケット内のオブジェクトキー（{juchu_head_id}/{uuid}.pdf）
 */
export const buildTempuObjectPat = (juchuHeadId: number) => `${juchuHeadId}/${crypto.randomUUID()}.pdf`;

/**
 * アップロード用の署名付きURLを発行する
 * @param objectPat オブジェクトキー
 * @returns 署名付きURLとトークン
 */
export const createTempuUploadUrl = async (objectPat: string) => {
  const supabase = createAdminClient();
  try {
    return await supabase.storage.from(JUCHU_TEMPU.bucket).createSignedUploadUrl(objectPat);
  } catch (e) {
    throw new Error('[createTempuUploadUrl] Storageエラー:', { cause: e });
  }
};

/**
 * 表示・ダウンロード用の署名付きURLを発行する
 *
 * `download` オプションは付けない。付けるとStorage側がファイル名を二重にURLエンコードし、
 * 日本語のファイル名が `%E7%99%BA...` のまま保存されてしまうため
 * （検証結果: `filename*=UTF-8''%25E7%2599%25BA...`）。
 * 付けない場合は Content-Disposition が付かず Content-Type: application/pdf だけになるので、
 * ブラウザはPDFビューアでそのまま表示する。ダウンロードは画面側でblob経由にしている。
 * @param objectPat オブジェクトキー
 * @returns 署名付きURL
 */
export const createTempuSignedUrl = async (objectPat: string) => {
  const supabase = createAdminClient();
  try {
    return await supabase.storage.from(JUCHU_TEMPU.bucket).createSignedUrl(objectPat, JUCHU_TEMPU.signedUrlSec);
  } catch (e) {
    throw new Error('[createTempuSignedUrl] Storageエラー:', { cause: e });
  }
};

/**
 * オブジェクトの実体を削除する
 * @param objectPats オブジェクトキーの配列
 * @returns
 */
export const removeTempuObjects = async (objectPats: string[]) => {
  const supabase = createAdminClient();
  try {
    return await supabase.storage.from(JUCHU_TEMPU.bucket).remove(objectPats);
  } catch (e) {
    throw new Error('[removeTempuObjects] Storageエラー:', { cause: e });
  }
};
