import fontkit from '@pdf-lib/fontkit';
import { PDFDocument, rgb } from 'pdf-lib';
import { useEffect, useState } from 'react';

// PDF出力用のモデル定義
export type PdfModel = {
  item1: number;
  item2: string;
  item3: boolean;
};

type PdfTableModel = {
  item1: string;
  item2: string;
  item3: string;
  item4: string;
  item5: string;
  line: number; // 0:nomal 1:bold 2:double
};

// PDFデータ生成フック
export const usePdf = (): [(param: PdfModel) => Promise<Blob>] => {
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
  const printQuotation = async (param: PdfModel): Promise<Blob> => {
    // PDFドキュメント作成
    const pdfDoc = await PDFDocument.create();

    // フォントの設定
    pdfDoc.registerFontkit(fontkit);
    const customFont = await pdfDoc.embedFont(font);

    const sampleHeader = getSampleHeader();

    /* ここから出力内容
     * -----------------------------------------------------------------*/

    // PDFページ生成
    const page = pdfDoc.addPage();

    // ページの高さと幅
    const { width, height } = page.getSize();

    // ------------------------------------------------------------------/
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

    page.drawText('御見積書', {
      x: 257,
      y: 790,
      font: customFont, // カスタムフォントの設定
      size: 18,
      color: rgb(0, 0, 0),
      lineHeight: 24,
      opacity: 1,
    });
    page.drawText('****　　　　****', {
      x: 230,
      y: 786,
      font: customFont, // カスタムフォントの設定
      size: 18,
      color: rgb(0, 0, 0),
      lineHeight: 24,
      opacity: 1,
    });

    page.drawText(`No. ${sampleHeader.no}`, {
      x: 490,
      y: 786,
      font: customFont, // カスタムフォントの設定
      size: 10,
      color: rgb(0, 0, 0),
      lineHeight: 24,
      opacity: 1,
    });
    page.drawText(`${sampleHeader.date}`, {
      x: 452,
      y: 774,
      font: customFont, // カスタムフォントの設定
      size: 10,
      color: rgb(0, 0, 0),
      lineHeight: 24,
      opacity: 1,
    });

    // 取引先名枠線 -------------------------------------------------------/

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

    if (sampleHeader.client.length < 25) {
      page.drawText(sampleHeader.client, {
        x: 80,
        y: 746,
        font: customFont, // カスタムフォントの設定
        size: 14,
        color: rgb(0, 0, 0),
        lineHeight: 24,
        opacity: 1,
      });
    } else {
      page.drawText(sampleHeader.client.substring(0, 24), {
        x: 80,
        y: 754,
        font: customFont, // カスタムフォントの設定
        size: 14,
        color: rgb(0, 0, 0),
        lineHeight: 24,
        opacity: 1,
      });

      page.drawText(sampleHeader.client.substring(24, 48), {
        x: 80,
        y: 738,
        font: customFont, // カスタムフォントの設定
        size: 14,
        color: rgb(0, 0, 0),
        lineHeight: 24,
        opacity: 1,
      });
    }

    page.drawText(sampleHeader.clientName, {
      x: 442,
      y: 746,
      font: customFont, // カスタムフォントの設定
      size: 14,
      color: rgb(0, 0, 0),
      lineHeight: 24,
      opacity: 1,
    });

    page.drawText('様', {
      x: 500,
      y: 746,
      font: customFont, // カスタムフォントの設定
      size: 14,
      color: rgb(0, 0, 0),
      lineHeight: 24,
      opacity: 1,
    });

    page.drawText('下記の通り御見積申し上げます。', {
      x: 50,
      y: 717,
      font: customFont, // カスタムフォントの設定
      size: 10,
      color: rgb(0, 0, 0),
      lineHeight: 24,
      opacity: 1,
    });

    // ヘッダー枠線 -------------------------------------------------------/
    page.drawLine({
      start: { x: whiteSpace, y: 675 },
      end: { x: width - whiteSpace, y: 675 },
      thickness: 1,
    });

    page.drawLine({
      start: { x: whiteSpace, y: 590 },
      end: { x: width - whiteSpace, y: 590 },
      thickness: 1,
    });

    page.drawLine({
      start: { x: 150, y: 675 },
      end: { x: 150, y: 590 },
      thickness: 1,
    });

    page.drawLine({
      start: { x: 355, y: 675 },
      end: { x: 355, y: 590 },
      thickness: 1,
    });
    // ------------------------------------------------------------------/

    page.drawText('作品名', {
      x: 70,
      y: 665,
      font: customFont, // カスタムフォントの設定
      size: 10,
      color: rgb(0, 0, 0),
      lineHeight: 24,
      opacity: 1,
    });

    page.drawText('貸出期日', {
      x: 70,
      y: 650,
      font: customFont, // カスタムフォントの設定
      size: 10,
      color: rgb(0, 0, 0),
      lineHeight: 24,
      opacity: 1,
    });

    page.drawText('実施場所', {
      x: 70,
      y: 635,
      font: customFont, // カスタムフォントの設定
      size: 10,
      color: rgb(0, 0, 0),
      lineHeight: 24,
      opacity: 1,
    });

    page.drawText('本番日数', {
      x: 70,
      y: 620,
      font: customFont, // カスタムフォントの設定
      size: 10,
      color: rgb(0, 0, 0),
      lineHeight: 24,
      opacity: 1,
    });

    page.drawText('備考', {
      x: 70,
      y: 605,
      font: customFont, // カスタムフォントの設定
      size: 10,
      color: rgb(0, 0, 0),
      lineHeight: 24,
      opacity: 1,
    });

    page.drawText('H/ ○○○○○○○○○○○', {
      x: 155,
      y: 665,
      font: customFont, // カスタムフォントの設定
      size: 10,
      color: rgb(0, 0, 0),
      lineHeight: 24,
      opacity: 1,
    });

    page.drawText('2025/02/21〜2025/03/31各地', {
      x: 155,
      y: 650,
      font: customFont, // カスタムフォントの設定
      size: 10,
      color: rgb(0, 0, 0),
      lineHeight: 24,
      opacity: 1,
    });

    page.drawText('◯◯◯◯◯◯◯◯◯◯◯', {
      x: 155,
      y: 635,
      font: customFont, // カスタムフォントの設定
      size: 10,
      color: rgb(0, 0, 0),
      lineHeight: 24,
      opacity: 1,
    });

    page.drawText('◯◯◯◯◯◯◯◯◯◯◯', {
      x: 155,
      y: 620,
      font: customFont, // カスタムフォントの設定
      size: 10,
      color: rgb(0, 0, 0),
      lineHeight: 24,
      opacity: 1,
    });

    page.drawText('仮組 +1日、GP +1日', {
      x: 155,
      y: 605,
      font: customFont, // カスタムフォントの設定
      size: 10,
      color: rgb(0, 0, 0),
      lineHeight: 24,
      opacity: 1,
    });

    const pngImage = await pdfDoc.embedPng(image);
    pngImage.scale(1);
    page.drawImage(pngImage, {
      x: 360,
      y: 595,
      width: 200,
      height: 75,
    });

    // 合計金額枠線 -------------------------------------------------------/
    // 左縦線
    page.drawLine({
      start: { x: 110, y: 570 },
      end: { x: 110 - 1, y: 540 - 1 },
      thickness: 1,
    });
    // 上横線
    page.drawLine({
      start: { x: 110, y: 570 },
      end: { x: 460, y: 570 },
      thickness: 1,
    });
    // 右縦線
    page.drawLine({
      start: { x: 460, y: 540 - 1 },
      end: { x: 460, y: 570 },
      thickness: 1,
    });
    // 下横線
    page.drawLine({
      start: { x: 110, y: 540 },
      end: { x: 460, y: 540 },
      thickness: 1,
    });

    // 左縦線
    page.drawLine({
      start: { x: 108, y: 572 },
      end: { x: 108 - 1, y: 538 - 1 },
      thickness: 1,
    });
    // 上横線
    page.drawLine({
      start: { x: 108, y: 572 },
      end: { x: 462, y: 572 },
      thickness: 1,
    });
    // 右縦線
    page.drawLine({
      start: { x: 462, y: 538 - 1 },
      end: { x: 462, y: 572 },
      thickness: 1,
    });
    // 下横線
    page.drawLine({
      start: { x: 108, y: 538 },
      end: { x: 462, y: 538 },
      thickness: 1,
    });
    // ------------------------------------------------------------------/

    page.drawText('合計金額', {
      x: 130,
      y: 550,
      font: customFont, // カスタムフォントの設定
      size: 14,
      color: rgb(0, 0, 0),
      lineHeight: 24,
      opacity: 1,
    });

    page.drawText('¥18,590,000', {
      x: 220,
      y: 550,
      font: customFont, // カスタムフォントの設定
      size: 14,
      color: rgb(0, 0, 0),
      lineHeight: 24,
      opacity: 1,
    });

    page.drawText('(税込み)', {
      x: 370,
      y: 550,
      font: customFont, // カスタムフォントの設定
      size: 14,
      color: rgb(0, 0, 0),
      lineHeight: 24,
      opacity: 1,
    });
    // ------------------------------------------------------------------/

    page.drawLine({
      start: { x: whiteSpace, y: 520 },
      end: { x: width - whiteSpace, y: 520 },
      thickness: 1,
    });

    page.drawLine({
      start: { x: 330, y: 520 },
      end: { x: 330, y: 500 },
      thickness: 1,
    });

    page.drawLine({
      start: { x: 370, y: 520 },
      end: { x: 370, y: 500 },
      thickness: 1,
    });

    page.drawLine({
      start: { x: 410, y: 520 },
      end: { x: 410, y: 500 },
      thickness: 1,
    });

    page.drawLine({
      start: { x: 480, y: 520 },
      end: { x: 480, y: 500 },
      thickness: 1,
    });

    page.drawText('摘　　　　　　要', {
      x: 160,
      y: 505,
      font: customFont, // カスタムフォントの設定
      size: 12,
      color: rgb(0, 0, 0),
      lineHeight: 24,
      opacity: 1,
    });

    page.drawText('数　量', {
      x: 330,
      y: 505,
      font: customFont, // カスタムフォントの設定
      size: 12,
      color: rgb(0, 0, 0),
      lineHeight: 24,
      opacity: 1,
    });

    page.drawText('使用日', {
      x: 370,
      y: 505,
      font: customFont, // カスタムフォントの設定
      size: 12,
      color: rgb(0, 0, 0),
      lineHeight: 24,
      opacity: 1,
    });

    page.drawText('単　価', {
      x: 425,
      y: 505,
      font: customFont, // カスタムフォントの設定
      size: 12,
      color: rgb(0, 0, 0),
      lineHeight: 24,
      opacity: 1,
    });

    page.drawText('小　計', {
      x: 495,
      y: 505,
      font: customFont, // カスタムフォントの設定
      size: 12,
      color: rgb(0, 0, 0),
      lineHeight: 24,
      opacity: 1,
    });

    page.drawLine({
      start: { x: whiteSpace, y: 500 },
      end: { x: width - whiteSpace, y: 500 },
      thickness: 1,
    });

    // ------------------------------------------------------------------/

    // テストデータ
    const list = getTestData();

    let workPage = page;

    let startY = 500;
    let index = 0;
    list.forEach((childList) => {
      childList.forEach((row) => {
        // workPage.drawLine({
        //   start: { x: whiteSpace, y: startY - 20 * index },
        //   end: { x: width - whiteSpace, y: startY - 20 * index },
        //   thickness: 1,
        // });

        workPage.drawLine({
          start: { x: 330, y: startY - 20 * index },
          end: { x: 330, y: startY - 20 * (index + 1) },
          thickness: 1,
        });

        workPage.drawLine({
          start: { x: 370, y: startY - 20 * index },
          end: { x: 370, y: startY - 20 * (index + 1) },
          thickness: 1,
        });

        workPage.drawLine({
          start: { x: 410, y: startY - 20 * index },
          end: { x: 410, y: startY - 20 * (index + 1) },
          thickness: 1,
        });

        workPage.drawLine({
          start: { x: 480, y: startY - 20 * index },
          end: { x: 480, y: startY - 20 * (index + 1) },
          thickness: 1,
        });

        workPage.drawText(row.item1, {
          x: 160,
          y: startY - 20 * (index + 1),
          font: customFont, // カスタムフォントの設定
          size: 12,
          color: rgb(0, 0, 0),
          lineHeight: 24,
          opacity: 1,
        });

        workPage.drawText(row.item2, {
          x: 330,
          y: startY - 20 * (index + 1),
          font: customFont, // カスタムフォントの設定
          size: 12,
          color: rgb(0, 0, 0),
          lineHeight: 24,
          opacity: 1,
        });

        workPage.drawText(row.item3, {
          x: 370,
          y: startY - 20 * (index + 1),
          font: customFont, // カスタムフォントの設定
          size: 12,
          color: rgb(0, 0, 0),
          lineHeight: 24,
          opacity: 1,
        });

        workPage.drawText(row.item4, {
          x: 425,
          y: startY - 20 * (index + 1),
          font: customFont, // カスタムフォントの設定
          size: 12,
          color: rgb(0, 0, 0),
          lineHeight: 24,
          opacity: 1,
        });

        workPage.drawText(row.item5, {
          x: 495,
          y: startY - 20 * (index + 1),
          font: customFont, // カスタムフォントの設定
          size: 12,
          color: rgb(0, 0, 0),
          lineHeight: 24,
          opacity: 1,
        });

        // 0:nomal 1:bold 2:double
        if (row.line === 0) {
          workPage.drawLine({
            start: { x: whiteSpace, y: startY - 20 * (index + 1) },
            end: { x: width - whiteSpace, y: startY - 20 * (index + 1) },
            thickness: 1,
          });
        } else if (row.line === 1) {
          workPage.drawLine({
            start: { x: whiteSpace, y: startY - 20 * (index + 1) },
            end: { x: width - whiteSpace, y: startY - 20 * (index + 1) },
            thickness: 2,
          });
        } else if (row.line === 2) {
          workPage.drawLine({
            start: { x: whiteSpace, y: startY - 19 * (index + 1) },
            end: { x: width - whiteSpace, y: startY - 19 * (index + 1) },
            thickness: 1,
          });
          workPage.drawLine({
            start: { x: whiteSpace, y: startY - 20 * (index + 1) },
            end: { x: width - whiteSpace, y: startY - 20 * (index + 1) },
            thickness: 1,
          });
        }

        index++;

        if (20 < index) {
          // 外枠線 -------------------------------------------------------------/
          // 下横線
          workPage.drawLine({
            start: { x: whiteSpace, y: whiteSpace },
            end: { x: width - whiteSpace, y: whiteSpace },
            thickness: boldLine,
          });

          workPage = pdfDoc.addPage();

          startY = 780;
          index = 0;

          // 外枠線 -------------------------------------------------------------/
          // 左縦線
          workPage.drawLine({
            start: { x: whiteSpace - 1, y: whiteSpace - 1 },
            end: { x: whiteSpace - 1, y: height - (whiteSpace - 1) },
            thickness: boldLine,
          });
          // 上横線
          workPage.drawLine({
            start: { x: whiteSpace, y: height - whiteSpace },
            end: { x: width - whiteSpace, y: height - whiteSpace },
            thickness: boldLine,
          });
          // 右縦線
          workPage.drawLine({
            start: { x: width - (whiteSpace + 1), y: whiteSpace - 1 },
            end: { x: width - (whiteSpace + 1), y: height - (whiteSpace - 1) },
            thickness: boldLine,
          });
        }
      });

      // TODO:空行
      index++;
    });

    // ------------------------------------------------------------------/

    const footerList = [];
    footerList.push({ item1: '中計', item2: '17,128,000' });
    footerList.push({ item1: '特別調整値引き', item2: '-228,000' });
    footerList.push({ item1: '', item2: '' });
    footerList.push({ item1: '合計', item2: '16,9000,000' });
    footerList.push({ item1: '消費税（10%）', item2: '1,690,000' });
    footerList.push({ item1: '合計金額', item2: '¥18,590,000' });

    footerList.forEach((row) => {
      workPage.drawLine({
        start: { x: 420, y: startY - 20 * index },
        end: { x: 420, y: startY - 20 * (index + 1) },
        thickness: 1,
      });

      workPage.drawText(row.item1, {
        x: 300,
        y: startY - 20 * (index + 1),
        font: customFont, // カスタムフォントの設定
        size: 12,
        color: rgb(0, 0, 0),
        lineHeight: 24,
        opacity: 1,
      });

      workPage.drawText(row.item2, {
        x: 480,
        y: startY - 20 * (index + 1),
        font: customFont, // カスタムフォントの設定
        size: 12,
        color: rgb(0, 0, 0),
        lineHeight: 24,
        opacity: 1,
      });

      workPage.drawLine({
        start: { x: whiteSpace, y: startY - 20 * (index + 1) },
        end: { x: width - whiteSpace, y: startY - 20 * (index + 1) },
        thickness: 1,
      });

      index++;
    });

    // ------------------------------------------------------------------/

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

const getSampleHeader = () => {
  return {
    no: '93391-2',
    date: '令和7年4月23日',
    client: '株式会社リファクト〇〇〇〇〇〇〇〇〇〇〇〇〇〇〇〇〇〇〇〇〇〇〇〇〇〇〇〇',
    clientName: '〇〇〇〇',
  };
};

const getTestData = () => {
  const list = [];

  const childList1 = [];
  childList1.push({ item1: 'Diamond 9-215', item2: '1', item3: '8.0', item4: '80,000', item5: '640,000', line: 0 });
  childList1.push({ item1: 'ｽﾏｰﾄﾌｪｰﾄﾞ 1248', item2: '1', item3: '8.0', item4: '8,000', item5: '64,000', line: 0 });
  childList1.push({
    item1: 'システム回り一式',
    item2: '1',
    item3: '8.0',
    item4: '188,000',
    item5: '1,504,000',
    line: 0,
  });
  childList1.push({
    item1: 'ビーム強電ｹｰﾌﾞﾙ一式',
    item2: '1',
    item3: '8.0',
    item4: '39,900',
    item5: '319,200',
    line: 1,
  });
  childList1.push({ item1: '', item2: '', item3: '', item4: '小計', item5: '17,701,200', line: 0 });
  childList1.push({ item1: '', item2: '', item3: '', item4: '値引き', item5: '-7,301,200', line: 0 });
  childList1.push({
    item1: '1本単価：1,300,000-',
    item2: '',
    item3: '',
    item4: '機材費A',
    item5: '10,400,000',
    line: 0,
  });
  list.push(childList1);

  const childList2 = [];
  childList2.push({ item1: 'Diamond 9-215', item2: '1', item3: '8.0', item4: '80,000', item5: '640,000', line: 0 });
  childList2.push({ item1: 'ｽﾏｰﾄﾌｪｰﾄﾞ 1248', item2: '1', item3: '8.0', item4: '8,000', item5: '64,000', line: 0 });
  childList2.push({
    item1: '横浜> インカム・備品 一式',
    item2: '1',
    item3: '2.0',
    item4: '22,100',
    item5: '44,200',
    line: 2,
  });
  childList2.push({ item1: '', item2: '', item3: '', item4: '小計', item5: '1,682,800', line: 0 });
  childList2.push({ item1: '', item2: '', item3: '', item4: '値引き', item5: '-696,800', line: 0 });
  childList2.push({
    item1: '',
    item2: '',
    item3: '',
    item4: '機材費B',
    item5: '986,000',
    line: 2,
  });
  list.push(childList2);

  const childList3 = [];
  childList3.push({ item1: '', item2: '', item3: '', item4: '機材費A+B', item5: '11,386,000', line: 0 });
  list.push(childList3);

  const childList4 = [];
  childList4.push({ item1: 'Diamond 9-215', item2: '1', item3: '8.0', item4: '80,000', item5: '640,000', line: 0 });
  childList4.push({ item1: 'Diamond 9-215', item2: '1', item3: '8.0', item4: '80,000', item5: '640,000', line: 0 });
  childList4.push({ item1: 'Diamond 9-215', item2: '1', item3: '8.0', item4: '80,000', item5: '640,000', line: 0 });
  childList4.push({ item1: 'Diamond 9-215', item2: '1', item3: '8.0', item4: '80,000', item5: '640,000', line: 0 });
  childList4.push({ item1: 'Diamond 9-215', item2: '1', item3: '8.0', item4: '80,000', item5: '640,000', line: 0 });
  childList4.push({ item1: 'Diamond 9-215', item2: '1', item3: '8.0', item4: '80,000', item5: '640,000', line: 0 });
  childList4.push({ item1: 'Diamond 9-215', item2: '1', item3: '8.0', item4: '80,000', item5: '640,000', line: 0 });
  childList4.push({ item1: 'Diamond 9-215', item2: '1', item3: '8.0', item4: '80,000', item5: '640,000', line: 0 });
  childList4.push({ item1: 'Diamond 9-215', item2: '1', item3: '8.0', item4: '80,000', item5: '640,000', line: 0 });
  childList4.push({ item1: 'Diamond 9-215', item2: '1', item3: '8.0', item4: '80,000', item5: '640,000', line: 0 });
  childList4.push({ item1: 'Diamond 9-215', item2: '1', item3: '8.0', item4: '80,000', item5: '640,000', line: 0 });
  childList4.push({ item1: 'Diamond 9-215', item2: '1', item3: '8.0', item4: '80,000', item5: '640,000', line: 0 });
  childList4.push({ item1: 'Diamond 9-215', item2: '1', item3: '8.0', item4: '80,000', item5: '640,000', line: 0 });
  childList4.push({ item1: 'Diamond 9-215', item2: '1', item3: '8.0', item4: '80,000', item5: '640,000', line: 0 });
  childList4.push({ item1: 'Diamond 9-215', item2: '1', item3: '8.0', item4: '80,000', item5: '640,000', line: 0 });
  childList4.push({ item1: 'Diamond 9-215', item2: '1', item3: '8.0', item4: '80,000', item5: '640,000', line: 0 });
  childList4.push({ item1: 'Diamond 9-215', item2: '1', item3: '8.0', item4: '80,000', item5: '640,000', line: 0 });
  list.push(childList4);

  return list;
};
