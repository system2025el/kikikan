'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import AddIcon from '@mui/icons-material/Add';
import CheckIcon from '@mui/icons-material/Check';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import Delete from '@mui/icons-material/Delete';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  Button,
  Dialog,
  Divider,
  FormControl,
  Grid2,
  MenuItem,
  Paper,
  Select,
  SelectChangeEvent,
  TextField,
  Typography,
} from '@mui/material';
import { use, useEffect, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { TextFieldElement } from 'react-hook-form-mui';

import DateX, { RSuiteDateRangePicker, TestDate } from '@/app/(main)/_ui/date';
import { SelectTable } from '@/app/(main)/_ui/table';
import { equipmentRows, vehicleHeaders, vehicleRows } from '@/app/(main)/new-order/[juchu_head_id]/_lib/data';

import { Update } from '../_lib/funcs';
import { JuchuHeadSchema, NewOrderSchema, NewOrderValues } from '../_lib/types';
import { CustomerSelectionDialog } from './customer-selection';
import { LocationSelectDialog } from './location-selection';
import { NewOrderTable } from './new-order-table';

export const NewOrder = (order: NewOrderValues) => {
  /* useForm ------------------------- */
  const {
    watch,
    control,
    handleSubmit,
    reset,
    formState: { isDirty, dirtyFields, errors },
  } = useForm({
    mode: 'onBlur',
    reValidateMode: 'onBlur',
    defaultValues: {
      juchuHeadId: order.juchuHeadId,
      delFlg: order.delFlg,
      juchuSts: order.juchuSts,
      juchuDat: order.juchuDat,
      juchuRange:
        order.juchuRange !== null
          ? ([
              order.juchuRange[0] ? new Date(order.juchuRange[0]) : new Date(''),
              order.juchuRange[1] ? new Date(order.juchuRange[1]) : new Date(''),
            ] as [Date, Date])
          : null,
      nyuryokuUser: order.nyuryokuUser,
      koenNam: order.koenNam,
      koenbashoNam: order.koenbashoNam,
      kokyakuId: order.kokyakuId,
      kokyakuNam: order.kokyakuNam,
      kokyakuTantoNam: order.kokyakuTantoNam,
      mem: order.mem,
      nebikiAmt: order.nebikiAmt,
      zeiKbn: order.zeiKbn,
    },
    resolver: zodResolver(NewOrderSchema),
  });

  const onSubmit = async (data: NewOrderValues) => {
    console.log('update : 開始');
    const update = await Update(data);
    console.log('update : ', update);
  };

  // 受注開始日/受注終了日
  const [dateRange, setDateRange] = useState<[Date, Date] | null>([new Date(), new Date()]);
  // 内税、外税
  const [selectTax, setSelectTax] = useState('外税');

  // 内税、外税変更
  const selectTaxChange = (event: SelectChangeEvent) => {
    setSelectTax(event.target.value);
  };

  const handleSelectionChange = (selectedIds: (string | number)[]) => {
    console.log('選択されたID:', selectedIds);
  };

  const priceTotal = equipmentRows.reduce((sum, row) => sum + (row.price ?? 0), 0);

  const [selectStatus, setSelectStatus] = useState('処理中');

  const statusChange = (event: SelectChangeEvent) => {
    setSelectStatus(event.target.value);
  };

  const [selectInputPerson, setselectInputPerson] = useState('');

  const inputPersonChange = (event: SelectChangeEvent) => {
    setselectInputPerson(event.target.value);
  };

  const [selectLocation, setSelectLocation] = useState('');

  const locationChange = (event: SelectChangeEvent) => {
    setSelectLocation(event.target.value);
  };

  const [locationDialogOpen, setLocationDialogOpen] = useState(false);
  const handleOpenLocationDialog = () => {
    setLocationDialogOpen(true);
  };
  const handleCloseLocationDailog = () => {
    setLocationDialogOpen(false);
  };

  const [customerDialogOpen, setCustomerDialogOpen] = useState(false);
  const handleOpenCustomerDialog = () => {
    setCustomerDialogOpen(true);
  };
  const handleCloseCustomerDialog = () => {
    setCustomerDialogOpen(false);
  };

  const handleDateChange = (range: [Date, Date]) => {
    setDateRange(range);
  };

  // const [rentalPeriod, setRentalPeriod] = useState<[Date, Date]>([new Date(), new Date()]);
  return (
    <Box>
      {/* --------------------------------受注ヘッダー------------------------------------- */}
      <Paper>
        <form onSubmit={handleSubmit(onSubmit)}>
          <Grid2 container display="flex" alignItems="center" justifyContent="space-between" p={2}>
            <Grid2>
              <Typography>受注ヘッダー</Typography>
            </Grid2>
            <Grid2 container spacing={1}>
              <Button type="submit">
                <CheckIcon fontSize="small" />
                保存
              </Button>
              <Button color="error">
                <Delete fontSize="small" />
                伝票削除
              </Button>
              <Button>
                <ContentCopyIcon fontSize="small" />
                コピー
              </Button>
            </Grid2>
          </Grid2>
          <Divider />
          <Grid2 container spacing={{ xs: 0, sm: 0, md: 2 }}>
            <Grid2 size={{ xs: 12, sm: 12, md: 7 }}>
              <Grid2 container margin={2} spacing={2}>
                <Grid2 display="flex" direction="row" alignItems="center">
                  <Typography marginRight={5} whiteSpace="nowrap">
                    受注番号
                  </Typography>
                  <TextFieldElement name="juchuHeadId" control={control} disabled></TextFieldElement>
                </Grid2>
                <Grid2 display="flex" direction="row" alignItems="center">
                  <Typography mr={2}>受注ステータス</Typography>
                  <FormControl size="small" sx={{ width: 120 }}>
                    <Controller
                      name="juchuSts"
                      control={control}
                      render={({ field }) => (
                        <Select {...field}>
                          <MenuItem value={0}>入力中</MenuItem>
                          <MenuItem value={1}>仮受注</MenuItem>
                          <MenuItem value={2}>処理中</MenuItem>
                          <MenuItem value={3}>確定</MenuItem>
                          <MenuItem value={4}>貸出済み</MenuItem>
                          <MenuItem value={5}>返却済み</MenuItem>
                          <MenuItem value={9}>受注キャンセル</MenuItem>
                        </Select>
                      )}
                    />
                  </FormControl>
                </Grid2>
              </Grid2>
              <Box sx={styles.container}>
                <Typography marginRight={7}>受注日</Typography>
                <Controller
                  name="juchuDat"
                  control={control}
                  render={({ field }) => (
                    <TestDate date={field.value} message={'受注日は必須です'} onChange={field.onChange} />
                  )}
                />
              </Box>
              <Box sx={styles.container}>
                <Typography marginRight={7}>入力者</Typography>
                <TextFieldElement name="nyuryokuUser" control={control} disabled></TextFieldElement>
              </Box>
              <Box sx={styles.container}>
                <Typography mr={2}>
                  受注開始日/
                  <br />
                  受注終了日
                </Typography>
                <Controller
                  name="juchuRange"
                  control={control}
                  render={({ field }) => (
                    <RSuiteDateRangePicker
                      //styles={{ background: 'grey' }}
                      value={field.value}
                      onChange={field.onChange} /*val={rentalPeriod}*/
                    />
                  )}
                />
              </Box>
            </Grid2>
            <Grid2 size={{ xs: 12, sm: 12, md: 5 }}>
              <Box sx={styles.container}>
                <Typography marginRight={7}>公演名</Typography>
                <TextFieldElement name="koenNam" control={control}></TextFieldElement>
              </Box>
              <Box sx={styles.container}>
                <Typography marginRight={5}>公演場所</Typography>
                <TextFieldElement name="koenbashoNam" control={control}></TextFieldElement>
                <Button onClick={() => handleOpenLocationDialog()}>検索</Button>
                <Dialog open={locationDialogOpen} fullScreen>
                  <LocationSelectDialog handleCloseLocationDialog={handleCloseLocationDailog} />
                </Dialog>
              </Box>
              <Box sx={styles.container}>
                <Typography marginRight={9}>相手</Typography>
                <TextFieldElement name="kokyakuNam" control={control}></TextFieldElement>
                <Button onClick={() => handleOpenCustomerDialog()}>検索</Button>
                <Dialog open={customerDialogOpen} fullScreen>
                  <CustomerSelectionDialog handleCloseCustDialog={handleCloseCustomerDialog} />
                </Dialog>
              </Box>
              <Box sx={styles.container}>
                <Typography marginRight={3}>相手担当者</Typography>
                <TextFieldElement name="kokyakuTantoNam" control={control}></TextFieldElement>
              </Box>
              <Box sx={styles.container}>
                <Typography marginRight={9}>メモ</Typography>
                <TextFieldElement name="mem" control={control}></TextFieldElement>
              </Box>
              <Box sx={styles.container}>
                <Typography marginRight={7}>値引き</Typography>
                <TextFieldElement name="nebikiAmt" control={control}></TextFieldElement>
                <Typography>円</Typography>
                <Typography ml={4} mr={2}>
                  税区分
                </Typography>
                <FormControl size="small" sx={{ width: '8%', minWidth: '80px' }}>
                  <Controller
                    name="zeiKbn"
                    control={control}
                    render={({ field }) => (
                      <Select {...field}>
                        <MenuItem value={1}>内税</MenuItem>
                        <MenuItem value={2}>外税</MenuItem>
                      </Select>
                    )}
                  />
                </FormControl>
              </Box>
            </Grid2>
          </Grid2>
        </form>
      </Paper>
      {/* --------------------------------受注明細（機材）------------------------------------- */}
      <Accordion sx={{ marginTop: 2 }} defaultExpanded>
        <AccordionSummary expandIcon={<ExpandMoreIcon />} component="div">
          <Grid2 container alignItems="center" justifyContent="space-between" py={1} sx={{ width: '100%' }} spacing={1}>
            <Grid2>
              <Typography>受注機材ヘッダー一覧</Typography>
            </Grid2>
            <Grid2 container display="flex" alignItems="center" spacing={1}>
              <Typography>合計金額</Typography>
              <TextField
                sx={{
                  width: '40%',
                  minWidth: '90px',
                  '& .MuiInputBase-input': {
                    textAlign: 'right',
                    padding: 1,
                  },
                }}
                value={'¥' + priceTotal}
                onClick={(e) => {
                  e.stopPropagation();
                }}
                disabled
              ></TextField>
            </Grid2>
            <Grid2 container spacing={1}>
              <Button
                href="/new-order/equipment-order-detail"
                onClick={(e) => {
                  e.stopPropagation();
                }}
              >
                <AddIcon fontSize="small" />
                機材入力
              </Button>
              <Button
                href="/new-order/equipment-return-order-detail"
                color="error"
                onClick={(e) => {
                  e.stopPropagation();
                }}
              >
                <AddIcon fontSize="small" />
                返却入力
              </Button>
              <Button
                color="error"
                onClick={(e) => {
                  e.stopPropagation();
                }}
              >
                <Delete fontSize="small" />
                受注明細削除
              </Button>
            </Grid2>
          </Grid2>
        </AccordionSummary>
        <AccordionDetails sx={{ padding: 0 }}>
          <NewOrderTable orderRows={equipmentRows} onSelectionChange={handleSelectionChange} />
        </AccordionDetails>
      </Accordion>
      {/* -------------------------車両----------------------------------- */}
      <Accordion sx={{ marginTop: 2 }} defaultExpanded>
        <AccordionSummary expandIcon={<ExpandMoreIcon />} component="div">
          <Grid2 container alignItems="center" justifyContent="space-between" py={1} sx={{ width: '100%' }} spacing={1}>
            <Grid2>
              <Typography>受注車両ヘッダー一覧</Typography>
            </Grid2>
            <Grid2 container spacing={1}>
              <Button
                href="/new-order/vehicle-order-detail"
                onClick={(e) => {
                  e.stopPropagation();
                }}
              >
                <AddIcon fontSize="small" />
                車両入力
              </Button>

              <Button
                color="error"
                onClick={(e) => {
                  e.stopPropagation();
                }}
              >
                <Delete fontSize="small" />
                受注明細削除
              </Button>
            </Grid2>
          </Grid2>
        </AccordionSummary>
        <AccordionDetails sx={{ padding: 0 }}>
          <SelectTable headers={vehicleHeaders} datas={vehicleRows} onSelectionChange={handleSelectionChange} />
        </AccordionDetails>
      </Accordion>
    </Box>
  );
};

/* style
---------------------------------------------------------------------------------------------------- */
/** @type {{ [key: string]: React.CSSProperties }} style */
const styles: { [key: string]: React.CSSProperties } = {
  // コンテナ
  container: {
    display: 'flex',
    alignItems: 'center',
    margin: 1,
    marginLeft: 2,
  },
};
