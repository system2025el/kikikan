'use client';

import ArrowBackIosNewIcon from '@mui/icons-material/ArrowBackIosNew';
import ArrowForwardIosIcon from '@mui/icons-material/ArrowForwardIos';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  Button,
  ClickAwayListener,
  Dialog,
  Divider,
  Fab,
  FormControl,
  Grid2,
  MenuItem,
  Paper,
  Popper,
  Select,
  SelectChangeEvent,
  TextField,
  Typography,
} from '@mui/material';
import { addMonths, endOfMonth, subDays } from 'date-fns';
import dayjs, { Dayjs } from 'dayjs';
import { useState } from 'react';
import React from 'react';

import { BackButton } from '@/app/(main)/_ui/back-button';
import { Calendar, TestDate, toISOStringWithTimezoneMonthDay } from '@/app/(main)/_ui/date';
import Time from '@/app/(main)/_ui/time';
import {
  getDateHeaderBackgroundColor,
  getDateRowBackgroundColor,
  getEquipmentRowBackgroundColor,
} from '@/app/(main)/new-order/equipment-order-detail/_lib/colorselect';
import { cellWidths, data, dateWidths, header, stock } from '@/app/(main)/new-order/equipment-order-detail/_lib/data';
import GridTable, {
  GridSelectBoxTable,
} from '@/app/(main)/new-order/equipment-order-detail/_ui/equipment-order-detail-table';
import { getDateTextColor } from '@/app/(main)/new-order/schedule/_lib/colorselect';

import { DateSelectDialog } from './date-selection-dialog';
import { EquipmentSelectionDialog } from './equipment-selection-dailog';

export type EquipmentData = {
  date: string;
  memo: string;
};

type row = {
  id: number;
  data: number[];
};

const getRange = (start: Date, end: Date): string[] => {
  if (start !== null && end !== null) {
    const range: string[] = [];
    const current = new Date(start);

    while (current <= end) {
      const dateStr = toISOStringWithTimezoneMonthDay(current).split('T')[0];
      range.push(dateStr);
      current.setDate(current.getDate() + 1);
    }

    return range;
  }
  return [];
};

const getDateRange = (date: Date) => {
  if (date !== null) {
    const start = subDays(date, 1);
    const end = endOfMonth(addMonths(date, 2));
    const range: string[] = [];
    const current = new Date(start);

    while (current <= end) {
      const dateStr = toISOStringWithTimezoneMonthDay(current).split('T')[0];
      range.push(dateStr);
      current.setDate(current.getDate() + 1);
    }

    return range;
  }
  return [];
};

const getRow = (stock: number[], length: number) => {
  const rows: row[] = [];

  stock.map((num, index) => {
    const data: number[] = [];
    for (let i = 0; i < length; i++) {
      data.push(num);
    }
    const row: row = { id: index + 1, data: data };
    rows.push(row);
  });

  return rows;
};

const EquipmentOrderDetail = () => {
  const [startKICSDate, setStartKICSDate] = useState<Date>(new Date());
  const [startYARDDate, setStartYARDDate] = useState<Date>(new Date());
  const [endKICSDate, setEndKICSDate] = useState<Date>(new Date());
  const [endYARDDate, setEndYARDDate] = useState<Date>(new Date());
  // ヘッダー用の日付
  const [dateHeader, setDateHeader] = useState<string[]>(getDateRange(startKICSDate));
  // 出庫日から入庫日
  const [dateRange, setDateRange] = useState<string[]>(getRange(startKICSDate, endKICSDate));
  const [dateRow, setDateRow] = useState<row[]>(getRow(stock, dateHeader.length));
  const [preparation, setPreparation] = useState<EquipmentData[]>([]);
  const [RH, setRH] = useState<EquipmentData[]>([]);
  const [GP, setGP] = useState<EquipmentData[]>([]);
  const [actual, setActual] = useState<EquipmentData[]>([]);
  const [expanded, setExpanded] = useState(false);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectDate, setSelectDate] = useState<Date>(new Date());

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(anchorEl ? null : event.currentTarget);
  };

  const handleDateChange = (date: Dayjs | null) => {
    if (date !== null) {
      setSelectDate(date?.toDate());
      setDateHeader(getDateRange(date?.toDate()));
      setAnchorEl(null);
    }
  };

  const handleClickAway = () => {
    setAnchorEl(null);
  };

  const open = Boolean(anchorEl);

  const handleExpansion = () => {
    setExpanded((prevExpanded) => !prevExpanded);
  };

  const scrollTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const stockChange = (row: row[], rowIndex: number, value: number, range: string[], dateRange: string[]) => {
    const updatedRows = [...row];
    const targetIndex: number[] = [];
    range.map((targetDate) => {
      dateRange.map((date, index) => {
        if (targetDate === date) {
          targetIndex.push(index);
        }
      });
    });
    targetIndex.map((index) => {
      updatedRows[rowIndex].data[index] = stock[rowIndex] - value;
      setDateRow(updatedRows);
    });
  };

  const [selectedValues, setSelectedValues] = useState<string[]>(Array(2).fill('KICS'));
  const [rows, setRows] = useState(data);
  const editableColumns = [4, 5];

  const [selectTax, setSelectTax] = useState('外税');
  const selectTaxChange = (event: SelectChangeEvent) => {
    setSelectTax(event.target.value);
  };

  const selectIssueBaseChange = (index: number, value: string) => {
    const newValues = [...selectedValues];
    newValues[index] = value;
    setSelectedValues(newValues);
  };

  const handleCellChange = (rowIndex: number, colIndex: number, newValue: number, value: number) => {
    const updatedRows = [...rows];
    updatedRows[rowIndex].data[colIndex] = newValue;
    setRows(updatedRows);
    stockChange(dateRow, rowIndex, value, dateRange, dateHeader);
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
    setDateSelectionDialogOpne(false);
  };

  return (
    <Box>
      {/*受注ヘッダー*/}
      <Accordion expanded={expanded} onChange={handleExpansion}>
        <AccordionSummary expandIcon={<ExpandMoreIcon />} component="div">
          <Box display="flex" justifyContent="space-between" alignItems="center" py={1} width="100%">
            <Grid2 container display="flex" justifyContent="space-between" spacing={2}>
              <Typography>受注ヘッダー</Typography>
              <Grid2 container display={expanded ? 'none' : 'flex'} spacing={2}>
                <Typography>公演名</Typography>
                <Typography>A/Zepp Tour</Typography>
              </Grid2>
            </Grid2>
            <BackButton label={'戻る'} />
          </Box>
        </AccordionSummary>
        <AccordionDetails sx={{ padding: 0 }}>
          <Divider />
          <Grid2 container display="flex">
            <Grid2>
              <Grid2 container margin={2} spacing={2}>
                <Grid2 container display="flex" direction="row" alignItems="center">
                  <Grid2 display="flex" direction="row" alignItems="center">
                    <Typography marginRight={3} whiteSpace="nowrap">
                      受注番号
                    </Typography>
                    <TextField defaultValue="81694" disabled></TextField>
                  </Grid2>
                  <Grid2 display="flex" direction="row" alignItems="center">
                    <Typography mr={2}>受注ステータス</Typography>
                    <TextField defaultValue="確定" disabled sx={{ width: 120 }}>
                      確定
                    </TextField>
                  </Grid2>
                </Grid2>
              </Grid2>
              <Box sx={styles.container}>
                <Typography marginRight={5} whiteSpace="nowrap">
                  受注日
                </Typography>
                <TextField defaultValue="2025/10/01" disabled></TextField>
              </Box>
              <Box sx={styles.container}>
                <Typography marginRight={5} whiteSpace="nowrap">
                  入力者
                </Typography>
                <TextField defaultValue="XXXXXXXX" disabled></TextField>
              </Box>
            </Grid2>
            <Grid2>
              <Box sx={{ display: 'flex', alignItems: 'center', ml: 2, mt: { xs: 0, sm: 0, md: 2 } }}>
                <Typography marginRight={5} whiteSpace="nowrap">
                  公演名
                </Typography>
                <TextField defaultValue="A/Zepp Tour" disabled></TextField>
              </Box>
              <Box sx={styles.container}>
                <Typography marginRight={3} whiteSpace="nowrap">
                  公演場所
                </Typography>
                <TextField defaultValue="Zepp Osaka" disabled></TextField>
              </Box>
              <Box sx={styles.container}>
                <Typography marginRight={7} whiteSpace="nowrap">
                  相手
                </Typography>
                <TextField defaultValue="(株)シアターブレーン" disabled></TextField>
              </Box>
            </Grid2>
          </Grid2>
        </AccordionDetails>
      </Accordion>
      {/*受注明細ヘッダー*/}
      <Accordion sx={{ mt: 2 }} defaultExpanded>
        <AccordionSummary expandIcon={<ExpandMoreIcon />} component="div">
          <Grid2 container display="flex" justifyContent="space-between" spacing={2} py={1}>
            <Typography>受注機材ヘッダー</Typography>
          </Grid2>
        </AccordionSummary>
        <AccordionDetails sx={{ padding: 0 }}>
          <Divider />
          <Grid2 container p={2} spacing={1} flexWrap="nowrap">
            <Grid2>
              <Typography>出庫日時</Typography>
              <Grid2>
                <TextField defaultValue={'KICS'} sx={{ width: '10%', minWidth: 150 }} />
                <TestDate
                  date={startKICSDate}
                  onChange={(newDate) => {
                    if (newDate !== null) {
                      const updatedDateRange = getDateRange(newDate?.toDate());
                      setStartKICSDate(newDate?.toDate());
                      setDateHeader(updatedDateRange);
                      setDateRange(getRange(newDate?.toDate(), endKICSDate));
                      setDateRow(getRow(stock, updatedDateRange.length));
                    }
                  }}
                />
                <Time />
              </Grid2>
              <Grid2>
                <TextField defaultValue={'YARD'} sx={{ width: '10%', minWidth: 150 }} />
                <TestDate
                  date={startYARDDate}
                  onChange={(newDate) => {
                    if (newDate !== null) {
                      setStartYARDDate(newDate?.toDate());
                    }
                  }}
                />
                <Time />
              </Grid2>
            </Grid2>
            <Grid2>
              <Typography>入庫日時</Typography>
              <Grid2>
                <TextField defaultValue={'KICS'} sx={{ width: '10%', minWidth: 150 }} />
                <TestDate
                  date={endKICSDate}
                  onChange={(newDate) => {
                    if (newDate !== null) {
                      setEndKICSDate(newDate?.toDate());
                      setDateRange(getRange(startKICSDate, newDate?.toDate()));
                    }
                  }}
                />
                <Time />
              </Grid2>
              <Grid2>
                <TextField defaultValue={'YARD'} sx={{ width: '10%', minWidth: 150 }} />
                <TestDate
                  date={endYARDDate}
                  onChange={(newDate) => {
                    if (newDate !== null) {
                      setEndYARDDate(newDate?.toDate());
                      setDateRange(getRange(startKICSDate, newDate?.toDate()));
                    }
                  }}
                />
                <Time />
              </Grid2>
            </Grid2>
          </Grid2>
          <Box display="flex" alignItems="center" p={2}>
            <Typography>税区分</Typography>
            <FormControl size="small" sx={{ width: '8%', minWidth: '80px', ml: 2 }}>
              <Select value={selectTax} onChange={selectTaxChange}>
                <MenuItem value={'外税'}>外税</MenuItem>
                <MenuItem value={'内税'}>内税</MenuItem>
              </Select>
            </FormControl>
          </Box>
          <Grid2 container alignItems="center" spacing={2} p={2}>
            <Typography>メモ</Typography>
            <TextField multiline rows={3} />
          </Grid2>
        </AccordionDetails>
      </Accordion>
      {/*受注明細(機材)*/}
      <Paper variant="outlined" sx={{ mt: 2 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" p={2}>
          <Grid2 container direction="column" spacing={1}>
            <Typography>受注明細(機材)</Typography>
            <Typography fontSize={'small'}>機材入力</Typography>
          </Grid2>
          <Grid2 container spacing={2}>
            <Button>編集</Button>
            <Button>保存</Button>
          </Grid2>
        </Box>
        <Divider />
        <Grid2 container direction="row" alignItems="center" spacing={2} p={2}>
          <Grid2 container direction="row" alignItems="center">
            <Typography>機材明細名</Typography>
            <TextField />
          </Grid2>
          <Grid2>
            <Typography>合計金額</Typography>
          </Grid2>
        </Grid2>

        <Dialog open={EqSelectionDialogOpen} fullScreen>
          <EquipmentSelectionDialog handleCloseDialog={handleCloseEqDialog} />
        </Dialog>

        <Box display="flex" flexDirection="row" width="100%">
          <Box sx={{ width: { xs: '40%', sm: '40%', md: 'auto' } }}>
            <Button sx={{ m: 2 }} onClick={() => handleOpenEqDialog()}>
              ＋ 機材追加
            </Button>
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
          <Box overflow="auto" sx={{ width: { xs: '60%', sm: '60%', md: 'auto' } }}>
            <Box display="flex" my={2}>
              <Button>
                <ArrowBackIosNewIcon fontSize="small" />
              </Button>
              <Button variant="outlined" onClick={handleClick}>
                日付選択
              </Button>
              <Popper open={open} anchorEl={anchorEl} placement="bottom-start">
                <ClickAwayListener onClickAway={handleClickAway}>
                  <Paper elevation={3} sx={{ mt: 1 }}>
                    <Calendar date={selectDate} onChange={handleDateChange} />
                  </Paper>
                </ClickAwayListener>
              </Popper>
              <Button>
                <ArrowForwardIosIcon fontSize="small" />
              </Button>
            </Box>
            <GridTable
              header={dateHeader}
              rows={dateRow}
              dateRange={dateRange}
              startKICSDate={startKICSDate}
              endKICSDate={endKICSDate}
              preparation={preparation}
              RH={RH}
              GP={GP}
              actual={actual}
              cellWidths={dateWidths}
              getHeaderBackgroundColor={getDateHeaderBackgroundColor}
              rowColorSelect={true}
              getRowBackgroundColor={getDateRowBackgroundColor}
            />
          </Box>
        </Box>
      </Paper>
      {/*本番日*/}
      <Paper variant="outlined" sx={{ mt: 2 }}>
        <Box>
          <Box display="flex" alignItems="center" p={2}>
            <Typography>本番日数</Typography>
            <TextField sx={{ width: '5%', minWidth: '60px', ml: 2 }} />日
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
                onClose={handleCloseDateDialog}
                onSave={handleSave}
              />
            </Dialog>
          </Box>
          <Grid2 container spacing={1} ml={{ xs: 10, sm: 17, md: 17, lg: 17 }} py={2} width={{ md: '50%' }}>
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
            width={{ md: '50%' }}
          >
            {preparation.map((data, index) => (
              <Grid2 key={index} container display="flex" flexDirection="row">
                <Grid2 size={5}>
                  <Typography>{data.date}</Typography>
                </Grid2>
                <Grid2 size={7}>
                  <Typography sx={{ wordBreak: 'break-word', whiteSpace: 'wrap' }}>{data.memo}</Typography>
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
            width={{ md: '50%' }}
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
            width={{ md: '50%' }}
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
            width={{ md: '50%' }}
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
            width={{ md: '50%' }}
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
            width={{ md: '50%' }}
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
            width={{ md: '50%' }}
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
          <Grid2 container alignItems="center" spacing={2} p={2}>
            <Typography>入出庫ステータス</Typography>
            <TextField disabled defaultValue={'準備中'}></TextField>
          </Grid2>
        </Box>
      </Paper>
      <Fab color="primary" onClick={scrollTop} sx={{ position: 'fixed', bottom: 32, right: 32, zIndex: 1000 }}>
        <ArrowUpwardIcon fontSize="small" />
      </Fab>
      {/* <Paper variant="outlined">
        <Grid2 container display="flex">
          <Grid2 size={{ xs: 12, sm: 12, md: 7 }}>
            <Grid2 container margin={2} spacing={2}>
              <Grid2 container display="flex" direction="row" alignItems="center">
                <Grid2 display="flex" direction="row" alignItems="center">
                  <Typography marginRight={3} whiteSpace="nowrap">
                    受注番号
                  </Typography>
                  <TextField defaultValue="81694" disabled></TextField>
                </Grid2>
                <Grid2 display="flex" direction="row" alignItems="center">
                  <Typography mr={2} whiteSpace="nowrap">
                    受注ステータス
                  </Typography>
                  <TextField defaultValue="確定" disabled>
                    確定
                  </TextField>
                </Grid2>
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
      </Paper>
      <Paper variant="outlined" sx={{ mt: 2 }}>
        <Box display={'flex'} p={2} alignItems={'center'} justifyContent="space-between">
          <Typography>機材入力</Typography>
          <Grid2 container display={'flex'} spacing={1}>
            <Button>編集</Button>
            <Button onClick={() => console.log(preparation)}>保存</Button>
          </Grid2>
        </Box>
        <Divider />
        <Box display="flex">
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
                alignItems="center"
                ml={{ xs: 3, sm: 9, md: 9, lg: 9 }}
                spacing={{ xs: 2, sm: 2, md: 2, lg: 0 }}
              >
                <Grid2 display={{ lg: 'flex' }} alignItems="center">
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
                <Grid2 display={{ lg: 'flex' }} alignItems="center">
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
            <Divider variant="middle" sx={{ mt: 2, mx: 4 }} />
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
      </Paper> */}
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
