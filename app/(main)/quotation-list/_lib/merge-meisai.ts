import { QuotMeisaiHeadValues } from './types';

type QuotMeisaiRow = NonNullable<QuotMeisaiHeadValues['meisai']>[number];

/**
 * 見積の明細1行を、1つ上の明細ヘッダーの明細リストへ足し込む（「合算」「一括合算」ボタン共通）
 *
 * 足し込み先は同じ名称の最初の1行だけを見る（無ければ行を追加）。
 * 数量がマイナスの行（返却の明細）は減らす方向、プラスの行（追加の明細）は増やす方向で、
 * 単価・数量・本番日数のどれが一致するかで、行の削除・値の加減算・行の追加を決める。
 * @param target 足し込み先の明細リスト（変更しない）
 * @param m 足し込む明細行
 * @returns 足し込み後の明細リスト
 */
export const mergeMeisaiInto = (target: QuotMeisaiRow[], m: QuotMeisaiRow): QuotMeisaiRow[] => {
  const newMeisai = [...target];
  const targetIndex = newMeisai.findIndex((t) => t.nam === m.nam);

  if (targetIndex !== -1) {
    const targetQty = Number(newMeisai[targetIndex].qty) || 0;
    const targetHonbanbiQty = Number(newMeisai[targetIndex].honbanbiQty) || 0;
    const targetTankaAmt = Number(newMeisai[targetIndex].tankaAmt) || 0;

    // 返却明細
    if ((m.qty ?? 0) < 0) {
      // 単価一致
      if (targetTankaAmt === (m.tankaAmt ?? 0)) {
        if (targetQty === -1 * (m.qty ?? 0) && targetHonbanbiQty === (m.honbanbiQty ?? 0)) {
          // 数量、本番日数一致対象から削除
          newMeisai.splice(targetIndex, 1);
        } else if (targetQty === -1 * (m.qty ?? 0) && targetHonbanbiQty !== (m.honbanbiQty ?? 0)) {
          // 数量一致、本番日数不一致なら本番日数のみ減らす
          newMeisai[targetIndex] = {
            ...newMeisai[targetIndex],
            honbanbiQty: targetHonbanbiQty - (m.honbanbiQty ?? 0),
          };
        } else if (targetQty !== -1 * (m.qty ?? 0) && targetHonbanbiQty === (m.honbanbiQty ?? 0)) {
          // 数量不一致、本番日数一致なら数量のみ減らす
          newMeisai[targetIndex] = {
            ...newMeisai[targetIndex],
            qty: targetQty + (m.qty ?? 0),
          };
        } else if (targetQty !== -1 * (m.qty ?? 0) && targetHonbanbiQty !== (m.honbanbiQty ?? 0)) {
          // 数量不一致、本番日数不一致なら本番日数を減らし、数量を減らして本番日数が返却分の項目を追加
          newMeisai[targetIndex] = {
            ...newMeisai[targetIndex],
            honbanbiQty: targetHonbanbiQty - (m.honbanbiQty ?? 0),
          };
          newMeisai.push({
            ...m,
            id: null,
            qty: targetQty + (m.qty ?? 0),
            honbanbiQty: m.honbanbiQty,
          });
        }
        // 単価不一致
      } else {
        if (targetQty === -1 * (m.qty ?? 0) && targetHonbanbiQty === (m.honbanbiQty ?? 0)) {
          // 数量、本番日数一致なら単価のみ減らす
          newMeisai[targetIndex] = {
            ...newMeisai[targetIndex],
            tankaAmt: targetTankaAmt - (m.tankaAmt ?? 0),
          };
        } else if (targetQty === -1 * (m.qty ?? 0) && targetHonbanbiQty !== (m.honbanbiQty ?? 0)) {
          // 数量一致、本番日数不一致なら本番日数を減らし、単価を減らした返却分の本番日数で項目追加
          newMeisai[targetIndex] = {
            ...newMeisai[targetIndex],
            honbanbiQty: targetHonbanbiQty - (m.honbanbiQty ?? 0),
          };
          newMeisai.push({
            ...newMeisai[targetIndex],
            id: null,
            honbanbiQty: m.honbanbiQty,
            tankaAmt: targetTankaAmt - (m.tankaAmt ?? 0),
          });
        } else if (targetQty !== -1 * (m.qty ?? 0)) {
          // 数量不一致なら項目追加
          newMeisai.push({ ...m, id: null });
        }
      }

      // 追加明細
    } else {
      // 単価一致
      if (targetTankaAmt === (m.tankaAmt ?? 0)) {
        if (targetHonbanbiQty === (m.honbanbiQty ?? 0)) {
          // 本番日数一致なら数量のみ増やす
          newMeisai[targetIndex] = {
            ...newMeisai[targetIndex],
            qty: targetQty + (m.qty ?? 0),
          };
        } else if (targetQty === (m.qty ?? 0)) {
          // 数量一致なら本番日数のみ増やす
          newMeisai[targetIndex] = {
            ...newMeisai[targetIndex],
            honbanbiQty: targetHonbanbiQty + (m.honbanbiQty ?? 0),
          };
        } else {
          // 数量、本番日数不一致なら項目追加
          newMeisai.push({ ...m, id: null });
        }
        // 単価不一致
      } else {
        if (targetQty === (m.qty ?? 0) && targetHonbanbiQty === (m.honbanbiQty ?? 0)) {
          // 数量、本番日数一致なら単価のみ増やす
          newMeisai[targetIndex] = {
            ...newMeisai[targetIndex],
            tankaAmt: targetTankaAmt + (m.tankaAmt ?? 0),
          };
        } else {
          // 数量または本番日数不一致なら項目追加
          newMeisai.push({ ...m, id: null });
        }
      }
    }
  } else {
    // 一致する名称がない場合は、新しく追加
    newMeisai.push({ ...m, id: null });
  }

  return newMeisai;
};
