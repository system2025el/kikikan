'use client';

import { Box, Container, Snackbar, Stack } from '@mui/material';
import { useEffect, useState } from 'react';
import { read, utils } from 'xlsx';
import z from 'zod';

import { BackButton } from '@/app/(main)/_ui/buttons';

import { ImportData } from '../_lib/funcs';
import { Section } from './section'; // Assuming section.tsx is in the same directory

export const ImportMaster = () => {
  const [eqptFileName, setEqptFileName] = useState<string>('ファイルが選ばれていません');
  const [rfidFileName, setRfidFileName] = useState<string>('ファイルが選ばれていません'); // Initialize RFID filename
  const [eqptData, setEqptData] = useState<EqptImportType[]>([]);
  // const [rfidData, setRfidData] = useState<RFIDImportType[]>([]); // State for RFID data
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
            section_num: row[3] !== null && row[3] !== undefined ? parseNumber(row[3]) : null,
            kizai_nam: String(row[4] ?? ''),
            el_num: row[5] !== null && row[5] !== undefined ? parseNumber(row[5]) : null,
            shozoku_id: Number(parseNumber(row[6]) ?? 0),
            bld_cod: String(row[7] ?? ''),
            tana_cod: String(row[8] ?? ''),
            eda_cod: String(row[9] ?? ''),
            kizai_grp_cod: String(row[10] ?? ''),
            dsp_ord_num: row[11] !== null && row[11] !== undefined ? parseNumber(row[11]) : null,
            mem: String(row[12] ?? ''),
            dai_bumon_nam: String(row[13] ?? ''),
            bumon_nam: String(row[14] ?? ''),
            shukei_bumon_nam: String(row[15] ?? ''),
            dsp_flg: row[16] !== null && row[16] !== undefined ? parseNumber(row[16]) : null,
            ctn_flg: row[17] !== null && row[17] !== undefined ? parseNumber(row[17]) : null,
            def_dat_qty: row[18] !== null && row[18] !== undefined ? parseNumber(row[18]) : null,
            reg_amt: parseNumber(row[19]),
            rank_amt_1: row[20] !== null && row[20] !== undefined ? parseNumber(row[20]) : null,
            rank_amt_2: row[21] !== null && row[21] !== undefined ? parseNumber(row[21]) : null,
            rank_amt_3: row[22] !== null && row[22] !== undefined ? parseNumber(row[22]) : null,
            rank_amt_4: row[23] !== null && row[23] !== undefined ? parseNumber(row[23]) : null,
            rank_amt_5: row[24] !== null && row[24] !== undefined ? parseNumber(row[24]) : null,
          };
          const result = eqptSchema.safeParse(rowObject);
          if (result.success) {
            parsedEqptData.push(result.data);
          } else {
            console.error(`機材マスタの行 ${index + 2} でバリデーションエラー:`, result.error.issues);
            hasError = true;
            // エラーハンドリング
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
    // // Add your logic to send rfidData to the server or process it further
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

// 機材インポートタイプ
export type EqptImportType = z.infer<typeof eqptSchema>;

// 機材インポートタイプのZodスキーマ
const eqptSchema = z.object({
  rfid_tag_id: z.string(),
  rfid_kizai_sts: z.number().nullable().optional(),
  del_flg: z.number().nullable().optional(),
  section_num: z.number().nullable().optional(),
  kizai_nam: z.string(),
  el_num: z.number().nullable().optional(),
  shozoku_id: z.number().nullable().optional(),
  bld_cod: z.string().optional(),
  tana_cod: z.string().optional(),
  eda_cod: z.string().optional(),
  kizai_grp_cod: z.string().optional(),
  dsp_ord_num: z.number().nullable().optional(),
  mem: z.string().optional(),
  dai_bumon_nam: z.string().optional(),
  bumon_nam: z.string().optional(),
  shukei_bumon_nam: z.string().optional(),
  dsp_flg: z.number().nullable().optional(),
  ctn_flg: z.number().nullable().optional(),
  def_dat_qty: z.number().nullable().optional(),
  reg_amt: z.number().nullable().optional(),
  rank_amt_1: z.number().nullable().optional(),
  rank_amt_2: z.number().nullable().optional(),
  rank_amt_3: z.number().nullable().optional(),
  rank_amt_4: z.number().nullable().optional(),
  rank_amt_5: z.number().nullable().optional(),
});

type EqptImportRowType = [
  string, // rfid_tag_id
  number, // rfid_kizai_sts
  number | null, // del_flg
  number | null, // section_num
  string, // kizai_nam
  number | null, // el_num
  number, // shozoku_id
  string | undefined, // bld_cod
  string | undefined, // tana_cod
  string | undefined, // eda_cod
  string | undefined, // kizai_grp_cod
  number | null, // dsp_ord_num
  string | undefined, // mem
  string | undefined, // dai_bumon_nam
  string | undefined, //bumon_nam
  string | undefined, // shukei_bumon_nam
  number | null, // dsp_flg
  number | null, // ctn_flg
  number | null, // def_dat_qty
  number, // reg_amt
  number | null, // rank_amt_1
  number | null, // rank_amt_2
  number | null, // rank_amt_3
  number | null, // rank_amt_4
  number | null, // rank_amt_5
];

const parseNumber = (input: number | null) => {
  if (input === null) return null;
  if (input === undefined) return null;
  const inputString = String(input);
  const normalizedString = inputString.replace(/[０-９]/g, (s) => String.fromCharCode(s.charCodeAt(0) - 0xfee0));
  const cleanString = normalizedString.replace(/[,\.]/g, '');
  if (cleanString === '') return null;

  const result = Number(cleanString);
  return isNaN(result) ? null : result;
};
