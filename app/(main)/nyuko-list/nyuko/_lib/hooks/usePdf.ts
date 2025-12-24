import fontkit from '@pdf-lib/fontkit';
import { PDFDocument, PDFFont, PDFPage, rgb } from 'pdf-lib';
import { useEffect, useState } from 'react';

import { NyukoKizai } from '../../../_lib/types';

// PDF出力用のモデル
export type PdfModel = {
  item1: number; //受注番号
  item2: string; //年月日
  item3: string; //公演名
  item4: string; //顧客名
  item5: string; //貸出日
  item6: string; //返却日
  item7: string; //公演場所
  item8: number; //本番日数
  item9: string; //担当
  item10: string; //備考
  item11: string; //ご担当者様
  item12: NyukoKizai[]; //機材詳細
  item13?: string;
};

// PDFデータ生成フック
export const usePdf = (): [(params: PdfModel[]) => Promise<Blob>] => {
  // フォント
  const [font, setFont] = useState<ArrayBuffer>(new ArrayBuffer(0));
  // イメージ
  const [image, setImage] = useState<ArrayBuffer>(new ArrayBuffer(0));

  // フォントの読み込み
  const setupFont = async () => {
    const fontBytes = await fetch('/fonts/ipaexg.ttf').then((res) => res.arrayBuffer());
    setFont(fontBytes);
  };

  // イメージの読み込み
  const setupImage = async () => {
    const imageBytes = await fetch('/images/sign.png').then((res) => res.arrayBuffer());
    setImage(imageBytes);
  };

  useEffect(() => {
    Promise.allSettled([setupFont(), setupImage()])
      .then(() => {})
      .catch(() => {})
      .finally(() => {});
  }, []);

  // PDF生成関数
  const printShuko = async (params: PdfModel[]): Promise<Blob> => {
    const pdfDoc = await PDFDocument.create();
    pdfDoc.registerFontkit(fontkit);
    const customFont = await pdfDoc.embedFont(font);

    // 各注文情報ごとにページを生成
    for (const param of params) {
      console.log('params', params);
      let page = pdfDoc.addPage();

      /* ---------------- ヘッダー：納品書 ---------------- */
      page.drawText('員　数　票', {
        x: 257,
        y: 790,
        font: customFont,
        size: 20,
        color: rgb(0, 0, 0),
      });

      /* ---------------- 表：受注番号・年月日 ---------------- */
      const tableX = 440;
      const tableY = 810;
      const cellWidth = 60;
      const cellHeight = 15;

      // 外枠
      page.drawRectangle({
        x: tableX,
        y: tableY - cellHeight * 2,
        width: cellWidth * 2,
        height: cellHeight * 2,
        borderColor: rgb(0, 0, 0),
        borderWidth: 0.5,
      });

      // 縦線
      page.drawLine({
        start: { x: tableX + cellWidth, y: tableY - cellHeight * 2 },
        end: { x: tableX + cellWidth, y: tableY },
        thickness: 0.5,
        color: rgb(0, 0, 0),
      });

      // 横線
      page.drawLine({
        start: { x: tableX, y: tableY - cellHeight },
        end: { x: tableX + cellWidth * 2, y: tableY - cellHeight },
        thickness: 0.5,
        color: rgb(0, 0, 0),
      });

      // ヘッダー背景
      page.drawRectangle({
        x: tableX,
        y: tableY - cellHeight,
        width: cellWidth,
        height: cellHeight,
        color: rgb(0.9, 0.9, 0.9),
        borderColor: rgb(0, 0, 0),
        borderWidth: 0.5,
      });
      page.drawRectangle({
        x: tableX + cellWidth,
        y: tableY - cellHeight,
        width: cellWidth,
        height: cellHeight,
        color: rgb(0.9, 0.9, 0.9),
        borderColor: rgb(0, 0, 0),
        borderWidth: 0.5,
      });

      // ヘッダーテキスト
      page.drawText('受注番号', { x: tableX + 14, y: tableY - 12, font: customFont, size: 8 });
      page.drawText('年 月 日', { x: tableX + cellWidth + 18, y: tableY - 12, font: customFont, size: 8 });

      // データ
      const fontSize = 8;

      const text1 = String(param.item1);
      const text1Width = customFont.widthOfTextAtSize(text1, fontSize);
      page.drawText(text1, {
        x: tableX + (cellWidth - text1Width) / 2,
        y: tableY - cellHeight - 12,
        font: customFont,
        size: fontSize,
      });

      const text2 = param.item2;
      const text2Width = customFont.widthOfTextAtSize(text2, fontSize);
      page.drawText(text2, {
        x: tableX + cellWidth + (cellWidth - text2Width) / 2,
        y: tableY - cellHeight - 12,
        font: customFont,
        size: fontSize,
      });

      /* ---------------- 取引先：会社名 + 御中 ---------------- */
      const textX = 50;
      const textY = tableY - cellHeight * 2 - 20;
      page.drawText(`${param.item4} 御中`, {
        x: textX,
        y: textY,
        font: customFont,
        size: 13,
        color: rgb(0, 0, 0),
      });

      /* ---------------- 公演情報 ---------------- */
      const rowHeight = 20;
      let currentY = 750;
      const pageWidth = 340;
      const FONT_SIZE = 9;
      const colWidthsPerRow = [
        [45, pageWidth - 45], // 1行目
        [45, 80, 45, 80, 50, 40], // 2行目
        [45, pageWidth - 45], // 3行目
        [45, pageWidth - 45, 45, pageWidth - 45], // 4行目
        [45, 150, 45, 100], // 5行目
      ];

      // 幅計算・省略用のヘルパー関数
      // テキストの実際の幅を取得する
      const getTextWidth = (text: string) => {
        return customFont.widthOfTextAtSize(text, FONT_SIZE);
      };

      // 指定した幅(maxWidth)に収まるように「…」で省略する関数
      const truncateToFit = (text: string, maxWidth: number) => {
        if (!text) return '';

        // そのままで収まるなら返す
        if (getTextWidth(text) <= maxWidth) {
          return text;
        }

        // 収まらない場合、収まるまで末尾を削る
        let truncated = text;
        const ellipsis = '…';

        // "..."を含めた幅が maxWidth 以下になるまでループ
        while (truncated.length > 0 && getTextWidth(truncated + ellipsis) > maxWidth) {
          truncated = truncated.slice(0, -1);
        }

        return truncated + ellipsis;
      };
      // メインのフォーマット関数
      const formatWithParens = (
        title: string | null | undefined,
        subtitle: string | null | undefined,
        maxWidth: number
      ) => {
        const t = title ?? '';
        const s = subtitle ?? '';
        const fullString = `${t}（${s}）`;

        // 全体が収まるならそのまま返す
        if (getTextWidth(fullString) <= maxWidth) return fullString;

        // タイトルの幅を確認
        const tWidth = getTextWidth(t);

        // 「（...）」などの記号分の幅
        const decorationWidth = getTextWidth('（…）');

        // サブタイトルに使える幅 = 全体幅 - タイトル - 記号
        const subAvailableWidth = maxWidth - tWidth - decorationWidth;

        // サブタイトルを入れる余地がある場合
        if (subAvailableWidth > 0) {
          const truncatedSub = truncateToFit(s, subAvailableWidth + getTextWidth('…'));
          return `${t}（${truncatedSub}）`;
        }

        // タイトルすら長い、あるいはサブタイトルを入れる隙間がない場合は全体を省略
        return truncateToFit(fullString, maxWidth);
      };

      const contactName = param.item11;
      let displayContact = '';

      if (contactName) {
        const suffix = ' 様';
        const maxNameWidth = 90 - getTextWidth(suffix);

        const namePart = truncateToFit(contactName, maxNameWidth);
        displayContact = `${namePart}${suffix}`;
      } else {
        displayContact = '';
      }

      const TITLE_MAX_WIDTH = 287;

      const rows = [
        ['公 演 名', formatWithParens(param.item3, param.item13, TITLE_MAX_WIDTH)],
        ['貸 出 日', param.item5, '返 却 日', param.item6, '本番日数', param.item8 ?? ''],
        ['公演場所', param.item7],
        ['担　　当', param.item9],
        ['備　　考', param.item10, '御担当者', displayContact ?? ''], // displayContactは上で計算済み
      ];

      rows.forEach((row, rowIndex) => {
        const colWidths = colWidthsPerRow[rowIndex];
        let colX = textX - 20;

        // 横線
        page.drawLine({
          start: { x: colX, y: currentY },
          end: { x: colX + pageWidth, y: currentY },
          thickness: 1,
          color: rgb(0, 0, 0),
        });

        row.forEach((cellText, colIndex) => {
          const cellWidth = colWidths[colIndex] || pageWidth;

          // 背景色（偶数列のみ）
          if (colIndex % 2 === 0) {
            page.drawRectangle({
              x: colX,
              y: currentY - rowHeight,
              width: cellWidth,
              height: rowHeight,
              color: rgb(0.9, 0.9, 0.9),
            });
          }

          // 枠線
          page.drawRectangle({
            x: colX,
            y: currentY - rowHeight,
            width: cellWidth,
            height: rowHeight,
            borderColor: rgb(0, 0, 0),
            borderWidth: 1,
          });

          const textToDraw = String(cellText);
          const textWidth = customFont.widthOfTextAtSize(textToDraw, FONT_SIZE);

          let textX: number;
          if (typeof cellText === 'number') {
            // 数値は右寄せ
            textX = colX + cellWidth - textWidth - 3;
          } else {
            // 文字列は左寄せ
            textX = colX + 5;
          }

          page.drawText(textToDraw, {
            x: textX,
            y: currentY - rowHeight + 7, // Y位置調整
            font: customFont,
            size: FONT_SIZE,
            color: rgb(0, 0, 0),
          });

          colX += cellWidth;
        });

        currentY -= rowHeight; // 次の行に移動
      });

      /* ---------------- 署名画像 ---------------- */
      const pngImage = await pdfDoc.embedPng(image);
      pngImage.scale(1);
      page.drawImage(pngImage, {
        x: 380,
        y: currentY + 25,
        width: 180,
        height: 75,
      });

      /* ---------------- 機材情報 ---------------- */
      const drawTableHeader = (
        targetPage: PDFPage, // PDFPageオブジェクト
        font: PDFFont,
        startX: number,
        startY: number,
        rowHeight: number,
        colWidths: number[],
        headerTexts: string[]
      ) => {
        let currentX = startX;
        headerTexts.forEach((text, i) => {
          const cellWidth = colWidths[i];
          targetPage.drawRectangle({
            x: currentX,
            y: startY - rowHeight,
            width: cellWidth,
            height: rowHeight,
            color: rgb(0.9, 0.9, 0.9),
            borderColor: rgb(0, 0, 0),
            borderWidth: 1,
          });
          const fontSize = 10;
          const textWidth = font.widthOfTextAtSize(text, fontSize);
          targetPage.drawText(text, {
            x: currentX + (cellWidth - textWidth) / 2,
            y: startY - rowHeight + (rowHeight - fontSize) / 2,
            font: font,
            size: fontSize,
            color: rgb(0, 0, 0),
          });
          currentX += cellWidth;
        });
      };

      const tableStartX = textX - 20;
      const tableStartY = currentY - 10;
      const tableRowHeight = 20; // 1行の高さを定数化
      const pageStartY = 800; // 新しいページのY座標の開始位置
      const marginBottom = 50; // これより下には描画しないというマージン

      const tableColWidths = [300, 40, 190]; //機材名の枠は、公演情報の枠と同じ幅で設定
      const headerTexts = ['機　　材　　名', '合計数', '備　　考'];

      // 現在の描画Y座標を管理する変数
      const tableCurrentY = tableStartY;

      // 最初のページにヘッダーを描画
      drawTableHeader(page, customFont, tableStartX, tableCurrentY, tableRowHeight, tableColWidths, headerTexts);

      const tableData =
        param.item12 && param.item12.length > 0 ? param.item12 : [{ kizai_nam: '', plan_qty: '', plan_yobi_qty: '' }];

      let currentBottomY = tableStartY - tableRowHeight;
      //ループで機材データを描画
      for (const item of tableData) {
        // 次の行がページに収まるかをチェック
        if (currentBottomY - tableRowHeight < marginBottom) {
          // スペースがなければ新しいページを追加
          page = pdfDoc.addPage();
          // Y座標を新しいページの開始位置にリセット
          const newPageY = pageStartY;
          // 新しいページにヘッダーを描画
          drawTableHeader(page, customFont, tableStartX, newPageY, tableRowHeight, tableColWidths, headerTexts);
          // Y座標も新しいヘッダーの底辺にリセット
          currentBottomY = newPageY - tableRowHeight;
        }

        // 現在の行を描画するためにY座標を更新
        currentBottomY -= tableRowHeight;
        const y = currentBottomY; // 現在行の底辺のY座標
        let colX = tableStartX;
        const textMaxWidth = tableColWidths[0] - 6;
        const truncatedText = formatTextLine(
          item.kizai_nam ?? '',
          customFont,
          10, // フォントサイズ
          textMaxWidth
        );
        // 機材名セル
        page.drawRectangle({
          x: colX,
          y,
          width: tableColWidths[0],
          height: tableRowHeight,
          borderColor: rgb(0, 0, 0),
          borderWidth: 1,
        });
        page.drawText(truncatedText, {
          x: colX + 3,
          y: y + (tableRowHeight - 10) / 2,
          font: customFont,
          size: 10,
        });
        colX += tableColWidths[0];

        // 合計数セル
        page.drawRectangle({
          x: colX,
          y,
          width: tableColWidths[1],
          height: tableRowHeight,
          borderColor: rgb(0, 0, 0),
          borderWidth: 1,
        });

        const planQtyText = `${item.plan_qty ?? ''}`;
        const planQtyTextWidth = customFont.widthOfTextAtSize(planQtyText, 10);
        page.drawText(planQtyText, {
          x: colX + tableColWidths[1] - planQtyTextWidth - 3, // 3pxのパディング
          y: y + (tableRowHeight - 10) / 2,
          font: customFont,
          size: 10,
        });
        colX += tableColWidths[1];

        // 備考セル
        page.drawRectangle({
          x: colX,
          y,
          width: tableColWidths[2],
          height: tableRowHeight,
          borderColor: rgb(0, 0, 0),
          borderWidth: 1,
        });

        const planYobiQty = item.plan_yobi_qty ?? 0;
        // 予備数量が 0 または "0" のときは表示しない
        if (Number(planYobiQty) !== 0) {
          const planYobiQtyText = ` 予備:${planYobiQty}`;
          const planYobiQtyWidth = customFont.widthOfTextAtSize(planYobiQtyText, 10);
          page.drawText(planYobiQtyText, {
            x: colX + tableColWidths[1] - planYobiQtyWidth - 3, // 右寄せ + 3pxパディング
            y: y + (tableRowHeight - 10) / 2,
            font: customFont,
            size: 10,
          });
        }

        colX += tableColWidths[2];
      }
    }

    const pdfBytes = await pdfDoc.save();
    return new Blob([pdfBytes.buffer as ArrayBuffer], { type: 'application/pdf' });
  };

  return [printShuko];
};
//一行切り詰め
const formatTextLine = (text: string, font: PDFFont, fontSize: number, maxWidth: number) => {
  // 1行に収まる場合
  if (font.widthOfTextAtSize(text, fontSize) <= maxWidth) {
    return text;
  }

  let currentText = '';
  let currentWidth = 0;

  const items = text.split('');

  for (const item of items) {
    const wordWidth = font.widthOfTextAtSize(item, fontSize);
    if (currentWidth + wordWidth <= maxWidth) {
      currentText += item;
      currentWidth += wordWidth;
    } else {
      // 1行分のテキスト確定
      break;
    }
  }

  return currentText;
};
