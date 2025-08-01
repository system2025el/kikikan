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
      const dataRows = jsonData.slice(1).map((row) => {
        row.splice(14, 1); // O列が14番目で空欄なので削除
        return row;
      }); // ヘッダー行をスキップ
      console.log('Excel内容 (生データ):', dataRows);

      if (type === 'eqpt') {
        const parsedEqptData: EqptImportType[] = [];
        let hasError = false;
        dataRows.forEach((row, index) => {
          // 置き換え
          const rowObject = {
            rfid_tag_id: row[0],
            kizai_id: row[1],
            del_flg: row[2],
            section_num: row[3],
            kizai_nam: row[4],
            el_num: row[5],
            shozoku_id: row[6],
            bld_cod: row[7],
            tana_cod: row[8],
            eda_cod: row[9],
            kizai_grp_cod: row[10],
            dsp_ord_num: row[11],
            mem: row[12],
            dai_bumon_nam: row[13],
            shukei_bumon_nam: row[14],
            dsp_flg: row[15],
            ctn_flg: row[16],
            def_dat_qty: row[17],
            reg_amt: row[18],
            rank_amt_1: row[19],
            rank_amt_2: row[20],
            rank_amt_3: row[21],
            rank_amt_4: row[22],
            rank_amt_5: row[23],
          };

          const result = eqptSchema.safeParse(rowObject); // safeParseで安全に検証
          if (result.success) {
            parsedEqptData.push(result.data);
          } else {
            console.error(`機材マスタの行 ${index + 2} でバリデーションエラー:`, result.error.issues);
            hasError = true;
            // エラーをユーザーに通知するなど、適切なエラーハンドリングをここに追加
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
  rfid_tag_id: z.string().transform((val) => String(val || '')), // stringに変換
  kizai_id: z.number().transform((val) => Number(val || 0)), // numberに変換
  del_flg: z
    .number()
    .nullable()
    .optional()
    .transform((val) => (val === null || val === undefined ? null : Number(val))),
  section_num: z
    .number()
    .nullable()
    .optional()
    .transform((val) => (val === null || val === undefined ? null : Number(val))),
  kizai_nam: z.string().transform((val) => String(val || '')),
  el_num: z
    .number()
    .nullable()
    .optional()
    .transform((val) => (val === null || val === undefined ? null : Number(val))),
  shozoku_id: z.number().transform((val) => Number(val || 0)),
  bld_cod: z
    .string()
    .optional()
    .transform((val) => (val === null || val === undefined ? '' : String(val))),
  tana_cod: z
    .string()
    .optional()
    .transform((val) => (val === null || val === undefined ? '' : String(val))),
  eda_cod: z
    .string()
    .optional()
    .transform((val) => (val === null || val === undefined ? '' : String(val))),
  kizai_grp_cod: z
    .string()
    .optional()
    .transform((val) => (val === null || val === undefined ? '' : String(val))),
  dsp_ord_num: z
    .number()
    .nullable()
    .optional()
    .transform((val) => (val === null || val === undefined ? null : Number(val))),
  mem: z
    .string()
    .optional()
    .transform((val) => (val === null || val === undefined ? '' : String(val))),
  dai_bumon_nam: z
    .string()
    .optional()
    .transform((val) => (val === null || val === undefined ? '' : String(val))),
  shukei_bumon_nam: z
    .string()
    .optional()
    .transform((val) => (val === null || val === undefined ? '' : String(val))),
  dsp_flg: z
    .number()
    .nullable()
    .optional()
    .transform((val) => (val === null || val === undefined ? null : Number(val))),
  ctn_flg: z
    .number()
    .nullable()
    .optional()
    .transform((val) => (val === null || val === undefined ? null : Number(val))),
  def_dat_qty: z
    .number()
    .nullable()
    .optional()
    .transform((val) => (val === null || val === undefined ? null : Number(val))),
  reg_amt: z.number().transform((val) => Number(val || 0)),
  rank_amt_1: z
    .number()
    .nullable()
    .optional()
    .transform((val) => (val === null || val === undefined ? null : Number(val))),
  rank_amt_2: z
    .number()
    .nullable()
    .optional()
    .transform((val) => (val === null || val === undefined ? null : Number(val))),
  rank_amt_3: z
    .number()
    .nullable()
    .optional()
    .transform((val) => (val === null || val === undefined ? null : Number(val))),
  rank_amt_4: z
    .number()
    .nullable()
    .optional()
    .transform((val) => (val === null || val === undefined ? null : Number(val))),
  rank_amt_5: z
    .number()
    .nullable()
    .optional()
    .transform((val) => (val === null || val === undefined ? null : Number(val))),
});

type EqptImportRowType = [
  string, // rfid_tag_id
  number, // kizai_id
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
