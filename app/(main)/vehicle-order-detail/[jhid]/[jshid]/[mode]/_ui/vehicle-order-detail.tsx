'use client';

import AddIcon from '@mui/icons-material/Add';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import PrintIcon from '@mui/icons-material/Print';
import SaveAsIcon from '@mui/icons-material/SaveAs';
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  Button,
  Container,
  Divider,
  Fab,
  FormControl,
  Grid2,
  ListItem,
  MenuItem,
  Paper,
  Select,
  SelectChangeEvent,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { grey } from '@mui/material/colors';
import { Dayjs } from 'dayjs';
import { useEffect, useState } from 'react';
import { Controller, useFieldArray, useForm } from 'react-hook-form';
import { SelectElement, TextFieldElement } from 'react-hook-form-mui';
import { Grid } from 'rsuite';

import { toJapanYMDString } from '@/app/(main)/_lib/date-conversion';
import { BackButton } from '@/app/(main)/_ui/buttons';
import { DateTime, TestDate } from '@/app/(main)/_ui/date';
import { selectNone, SelectTypes } from '@/app/(main)/_ui/form-box';
import { DetailOerValues } from '@/app/(main)/(eq-order-detail)/_lib/types';
import {
  IdoJuchuKizaiMeisaiValues,
  JuchuContainerMeisaiValues,
  JuchuKizaiHeadValues,
  JuchuKizaiHonbanbiValues,
  JuchuKizaiMeisaiValues,
} from '@/app/(main)/(eq-order-detail)/eq-main-order-detail/[juchuHeadId]/[juchuKizaiHeadId]/[mode]/_lib/types';
import { FAKE_NEW_ID } from '@/app/(main)/(masters)/_lib/constants';
import { getBasesSelections } from '@/app/(main)/(masters)/bases-master/_lib/funcs';
import { StockTableValues } from '@/app/(main)/stock/_lib/types';
import { JuchuSharyoHeadValues } from '@/app/(main)/vehicle-order-detail/[jhid]/[jshid]/[mode]/_lib/types';

import { getVehsSelections } from '../_lib/funcs';

const VehicleOrderDetail = ({
  juchuHeadData,
  sharyoHeadId,
}: {
  juchuHeadData: DetailOerValues;
  sharyoHeadId: number;
  idoJuchuKizaiMeisaiData: IdoJuchuKizaiMeisaiValues[] | undefined;
  juchuContainerMeisaiData: JuchuContainerMeisaiValues[];
  shukoDate: Date | null;
  nyukoDate: Date | null;
  dateRange: string[];
  eqStockData: StockTableValues[][] | undefined;
  juchuHonbanbiData: JuchuKizaiHonbanbiValues[] | undefined;
  edit: boolean;
  fixFlag: boolean;
}) => {
  /** 選択肢 */
  const [options, setOptions] = useState<{ kbn: SelectTypes[]; basho: SelectTypes[]; vehs: SelectTypes[] }>({
    kbn: [],
    basho: [],
    vehs: [],
  });
  /** 受注ヘッダーアコーディオン制御 */
  const [juchuExpanded, setJuchuExpanded] = useState(false);
  /** 受注車両ヘッダーアコーディオン制御 */
  const [sharyoExpanded, setSharyoExpanded] = useState(true);

  // React hook formの設定
  const { control, handleSubmit, setValue } = useForm<JuchuSharyoHeadValues>({
    mode: 'onTouched',
    defaultValues: {
      juchuHeadId: juchuHeadData.juchuHeadId,
      juchuShryoHeadId: sharyoHeadId,
      headNam: '',
      nyushukoKbn: FAKE_NEW_ID,
      nyushukoDat: new Date(),
      nyushukoBashoId: FAKE_NEW_ID,
      meisai: {
        v1Id: FAKE_NEW_ID,
        v1Mem: null,
        v2Id: FAKE_NEW_ID,
        v2Mem: null,
      },
    },
  });

  // フォーム送信処理
  const onSubmit = async (data: JuchuSharyoHeadValues) => {
    console.log(data);
  };

  function setError(newError: string | null): void {
    throw new Error('Function not implemented.');
  }

  /* useEffect ------------------------------------------------------- */
  useEffect(() => {
    const getOptions = async () => {
      const v = await getVehsSelections();
      const base = await getBasesSelections();
      setOptions({
        kbn: [
          { id: 'shuko', label: '出庫' },
          { id: 'nyuko', label: '入庫' },
        ],
        basho: base,
        vehs: v,
      });
    };
    getOptions();
  }, []);

  return (
    <Container disableGutters sx={{ minWidth: '100%' }} maxWidth={'xl'}>
      <Box justifySelf={'end'}>
        <BackButton label={'戻る'} />
      </Box>
      {/* 受注ヘッダ ---------------------------------------------------------------------------------- */}
      <Accordion
        expanded={juchuExpanded}
        onChange={() => setJuchuExpanded(!juchuExpanded)}
        sx={{
          borderRadius: 1,
          overflow: 'hidden',
          marginTop: 0.5,
        }}
        variant="outlined"
      >
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Grid2 container alignItems={'center'} width={'100%'}>
            <Grid2 size={3}>
              <Typography component="span">受注ヘッダー</Typography>
            </Grid2>
            {!juchuExpanded && (
              <Grid2 size={'grow'} alignItems={'center'} display={'flex'}>
                <Typography marginRight={2}>公演名</Typography>
                <Typography>{juchuHeadData.koenNam}</Typography>
              </Grid2>
            )}
          </Grid2>
        </AccordionSummary>
        <AccordionDetails sx={{ padding: 0, pb: 1 }}>
          <Divider />
          <Grid2 container display="flex" spacing={3}>
            <Grid2>
              <Grid2 container mt={2} mb={1} mx={2} spacing={2}>
                <Grid2 container display="flex" direction="row" alignItems="center">
                  <Grid2 display="flex" direction="row" alignItems="center">
                    <Typography marginRight={3} whiteSpace="nowrap">
                      受注番号
                    </Typography>
                    <TextField value={juchuHeadData.juchuHeadId} disabled sx={{ width: 120 }}></TextField>
                  </Grid2>
                  <Grid2 display="flex" direction="row" alignItems="center">
                    <Typography mr={2}>受注ステータス</Typography>
                    <FormControl size="small" sx={{ width: 120 }}>
                      <Select value={juchuHeadData.juchuSts} disabled>
                        <MenuItem value={0}>入力中</MenuItem>
                        <MenuItem value={1}>仮受注</MenuItem>
                        <MenuItem value={2}>処理中</MenuItem>
                        <MenuItem value={3}>確定</MenuItem>
                        <MenuItem value={4}>貸出済み</MenuItem>
                        <MenuItem value={5}>返却済み</MenuItem>
                        <MenuItem value={9}>受注キャンセル</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid2>
                </Grid2>
              </Grid2>
              <Box sx={styles.container}>
                <Typography marginRight={5} whiteSpace="nowrap">
                  受注日
                </Typography>
                <TextField value={juchuHeadData.juchuDat ? toJapanYMDString(juchuHeadData.juchuDat) : ''} disabled />
              </Box>
              <Box sx={styles.container}>
                <Typography marginRight={5} whiteSpace="nowrap">
                  入力者
                </Typography>
                <TextField value={juchuHeadData.nyuryokuUser} disabled></TextField>
              </Box>
            </Grid2>
            <Grid2>
              <Box sx={{ display: 'flex', alignItems: 'center', ml: 2, mt: { xs: 0, sm: 0, md: 2 } }}>
                <Typography marginRight={5} whiteSpace="nowrap">
                  公演名
                </Typography>
                <TextField value={juchuHeadData.koenNam} disabled></TextField>
              </Box>
              <Box sx={styles.container}>
                <Typography marginRight={3} whiteSpace="nowrap">
                  公演場所
                </Typography>
                <TextField value={juchuHeadData.koenbashoNam ? juchuHeadData.koenbashoNam : ''} disabled></TextField>
              </Box>
              <Box sx={styles.container}>
                <Typography marginRight={7} whiteSpace="nowrap">
                  相手
                </Typography>
                <TextField value={juchuHeadData.kokyaku.kokyakuNam} disabled></TextField>
              </Box>
            </Grid2>
          </Grid2>
        </AccordionDetails>
      </Accordion>
      {/** 受注車両ヘッダー ------------------------------------- */}
      <Accordion
        expanded={sharyoExpanded}
        onChange={() => setSharyoExpanded(!sharyoExpanded)}
        sx={{
          borderRadius: 1,
          overflow: 'hidden',
          marginTop: 0.5,
        }}
        variant="outlined"
      >
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>受注車両ヘッダー</AccordionSummary>
        <AccordionDetails sx={{ padding: 0, pb: 1 }}>
          <Divider />
          <Grid2 container direction={'column'} spacing={1} px={2} py={1}>
            <Grid2 container sx={styles.baselineContainer} spacing={{ sm: 1, md: 5 }}>
              <Grid2 size={{ sm: 12, md: 6 }} sx={styles.baselineContainer}>
                <Typography mr={1}>車両明細名</Typography>
                <TextFieldElement name="headNam" control={control} fullWidth sx={{ maxWidth: 400 }} />
              </Grid2>
              <Grid2 sx={styles.baselineContainer}>
                <Typography mr={1}>入出庫区分</Typography>
                <SelectElement
                  name="nyushukoKbn"
                  control={control}
                  sx={{ width: 120 }}
                  options={[
                    { id: 1, label: '入庫' },
                    { id: 2, label: '出庫' },
                  ]}
                />
              </Grid2>
            </Grid2>
            <Grid2 container sx={styles.baselineContainer} spacing={{ sm: 1, md: 5 }}>
              <Grid2 size={{ sm: 12, md: 6 }} sx={styles.baselineContainer}>
                <Typography mr={7}>日時</Typography>
                <Controller
                  name="nyushukoDat"
                  control={control}
                  render={({ field, fieldState }) => (
                    <DateTime
                      date={field.value}
                      maxDate={undefined}
                      onChange={(newDate: Dayjs | null) => {
                        if (newDate === null) return;
                        setValue('nyushukoDat', newDate.toDate(), { shouldDirty: true });
                      }}
                      onAccept={(newDate: Dayjs | null) => {
                        if (newDate === null) return;
                        setValue('nyushukoDat', newDate.toDate(), { shouldDirty: true });
                      }}
                      fieldstate={fieldState}
                      disabled={false}
                    />
                  )}
                />
              </Grid2>
              <Grid2 sx={styles.baselineContainer}>
                <Typography mr={5}>作業場</Typography>
                <SelectElement name="nyushukoBashoId" control={control} sx={{ width: 120 }} options={options.basho} />
              </Grid2>
            </Grid2>
            <Grid2 container sx={styles.baselineContainer}>
              <Grid2 size={'grow'} sx={styles.baselineContainer}>
                <Typography mr={7}>メモ</Typography>
                <TextFieldElement
                  name="headMem"
                  control={control}
                  multiline
                  sx={{ width: 1, mr: 1 }}
                  minRows={3}
                  maxRows={3}
                />
              </Grid2>
            </Grid2>
          </Grid2>
        </AccordionDetails>
      </Accordion>

      {/* ---------------- 車両入力 ------------------ */}
      <Paper variant="outlined" sx={{ mt: 0.5 }}>
        <Box display={'flex'} px={2} alignItems={'center'}>
          <Grid2 container direction="column" spacing={1}>
            <Typography>受注明細(車両)</Typography>
            <Typography fontSize={'small'}>車両入力</Typography>
          </Grid2>
        </Box>
        <Divider />

        <Box component="form" noValidate onSubmit={handleSubmit(onSubmit)} px={4} width={'100%'}>
          <Grid2 container spacing={{ sm: 1, md: 3 }} my={1} sx={styles.baselineContainer}>
            <Grid2 size={'auto'}>
              <Controller
                name={'meisai.v1Id'}
                control={control}
                render={({ field }) => (
                  <Select {...field} sx={{ minWidth: { sm: '60vw', md: '30vw' }, ml: { sm: 5, md: 0 } }}>
                    {[selectNone, ...options.vehs].map((opt) => (
                      <MenuItem
                        key={opt.id}
                        value={opt.id}
                        sx={opt.id === FAKE_NEW_ID ? { color: grey[600] } : undefined}
                      >
                        {opt.label}
                      </MenuItem>
                    ))}
                  </Select>
                )}
              />
            </Grid2>
            <Grid2 sx={styles.baselineContainer} size={'auto'}>
              <Typography mr={1}>台数</Typography>
              <TextFieldElement name="meisai.v1Qty" control={control} sx={{ width: 50 }} />
            </Grid2>
            <Grid2 sx={styles.baselineContainer} size={'auto'}>
              <Typography mr={1}>メモ</Typography>
              <TextFieldElement name="meisai.v1Mem" control={control} />
            </Grid2>
          </Grid2>
          <Grid2 container spacing={{ sm: 1, md: 3 }} my={1} sx={styles.baselineContainer}>
            <Grid2>
              <Controller
                name={'meisai.v2Id'}
                control={control}
                render={({ field }) => (
                  <Select {...field} sx={{ minWidth: { sm: '60vw', md: '30vw' }, ml: { sm: 5, md: 0 } }}>
                    {[selectNone, ...options.vehs].map((opt) => (
                      <MenuItem
                        key={opt.id}
                        value={opt.id}
                        sx={opt.id === FAKE_NEW_ID ? { color: grey[600] } : undefined}
                      >
                        {opt.label}
                      </MenuItem>
                    ))}
                  </Select>
                )}
              />
            </Grid2>
            <Grid2 sx={styles.baselineContainer} size={'auto'}>
              <Typography mr={1}>台数</Typography>
              <TextFieldElement name="meisai.v1Qty" control={control} sx={{ width: 50 }} />
            </Grid2>
            <Grid2 sx={styles.baselineContainer}>
              <Typography mr={1}>メモ</Typography>
              <TextFieldElement name="meisai.v2Mem" control={control} />
            </Grid2>
          </Grid2>
        </Box>
      </Paper>
      {/** 固定ボタン 保存＆ページトップ */}
      <Box position={'fixed'} zIndex={1050} bottom={25} right={25} alignItems={'center'}>
        <Fab variant="extended" color="primary" type="submit" sx={{ mr: 2 }}>
          <SaveAsIcon sx={{ mr: 1 }} />
          保存
        </Fab>
        <Fab color="primary" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
          <ArrowUpwardIcon />
        </Fab>
      </Box>
    </Container>
  );
};

export default VehicleOrderDetail;

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
  baselineContainer: {
    display: 'flex',
    alignItems: 'center',
  },
};
