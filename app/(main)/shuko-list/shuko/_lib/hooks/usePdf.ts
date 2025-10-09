import fontkit from '@pdf-lib/fontkit';
import { PDFDocument, rgb } from 'pdf-lib';
import { useEffect, useState } from 'react';

// PDF出力用のモデル
export type PdfModel = {
  item1: number; //受注番号
  item2: Date; //年月日
  item3: string; //公演名
  item4: string; //顧客名
  item5: Date; //貸出日
  item6: Date; //返却日
  item7: string; //公演場所
  item8: number; //本番日数
  item9: string; //担当
  item10: string; //備考
  item11: string; //ご担当者様
  item12: string; //本番日
  //item13?: ShukoKizai[]; //機材詳細
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
      const page = pdfDoc.addPage();

      /* ---------------- ヘッダー：納品書 ---------------- */
      page.drawText('納　品　書', {
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
      page.drawText(String(param.item1), { x: tableX + 17, y: tableY - cellHeight - 12, font: customFont, size: 8 });
      page.drawText(param.item2.toISOString().slice(0, 10), {
        x: tableX + cellWidth + 9,
        y: tableY - cellHeight - 12,
        font: customFont,
        size: 8,
      });

      /* ---------------- 取引先：会社名 + 御中 ---------------- */
      const textX = 50;
      const textY = tableY - cellHeight * 2 - 20;
      page.drawText(`${param.item3} 御中`, {
        x: textX,
        y: textY,
        font: customFont,
        size: 13,
        color: rgb(0, 0, 0),
      });

      /* ---------------- 公演情報 ---------------- */
      const rowHeight = 20;
      let currentY = 730;
      const pageWidth = 300;
      const colWidthsPerRow = [
        [45, pageWidth - 45], // 1行目
        [45, 65, 45, 65, 50, 30], // 2行目
        [45, pageWidth - 45], // 3行目
        [45, pageWidth - 45, 45, pageWidth - 45], // 4行目
        [45, 150, 45, 60], // 5行目
        [45, pageWidth - 45], // 6行目
      ];

      const rows = [
        ['公 演 名', param.item4],
        ['貸 出 日', param.item5, '返 却 日', param.item6, '本番日数', `${param.item8} 日`],
        ['公演場所', param.item7],
        ['担　　当', param.item9],
        ['備　　考', param.item10, '御担当者', `${param.item11} 様`],
        ['本 番 日', param.item12],
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
          const textToDraw = cellText instanceof Date ? cellText.toLocaleDateString() : String(cellText);
          page.drawText(textToDraw, {
            x: colX + 5,
            y: currentY - rowHeight + 7,
            font: customFont,
            size: 9,
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
        x: 360,
        y: currentY + 45,
        width: 200,
        height: 75,
      });

      /* ---------------- 機材情報 ---------------- */
      const tableStartY = currentY - 10;
      const colWidths = [250, 30, 250]; // 機材・数量・備考
      const headerRow = ['機　　材　　名', '数量', '備　　考'];
      let colX = textX - 20;

      // ヘッダー描画
      headerRow.forEach((text, i) => {
        const cellWidth = colWidths[i];
        page.drawRectangle({
          x: colX,
          y: tableStartY - rowHeight,
          width: cellWidth,
          height: rowHeight,
          color: rgb(0.9, 0.9, 0.9),
          borderColor: rgb(0, 0, 0),
          borderWidth: 1,
        });
        const fontSize = 10;
        const textWidth = customFont.widthOfTextAtSize(text, fontSize);
        page.drawText(text, {
          x: colX + (cellWidth - textWidth) / 2,
          y: tableStartY - rowHeight + (rowHeight - fontSize) / 2,
          font: customFont,
          size: fontSize,
          color: rgb(0, 0, 0),
        });
        colX += cellWidth;
      });

      // データ型が不明なので一旦コメントアウト
      /*
      let currentRow = 0;
      const tableData =
        param.item13 && param.item13.length > 0
          ? param.item13
          : [{ kizai: ['', ''], kizaiQty: [undefined, undefined], kizaiMem: [''] }];

      tableData.forEach((item) => {
        item.kizai?.forEach((line, idx) => {
          colX = textX - 20;
          const y = tableStartY - rowHeight * (currentRow + 2);

          // 機材セル
          page.drawRectangle({
            x: colX,
            y,
            width: colWidths[0],
            height: rowHeight,
            borderColor: rgb(0, 0, 0),
            borderWidth: 1,
          });
          page.drawText(line, {
            x: colX + 2,
            y: y + (rowHeight - 10) / 2,
            font: customFont,
            size: 10,
            color: rgb(0, 0, 0),
          });
          colX += colWidths[0];

          // 数量セル
          page.drawRectangle({
            x: colX,
            y,
            width: colWidths[1],
            height: rowHeight,
            borderColor: rgb(0, 0, 0),
            borderWidth: 1,
          });
          const qtyText = item.kizaiQty?.[idx] != null ? String(item.kizaiQty[idx]) : '';
          if (qtyText) {
            const textWidth = customFont.widthOfTextAtSize(qtyText, 10);
            page.drawText(qtyText, {
              x: colX + colWidths[1] - textWidth - 2,
              y: y + (rowHeight - 10) / 2,
              font: customFont,
              size: 10,
              color: rgb(0, 0, 0),
            });
          }
          colX += colWidths[1];

          // 備考セル
          page.drawRectangle({
            x: colX,
            y,
            width: colWidths[2],
            height: rowHeight,
            borderColor: rgb(0, 0, 0),
            borderWidth: 1,
          });
          if (idx === 0) {
            page.drawText(item.kizaiMem?.[0] ?? '', {
              x: colX + (colWidths[2] - customFont.widthOfTextAtSize(item.kizaiMem?.[0] ?? '', 10)) / 2,
              y: y + (rowHeight - 10) / 2,
              font: customFont,
              size: 10,
              color: rgb(0, 0, 0),
            });
          }

          currentRow++;
        });
      });
      */
    }

    const pdfBytes = await pdfDoc.save();
    return new Blob([pdfBytes.buffer as ArrayBuffer], { type: 'application/pdf' });
  };

  return [printShuko];
};
