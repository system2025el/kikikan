'use client';

import {
  Box,
  Button,
  Dialog,
  Divider,
  FormControl,
  Grid2,
  MenuItem,
  Select,
  SelectChangeEvent,
  TextField,
  Typography,
} from '@mui/material';
import { grey } from '@mui/material/colors';
import { useRef, useState } from 'react';
import React from 'react';

import { BackButton } from '@/app/(main)/_ui/back-button';
import DateX from '@/app/(main)/_ui/date';
import { GridSelectBoxTable } from '@/app/(main)/_ui/gridtable';
import Time from '@/app/(main)/_ui/time';
import { cellWidths, data, header } from '@/app/(main)/new-order/equipment-order-detail/_lib/data';
import { getEquipmentRowBackgroundColor } from '@/app/(main)/new-order/schedule/_lib/colorselect';

import { DateSelectDialog } from './date-selection-dialog';
import { EquipmentSelectionDialog } from './equipment-selection-dailog';

export type EquipmentData = {
  date: string;
  memo: string;
};

const EquipmentOrderDetail = () => {
  const [selectStatus, setSelectStatus] = useState('準備中');
  const [selectedValues, setSelectedValues] = useState<string[]>(Array(2).fill('KICS'));
  const [selectReturnBase, setSelectReturnBase] = useState('YARD');
  const [rows, setRows] = useState(data);
  const editableColumns = [2, 3];

  const selectIssueBaseChange = (index: number, value: string) => {
    const newValues = [...selectedValues];
    newValues[index] = value;
    setSelectedValues(newValues);
  };
  const selectStatusChange = (event: SelectChangeEvent) => {
    setSelectStatus(event.target.value);
  };
  const selectReturnBaseChange = (event: SelectChangeEvent) => {
    setSelectReturnBase(event.target.value);
  };

  const handleCellChange = (rowIndex: number, colIndex: number, newValue: number) => {
    const updatedRows = [...rows];
    updatedRows[rowIndex].data[colIndex] = newValue;
    setRows(updatedRows);
    console.log(`Row ${rowIndex}, Column ${colIndex} changed to "${newValue}"`);
  };

  const [EqSelectionDialogOpen, setEqSelectionDialogOpen] = useState(false);
  const handleOpenEqDialog = () => {
    setEqSelectionDialogOpen(true);
  };
  const handleCloseEqDialog = () => {
    setEqSelectionDialogOpen(false);
  };

  const [dateSelectionDialogOpne, setDateSelectionDialogOpne] = useState(false);
  const handleOpenDateDialog = () => {
    setDateSelectionDialogOpne(true);
  };
  const handleCloseDateDialog = () => {
    setDateSelectionDialogOpne(false);
  };

  const handleSave = (
    preparationDates: string[],
    preparationMemo: string[],
    RHDates: string[],
    RHMemo: string[],
    GPDates: string[],
    GPMemo: string[],
    actualDates: string[],
    actualMemo: string[]
  ) => {
    setPreparation(
      preparationDates.map((date, index) => ({
        date: date,
        memo: preparationMemo[index] ?? '',
      }))
    );
    setRH(
      RHDates.map((date, index) => ({
        date: date,
        memo: RHMemo[index] ?? '',
      }))
    );
    setGP(
      GPDates.map((date, index) => ({
        date: date,
        memo: GPMemo[index] ?? '',
      }))
    );
    setActual(
      actualDates.map((date, index) => ({
        date: date,
        memo: actualMemo[index] ?? '',
      }))
    );
    // setPreparationDates(preparationDates);
    // setInputPreparation(preparationMemo);
    // setRHDates(RHDates);
    // setInputRH(RHMemo);
    // setGPDates(GPDates);
    // setInputGP(GPMemo);
    // setActualDates(actualDates);
    // setInputActual(actualMemo);
    setDateSelectionDialogOpne(false);
  };
  const [preparation, setPreparation] = useState<EquipmentData[]>([]);
  const [RH, setRH] = useState<EquipmentData[]>([]);
  const [GP, setGP] = useState<EquipmentData[]>([]);
  const [actual, setActual] = useState<EquipmentData[]>([]);

  const [preparationDates, setPreparationDates] = useState<string[]>([]);
  const [inputPreparation, setInputPreparation] = useState<string[]>([]);

  const [RHDates, setRHDates] = useState<string[]>([]);
  const [inputRH, setInputRH] = useState<string[]>([]);

  const [GPDates, setGPDates] = useState<string[]>([]);
  const [inputGP, setInputGP] = useState<string[]>([]);

  const [actualDates, setActualDates] = useState<string[]>([]);
  const [inputActual, setInputActual] = useState<string[]>([]);

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" sx={{ bgcolor: grey[300] }}>
        <Typography margin={1}>受注明細（機材）</Typography>
        <BackButton label={'戻る'} />
      </Box>
      <Grid2 container display="flex" sx={{ bgcolor: grey[200] }}>
        <Grid2 size={{ xs: 12, sm: 12, md: 7 }}>
          <Grid2 container margin={2} spacing={1}>
            <Grid2 display="flex" direction="row" alignItems="center" size={{ sm: 12, md: 5 }}>
              <Typography marginRight={3} whiteSpace="nowrap">
                受注番号
              </Typography>
              <TextField defaultValue="81694" disabled sx={{ bgcolor: grey[300] }}></TextField>
            </Grid2>
            <Grid2
              display="flex"
              direction="row"
              alignItems="center"
              size={{ sm: 12, md: 7 }}
              sx={{ mt: { xs: 1, sm: 1, md: 0 } }}
            >
              <Typography mr={2} whiteSpace="nowrap">
                受注ステータス
              </Typography>
              <TextField defaultValue="確定" disabled sx={{ bgcolor: grey[300] }}>
                確定
              </TextField>
            </Grid2>
          </Grid2>
          <Box sx={styles.container}>
            <Typography marginRight={5} whiteSpace="nowrap">
              受注日
            </Typography>
            <TextField defaultValue="2025/10/01" disabled sx={{ bgcolor: grey[300] }}></TextField>
          </Box>
          <Box sx={styles.container}>
            <Typography marginRight={5} whiteSpace="nowrap">
              入力者
            </Typography>
            <TextField defaultValue="XXXXXXXX" disabled sx={{ bgcolor: grey[300] }}></TextField>
          </Box>
        </Grid2>
        <Grid2 size={{ xs: 12, sm: 12, md: 5 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', ml: 2, mt: { xs: 0, sm: 0, md: 2 } }}>
            <Typography marginRight={5} whiteSpace="nowrap">
              公演名
            </Typography>
            <TextField defaultValue="A/Zepp Tour" disabled sx={{ bgcolor: grey[300] }}></TextField>
          </Box>
          <Box sx={styles.container}>
            <Typography marginRight={3} whiteSpace="nowrap">
              公演場所
            </Typography>
            <TextField defaultValue="Zepp Osaka" disabled sx={{ bgcolor: grey[300] }}></TextField>
          </Box>
          <Box sx={styles.container}>
            <Typography marginRight={7} whiteSpace="nowrap">
              相手
            </Typography>
            <TextField defaultValue="(株)シアターブレーン" disabled sx={{ bgcolor: grey[300] }}></TextField>
          </Box>
        </Grid2>
      </Grid2>
      <Box display={'flex'} marginTop={2} px={1} sx={{ bgcolor: grey[300] }} alignItems={'center'}>
        <Typography whiteSpace="nowrap" textAlign={'center'}>
          機材入力
        </Typography>
        <Box ml={'35%'}>
          <Button variant="contained" sx={{ margin: 1 }}>
            編集
          </Button>
          <Button variant="contained" sx={{ margin: 1 }} onClick={() => console.log(preparation)}>
            保存
          </Button>
        </Box>
      </Box>
      <Box display="flex" sx={{ bgcolor: grey[200] }}>
        <Box sx={{ width: '100%' }}>
          <Box display="flex" alignItems="center" margin={1} marginLeft={{ xs: 8, sm: 12, md: 14, lg: 17 }}>
            <Button variant="contained" onClick={() => handleOpenEqDialog()}>
              ＋ 機材追加
            </Button>
            <Dialog open={EqSelectionDialogOpen} fullScreen>
              <EquipmentSelectionDialog handleCloseDialog={handleCloseEqDialog} />
            </Dialog>
          </Box>
          <Box sx={styles.container} width="90%">
            <Typography marginRight={{ xs: 2, sm: 6, md: 8, lg: 11 }} whiteSpace="nowrap">
              機材
            </Typography>
            <GridSelectBoxTable
              header={header}
              rows={rows}
              editableColumns={editableColumns}
              onChange={handleCellChange}
              cellWidths={cellWidths}
              headerColorSelect={false}
              getHeaderBackgroundColor={() => ''}
              getHeaderTextColor={() => ''}
              rowColorSelect={true}
              getRowBackgroundColor={getEquipmentRowBackgroundColor}
              selectIssueBase={selectedValues}
              selectIssueBaseChange={selectIssueBaseChange}
            />
          </Box>
          <Box display="flex" alignItems="center" mt={4}>
            <Typography ml={2} whiteSpace="nowrap">
              出庫日
            </Typography>
            <Grid2
              container
              //display="flex"
              alignItems="center"
              ml={{ xs: 3, sm: 9, md: 9, lg: 9 }}
              spacing={{ xs: 2, sm: 2, md: 2, lg: 0 }}
            >
              <Grid2 size={{ xs: 12, sm: 12, md: 6, lg: 12 }} display={{ lg: 'flex' }} alignItems="center">
                <Box display="flex" alignItems="center" mr={3}>
                  <Typography marginRight={2} whiteSpace="nowrap">
                    作業場
                  </Typography>
                  <TextField defaultValue={'KICS'} sx={{ width: 200 }} />
                </Box>
                <Box display="flex" alignItems="center" mr={3}>
                  <Typography marginRight={{ xs: 4, sm: 4, md: 4, lg: 2 }} whiteSpace="nowrap">
                    日付
                  </Typography>
                  <DateX />
                </Box>
                <Box display="flex" alignItems="center">
                  <Typography marginRight={{ xs: 4, sm: 4, md: 4, lg: 2 }} whiteSpace="nowrap">
                    時刻
                  </Typography>
                  <Time />
                </Box>
              </Grid2>
              <Grid2 size={{ xs: 12, sm: 12, md: 6, lg: 12 }} display={{ lg: 'flex' }} alignItems="center">
                <Box display="flex" alignItems="center" mr={3}>
                  <Typography marginRight={2} whiteSpace="nowrap">
                    作業場
                  </Typography>
                  <TextField defaultValue={'YARD'} sx={{ width: 200 }} />
                </Box>
                <Box display="flex" alignItems="center" mr={3}>
                  <Typography marginRight={{ xs: 4, sm: 4, md: 4, lg: 2 }} whiteSpace="nowrap">
                    日付
                  </Typography>
                  <DateX />
                </Box>
                <Box display="flex" alignItems="center">
                  <Typography marginRight={{ xs: 4, sm: 4, md: 4, lg: 2 }} whiteSpace="nowrap">
                    時刻
                  </Typography>
                  <Time />
                </Box>
              </Grid2>
            </Grid2>
          </Box>
          <Divider variant="middle" sx={{ mt: 2, mx: 4, display: { sm: 'block', md: 'none' } }} />
          <Box sx={styles.container}>
            <Typography whiteSpace="nowrap">入庫日</Typography>
            <Grid2 display={{ lg: 'flex' }} alignItems="center" ml={{ xs: 3, sm: 9, md: 9, lg: 9 }}>
              <Box display="flex" alignItems="center" mr={3}>
                <Typography marginRight={2} whiteSpace="nowrap">
                  作業場
                </Typography>
                <FormControl size="small" sx={{ minWidth: 200 }}>
                  <Select value={selectReturnBase} onChange={selectReturnBaseChange}>
                    <MenuItem value={'YARD'}>YARD</MenuItem>
                  </Select>
                </FormControl>
              </Box>
              <Box display="flex" alignItems="center" mr={3}>
                <Typography marginRight={{ xs: 4, sm: 4, md: 4, lg: 2 }} whiteSpace="nowrap">
                  日付
                </Typography>
                <DateX />
              </Box>
              <Box display="flex" alignItems="center">
                <Typography marginRight={{ xs: 4, sm: 4, md: 4, lg: 2 }} whiteSpace="nowrap">
                  時刻
                </Typography>
                <Time />
              </Box>
            </Grid2>
          </Box>
          <Box sx={styles.container}>
            <Typography marginRight={7} whiteSpace="nowrap">
              本番日数
            </Typography>
            <TextField
              defaultValue="4"
              sx={{
                width: '5%',
                minWidth: '45px',
                '& .MuiInputBase-input': {
                  textAlign: 'right',
                },
              }}
            />
            日
          </Box>
          <Box sx={styles.container}>
            <Typography marginRight={{ xs: 2, sm: 9, md: 9, lg: 9 }} whiteSpace="nowrap">
              本番日
            </Typography>
            <Button onClick={handleOpenDateDialog}>編集</Button>
            <Dialog open={dateSelectionDialogOpne} fullScreen sx={{ zIndex: 1201 }}>
              <DateSelectDialog
                preparation={preparation}
                RH={RH}
                GP={GP}
                actual={actual}
                // preparationRange={preparationDates}
                // preparationMemo={inputPreparation}
                // RHRange={RHDates}
                // RHMemo={inputRH}
                // GPRange={GPDates}
                // GPMemo={inputGP}
                // actualRange={actualDates}
                // actualMemo={inputActual}
                onClose={handleCloseDateDialog}
                onSave={handleSave}
              />
            </Dialog>
          </Box>
          <Grid2 container spacing={1} ml={{ xs: 10, sm: 17, md: 17, lg: 17 }} py={2} width="70%">
            <Grid2 size={12}>
              <Button sx={{ color: 'white', bgcolor: 'purple' }}>仕込</Button>
            </Grid2>
            <Grid2 size={5} display="flex">
              <Typography>日付</Typography>
            </Grid2>
            <Grid2 size={7} display="flex">
              <Typography>メモ</Typography>
            </Grid2>
          </Grid2>
          <Grid2
            container
            display="flex"
            flexDirection="column"
            spacing={1}
            ml={{ xs: 10, sm: 17, md: 17, lg: 17 }}
            width="70%"
          >
            {preparation.map((data, index) => (
              <Grid2 key={index} container display="flex" flexDirection="row">
                <Grid2 size={5}>
                  <Typography>{data.date}</Typography>
                </Grid2>
                <Grid2 size={7}>
                  <Typography sx={{ wordBreak: 'break-word' }}>{data.memo}</Typography>
                </Grid2>
              </Grid2>
            ))}
          </Grid2>
          <Grid2
            container
            display="flex"
            flexDirection="row"
            spacing={1}
            ml={{ xs: 10, sm: 17, md: 17, lg: 17 }}
            py={2}
            width="70%"
          >
            <Grid2 size={12}>
              <Button sx={{ color: 'white', bgcolor: 'orange' }}>RH</Button>
            </Grid2>
            <Grid2 size={5}>
              <Typography>日付</Typography>
            </Grid2>
            <Grid2 size={7}>
              <Typography>メモ</Typography>
            </Grid2>
          </Grid2>
          <Grid2
            container
            display="flex"
            flexDirection="column"
            spacing={1}
            ml={{ xs: 10, sm: 17, md: 17, lg: 17 }}
            width="70%"
          >
            {RH.map((data, index) => (
              <Grid2 key={index} container display="flex" flexDirection="row">
                <Grid2 size={5}>
                  <Typography>{data.date}</Typography>
                </Grid2>
                <Grid2 size={7}>
                  <Typography sx={{ wordBreak: 'break-word' }}>{data.memo}</Typography>
                </Grid2>
              </Grid2>
            ))}
          </Grid2>
          <Grid2
            container
            display="flex"
            flexDirection="row"
            spacing={1}
            ml={{ xs: 10, sm: 17, md: 17, lg: 17 }}
            py={2}
            width="70%"
          >
            <Grid2 size={12}>
              <Button sx={{ color: 'white', bgcolor: 'green' }}>GP</Button>
            </Grid2>
            <Grid2 size={5}>
              <Typography>日付</Typography>
            </Grid2>
            <Grid2 size={7}>
              <Typography>メモ</Typography>
            </Grid2>
          </Grid2>
          <Grid2
            container
            display="flex"
            flexDirection="column"
            spacing={1}
            ml={{ xs: 10, sm: 17, md: 17, lg: 17 }}
            width="70%"
          >
            {GP.map((data, index) => (
              <Grid2 key={index} container display="flex" flexDirection="row">
                <Grid2 size={5}>
                  <Typography>{data.date}</Typography>
                </Grid2>
                <Grid2 size={7}>
                  <Typography sx={{ wordBreak: 'break-word' }}>{data.memo}</Typography>
                </Grid2>
              </Grid2>
            ))}
          </Grid2>
          <Grid2
            container
            display="flex"
            flexDirection="row"
            spacing={1}
            ml={{ xs: 10, sm: 17, md: 17, lg: 17 }}
            py={2}
            width="70%"
          >
            <Grid2 size={12}>
              <Button sx={{ color: 'white', bgcolor: 'pink' }}>本番</Button>
            </Grid2>
            <Grid2 size={5}>
              <Typography>日付</Typography>
            </Grid2>
            <Grid2 size={7}>
              <Typography>メモ</Typography>
            </Grid2>
          </Grid2>
          <Grid2
            container
            display="flex"
            flexDirection="column"
            spacing={1}
            ml={{ xs: 10, sm: 17, md: 17, lg: 17 }}
            width="70%"
          >
            {actual.map((data, index) => (
              <Grid2 key={index} container display="flex" flexDirection="row">
                <Grid2 size={5}>
                  <Typography>{data.date}</Typography>
                </Grid2>
                <Grid2 size={7}>
                  <Typography sx={{ wordBreak: 'break-word' }}>{data.memo}</Typography>
                </Grid2>
              </Grid2>
            ))}
          </Grid2>
          {/* <Button sx={{ color: 'white', bgcolor: 'orange', marginLeft: 17 }}>RH</Button>
          <Box display="flex" alignItems="center" mb={2} ml={28}>
            <Box display="flex" flexDirection="column">
              <Typography>日付</Typography>
              {RHDates.map((date, index) => (
                <Typography key={index}>{date}</Typography>
              ))}
            </Box>
            <Box display="flex" flexDirection="column" ml={25}>
              <Typography>メモ</Typography>
              {inputRH.map((memo, index) => (
                <Typography key={index}>{memo}</Typography>
              ))}
            </Box>
          </Box>
          <Button sx={{ color: 'white', bgcolor: 'green', marginLeft: 17 }}>GP</Button>
          <Box display="flex" alignItems="center" mb={2} ml={28}>
            <Box display="flex" flexDirection="column">
              <Typography>日付</Typography>
              {GPDates.map((date, index) => (
                <Typography key={index}>{date}</Typography>
              ))}
            </Box>
            <Box display="flex" flexDirection="column" ml={25}>
              <Typography>メモ</Typography>
              {inputGP.map((memo, index) => (
                <Typography key={index}>{memo}</Typography>
              ))}
            </Box>
          </Box>
          <Button sx={{ color: 'white', bgcolor: 'pink', marginLeft: 17 }}>本番</Button>
          <Box display="flex" alignItems="center" mb={2} ml={28}>
            <Box display="flex" flexDirection="column">
              <Typography>日付</Typography>
              {actualDates.map((date, index) => (
                <Typography key={index}>{date}</Typography>
              ))}
            </Box>
            <Box display="flex" flexDirection="column" ml={25}>
              <Typography>メモ</Typography>
              {inputActual.map((memo, index) => (
                <Typography key={index}>{memo}</Typography>
              ))}
            </Box>
          </Box> */}
          <Box display="flex" alignItems="center" margin={1} marginLeft={2} marginTop={4}>
            <Typography marginRight={1} whiteSpace="nowrap">
              受注機材ステータス
            </Typography>
            <FormControl size="small" sx={{ width: '10%', minWidth: 150 }}>
              <Select value={selectStatus} onChange={selectStatusChange}>
                <MenuItem value={'準備中'}>準備中</MenuItem>
                <MenuItem value={'作業中'}>作業中</MenuItem>
                <MenuItem value={'OK'}>OK</MenuItem>
              </Select>
            </FormControl>
          </Box>
        </Box>
      </Box>
    </Box>
  );
};

export default EquipmentOrderDetail;

/* style
---------------------------------------------------------------------------------------------------- */
/** @type {{ [key: string]: React.CSSProperties }} style */
const styles: { [key: string]: React.CSSProperties } = {
  // コンテナ
  container: {
    display: 'flex',
    alignItems: 'center',
    margin: 2,
    marginLeft: 2,
  },
  // ボタン
  button: {},
};
