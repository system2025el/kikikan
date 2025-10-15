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

    //TODO 角を丸くする処理を後で追加する？
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
    const issueDateText = param.seikyuDat
      ? param.seikyuDat instanceof Date
        ? param.seikyuDat.toLocaleDateString('ja-JP')
        : String(param.seikyuDat)
      : '';

    page.drawText(issueDateText, {
      x: tableX + 8,
      y: tableY - cellHeight - 12,
      font: customFont,
      size: 8,
    });

    // 請求番号を中央寄せ
    const seikyuText = String(param.seikyuHeadId ?? '');
    const textWidth = customFont.widthOfTextAtSize(seikyuText, 8);
    const cellCenterX = tableX + cellWidth + cellWidth / 2;
    const textX = cellCenterX - textWidth / 2;

    page.drawText(seikyuText, {
      x: textX,
      y: tableY - cellHeight - 12,
      font: customFont,
      size: 8,
    });

    /* ---------------- 取引先：住所+ 会社名 + 御中 ---------------- */
    const clientInfoX = 80; // 左端からの位置
    let clientInfoY = 785; // Y座標の開始位置

    // 郵便番号
    page.drawText(String(param.adr1), {
      x: clientInfoX,
      y: clientInfoY,
      font: customFont,
      size: 9,
    });

    // 住所
    clientInfoY -= 15; // 1行下にずらす
    page.drawText(String(param.adr2.shozai), {
      x: clientInfoX,
      y: clientInfoY,
      font: customFont,
      size: 9,
    });
    //ビル名等
    clientInfoY -= 15; // 1行下にずらす
    page.drawText(String(param.adr2.tatemono), {
      x: clientInfoX,
      y: clientInfoY,
      font: customFont,
      size: 9,
    });
    //その他
    clientInfoY -= 15; // 少し間隔をあけて1行下にずらす
    page.drawText(String(param.adr2.sonota ?? ''), {
      x: clientInfoX,
      y: clientInfoY,
      font: customFont,
      size: 9,
    });

    // 会社名
    clientInfoY -= 25; // 少し間隔をあけて1行下にずらす
    page.drawText(`${param.aite.nam}御中`, {
      x: clientInfoX,
      y: clientInfoY,
      font: customFont,
      size: 9,
    });

    // 顧客番号
    clientInfoY -= 75; // 1行下にずらす
    page.drawText(`顧客番号：${param.aite.id} `, {
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
    const totalAmountText = '￥' + Number(param.gokeiAmt ?? 0).toLocaleString();
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
    const subtotalText = '￥' + Number(param.preTaxGokeiAmt ?? 0).toLocaleString();
    const subtotalTextWidth = customFont.widthOfTextAtSize(subtotalText, 10);
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

    page.drawText(`${param.zeiRat ?? ''}％対象合計`, {
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
    const taxText = '￥' + Number(param.zeiAmt ?? 0).toLocaleString();
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

    page.drawText(`消費税（${param.zeiRat ?? ''}％）`, {
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

    let drawPositionY = billingTableBottomY - 10;
    const rowHeight = 20;
    const pageWidth = 525; // ページ幅に合わせて調整
    const pageMarginBottom = 50; // ページ下余白

    // 日付フォーマッタ
    function formatDate(date: string | number | Date | null | undefined) {
      if (!date) return '';
      const d = new Date(date);
      if (isNaN(d.getTime())) return '';
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${year}/${month}/${day}`;
    }

    // ページを切り替える関数
    function addNewPage() {
      const newPage = pdfDoc.addPage([595, 842]); // A4
      return newPage;
    }

    // 描画対象のページ
    let currentPage = page;

    // 各明細ヘッダを処理
    param.meisaiHeads.forEach((meisai, meisaiIndex) => {
      // 明細がなくてもヘッダ情報を出すように変更
      const meisaiList = meisai?.meisai ?? [];
      // --- 公演情報テーブル ---
      const colWidthsPerRow = [
        [50, 50, 50, 265, 50, 60],
        [50, 300, 50, 125],
      ];

      const rows: (string | number)[][] = [
        [
          '受注番号',
          meisai?.juchuHeadId ?? '',
          '公演名',
          meisai?.koenNam ?? '',
          '御担当',
          `${meisai?.kokyakuTantoNam ?? ''} 様`,
        ],
        [
          '公演場所',
          meisai?.koenbashoNam ?? '',
          '貸出期間',
          `${formatDate(meisai?.seikyuRange?.strt)}～${formatDate(meisai?.seikyuRange?.end)}`,
        ],
      ];

      // --- 公演情報の描画 ---
      rows.forEach((row, rowIndex) => {
        if (drawPositionY - rowHeight < pageMarginBottom) {
          currentPage = addNewPage();
          drawPositionY = 800;
        }

        const colWidths = colWidthsPerRow[rowIndex];
        let colX = billingTableX;

        // 横線
        currentPage.drawLine({
          start: { x: colX, y: drawPositionY },
          end: { x: colX + pageWidth, y: drawPositionY },
          thickness: 1,
          color: rgb(0, 0, 0),
        });

        row.forEach((cellText, colIndex) => {
          const cellWidth = colWidths[colIndex];
          if (!cellWidth) return;

          // 偶数列をグレー背景
          if (colIndex % 2 === 0) {
            currentPage.drawRectangle({
              x: colX,
              y: drawPositionY - rowHeight,
              width: cellWidth,
              height: rowHeight,
              color: rgb(0.9, 0.9, 0.9),
            });
          }

          // 枠線
          currentPage.drawRectangle({
            x: colX,
            y: drawPositionY - rowHeight,
            width: cellWidth,
            height: rowHeight,
            borderColor: rgb(0, 0, 0),
            borderWidth: 1,
          });

          // テキスト
          const textToDraw = String(cellText);
          const textWidth = customFont.widthOfTextAtSize(textToDraw, 9);
          // const textX = typeof cellText === 'number' ? colX + cellWidth - textWidth - 5 : colX + 5;

          let textX: number;
          if (colIndex % 2 === 0) {
            // 偶数列（項目名）は中央寄せ
            textX = colX + (cellWidth - textWidth) / 2;
          } else if (typeof cellText === 'number') {
            // 数値は右寄せ
            textX = colX + cellWidth - textWidth - 5;
          } else {
            // 文字列は左寄せ
            textX = colX + 5;
          }
          currentPage.drawText(textToDraw, {
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

      // --- 明細テーブルデータ ---
      const columnWidthsByRow = {
        header: [250, 30, 75, 75, 50, 45],
        data: [250, 30, 75, 75, 50, 45],
        summary: [355, 75, 95],
      };

      const tableData = [
        ['項　　　　　　　目', '数量', '単価', '金額', '本番日数', '備考'],
        ...meisaiList.map((item) => [
          item.nam ?? '',
          item.qty ?? 0,
          item.tankaAmt ?? 0,
          item.shokeiAmt,
          item.honbanbiQty ?? 0,
          '',
        ]),
        ['', '', ''],
        ['伝　票　計', meisai?.nebikiAftAmt, ''],
      ];

      // --- 明細テーブル描画 ---
      const fontSize = 10;

      tableData.forEach((row, rowIndex) => {
        // 改ページ処理（重複ヘッダー防止）
        if (drawPositionY - rowHeight < pageMarginBottom) {
          currentPage = addNewPage();
          drawPositionY = 800;

          // 次ページ先頭がヘッダー以外の時だけヘッダー描画
          if (rowIndex !== 0) {
            const header = ['項　　　　　　　目', '数量', '単価', '金額', '本番日数', '備考'];
            let colX = billingTableX;
            header.forEach((h, i) => {
              const w = columnWidthsByRow.header[i];
              currentPage.drawRectangle({
                x: colX,
                y: drawPositionY - rowHeight,
                width: w,
                height: rowHeight,
                color: rgb(0.804, 0.894, 0.808),
                borderColor: rgb(0, 0, 0),
                borderWidth: 1,
              });
              currentPage.drawText(h, {
                x: colX + (w - customFont.widthOfTextAtSize(h, fontSize)) / 2,
                y: drawPositionY - rowHeight + 7,
                font: customFont,
                size: fontSize,
                color: rgb(0, 0, 0),
              });
              colX += w;
            });
            drawPositionY -= rowHeight;
          }
        }

        let currentRowWidths: number[];
        let fillColor: ReturnType<typeof rgb> | undefined;

        if (rowIndex === 0) {
          currentRowWidths = columnWidthsByRow.header;
          fillColor = rgb(0.804, 0.894, 0.808);
        } else if (rowIndex >= tableData.length - 2) {
          currentRowWidths = columnWidthsByRow.summary;
        } else {
          currentRowWidths = columnWidthsByRow.data;
        }

        let colX = billingTableX;
        row.forEach((cellText, colIndex) => {
          const cellWidth = currentRowWidths[colIndex];
          if (!cellWidth) return;

          let textToDraw = String(cellText);
          if (typeof cellText === 'number') textToDraw = cellText.toLocaleString();
          if (rowIndex === tableData.length - 1 && colIndex === 1) textToDraw = '￥' + textToDraw;

          // 背景と枠
          currentPage.drawRectangle({
            x: colX,
            y: drawPositionY - rowHeight,
            width: cellWidth,
            height: rowHeight,
            color: fillColor,
            borderColor: rgb(0, 0, 0),
            borderWidth: 1,
          });

          const textWidth = customFont.widthOfTextAtSize(textToDraw, fontSize);
          let textX: number;

          // 数値は右寄せ、それ以外は中央寄せ
          if (rowIndex === 0) {
            // ヘッダー中央寄せ
            textX = colX + (cellWidth - textWidth) / 2;
          } else if (rowIndex === tableData.length - 1 && colIndex === 0) {
            // 伝票計 中央寄せ
            textX = colX + (cellWidth - textWidth) / 2;
          } else if (typeof cellText === 'number') {
            textX = colX + cellWidth - textWidth - 5; // 右寄せ
          } else {
            textX = colX + 2; // 左寄せ
          }

          currentPage.drawText(textToDraw, {
            x: textX,
            y: drawPositionY - rowHeight + (rowHeight - fontSize) / 2 + 1,
            font: customFont,
            size: fontSize,
            color: rgb(0, 0, 0),
          });

          colX += cellWidth;
        });

        drawPositionY -= rowHeight;
      });

      // 明細ごとに余白
      drawPositionY -= 10;
    });
    /* ---------------- フッター描画処理 ---------------- */

    // すべてのページを取得
    const pages = pdfDoc.getPages();
    const totalPages = pages.length;

    // フッターに表示する共通情報
    const footerDate = issueDateText;
    const footerSeikyuNo = `請求番号：${param.seikyuHeadId ?? ''}`;
    const footerCompanyName = '株式会社　エンジニア・ライティング';

    const footerY = 35; // ページ下部からのY座
    const footerFontSize = 9;

    // 各ページにフッターを描画
    pages.forEach((targetPage, index) => {
      const currentPageNum = index + 1;
      const pageInfoText = `PAGE : ${currentPageNum} / ${totalPages}`;

      // フッターの左側に表示するテキスト
      const leftText = `${footerDate}   　　　${footerSeikyuNo}　　　　${footerCompanyName}`;

      // ページ番号を右寄せにするための計算
      const pageInfoTextWidth = customFont.widthOfTextAtSize(pageInfoText, footerFontSize);
      const pageWidth = targetPage.getSize().width;
      const rightTextX = pageWidth - pageInfoTextWidth - 40;

      // 左側のテキストを描画
      targetPage.drawText(leftText, {
        x: 40, // 左マージンを40に設定
        y: footerY,
        font: customFont,
        size: footerFontSize,
        color: rgb(0, 0, 0),
      });

      // 右側のページ番号を描画
      targetPage.drawText(pageInfoText, {
        x: rightTextX,
        y: footerY,
        font: customFont,
        size: footerFontSize,
        color: rgb(0, 0, 0),
      });
    });

    /* ---------------- フッター描画処理 (ここまで) ---------------- */

    /*　ここまで出力内容
     * -----------------------------------------------------------------*/

    const pdfBytes: Uint8Array = await pdfDoc.save();

    const blob = new Blob([pdfBytes.buffer as ArrayBuffer], { type: 'application/pdf' });

    return blob;
  };

  return [printBill];
};
