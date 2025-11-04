'use client';

import { Box, Container, Snackbar, Stack } from '@mui/material';
import { useEffect, useState } from 'react';
import { read, utils } from 'xlsx';

import { useUserStore } from '@/app/_lib/stores/usestore';
import { BackButton } from '@/app/(main)/_ui/buttons';

import { ImportEqptRfidData, sendLogServer } from '../_lib/funcs';
import { EqptImportRowType, EqptImportType, eqptSchema, parseNumber } from '../_lib/types';
import { Section } from './section';

/**
 * マスタインポート画面
 * @returns {JSX.Element} マスタインポート画面のコンポーネント
 */
export const ImportMaster = () => {
  // ログインユーザ
  const user = useUserStore((state) => state.user);

  const errorRows: number[] = [];
  /* useState ----------------------------------------------------- */
  /** インポートした機材RFIDマスタファイル名 */
  const [eqptFileName, setEqptFileName] = useState<string>('ファイルが選択されていません');
  /** インポートした顧客マスタファイル名 */
  const [customerFileName, setCustomerFileName] = useState<string>('ファイルが選択されていません');
  /** 機材RFIDデータ */
  const [eqptData, setEqptData] = useState<EqptImportType[]>([]);
  /** 顧客データ */
  // const [customerData, setCustomerData] = useState<RFIDImportType[]>([]);
  /** スナックバーの表示するかしないか */
  const [snackBarOpen, setSnackBarOpen] = useState(false);
  /** スナックバーのメッセージ */
  const [snackBarMessage, setSnackBarMessage] = useState('ファイルが選択されていません');

  /* methods ----------------------------------------------------- */
  /** ファイルを選んでデータをオブジェクト化 */
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>, type: 'eqpt' | 'customer' | '') => {
    const file = event.target.files?.[0];
    if (!file) {
      setSnackBarMessage('ファイルが選択されていません。');
      setSnackBarOpen(true);
      return;
    }
    // ファイル読み込み
    const reader = new FileReader();
    reader.onload = (e) => {
      console.log('ファイル読み込み成功');

      const arrayBuffer = e.target?.result;
      if (!arrayBuffer || typeof arrayBuffer === 'string') {
        console.log('ファイルの読み込みに失敗しました');
        setSnackBarMessage('ファイルの読み込みに失敗しました。');
        setSnackBarOpen(true);
        return;
      }
      const workbook = read(arrayBuffer, { type: 'array' });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const jsonData: EqptImportRowType[] = utils.sheet_to_json(worksheet, { header: 1 });
      const dataRows = jsonData.slice(1);
      console.log('Excel内容 (生データ):', dataRows);

      if (type === 'eqpt') {
        const parsedEqptData: EqptImportType[] = [];
        let hasError = false;
        dataRows.forEach((row, index) => {
          // rfid_tag_idの部分が空ならそもそも取得しない
          if (!row[0] || row[0].trim() === '') {
            return;
          }
          // 置き換え
          const rowObject = {
            rfid_tag_id: String(row[0]),
            rfid_kizai_sts: parseNumber(row[1]),
            del_flg: parseNumber(row[2]),
            section_nam: String(row[3] ?? ''),
            kizai_nam: String(row[4]),
            el_num: parseNumber(row[5]),
            shozoku_id: parseNumber(row[6]),
            bld_cod: String(row[7] ?? ''),
            tana_cod: String(row[8] ?? ''),
            eda_cod: String(row[9] ?? ''),
            kizai_grp_cod: String(row[10] ?? ''),
            dsp_ord_num: parseNumber(row[11]),
            mem: String(row[12] ?? ''),
            dai_bumon_nam: String(row[13] ?? ''),
            bumon_nam: String(row[14] ?? ''),
            shukei_bumon_nam: String(row[15] ?? ''),
            dsp_flg: parseNumber(row[16]),
            ctn_flg: parseNumber(row[17]),
            def_dat_qty: parseNumber(row[18]),
            reg_amt: parseNumber(row[19]),
            // rank_amt_1: parseNumber(row[20]),
            // rank_amt_2: parseNumber(row[21]),
            // rank_amt_3: parseNumber(row[22]),
            // rank_amt_4: parseNumber(row[23]),
            // rank_amt_5: parseNumber(row[24]),
          };
          const result = eqptSchema.safeParse(rowObject);
          if (result.success) {
            setEqptFileName(file.name);
            parsedEqptData.push(result.data);
          } else {
            console.error(`${file.name}の行 ${index + 1} でバリデーションエラー:`, result.error.issues);
            hasError = true;
            errorRows.push(index + 1);
            sendLogServer(index + 1, result.error.issues);
          }
        });

        if (!hasError) {
          setEqptData(parsedEqptData);
          setSnackBarMessage(`${file.name}を読み込みました。`);
          setSnackBarOpen(true);
        } else {
          setSnackBarMessage(`${file.name}の ${errorRows.join(', ')}行目 にエラーがあります`);
          setSnackBarOpen(true);
        }
      } else {
        // // type === 'customer'
        setCustomerFileName(file.name);
        // setSnackBarOpen(true);
      }
    };
    reader.readAsArrayBuffer(file);
    event.target.value = '';
  };

  /* 機材インポートの登録ボタン押下時 */
  const handleImportEqpt = async () => {
    console.log('RFID機材マスタデータをインポート:', eqptData);

    if (eqptData.length !== 0) {
      try {
        // インポートするデータがあったら実行
        await ImportEqptRfidData(eqptData, user?.name ?? '');
        setEqptFileName('ファイルが選択されていません');
        setSnackBarMessage(`${eqptFileName}を登録しました`);
        setSnackBarOpen(true);
        setEqptData([]);
      } catch (error) {
        console.error('データの登録中にエラーが発生しました:', error);
        setSnackBarMessage('データの登録中にエラーが発生しました。');
        setSnackBarOpen(true);
      }
    } else {
      // データがない時
      setSnackBarMessage('登録するデータがありません。');
      setSnackBarOpen(true);
    }
  };

  return (
    <Container disableGutters sx={{ minWidth: '100%' }} maxWidth={'xl'}>
      <Stack direction={'column'} spacing={5} sx={{ minWidth: '100%' }}>
        <Section
          masterName={'機材RFID'}
          fileName={eqptFileName}
          handleFileUpload={handleFileUpload}
          handleImport={handleImportEqpt}
          fileInputId="eqpts-excel-file"
        />
      </Stack>
      <Snackbar
        open={snackBarOpen}
        autoHideDuration={6000}
        onClose={() => setSnackBarOpen(false)}
        message={snackBarMessage}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
        sx={{ marginTop: '65px' }}
      />
    </Container>
  );
};
