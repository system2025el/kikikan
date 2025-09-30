import fontkit from '@pdf-lib/fontkit';
import { PDFDocument, PDFFont, rgb } from 'pdf-lib';
import { useEffect, useState } from 'react';

import { QuotHeadValues } from '../types';

// PDFデータ生成フック
export const usePdf = (): [(param: QuotHeadValues) => Promise<Blob>] => {
  // フォント
  const [font, setFont] = useState<ArrayBuffer>(new ArrayBuffer(0));
  // イメージ
  const [image, setImage] = useState<ArrayBuffer>(new ArrayBuffer(0));

  useEffect(() => {
    // フォントの読み込み
    const setupFont = async () => {
      const fontBytes = await fetch('/fonts/ipaexg.ttf').then((res) => res.arrayBuffer());
      setFont(fontBytes);
    };
    setupFont();
    //console.log('setupFont');
    // イメージの読み込み
    const setupImage = async () => {
      const imageBytes = await fetch('/images/sign.png').then((res) => res.arrayBuffer());
      setImage(imageBytes);
    };
    setupImage();
    //console.log('setupImage');
  }, []);

  // PDF生成関数
  const printQuotation = async (param: QuotHeadValues): Promise<Blob> => {
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

    /* 外枠
     * -----------------------------------------------------------------*/
    // ページに線を描画
    const whiteSpace = 30;
    const boldLine = 2;

    // 上横線
    page.drawLine({
      start: { x: whiteSpace, y: height - whiteSpace },
      end: { x: width - whiteSpace, y: height - whiteSpace },
      thickness: boldLine,
    });
    // 左縦線
    page.drawLine({
      start: { x: whiteSpace - 1, y: whiteSpace - 1 },
      end: { x: whiteSpace - 1, y: height - (whiteSpace - 1) },
      thickness: boldLine,
    });
    // 右縦線
    page.drawLine({
      start: { x: width - (whiteSpace + 1), y: whiteSpace - 1 },
      end: { x: width - (whiteSpace + 1), y: height - (whiteSpace - 1) },
      thickness: boldLine,
    });
    // // 下横線
    // page.drawLine({
    //   start: { x: whiteSpace, y: whiteSpace },
    //   end: { x: width - whiteSpace, y: whiteSpace },
    //   thickness: boldLine,
    // });
    // ------------------------------------------------------------------/

    /* タイトル・見積番号・見積日
     * -----------------------------------------------------------------*/
    page.drawText('御見積書', {
      x: 257,
      y: 790,
      font: customFont, // カスタムフォントの設定
      size: 18,
      //color: rgb(0, 0, 0),
      //lineHeight: 10,
      //opacity: 1,
    });
    page.drawText('****　　　　****', {
      x: 230,
      y: 786,
      font: customFont, // カスタムフォントの設定
      size: 18,
      //color: rgb(0, 0, 0),
      //lineHeight: 10,
      //opacity: 1,
    });

    page.drawText(`No. ${param.mituHeadId ?? ''}`, {
      x: 490,
      y: 786,
      font: customFont, // カスタムフォントの設定
      size: 10,
      //color: rgb(0, 0, 0),
      //lineHeight: 10,
      //opacity: 1,
    });

    const date = new Intl.DateTimeFormat('ja-JP-u-ca-japanese', { era: 'long' }).format(param.mituDat ?? new Date());
    const dateItems = date.split('/');
    if (2 < dateItems.length) {
      page.drawText(`${dateItems[0]}年${dateItems[1]}月${dateItems[2]}日`, {
        x: 452,
        y: 774,
        font: customFont, // カスタムフォントの設定
        size: 10,
        //color: rgb(0, 0, 0),
        //lineHeight: 10,
        //opacity: 1,
      });
    }
    // ------------------------------------------------------------------/

    /* 取引先名枠線
     * -----------------------------------------------------------------*/

    // TODO:drawRectangle使うとスッキリするかも

    const baseX1 = 70;
    const baseX2 = 525;
    const baseX3 = 68;
    const baseX4 = 527;

    const baseY1 = 768;
    const baseY2 = 734;
    const baseY3 = 770;
    const baseY4 = 732;

    // 左縦線
    page.drawLine({
      start: { x: baseX1, y: baseY1 },
      end: { x: baseX1, y: baseY2 - 1 },
      thickness: 1,
    });
    // 上横線
    page.drawLine({
      start: { x: baseX1, y: baseY1 },
      end: { x: baseX2, y: baseY1 },
      thickness: 1,
    });
    // 右縦線
    page.drawLine({
      start: { x: baseX2, y: baseY2 - 1 },
      end: { x: baseX2, y: baseY1 },
      thickness: 1,
    });
    // 下横線
    page.drawLine({
      start: { x: baseX1, y: baseY2 },
      end: { x: baseX2, y: baseY2 },
      thickness: 1,
    });

    // 左縦線
    page.drawLine({
      start: { x: baseX3, y: baseY3 },
      end: { x: baseX3, y: baseY4 - 1 },
      thickness: 1,
    });
    // 上横線
    page.drawLine({
      start: { x: baseX3, y: baseY3 },
      end: { x: baseX4, y: baseY3 },
      thickness: 1,
    });
    // 右縦線
    page.drawLine({
      start: { x: baseX4, y: baseY4 - 1 },
      end: { x: baseX4, y: baseY3 },
      thickness: 1,
    });
    // 下横線
    page.drawLine({
      start: { x: baseX3, y: baseY4 },
      end: { x: baseX4, y: baseY4 },
      thickness: 1,
    });
    // ------------------------------------------------------------------/

    /* 取引先名・担当名
     * -----------------------------------------------------------------*/
    let fontSize = 10;
    let maxWidth = 100;

    const client = param.kokyaku ?? '';
    const clientCharge = param.kokyakuTantoNam ?? '';

    fontSize = 14;
    maxWidth = 330;
    page.drawText(formatTextLine(client, customFont, fontSize, maxWidth), {
      x: 80,
      y: 746,
      font: customFont, // カスタムフォントの設定
      size: fontSize,
      //maxWidth: maxWidth,
      //wordBreaks: [''],
      //color: rgb(0, 0, 0),
      //lineHeight: 10,
      //opacity: 1,
    });

    fontSize = 14;
    maxWidth = 80;
    page.drawText(`${formatTextLine(clientCharge, customFont, fontSize, maxWidth)} 様`, {
      x: 420,
      y: 746,
      font: customFont, // カスタムフォントの設定
      size: fontSize,
      //maxWidth: maxWidth,
      //wordBreaks: [''],
      //color: rgb(0, 0, 0),
      //lineHeight: 10,
      //opacity: 1,
    });

    page.drawText('下記の通り御見積申し上げます。', {
      x: 50,
      y: 717,
      font: customFont, // カスタムフォントの設定
      size: 10,
      //color: rgb(0, 0, 0),
      //lineHeight: 10,
      //opacity: 1,
    });

    /* ヘッダー枠線
     * -----------------------------------------------------------------*/
    // 上線
    page.drawLine({
      start: { x: whiteSpace, y: 710 },
      end: { x: width - whiteSpace, y: 710 },
      thickness: 1,
    });
    // 下線
    page.drawLine({
      start: { x: whiteSpace, y: 625 },
      end: { x: width - whiteSpace, y: 625 },
      thickness: 1,
    });
    // 間の線1
    page.drawLine({
      start: { x: 150, y: 710 },
      end: { x: 150, y: 625 },
      thickness: 1,
    });
    // 間の線2
    page.drawLine({
      start: { x: 355, y: 710 },
      end: { x: 355, y: 625 },
      thickness: 1,
    });
    // ------------------------------------------------------------------/

    /* 作品名・貸出期日・実施場所・本番日数・備考
     * -----------------------------------------------------------------*/
    const x1 = 60;
    const x2 = 155;
    const y1 = 700;
    const y2 = 685;
    const y3 = 670;
    const y4 = 655;
    const y5 = 640;

    page.drawText('作　品   名', {
      x: x1,
      y: y1,
      font: customFont, // カスタムフォントの設定
      size: 10,
      //color: rgb(0, 0, 0),
      //lineHeight: 10,
      //opacity: 1,
    });

    page.drawText('貸 出 期 日', {
      x: x1,
      y: y2,
      font: customFont, // カスタムフォントの設定
      size: 10,
      //color: rgb(0, 0, 0),
      //lineHeight: 10,
      //opacity: 1,
    });

    page.drawText('実 施 場 所', {
      x: x1,
      y: y3,
      font: customFont, // カスタムフォントの設定
      size: 10,
      //color: rgb(0, 0, 0),
      //lineHeight: 10,
      //opacity: 1,
    });

    page.drawText('本 番 日 数', {
      x: x1,
      y: y4,
      font: customFont, // カスタムフォントの設定
      size: 10,
      //color: rgb(0, 0, 0),
      //lineHeight: 10,
      //opacity: 1,
    });

    page.drawText('備　　   考', {
      x: x1,
      y: y5,
      font: customFont, // カスタムフォントの設定
      size: 10,
      //color: rgb(0, 0, 0),
      //lineHeight: 10,
      //opacity: 1,
    });

    fontSize = 10;
    maxWidth = 190;
    page.drawText(formatTextLine(param.koenNam ?? '', customFont, fontSize, maxWidth), {
      x: x2,
      y: y1,
      font: customFont, // カスタムフォントの設定
      size: fontSize,
      // maxWidth: maxWidth,
      // wordBreaks: [''],
      // color: rgb(0, 0, 0),
      // lineHeight: 10,
      // opacity: 1,
    });

    let start = '';
    if (param.mituRange.strt !== undefined && param.mituRange.strt !== null) {
      start = param.mituRange.strt?.toLocaleDateString();
    }
    let end = '';
    if (param.mituRange.end !== undefined && param.mituRange.end !== null) {
      end = param.mituRange.end?.toLocaleDateString();
    }

    page.drawText(`${start}〜${end}`, {
      x: x2,
      y: y2,
      font: customFont, // カスタムフォントの設定
      size: fontSize,
      // maxWidth: maxWidth,
      // wordBreaks: [''],
      // color: rgb(0, 0, 0),
      // lineHeight: 10,
      // opacity: 1,
    });

    page.drawText(formatTextLine(param.koenbashoNam ?? '', customFont, fontSize, maxWidth), {
      x: x2,
      y: y3,
      font: customFont, // カスタムフォントの設定
      color: rgb(0, 0, 0),
      size: fontSize,
      // maxWidth: maxWidth,
      // wordBreaks: [''],
      // color: rgb(0, 0, 0),
      // lineHeight: 10,
      // opacity: 1,
    });

    let qty = '';
    if (param.mituHonbanbiQty !== undefined && param.mituHonbanbiQty !== null) {
      qty = param.mituHonbanbiQty.toLocaleString();
    }

    page.drawText(qty, {
      x: x2,
      y: y4,
      font: customFont, // カスタムフォントの設定
      size: fontSize,
      // maxWidth: maxWidth,
      // wordBreaks: [''],
      // color: rgb(0, 0, 0),
      // lineHeight: 10,
      // opacity: 1,
    });

    const lines = formatTextArray(param.biko ?? '', customFont, fontSize, maxWidth);

    if (1 < lines.length) {
      page.drawText(lines[0], {
        x: x2,
        y: y5,
        font: customFont, // カスタムフォントの設定
        size: fontSize,
        // maxWidth: maxWidth,
        // wordBreaks: [''],
        // color: rgb(0, 0, 0),
        // lineHeight: 10,
        // opacity: 1,
      });

      page.drawText(lines[1], {
        x: x2,
        y: y5 - 12,
        font: customFont, // カスタムフォントの設定
        size: fontSize,
        // maxWidth: maxWidth,
        // wordBreaks: [''],
        // color: rgb(0, 0, 0),
        // lineHeight: 10,
        // opacity: 1,
      });
    } else {
      page.drawText(lines[0], {
        x: x2,
        y: y5,
        font: customFont, // カスタムフォントの設定
        size: fontSize,
        // maxWidth: maxWidth,
        // wordBreaks: [''],
        // color: rgb(0, 0, 0),
        // lineHeight: 10,
        // opacity: 1,
      });
    }
    // ------------------------------------------------------------------/

    /* 画像
     * -----------------------------------------------------------------*/
    const pngImage = await pdfDoc.embedPng(image);
    pngImage.scale(1);
    page.drawImage(pngImage, {
      x: 360,
      y: 630,
      width: 200,
      height: 75,
    });
    // ------------------------------------------------------------------/

    /* 合計金額枠線
     * -----------------------------------------------------------------*/
    // TODO:drawRectangle使うとスッキリするかも

    const x1_1 = 120;
    const x1_2 = 118;
    const x2_1 = 480;
    const x2_2 = 482;

    const y1_1 = 615;
    const y1_2 = 617;
    const y2_1 = 585;
    const y2_2 = 583;

    // 左縦線
    page.drawLine({
      start: { x: x1_1, y: y1_1 },
      end: { x: x1_1, y: y2_1 - 1 },
      thickness: 1,
    });
    // 上横線
    page.drawLine({
      start: { x: x1_1, y: y1_1 },
      end: { x: x2_1, y: y1_1 },
      thickness: 1,
    });
    // 右縦線
    page.drawLine({
      start: { x: x2_1, y: y2_1 - 1 },
      end: { x: x2_1, y: y1_1 },
      thickness: 1,
    });
    // 下横線
    page.drawLine({
      start: { x: x1_1, y: y2_1 },
      end: { x: x2_1, y: y2_1 },
      thickness: 1,
    });

    // 左縦線
    page.drawLine({
      start: { x: x1_2, y: y1_2 },
      end: { x: x1_2, y: y2_2 - 1 },
      thickness: 1,
    });
    // 上横線
    page.drawLine({
      start: { x: x1_2, y: y1_2 },
      end: { x: x2_2, y: y1_2 },
      thickness: 1,
    });
    // 右縦線
    page.drawLine({
      start: { x: x2_2, y: y2_2 - 1 },
      end: { x: x2_2, y: y1_2 },
      thickness: 1,
    });
    // 下横線
    page.drawLine({
      start: { x: x1_2, y: y2_2 },
      end: { x: x2_2, y: y2_2 },
      thickness: 1,
    });
    // ------------------------------------------------------------------/

    const y_totalAmount = 590;

    page.drawText('合計金額', {
      x: 130,
      y: y_totalAmount,
      font: customFont, // カスタムフォントの設定
      size: 14,
      //color: rgb(0, 0, 0),
      //lineHeight: 24,
      //opacity: 1,
    });

    page.drawText(`¥${param.gokeiAmt?.toLocaleString()}`, {
      x: 240,
      y: y_totalAmount,
      font: customFont, // カスタムフォントの設定
      size: 20,
      //color: rgb(0, 0, 0),
      //lineHeight: 24,
      //opacity: 1,
    });

    page.drawText('(税込み)', {
      x: 390,
      y: y_totalAmount,
      font: customFont, // カスタムフォントの設定
      size: 14,
      //color: rgb(0, 0, 0),
      //lineHeight: 24,
      //opacity: 1,
    });
    // ------------------------------------------------------------------/

    /* 詳細ヘッダー
     * -----------------------------------------------------------------*/

    const y_detail_1 = 565;
    const y_detail_2 = 545;

    page.drawLine({
      start: { x: whiteSpace, y: y_detail_1 },
      end: { x: width - whiteSpace, y: y_detail_1 },
      thickness: 1,
    });

    page.drawLine({
      start: { x: 350, y: y_detail_1 },
      end: { x: 350, y: y_detail_2 },
      thickness: 1,
    });

    page.drawLine({
      start: { x: 390, y: y_detail_1 },
      end: { x: 390, y: y_detail_2 },
      thickness: 1,
    });

    page.drawLine({
      start: { x: 430, y: y_detail_1 },
      end: { x: 430, y: y_detail_2 },
      thickness: 1,
    });

    page.drawLine({
      start: { x: 490, y: y_detail_1 },
      end: { x: 490, y: y_detail_2 },
      thickness: 1,
    });

    const y_detail_3 = 550;

    page.drawText('摘　　　　　　要', {
      x: 160,
      y: y_detail_3,
      font: customFont, // カスタムフォントの設定
      size: 9,
      //color: rgb(0, 0, 0),
      //lineHeight: 24,
      //opacity: 1,
    });

    page.drawText('数　量', {
      x: 355,
      y: y_detail_3,
      font: customFont, // カスタムフォントの設定
      size: 9,
      //color: rgb(0, 0, 0),
      //lineHeight: 24,
      //opacity: 1,
    });

    page.drawText('使用日', {
      x: 395,
      y: y_detail_3,
      font: customFont, // カスタムフォントの設定
      size: 9,
      //color: rgb(0, 0, 0),
      //lineHeight: 24,
      //opacity: 1,
    });

    page.drawText('単　価', {
      x: 445,
      y: y_detail_3,
      font: customFont, // カスタムフォントの設定
      size: 9,
      //color: rgb(0, 0, 0),
      //lineHeight: 24,
      //opacity: 1,
    });

    page.drawText('小　計', {
      x: 510,
      y: y_detail_3,
      font: customFont, // カスタムフォントの設定
      size: 9,
      //color: rgb(0, 0, 0),
      //lineHeight: 24,
      //opacity: 1,
    });

    page.drawLine({
      start: { x: whiteSpace, y: y_detail_2 },
      end: { x: width - whiteSpace, y: y_detail_2 },
      thickness: 1,
    });

    // ------------------------------------------------------------------/

    /* 詳細
     * -----------------------------------------------------------------*/

    let workPage = page;

    const startY = y_detail_2;
    const rowHeight = 20;
    let index = 0;

    if (param.meisaiHeads !== undefined && param.meisaiHeads != null) {
      // 機材費
      if (param.meisaiHeads.kizai !== undefined && param.meisaiHeads.kizai != null) {
        let detailIndex = 0;
        param.meisaiHeads.kizai.forEach((detail) => {
          if (detail.meisai !== undefined && detail.meisai != null) {
            // 空行
            if (0 < detailIndex) {
              drawColumnLine();
              drawUnderLine();
              index++;
            }

            detail.meisai.forEach((row) => {
              drawColumnLine();
              drawRow(row.nam, row.qty, row.honbanbiQty, row.tankaAmt, row.shokeiAmt);
              drawUnderLine();
              index++;
            });

            // 1つ前の線を二重線にする
            workPage.drawLine({
              start: { x: whiteSpace, y: startY - 20 * index - 2 }, // 通常の下線より少し上
              end: { x: width - whiteSpace, y: startY - 20 * index - 2 }, // 通常の下線より少し上
              thickness: 1,
            });

            // 小計行1
            drawColumnLine();
            drawShokei(detail.biko1, detail.shokeiMei, detail.shokeiAmt);
            drawUnderLine();
            index++;

            // 小計行2
            drawColumnLine();
            drawShokei(detail.biko2, detail.nebikiNam, detail.nebikiAmt);
            drawUnderLine();
            index++;

            // 小計行3
            drawColumnLine();
            drawShokei(detail.biko3, detail.nebikiAftNam, detail.nebikiAftAmt);
            drawUnderLine();
            index++;

            detailIndex++;
          }
        });

        // TODO:機材費の合計
      }

      // 人件費
      if (param.meisaiHeads.labor !== undefined && param.meisaiHeads.labor != null) {
        let detailIndex = 0;
        param.meisaiHeads.labor.forEach((detail) => {
          if (detail.meisai !== undefined && detail.meisai != null) {
            // 空行
            if (0 < detailIndex) {
              drawColumnLine();
              drawUnderLine();
              index++;
            }

            detail.meisai.forEach((row) => {
              drawColumnLine();
              drawRow(row.nam, row.qty, row.honbanbiQty, row.tankaAmt, row.shokeiAmt);
              drawUnderLine();
              index++;
            });

            // 1つ前の線を二重線にする
            workPage.drawLine({
              start: { x: whiteSpace, y: startY - 20 * index - 2 }, // 通常の下線より少し上
              end: { x: width - whiteSpace, y: startY - 20 * index - 2 }, // 通常の下線より少し上
              thickness: 1,
            });

            // 小計行1
            drawColumnLine();
            drawShokei(detail.biko1, detail.shokeiMei, detail.shokeiAmt);
            drawUnderLine();
            index++;

            // 小計行2
            drawColumnLine();
            drawShokei(detail.biko2, detail.nebikiNam, detail.nebikiAmt);
            drawUnderLine();
            index++;

            // 小計行3
            drawColumnLine();
            drawShokei(detail.biko3, detail.nebikiAftNam, detail.nebikiAftAmt);
            drawUnderLine();
            index++;

            detailIndex++;
          }
        });

        // TODO:人権費の合計
      }

      // 諸経費
      if (param.meisaiHeads.other !== undefined && param.meisaiHeads.other != null) {
        let detailIndex = 0;
        param.meisaiHeads.other.forEach((detail) => {
          if (detail.meisai !== undefined && detail.meisai != null) {
            // 空行
            if (0 < detailIndex) {
              drawColumnLine();
              drawUnderLine();
              index++;
            }

            detail.meisai.forEach((row) => {
              drawColumnLine();
              drawRow(row.nam, row.qty, row.honbanbiQty, row.tankaAmt, row.shokeiAmt);
              drawUnderLine();
              index++;
            });

            // 1つ前の線を二重線にする
            workPage.drawLine({
              start: { x: whiteSpace, y: startY - 20 * index - 2 }, // 通常の下線より少し上
              end: { x: width - whiteSpace, y: startY - 20 * index - 2 }, // 通常の下線より少し上
              thickness: 1,
            });

            // 小計行1
            drawColumnLine();
            drawShokei(detail.biko1, detail.shokeiMei, detail.shokeiAmt);
            drawUnderLine();
            index++;

            // 小計行2
            drawColumnLine();
            drawShokei(detail.biko2, detail.nebikiNam, detail.nebikiAmt);
            drawUnderLine();
            index++;

            // 小計行3
            drawColumnLine();
            drawShokei(detail.biko3, detail.nebikiAftNam, detail.nebikiAftAmt);
            drawUnderLine();
            index++;

            detailIndex++;
          }
        });

        // TODO:諸経費の合計
      }
    }

    function drawColumnLine() {
      workPage.drawLine({
        start: { x: 350, y: startY - rowHeight * index },
        end: { x: 350, y: startY - rowHeight * (index + 1) },
        thickness: 1,
      });
      workPage.drawLine({
        start: { x: 390, y: startY - rowHeight * index },
        end: { x: 390, y: startY - rowHeight * (index + 1) },
        thickness: 1,
      });
      workPage.drawLine({
        start: { x: 430, y: startY - rowHeight * index },
        end: { x: 430, y: startY - rowHeight * (index + 1) },
        thickness: 1,
      });
      workPage.drawLine({
        start: { x: 490, y: startY - rowHeight * index },
        end: { x: 490, y: startY - rowHeight * (index + 1) },
        thickness: 1,
      });
    }

    function drawUnderLine() {
      workPage.drawLine({
        start: { x: whiteSpace, y: startY - 20 * (index + 1) },
        end: { x: width - whiteSpace, y: startY - 20 * (index + 1) },
        thickness: 1,
      });
    }

    function drawRow(
      item1: string | undefined | null,
      item2: number | undefined | null,
      item3: number | undefined | null,
      item4: number | undefined | null,
      item5: number | undefined | null
    ) {
      fontSize = 8;
      maxWidth = 310;
      workPage.drawText(formatTextLine(item1 ?? '', customFont, fontSize, maxWidth), {
        x: 35,
        y: startY - rowHeight * (index + 1) + 3,
        font: customFont, // カスタムフォントの設定
        size: fontSize,
        // color: rgb(0, 0, 0),
        // lineHeight: 24,
        // opacity: 1,
      });

      let qty = '';
      if (item2 !== undefined && item2 != null) {
        qty = item2.toLocaleString();
      }
      workPage.drawText(qty, {
        x: 355,
        y: startY - 20 * (index + 1) + 3,
        font: customFont, // カスタムフォントの設定
        size: fontSize,
        // color: rgb(0, 0, 0),
        // lineHeight: 24,
        // opacity: 1,
      });

      let honbanbiQty = '';
      if (item3 !== undefined && item3 != null) {
        honbanbiQty = item3.toLocaleString();
      }
      workPage.drawText(honbanbiQty, {
        x: 395,
        y: startY - 20 * (index + 1) + 3,
        font: customFont, // カスタムフォントの設定
        size: fontSize,
        // color: rgb(0, 0, 0),
        // lineHeight: 24,
        // opacity: 1,
      });

      let tankaAmt = '';
      if (item4 !== undefined && item4 != null) {
        tankaAmt = item4.toLocaleString();
      }
      workPage.drawText(tankaAmt ?? '', {
        x: 435,
        y: startY - 20 * (index + 1) + 3,
        font: customFont, // カスタムフォントの設定
        size: fontSize,
        // color: rgb(0, 0, 0),
        // lineHeight: 24,
        // opacity: 1,
      });

      let shokeiAmt = '';
      if (item5 !== undefined && item5 != null) {
        shokeiAmt = item5.toLocaleString();
      }
      workPage.drawText(shokeiAmt ?? '', {
        x: 495,
        y: startY - 20 * (index + 1) + 3,
        font: customFont, // カスタムフォントの設定
        size: fontSize,
      });
    }

    function drawShokei(
      item1: string | undefined | null,
      item2: string | undefined | null,
      item3: number | undefined | null
    ) {
      fontSize = 8;
      maxWidth = 310;
      workPage.drawText(formatTextLine(item1 ?? '', customFont, fontSize, maxWidth), {
        x: 35,
        y: startY - rowHeight * (index + 1) + 3,
        font: customFont, // カスタムフォントの設定
        size: fontSize,
        // color: rgb(0, 0, 0),
        // lineHeight: 24,
        // opacity: 1,
      });

      workPage.drawText(item2 ?? '', {
        x: 435,
        y: startY - 20 * (index + 1) + 3,
        font: customFont, // カスタムフォントの設定
        size: fontSize,
        // color: rgb(0, 0, 0),
        // lineHeight: 24,
        // opacity: 1,
      });

      let shokeiAmt = '';
      if (item3 !== undefined && item3 != null) {
        shokeiAmt = item3.toLocaleString();
      }
      workPage.drawText(shokeiAmt ?? '', {
        x: 495,
        y: startY - 20 * (index + 1) + 3,
        font: customFont, // カスタムフォントの設定
        size: fontSize,
        // color: rgb(0, 0, 0),
        // lineHeight: 24,
        // opacity: 1,
      });
    }

    // ------------------------------------------------------------------/

    drawColumnLine2();
    drawRow2('中計(機材費+人件費+諸経費)', '17,128,000');
    drawUnderLine();
    index++;

    drawColumnLine2();
    drawRow2('特別調整値引き', '-228,000');
    drawUnderLine();
    index++;

    drawColumnLine2();
    drawUnderLine();
    index++;

    drawColumnLine2();
    drawRow2('合計', '16,9000,000');
    drawUnderLine();
    index++;

    drawColumnLine2();
    drawRow2('消費税（10%）', '1,690,000');
    drawUnderLine();
    index++;

    drawColumnLine2();
    drawRow2('合計金額', '¥18,590,000');
    drawUnderLine();
    index++;

    function drawColumnLine2() {
      workPage.drawLine({
        start: { x: 420, y: startY - 20 * index },
        end: { x: 420, y: startY - 20 * (index + 1) },
        thickness: 1,
      });
    }

    function drawRow2(item1: string, item2: string) {
      fontSize = 8;
      workPage.drawText(item1, {
        x: 290,
        y: startY - 20 * (index + 1) + 3,
        font: customFont, // カスタムフォントの設定
        size: fontSize,
        // color: rgb(0, 0, 0),
        // lineHeight: 24,
        // opacity: 1,
      });

      workPage.drawText(item2, {
        x: 480,
        y: startY - 20 * (index + 1) + 3,
        font: customFont, // カスタムフォントの設定
        size: fontSize,
      });
    }

    // ------------------------------------------------------------------/

    page.drawText(param.comment ?? '', {
      x: 35,
      y: startY - 20 * (index + 1) + 7,
      font: customFont, // カスタムフォントの設定
      size: 8,
      //color: rgb(0, 0, 0),
      //lineHeight: 24,
      //opacity: 1,
    });

    page.drawText('担当', {
      x: 335,
      y: startY - 20 * (index + 1) + 7,
      font: customFont, // カスタムフォントの設定
      size: 8,
      //color: rgb(0, 0, 0),
      //lineHeight: 24,
      //opacity: 1,
    });

    workPage.drawLine({
      start: { x: 330, y: startY - 20 * index },
      end: { x: 330, y: startY - 20 * (index + 3) },
      thickness: 1,
    });

    workPage.drawLine({
      start: { x: 420, y: startY - 20 * index },
      end: { x: 420, y: startY - 20 * (index + 3) },
      thickness: 1,
    });

    // 下横線
    workPage.drawLine({
      start: { x: whiteSpace, y: startY - 20 * (index + 3) },
      end: { x: width - whiteSpace, y: startY - 20 * (index + 3) },
      thickness: boldLine,
    });

    /*　ここまで出力内容
     * -----------------------------------------------------------------*/

    const pdfBytes: Uint8Array = await pdfDoc.save();

    const blob = new Blob([pdfBytes.buffer as ArrayBuffer], { type: 'application/pdf' });

    return blob;
  };

  return [printQuotation];
};

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

const formatTextArray = (text: string, font: PDFFont, fontSize: number, maxWidth: number) => {
  const textArray = [];

  // 1行に収まる場合
  if (font.widthOfTextAtSize(text, fontSize) <= maxWidth) {
    textArray.push(text);
    return textArray;
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
      textArray.push(currentText);
      currentText = '';
      currentWidth = 0;
    }
  }

  return textArray;
};
