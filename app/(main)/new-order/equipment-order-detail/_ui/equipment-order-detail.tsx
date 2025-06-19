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
import { addMonths, endOfMonth, subDays, subMonths } from 'date-fns';
import dayjs, { Dayjs } from 'dayjs';
import { useEffect, useState } from 'react';
import React from 'react';

import { BackButton } from '@/app/(main)/_ui/back-button';
import { Calendar, TestDate, toISOStringWithTimezoneMonthDay } from '@/app/(main)/_ui/date';
import Time from '@/app/(main)/_ui/time';
import {
  getDateHeaderBackgroundColor,
  getDateRowBackgroundColor,
} from '@/app/(main)/new-order/equipment-order-detail/_lib/colorselect';
import { data, stock } from '@/app/(main)/new-order/equipment-order-detail/_lib/data';
import GridTable, {
  Equipment,
  GridSelectBoxTable,
} from '@/app/(main)/new-order/equipment-order-detail/_ui/equipment-order-detail-table';

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

// const getRowRoop = (stock: number[], length: number) => {
//   const rows: row[] = [];
//   for (let i = 0; i < 28; i++) {
//     stock.map((num, index) => {
//       const data: number[] = [];
//       for (let i = 0; i < length; i++) {
//         data.push(num);
//       }
//       const row: row = { id: index + 1, data: data };
//       rows.push(row);
//     });
//   }
//   return rows;
// };

export const testeqData = Array.from({ length: 200 }, (_, i) => {
  const original = data[i % data.length];
  return {
    ...original,
    id: i + 1,
    name: `${original.name} (${i + 1})`,
    memo: original.memo,
    place: original.place,
    all: original.all,
    order: original.order,
    spare: original.spare,
    total: original.total,
  };
});

export const testDateData = Array.from({ length: 200 }, (_, i) => {
  const base = getRow(stock, getDateRange(new Date()).length);
  const original = base[i % data.length];
  return {
    ...original,
    id: i + 1,
    data: original.data,
  };
});

export const testStock = Array.from({ length: 200 }, (_, i) => {
  return [...stock];
});

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
  const [rows, setRows] = useState<Equipment[]>(data);
  const [preparation, setPreparation] = useState<EquipmentData[]>([]);
  const [RH, setRH] = useState<EquipmentData[]>([]);
  const [GP, setGP] = useState<EquipmentData[]>([]);
  const [actual, setActual] = useState<EquipmentData[]>([]);
  const [keep, setKeep] = useState<EquipmentData[]>([]);
  const [expanded, setExpanded] = useState(false);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectDate, setSelectDate] = useState<Date>(new Date());

  const open = Boolean(anchorEl);

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(anchorEl ? null : event.currentTarget);
  };

  const handleDateChange = (date: Dayjs | null) => {
    if (date !== null) {
      const updatedHeader = getDateRange(date?.toDate());
      const updatedRow = getRow(stock, updatedHeader.length);
      setDateHeader(updatedHeader);
      const targetIndex: number[] = [];
      dateRange.map((targetDate) => {
        updatedHeader.map((date, index) => {
          if (targetDate === date) {
            targetIndex.push(index);
          }
        });
      });
      targetIndex.map((index) => {
        updatedRow.map((date, i) => {
          date.data[index] = stock[i] - rows[i].total;
        });
      });
      setDateRow(updatedRow);

      setAnchorEl(null);
    }
  };

  const handleBackDateChange = () => {
    const date = subMonths(new Date(dateHeader[1]), 3);
    handleDateChange(dayjs(date));
  };

  const handleForwardDateChange = () => {
    const date = addMonths(new Date(dateHeader[1]), 3);
    handleDateChange(dayjs(date));
  };

  const handleClickAway = () => {
    setAnchorEl(null);
  };

  const handleExpansion = () => {
    setExpanded((prevExpanded) => !prevExpanded);
  };

  const scrollTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleMemoChange = (rowIndex: number, memo: string) => {
    const updatedRows = [...rows];
    updatedRows[rowIndex].memo = memo;
    setRows(updatedRows);
  };

  const [selectTax, setSelectTax] = useState('外税');
  const selectTaxChange = (event: SelectChangeEvent) => {
    setSelectTax(event.target.value);
  };

  const handleCellChange = (rowIndex: number, orderValue: number, spareValue: number, totalValue: number) => {
    setRows((prev) =>
      prev.map((row, i) => (i === rowIndex ? { ...row, order: orderValue, spare: spareValue, total: totalValue } : row))
    );
    const updatedData = dateRow[rowIndex].data;
    const targetIndex: number[] = [];
    console.log(dateHeader);
    dateRange.map((targetDate) => {
      dateHeader.map((date, index) => {
        if (targetDate === date) {
          targetIndex.push(index);
        }
      });
    });
    targetIndex.map((index) => {
      updatedData[index] = stock[rowIndex] - totalValue;
    });
    setDateRow((prev) => prev.map((row, i) => (i === rowIndex ? { ...row, data: updatedData } : row)));
  };

  const handleStartChange = (newDate: Dayjs | null) => {
    if (newDate !== null) {
      const updatedHeader = getDateRange(newDate?.toDate());
      const updatedDateRange = getRange(newDate?.toDate(), endKICSDate);
      const updatedRow = getRow(stock, updatedHeader.length);
      setStartKICSDate(newDate?.toDate());
      setDateHeader(updatedHeader);
      setDateRange(updatedDateRange);
      const targetIndex: number[] = [];
      updatedDateRange.map((targetDate) => {
        updatedHeader.map((date, index) => {
          if (targetDate === date) {
            targetIndex.push(index);
          }
        });
      });
      targetIndex.map((index) => {
        updatedRow.map((date, i) => {
          date.data[index] = stock[i] - rows[i].total;
        });
      });
      setDateRow(updatedRow);
    }
  };

  const handleEndChange = (newDate: Dayjs | null) => {
    if (newDate !== null) {
      const updatedDateRange = getRange(startKICSDate, newDate?.toDate());
      const updatedRow = getRow(stock, dateHeader.length);
      setEndKICSDate(newDate?.toDate());
      setDateRange(updatedDateRange);
      const targetIndex: number[] = [];
      updatedDateRange.map((targetDate) => {
        dateHeader.map((date, index) => {
          if (targetDate === date) {
            targetIndex.push(index);
          }
        });
      });
      targetIndex.map((index) => {
        updatedRow.map((date, i) => {
          date.data[index] = stock[i] - rows[i].total;
        });
      });
      setDateRow(updatedRow);
    }
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
    actualMemo: string[],
    keepDates: string[],
    keepMemo: string[]
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
    setKeep(
      keepDates.map((date, index) => ({
        date: date,
        memo: keepMemo[index] ?? '',
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
          <Grid2 container p={2} spacing={2}>
            <Grid2 width={500}>
              <Typography>出庫日時</Typography>
              <Grid2>
                <TextField defaultValue={'KICS'} disabled sx={{ width: '10%', minWidth: 150 }} />
                <TestDate date={startKICSDate} onChange={handleStartChange} />
                <Time />
              </Grid2>
              <Grid2>
                <TextField defaultValue={'YARD'} disabled sx={{ width: '10%', minWidth: 150 }} />
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
            <Grid2 width={500}>
              <Typography>入庫日時</Typography>
              <Grid2>
                <TextField defaultValue={'KICS'} disabled sx={{ width: '10%', minWidth: 150 }} />
                <TestDate date={endKICSDate} onChange={handleEndChange} />
                <Time />
              </Grid2>
              <Grid2>
                <TextField defaultValue={'YARD'} disabled sx={{ width: '10%', minWidth: 150 }} />
                <TestDate
                  date={endYARDDate}
                  onChange={(newDate) => {
                    if (newDate !== null) {
                      setEndYARDDate(newDate?.toDate());
                    }
                  }}
                />
                <Time />
              </Grid2>
            </Grid2>
            <Grid2 container direction="column" p={1}>
              <Grid2 container alignItems="center">
                <Typography>税区分</Typography>
                <FormControl size="small" sx={{ width: '8%', minWidth: '80px' }}>
                  <Select value={selectTax} onChange={selectTaxChange}>
                    <MenuItem value={'外税'}>外税</MenuItem>
                    <MenuItem value={'内税'}>内税</MenuItem>
                  </Select>
                </FormControl>
              </Grid2>
              <Grid2 container alignItems="center">
                <Typography>値引き</Typography>
                <TextField />
              </Grid2>
            </Grid2>
            <Grid2 container alignItems="center" py={1}>
              <Typography>メモ</Typography>
              <TextField multiline rows={3} />
            </Grid2>
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
            <Button onClick={() => console.log(rows, dateRow, dateRange)}>保存</Button>
          </Grid2>
        </Box>
        <Divider />
        <Grid2 container alignItems="center" spacing={2} p={2}>
          <Grid2 container alignItems="center">
            <Typography>機材明細名</Typography>
            <TextField />
          </Grid2>
          <Grid2 container alignItems="center">
            <Typography>小計金額</Typography>
            <TextField />
          </Grid2>
        </Grid2>

        <Dialog open={EqSelectionDialogOpen} fullScreen>
          <EquipmentSelectionDialog handleCloseDialog={handleCloseEqDialog} />
        </Dialog>

        <Box display="flex" flexDirection="row" width="100%">
          <Box
            sx={{
              width: {
                xs: '40%',
                sm: '40%',
                md: '40%',
                lg: 'min-content',
              },
            }}
          >
            <Button sx={{ m: 2 }} onClick={() => handleOpenEqDialog()}>
              ＋ 機材追加
            </Button>
            <GridSelectBoxTable
              dateHeader={dateHeader}
              rows={rows}
              dateRange={dateRange}
              onChange={handleCellChange}
              handleMemoChange={handleMemoChange}
            />
          </Box>
          <Box overflow="auto" sx={{ width: { xs: '60%', sm: '60%', md: 'auto' } }}>
            <Box display="flex" my={2}>
              <Button onClick={handleBackDateChange}>
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
              <Button onClick={handleForwardDateChange}>
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
              keep={keep}
              getHeaderBackgroundColor={getDateHeaderBackgroundColor}
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
                keep={keep}
                onClose={handleCloseDateDialog}
                onSave={handleSave}
              />
            </Dialog>
          </Box>
          <Grid2 container spacing={1} ml={{ xs: 10, sm: 17, md: 17, lg: 17 }} py={2} width={{ md: '50%' }}>
            <Grid2 size={12}>
              <Button sx={{ color: 'white', bgcolor: 'mediumpurple' }}>仕込</Button>
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
              <Button sx={{ color: 'white', bgcolor: 'lightgreen' }}>GP</Button>
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
              <Button sx={{ color: 'white', bgcolor: '#ACB9CA' }}>キープ</Button>
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
            {keep.map((data, index) => (
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
