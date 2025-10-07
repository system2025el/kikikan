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

    /* 外枠
     * -----------------------------------------------------------------*/
    // ページに線を描画
    const whiteSpace = 30;
    const boldLine = 2;

    // // 上横線
    // page.drawLine({
    //   start: { x: whiteSpace, y: height - whiteSpace },
    //   end: { x: width - whiteSpace, y: height - whiteSpace },
    //   thickness: boldLine,
    // });
    // // 左縦線
    // page.drawLine({
    //   start: { x: whiteSpace - 1, y: whiteSpace - 1 },
    //   end: { x: whiteSpace - 1, y: height - (whiteSpace - 1) },
    //   thickness: boldLine,
    // });
    // // 右縦線
    // page.drawLine({
    //   start: { x: width - (whiteSpace + 1), y: whiteSpace - 1 },
    //   end: { x: width - (whiteSpace + 1), y: height - (whiteSpace - 1) },
    //   thickness: boldLine,
    // });
    // // 下横線
    // page.drawLine({
    //   start: { x: whiteSpace, y: whiteSpace },
    //   end: { x: width - whiteSpace, y: whiteSpace },
    //   thickness: boldLine,
    // });
    // ------------------------------------------------------------------/

    /* タイトル・見積番号・見積日
     * -----------------------------------------------------------------*/
    page.drawText('請　求　書', {
      x: 365,
      y: 790,
      font: customFont, // カスタムフォントの設定
      size: 18,
      //color: rgb(0, 0, 0),
      //lineHeight: 10,
      //opacity: 1,
    });
    // ------------------------------------------------------------------/

    /*　ここまで出力内容
     * -----------------------------------------------------------------*/

    const pdfBytes: Uint8Array = await pdfDoc.save();

    const blob = new Blob([pdfBytes.buffer as ArrayBuffer], { type: 'application/pdf' });

    return blob;
  };

  return [printBill];
};
