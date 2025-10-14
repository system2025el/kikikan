import fontkit from '@pdf-lib/fontkit';
import { PDFDocument, PDFFont, rgb } from 'pdf-lib';
import { useEffect, useState } from 'react';

import { BillHeadValues } from '../types';

// PDFデータ生成フック
export const usePdf = (): [(param: BillHeadValues) => Promise<Blob>] => {
  // フォント
  const [font, setFont] = useState<ArrayBuffer>(new ArrayBuffer(0));
  // イメージ
  const [image, setImage] = useState<ArrayBuffer>(new ArrayBuffer(0));
  const [log, setLog] = useState<ArrayBuffer>(new ArrayBuffer(0));

  // フォントの読み込み
  const setupFont = async () => {
    const fontBytes = await fetch('/fonts/ipaexg.ttf').then((res) => res.arrayBuffer());
    setFont(fontBytes);
  };

  // イメージの読み込み
  const setupImage = async () => {
    const imageBytes = await fetch('/images/sign.bank.png').then((res) => res.arrayBuffer());
    setImage(imageBytes);
  };
  const setupLog = async () => {
    const logBytes = await fetch('/images/log.png').then((res) => res.arrayBuffer());
    setLog(logBytes);
  };

  useEffect(() => {
    Promise.allSettled([setupFont(), setupImage(), setupLog()])
      .then(() => {})
      .catch(() => {})
      .finally(() => {});
  }, []);

  // PDF生成関数
  const printBill = async (param: BillHeadValues): Promise<Blob> => {
    // PDFドキュメント作成
    const pdfDoc = await PDFDocument.create();

    // フォントの設定
    pdfDoc.registerFontkit(fontkit);
    const customFont = await pdfDoc.embedFont(font);

    /* ここから出力内容
     * -----------------------------------------------------------------*/

    // PDFページ生成
    const page = pdfDoc.addPage();

    // ページの高さと幅
    const { width, height } = page.getSize();

    // ------------------------------------------------------------------/

    /* タイトル・請求番号・発行年月日
     * -----------------------------------------------------------------*/
    page.drawText('請　 求　 書', {
      x: 330,
      y: 790,
      font: customFont, // カスタムフォントの設定
      size: 20,
      //color: rgb(0, 0, 0),
      //lineHeight: 10,
      //opacity: 1,
    });

    //TODO 角を丸くする処理を後で追加する
    const tableX = 440;
    const tableY = 770;
    const cellWidth = 60;
    const cellHeight = 15;

    // 請求番号、発行年月日
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
      borderColor: rgb(0, 0, 0),
      borderWidth: 0.5,
    });
    page.drawRectangle({
      x: tableX + cellWidth,
      y: tableY - cellHeight,
      width: cellWidth,
      height: cellHeight,
      borderColor: rgb(0, 0, 0),
      borderWidth: 0.5,
    });

    // ヘッダーテキスト
    page.drawText('発行年月日', { x: tableX + 10, y: tableY - 12, font: customFont, size: 8 });
    page.drawText('請求番号', { x: tableX + cellWidth + 15, y: tableY - 12, font: customFont, size: 8 });

    // データ
    page.drawText('2025/05/31', { x: tableX + 8, y: tableY - cellHeight - 12, font: customFont, size: 8 });
    page.drawText('18409', {
      x: tableX + cellWidth + 16,
      y: tableY - cellHeight - 12,
      font: customFont,
      size: 8,
    });
    /* ---------------- 取引先：住所+ 会社名 + 御中 ---------------- */
    const clientInfoX = 80; // 左端からの位置
    let clientInfoY = 785; // Y座標の開始位置

    // 郵便番号
    page.drawText('000-00000', {
      x: clientInfoX,
      y: clientInfoY,
      font: customFont,
      size: 9,
    });

    // 住所
    clientInfoY -= 15; // 1行下にずらす
    page.drawText(' 札幌市中央区北２条西３丁目', {
      x: clientInfoX,
      y: clientInfoY,
      font: customFont,
      size: 9,
    });
    //ビル名等
    clientInfoY -= 15; // 1行下にずらす
    page.drawText('　　　　　　　 札幌北２条ビル８階', {
      x: clientInfoX,
      y: clientInfoY,
      font: customFont,
      size: 9,
    });

    // 会社名
    clientInfoY -= 25; // 少し間隔をあけて1行下にずらす
    page.drawText('　株式会社　○○○○　御中', {
      x: clientInfoX,
      y: clientInfoY,
      font: customFont,
      size: 9,
    });

    // 顧客番号
    clientInfoY -= 85; // 1行下にずらす
    page.drawText('顧客番号: 1777', {
      x: clientInfoX - 45,
      y: clientInfoY,
      font: customFont,
      size: 10,
    });

    /* ---------------- 請求額 ---------------- */
    // テーブルの基本設定
    const billingTableX = 35; // 左端からの位置
    const billingTableWidth = 260; // テーブル全体の幅
    const billingTableRowHeight = 20; // 1行の高さ
    const billingTableHeight = billingTableRowHeight * 3; // テーブル全体の高さ

    // pngImageの下と合うようにテーブルの下辺を設定
    const pngImageBottomY = tableY - 215;
    const billingTableBottomY = pngImageBottomY;
    const billingTableTopY = billingTableBottomY + billingTableHeight;

    // 右側の余白
    const rightPadding = 5;

    // --- 1行目：今回ご請求金額 ---
    const totalAmountText = '¥686,400';
    const totalAmountTextWidth = customFont.widthOfTextAtSize(totalAmountText, 12);
    const totalAmountX = billingTableX + billingTableWidth - totalAmountTextWidth - rightPadding;
    // 背景色と枠線
    page.drawRectangle({
      x: billingTableX,
      y: billingTableTopY - billingTableRowHeight + 20,
      width: billingTableWidth,
      height: billingTableRowHeight,
      borderColor: rgb(0, 0, 0),
      borderWidth: 1,
    });
    const dividerX = billingTableX + 120; // 縦線
    page.drawLine({
      start: { x: dividerX, y: billingTableTopY - billingTableRowHeight + 20 },
      end: { x: dividerX, y: billingTableTopY - billingTableRowHeight + 20 + billingTableRowHeight },
      color: rgb(0, 0, 0),
      thickness: 1,
    });
    // テキスト
    page.drawText('今回ご請求金額', {
      x: billingTableX + 20,
      y: billingTableTopY - billingTableRowHeight + 25,
      font: customFont,
      size: 12,
    });
    page.drawText(totalAmountText, {
      x: totalAmountX, // 金額の表示位置
      y: billingTableTopY - billingTableRowHeight + 25,
      font: customFont,
      size: 12,
    });

    // --- 2行目：10％対象合計 ---
    const subtotalText = '￥624,000';
    const subtotalTextWidth = customFont.widthOfTextAtSize(subtotalText, 10);
    // 2行目、3行目の金額描画X座標を計算
    const amountX = billingTableX + billingTableWidth - subtotalTextWidth - rightPadding;

    page.drawRectangle({
      x: billingTableX + 50,
      y: billingTableBottomY + billingTableRowHeight,
      width: billingTableWidth - 50,
      height: billingTableRowHeight,
      borderColor: rgb(0, 0, 0),
      borderWidth: 0.5,
    });

    // 縦線
    const dividerX2 = billingTableX + 150;
    page.drawLine({
      start: { x: dividerX2, y: billingTableBottomY + billingTableRowHeight },
      end: { x: dividerX2, y: billingTableBottomY + billingTableRowHeight * 2 },
      color: rgb(0, 0, 0),
      thickness: 0.5,
    });

    page.drawText('10％対象合計', {
      x: billingTableX + 70,
      y: billingTableBottomY + billingTableRowHeight + 6,
      font: customFont,
      size: 10,
    });
    page.drawText(subtotalText, {
      x: amountX, // 縦線の右側に配置
      y: billingTableBottomY + billingTableRowHeight + 6,
      font: customFont,
      size: 10,
    });

    // --- 3行目：消費税 ---
    const taxText = '￥62,400';
    const taxTextWidth = customFont.widthOfTextAtSize(taxText, 10);
    const taxAmountX = billingTableX + billingTableWidth - taxTextWidth - rightPadding;

    // 長方形の描画
    page.drawRectangle({
      x: billingTableX + 50,
      y: billingTableBottomY,
      width: billingTableWidth - 50,
      height: billingTableRowHeight,
      borderColor: rgb(0, 0, 0),
      borderWidth: 0.5,
    });

    // 縦線の描画
    page.drawLine({
      start: { x: dividerX2, y: billingTableBottomY },
      end: { x: dividerX2, y: billingTableBottomY + billingTableRowHeight },
      color: rgb(0, 0, 0),
      thickness: 0.5,
    });

    page.drawText('消費税 (10%)', {
      x: billingTableX + 70,
      y: billingTableBottomY + 7,
      font: customFont,
      size: 10,
    });

    // 金額（右寄せ）
    page.drawText(taxText, {
      x: taxAmountX, // 計算したX座標を使用
      y: billingTableBottomY + 7,
      font: customFont,
      size: 10,
    });

    /* ---------------- 署名画像 ---------------- */
    const pngImage = await pdfDoc.embedPng(image);
    pngImage.scale(1);
    page.drawImage(pngImage, {
      x: tableX - 117,
      y: tableY - 215,
      width: 250,
      height: 180,
    });
    /* ---------------- 社名画像 ---------------- */
    const pngLog = await pdfDoc.embedPng(log);
    pngLog.scale(1);
    page.drawImage(pngLog, {
      x: tableX - 115, //横
      y: tableY - cellHeight - 17, //縦
      width: 110,
      height: 35,
    });

    /* ---------------- 公演情報 ---------------- */
    let drawPositionY = billingTableBottomY - 10;
    const rowHeight = 20;
    const pageWidth = 525; // ページ幅に合わせて調整
    const colWidthsPerRow = [
      [50, 50, 50, 265, 50, 60],
      [50, 290, 50, 135],
    ];
    const rows: (string | number)[][] = [
      ['受注番号', 82830, '公演名', 'H/ ○○○○○○○○', '御担当', `〇 〇 様`],
      ['公演場所', '〇〇ホール', '貸出期間', `2025/04/29～2025/05/09`],
    ];

    rows.forEach((row, rowIndex) => {
      const colWidths = colWidthsPerRow[rowIndex];
      let colX = billingTableX; // テーブルの開始X座標を合わせる

      // 各行の「上」の横線
      page.drawLine({
        start: { x: colX, y: drawPositionY },
        end: { x: colX + pageWidth, y: drawPositionY },
        thickness: 1,
        color: rgb(0, 0, 0),
      });

      row.forEach((cellText, colIndex) => {
        const cellWidth = colWidths[colIndex];

        if (colIndex % 2 === 0) {
          page.drawRectangle({
            x: colX,
            y: drawPositionY - rowHeight,
            width: cellWidth,
            height: rowHeight,
            color: rgb(0.9, 0.9, 0.9),
          });
        }

        // セルの枠線
        page.drawRectangle({
          x: colX,
          y: drawPositionY - rowHeight,
          width: cellWidth,
          height: rowHeight,
          borderColor: rgb(0, 0, 0),
          borderWidth: 1,
        });

        const textToDraw = String(cellText);

        // 数値（右寄せ）
        const textWidth = customFont.widthOfTextAtSize(textToDraw, 9);
        let textX: number;
        if (typeof cellText === 'number') {
          textX = colX + cellWidth - textWidth - 5;
        } else {
          textX = colX + 5; // 左寄せ
        }

        page.drawText(textToDraw, {
          x: textX,
          y: drawPositionY - rowHeight + 7,
          font: customFont,
          size: 9,
          color: rgb(0, 0, 0),
        });

        colX += cellWidth;
      });

      drawPositionY -= rowHeight;
    });

    // テーブル全体の「下」の横線
    page.drawLine({
      start: { x: billingTableX, y: drawPositionY },
      end: { x: billingTableX + pageWidth, y: drawPositionY },
      thickness: 1,
      color: rgb(0, 0, 0),
    });

    //項目テーブル
    // テーブル描画の開始Y座標
    let yPosition = drawPositionY;

    const fontSize = 10;

    const tableData = [
      ['項　　　　　　　目', '数量', '単価', '金額', '本番日数', '備考'], // ヘッダー
      ['照明機材費・現地費一式', 1, 624000, 624000, 1, ''],
      // ['照明機材', 1, 200000, 200000, 1, ''],
      ['', '', ''], // 空の行
      ['伝　票　計', 624000, ''],
    ];

    // 列幅設定
    const columnWidthsByRow = {
      header: [250, 30, 75, 75, 50, 45],
      data: [250, 30, 75, 75, 50, 45],
      summary: [355, 75, 95],
    };

    // 描画処理
    tableData.forEach((row, rowIndex) => {
      let currentRowWidths;
      let fillColor;

      if (rowIndex === 0) {
        currentRowWidths = columnWidthsByRow.header;
        fillColor = rgb(0.804, 0.894, 0.808); // ヘッダーは背景緑
      } else if (rowIndex >= tableData.length - 2) {
        currentRowWidths = columnWidthsByRow.summary;
        fillColor = undefined;
      } else {
        currentRowWidths = columnWidthsByRow.data;
        fillColor = undefined;
      }

      let colX = billingTableX;

      row.forEach((cellText, colIndex) => {
        const cellWidth = currentRowWidths[colIndex];
        if (!cellWidth) return;

        let textToDraw = String(cellText);

        // 数値（カンマ区切り）
        if (typeof cellText === 'number') {
          textToDraw = cellText.toLocaleString();
        }

        // 伝票計の行で先頭列に￥マーク
        if (rowIndex === tableData.length - 1 && colIndex === 1) {
          textToDraw = '￥' + textToDraw;
        }

        // 背景と枠線
        page.drawRectangle({
          x: colX,
          y: yPosition - rowHeight,
          width: cellWidth,
          height: rowHeight,
          color: fillColor,
          borderColor: rgb(0, 0, 0),
          borderWidth: 1,
        });

        const textWidth = customFont.widthOfTextAtSize(textToDraw, fontSize);

        // 数値は右寄せ、それ以外は中央寄せ
        let textX;
        if (rowIndex === 0) {
          // ヘッダーは中央寄せ
          textX = colX + (cellWidth - textWidth) / 2;
        } else if (rowIndex === tableData.length - 1) {
          // 伝票計の行
          if (colIndex === 0) {
            // 「伝票計」の文字は中央寄せ
            textX = colX + (cellWidth - textWidth) / 2;
          } else if (typeof cellText === 'number') {
            // 金額は右寄せ
            textX = colX + cellWidth - textWidth - 2;
          } else {
            // その他は左寄せ
            textX = colX + 2;
          }
        } else {
          // 通常データ行
          if (typeof cellText === 'number') {
            textX = colX + cellWidth - textWidth - 2; // 数値は右寄せ
          } else {
            textX = colX + 2; // 文字は左寄せ
          }
        }

        page.drawText(textToDraw, {
          x: textX,
          y: yPosition - rowHeight + (rowHeight - fontSize) / 2 + 1,
          font: customFont,
          size: fontSize,
          color: rgb(0, 0, 0),
        });

        colX += cellWidth;
      });

      yPosition -= rowHeight;
    });

    /*　ここまで出力内容
     * -----------------------------------------------------------------*/

    const pdfBytes: Uint8Array = await pdfDoc.save();

    const blob = new Blob([pdfBytes.buffer as ArrayBuffer], { type: 'application/pdf' });

    return blob;
  };

  return [printBill];
};
