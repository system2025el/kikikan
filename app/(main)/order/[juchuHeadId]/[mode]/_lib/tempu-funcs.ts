'use server';

import { JUCHU_TEMPU } from '@/app/_lib/constants';
import {
  buildTempuObjectPat,
  createTempuSignedUrl,
  createTempuUploadUrl,
  removeTempuObjects,
} from '@/app/_lib/db/storage/juchu-tempu';
import {
  insertJuchuTempu,
  selectJuchuTempu,
  selectJuchuTempuCount,
  selectJuchuTempuList,
  updateJuchuTempuDelFlg,
} from '@/app/_lib/db/tables/t-juchu-tempu';
import { getCurrentUser } from '@/app/(main)/_lib/funcs';
import { permission } from '@/app/(main)/_lib/permission';

import { TempuValues } from './types';

/**
 * 受注添付ファイル。
 *
 * ここでの権限チェックはUIの制御とは別に必須。'use server' を付けたファイルのexportは
 * Server Actionsのエンドポイントとして外部から直接呼べるため、
 * とくに署名付きURLを発行する関数はサーバー側で毎回権限を確かめる。
 */

/** エラーをログに出して再スローする（funcs.ts と同じ形） */
const logAndThrow = (e: unknown): never => {
  if (e instanceof Error) {
    console.error(`[ERROR] ${e.message}`);
    if (e.cause) {
      console.error(`[CAUSE]`, e.cause);
    }
  } else {
    console.error(e);
  }
  throw e;
};

/** 権限を確認してユーザーを返す。権限が無ければ例外 */
const authorize = async (required: number) => {
  const user = await getCurrentUser();
  if (!user || !(user.permission.juchu & required)) {
    throw new Error('添付ファイルを操作する権限がありません');
  }
  return user;
};

/**
 * 受注添付ファイル一覧取得
 * @param juchuHeadId 受注ヘッダーid
 * @returns 受注添付ファイル一覧
 */
export const getJuchuTempuList = async (juchuHeadId: number): Promise<TempuValues[]> => {
  try {
    await authorize(permission.juchu_ref);

    if (!juchuHeadId) return [];

    const { data, error } = await selectJuchuTempuList(juchuHeadId);
    if (error) {
      throw new Error('[getJuchuTempuList] DBエラー:', { cause: error });
    }

    return data.map((d) => ({
      juchuTempuId: d.juchu_tempu_id,
      fileNam: d.file_nam,
      fileSiz: d.file_siz ?? 0,
      addDat: d.add_dat,
      addUser: d.add_user ?? '',
    }));
  } catch (e) {
    return logAndThrow(e);
  }
};

/**
 * アップロード用の署名付きURLを発行する
 *
 * ファイル本体はブラウザからSupabaseへ直接送るため、ここではチケットだけを返す。
 * オブジェクトキーはサーバー側で決め、クライアントの申告値は使わない。
 * @param juchuHeadId 受注ヘッダーid
 * @param fileNam ファイル名
 * @param fileSiz ファイルサイズ（バイト）
 * @returns アップロード先のパスとトークン。検証に引っかかった場合はエラーメッセージ
 */
export const getJuchuTempuUploadTicket = async (
  juchuHeadId: number,
  fileNam: string,
  fileSiz: number
): Promise<{ objectPat: string; token: string } | { error: string }> => {
  try {
    await authorize(permission.juchu_upd);

    if (!juchuHeadId) {
      return { error: '受注が保存されていないため添付できません。' };
    }
    if (!fileNam || !fileNam.toLowerCase().endsWith('.pdf')) {
      return { error: 'PDFファイルを選択してください。' };
    }
    if (fileNam.length > 255) {
      return { error: 'ファイル名が長すぎます。' };
    }
    if (!fileSiz) {
      return { error: '空のファイルはアップロードできません。' };
    }
    if (fileSiz > JUCHU_TEMPU.maxSize) {
      return { error: `ファイルサイズが${JUCHU_TEMPU.maxSize / 1024 / 1024}MBを超えています。` };
    }

    const { count, error: countError } = await selectJuchuTempuCount(juchuHeadId);
    if (countError) {
      throw new Error('[getJuchuTempuUploadTicket] DBエラー:', { cause: countError });
    }
    if ((count ?? 0) >= JUCHU_TEMPU.maxCount) {
      return { error: `添付できるのは${JUCHU_TEMPU.maxCount}件までです。` };
    }

    const objectPat = buildTempuObjectPat(juchuHeadId);
    const { data, error } = await createTempuUploadUrl(objectPat);
    if (error || !data) {
      throw new Error('[getJuchuTempuUploadTicket] Storageエラー:', { cause: error });
    }

    return { objectPat: data.path, token: data.token };
  } catch (e) {
    return logAndThrow(e);
  }
};

/**
 * アップロード済みのファイルをDBに登録する
 * @param juchuHeadId 受注ヘッダーid
 * @param objectPat オブジェクトキー
 * @param fileNam ファイル名
 * @param fileSiz ファイルサイズ（バイト）
 * @returns 登録後の受注添付ファイル一覧
 */
export const addJuchuTempu = async (
  juchuHeadId: number,
  objectPat: string,
  fileNam: string,
  fileSiz: number
): Promise<TempuValues[]> => {
  try {
    const user = await authorize(permission.juchu_upd);

    // クライアントから渡されたキーが、この受注のものであることを確かめる
    if (!juchuHeadId || !objectPat.startsWith(`${juchuHeadId}/`)) {
      throw new Error('不正な添付ファイルのパスです');
    }

    const { error } = await insertJuchuTempu({
      juchu_head_id: juchuHeadId,
      file_nam: fileNam,
      file_pat: objectPat,
      file_siz: fileSiz,
      mime_typ: 'application/pdf',
      del_flg: 0,
      add_dat: new Date().toISOString(),
      add_user: user.name,
    });
    if (error) {
      throw new Error('[addJuchuTempu] DBエラー:', { cause: error });
    }

    return await getJuchuTempuList(juchuHeadId);
  } catch (e) {
    return logAndThrow(e);
  }
};

/**
 * 表示・ダウンロード用の署名付きURLを取得する
 *
 * 有効期限は10分（JUCHU_TEMPU.signedUrlSec）。
 * 期限内はURLを知っていれば誰でも読めるので、ログに出したり外部に貼ったりしないこと。
 * @param juchuTempuId 受注添付ファイルid
 * @returns 署名付きURL
 */
export const getJuchuTempuViewUrl = async (juchuTempuId: number): Promise<string | null> => {
  try {
    await authorize(permission.juchu_ref);

    const { data, error } = await selectJuchuTempu(juchuTempuId);
    if (error) {
      if (error.code === 'PGRST116') {
        return null;
      }
      throw new Error('[getJuchuTempuViewUrl] DBエラー:', { cause: error });
    }

    const { data: urlData, error: urlError } = await createTempuSignedUrl(data.file_pat);
    if (urlError || !urlData) {
      throw new Error('[getJuchuTempuViewUrl] Storageエラー:', { cause: urlError });
    }

    return urlData.signedUrl;
  } catch (e) {
    return logAndThrow(e);
  }
};

/**
 * 受注添付ファイル削除
 *
 * 論理削除してからStorageの実体を消す。順序を逆にすると
 * 「一覧に行があるが実体が無い」状態が残るため。
 * @param juchuTempuId 受注添付ファイルid
 * @returns 削除後の受注添付ファイル一覧
 */
export const delJuchuTempu = async (juchuTempuId: number): Promise<TempuValues[]> => {
  try {
    const user = await authorize(permission.juchu_upd);

    const { data, error } = await selectJuchuTempu(juchuTempuId);
    if (error) {
      throw new Error('[delJuchuTempu] DBエラー:', { cause: error });
    }

    const { error: updError } = await updateJuchuTempuDelFlg(juchuTempuId, user.name);
    if (updError) {
      throw new Error('[delJuchuTempu] DBエラー:', { cause: updError });
    }

    // 実体の削除に失敗しても、行は削除済みなので画面には出ない（孤児オブジェクトとして残る）
    const { error: removeError } = await removeTempuObjects([data.file_pat]);
    if (removeError) {
      console.error('[CAUSE]', removeError);
    }

    return await getJuchuTempuList(data.juchu_head_id);
  } catch (e) {
    return logAndThrow(e);
  }
};
