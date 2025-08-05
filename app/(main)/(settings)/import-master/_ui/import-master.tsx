'use client';

import { Box, Container, Snackbar, Stack } from '@mui/material';
import { useEffect, useState } from 'react';
import { read, utils } from 'xlsx';

import { BackButton } from '@/app/(main)/_ui/buttons';

import { ImportData } from '../_lib/funcs';
import { EqptImportRowType, EqptImportType, eqptSchema, parseNumber } from '../_lib/types';
import { Section } from './section';

export const ImportMaster = () => {
  const [eqptFileName, setEqptFileName] = useState<string>('ファイルが選ばれていません');
  const [rfidFileName, setRfidFileName] = useState<string>('ファイルが選ばれていません');
  const [eqptData, setEqptData] = useState<EqptImportType[]>([]);
  // const [rfidData, setRfidData] = useState<RFIDImportType[]>([]);
  const [snackBarOpen, setSnackBarOpen] = useState(false);
  const [snackBarMessage, setSnackBarMessage] = useState('');

  /* ファイルを選んでデータをオブジェクト化 */
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>, type: 'eqpt' | 'rfid') => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (type === 'eqpt') {
      setEqptFileName(file.name);
    } else {
      setRfidFileName(file.name);
    }

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
          // 置き換え
          const rowObject = {
            rfid_tag_id: String(row[0] ?? ''),
            rfid_kizai_sts: parseNumber(row[1] ?? 0),
            del_flg: parseNumber(row[2]),
            section_num: parseNumber(row[3]),
            kizai_nam: String(row[4] ?? ''),
            el_num: parseNumber(row[5]),
            shozoku_id: Number(parseNumber(row[6]) ?? 0),
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
            rank_amt_1: parseNumber(row[20]),
            rank_amt_2: parseNumber(row[21]),
            rank_amt_3: parseNumber(row[22]),
            rank_amt_4: parseNumber(row[23]),
            rank_amt_5: parseNumber(row[24]),
          };
          const result = eqptSchema.safeParse(rowObject);
          if (result.success) {
            parsedEqptData.push(result.data);
          } else {
            console.error(`機材マスタの行 ${index + 2} でバリデーションエラー:`, result.error.issues);
            hasError = true;
          }
        });
        setEqptData(parsedEqptData);
        if (hasError) {
          setSnackBarOpen(true);
          setSnackBarMessage('機材マスタファイルにエラーのある行がありました。コンソールを確認してください。');
        } else {
          setSnackBarOpen(true);
          setSnackBarMessage('機材マスタファイルを読み込みました。');
        }
        setSnackBarOpen(true);
      } else {
        // // type === 'rfid'
        // const parsedRfidData: RFIDImportType[] = [];
        // let hasError = false;
        // dataRows.forEach((row, index) => {
        //   const rowObject = {
        //     rfid_tag_id: row[0],
        //     location_id: row[1],
        //     status: row[2],
        //   };
        //   const result = rfidSchema.safeParse(rowObject);
        //   if (result.success) {
        //     parsedRfidData.push(result.data);
        //   } else {
        //     console.error(`RFIDマスタの行 ${index + 2} でバリデーションエラー:`, result.error.issues);
        //     hasError = true;
        //   }
        // });
        // setRfidData(parsedRfidData);
        // if (hasError) {
        //   setSnackBarMessage('RFIDマスタファイルにエラーのある行がありました。コンソールを確認してください。');
        // } else {
        //   setSnackBarMessage('RFIDマスタファイルを読み込みました。');
        // }
        // setSnackBarOpen(true);
      }
    };

    reader.readAsArrayBuffer(file);
  };

  useEffect(() => {
    console.log('eqptData更新:', eqptData, eqptFileName);
  }, [eqptData, eqptFileName]);

  // useEffect(() => {
  //   console.log('rfidData更新:', rfidData, rfidFileName);
  // }, [rfidData, rfidFileName]);

  const handleImportEqpt = async () => {
    console.log('Importing Equipment Data:', eqptData);
    await ImportData(eqptData);
    setSnackBarOpen(true);
  };

  const handleImportRfid = () => {
    // console.log('Importing RFID Data:', rfidData);
    // alert('RFIDマスタのインポートが実行されました (コンソールを確認)');
  };

  return (
    <Container disableGutters sx={{ minWidth: '100%' }} maxWidth={'xl'}>
      <Box justifySelf={'end'} mb={0.5}>
        <BackButton label={'戻る'} />
      </Box>
      <Stack direction={'column'} spacing={5} sx={{ minWidth: '100%' }}>
        <Section
          masterName={'機材'}
          fileName={eqptFileName}
          handleFileUpload={handleFileUpload}
          handleImport={handleImportEqpt}
          fileInputId="eqpt-excel-file" // Unique ID for equipment file input
        />
        <Section
          masterName={'RFID'}
          fileName={rfidFileName}
          handleFileUpload={handleFileUpload}
          handleImport={handleImportRfid}
          fileInputId="rfid-excel-file" // Unique ID for RFID file input
        />
      </Stack>
      <Snackbar
        open={snackBarOpen}
        autoHideDuration={6000}
        onClose={() => setSnackBarOpen(false)}
        message={snackBarMessage}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      />
    </Container>
  );
};
