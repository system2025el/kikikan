'use client';

import {
  Box,
  Button,
  Dialog,
  FormControl,
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
    setPreparationDates(preparationDates);
    setInputPreparation(preparationMemo);
    setRHDates(RHDates);
    setInputRH(RHMemo);
    setGPDates(GPDates);
    setInputGP(GPMemo);
    setActualDates(actualDates);
    setInputActual(actualMemo);
    setDateSelectionDialogOpne(false);
  };

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
      <Box display="flex" sx={{ bgcolor: grey[200] }}>
        <Box sx={{ width: '60%' }}>
          <Box sx={styles.container}>
            <Typography marginRight={3} whiteSpace="nowrap">
              受注番号
            </Typography>
            <TextField defaultValue="81694" disabled sx={{ bgcolor: grey[300] }}></TextField>
            <Typography mx={2} whiteSpace="nowrap">
              受注ステータス
            </Typography>
            <TextField defaultValue="確定" disabled sx={{ bgcolor: grey[300] }}>
              確定
            </TextField>
          </Box>
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
        </Box>
        <Box sx={{ width: '40%' }}>
          <Box sx={styles.container}>
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
        </Box>
      </Box>
      <Box display={'flex'} marginTop={2} px={1} sx={{ bgcolor: grey[300] }} alignItems={'center'}>
        <Typography whiteSpace="nowrap" textAlign={'center'}>
          機材入力
        </Typography>
        <Box ml={'35%'}>
          <Button variant="contained" sx={{ margin: 1 }}>
            編集
          </Button>
          <Button variant="contained" sx={{ margin: 1 }} onClick={() => console.log(selectedValues)}>
            保存
          </Button>
        </Box>
      </Box>
      <Box display="flex" sx={{ bgcolor: grey[200] }}>
        <Box sx={{ width: '100%' }}>
          <Box display="flex" alignItems="center" margin={1} marginLeft={17}>
            <Button variant="contained" sx={{ marginRight: 4 }} onClick={() => handleOpenEqDialog()}>
              ＋ 機材追加
            </Button>
            <Dialog open={EqSelectionDialogOpen} fullScreen>
              <EquipmentSelectionDialog handleCloseDialog={handleCloseEqDialog} />
            </Dialog>
          </Box>
          <Box sx={styles.container} width="70%">
            <Typography marginRight={11} whiteSpace="nowrap">
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
          <Box display="flex" alignItems="center" margin={1} marginLeft={2} marginTop={4} width="60%">
            <Typography marginRight={9} whiteSpace="nowrap">
              出庫日
            </Typography>
            <Box display="flex" flexDirection="column">
              <DateX />
              <DateX />
            </Box>
            <Box>
              <Box display="flex" alignItems="center">
                <Typography marginLeft={5} marginRight={2} whiteSpace="nowrap">
                  時刻
                </Typography>
                <Time />
              </Box>
              <Box display="flex" alignItems="center">
                <Typography marginLeft={5} marginRight={2} whiteSpace="nowrap">
                  時刻
                </Typography>
                <Time />
              </Box>
            </Box>
            <Box>
              <Box display="flex" alignItems="center">
                <Typography marginLeft={5} marginRight={2} whiteSpace="nowrap">
                  作業場
                </Typography>
                <TextField defaultValue={'KICS'} sx={{ minWidth: 200 }} />
              </Box>
              <Box display="flex" alignItems="center">
                <Typography marginLeft={5} marginRight={2} whiteSpace="nowrap">
                  作業場
                </Typography>
                <TextField defaultValue={'YARD'} sx={{ minWidth: 200 }} />
              </Box>
            </Box>
          </Box>
          <Box sx={styles.container} width="60%">
            <Typography marginRight={9} whiteSpace="nowrap">
              入庫日
            </Typography>
            <Box>
              <DateX />
            </Box>
            <Typography marginLeft={5} marginRight={2} whiteSpace="nowrap">
              時刻
            </Typography>
            <Box>
              <Time />
            </Box>
            <Typography marginLeft={5} marginRight={2} whiteSpace="nowrap">
              作業場
            </Typography>
            <Box>
              <FormControl size="small" sx={{ width: '25%', minWidth: 200 }}>
                <Select value={selectReturnBase} onChange={selectReturnBaseChange}>
                  <MenuItem value={'YARD'}>YARD</MenuItem>
                </Select>
              </FormControl>
            </Box>
          </Box>
          <Box sx={styles.container}>
            <Typography marginRight={7} whiteSpace="nowrap">
              本番日数
            </Typography>
            <TextField
              defaultValue="4"
              sx={{
                width: '5%',
                '& .MuiInputBase-input': {
                  textAlign: 'right',
                },
              }}
            />
            日
          </Box>
          <Box sx={styles.container}>
            <Typography marginRight={9} whiteSpace="nowrap">
              本番日
            </Typography>
            <Button onClick={handleOpenDateDialog}>編集</Button>
            <Dialog open={dateSelectionDialogOpne} fullScreen sx={{ zIndex: 1201 }}>
              <DateSelectDialog
                preparationRange={preparationDates}
                preparationMemo={inputPreparation}
                RHRange={RHDates}
                RHMemo={inputRH}
                GPRange={GPDates}
                GPMemo={inputGP}
                actualRange={actualDates}
                actualMemo={inputActual}
                onClose={handleCloseDateDialog}
                onSave={handleSave}
              />
            </Dialog>
          </Box>
          <Button sx={{ color: 'white', bgcolor: 'purple', marginLeft: 17 }}>仕込</Button>
          <Box display="flex" alignItems="center" mb={2} ml={28}>
            <Box display="flex" flexDirection="column">
              <Typography>日付</Typography>
              {preparationDates.map((date, index) => (
                <Typography key={index}>{date}</Typography>
              ))}
            </Box>
            <Box display="flex" flexDirection="column" ml={25}>
              <Typography>メモ</Typography>
              {inputPreparation.map((memo, index) => (
                <Typography key={index}>{memo}</Typography>
              ))}
            </Box>
          </Box>
          <Button sx={{ color: 'white', bgcolor: 'orange', marginLeft: 17 }}>RH</Button>
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
          </Box>
          <Box display="flex" alignItems="center" margin={1} marginLeft={2} marginTop={4}>
            <Typography marginRight={1} whiteSpace="nowrap">
              受注機材ステータス
            </Typography>
            <FormControl size="small" sx={{ width: '10%' }}>
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
