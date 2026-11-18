/**
 * catch した例外をログに出す（`[ERROR]` のメッセージと、あれば `[CAUSE]`）
 *
 * funcs.ts 層の catch で使う共通の出し方。出したあとの扱い（throw し直す・false を返す・ROLLBACK など）は呼び出し側で書く。
 *
 * ```ts
 * } catch (e) {
 *   logError(e);
 *   throw e;
 * }
 * ```
 *
 * サーバー（Server Action）でもクライアントでも使える（`'use server'` は付けない。付けると外から呼べる Server Action になる）。
 * @param e catch した値
 * @param options.stack true のとき `[STACK]`（スタックトレース）も出す
 */
export const logError = (e: unknown, options?: { stack?: boolean }) => {
  if (e instanceof Error) {
    console.error(`[ERROR] ${e.message}`);
    if (options?.stack) {
      console.error(`[STACK]`, e.stack);
    }
    if (e.cause) {
      console.error(`[CAUSE]`, e.cause);
    }
  } else {
    console.error(e);
  }
};
