'use client';

import AddIcon from '@mui/icons-material/Add';
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
import { useState } from 'react';
import { Controller, useFieldArray, useForm } from 'react-hook-form';

import { BackButton } from '@/app/(main)/_ui/buttons';
import { DateTime, TestDate } from '@/app/(main)/_ui/date';
import { DetailOerValues } from '@/app/(main)/(eq-order-detail)/_lib/types';
import {
  IdoJuchuKizaiMeisaiValues,
  JuchuContainerMeisaiValues,
  JuchuKizaiHeadValues,
  JuchuKizaiHonbanbiValues,
  JuchuKizaiMeisaiValues,
} from '@/app/(main)/(eq-order-detail)/eq-main-order-detail/[juchuHeadId]/[juchuKizaiHeadId]/[mode]/_lib/types';
import { FAKE_NEW_ID } from '@/app/(main)/(masters)/_lib/constants';
import { StockTableValues } from '@/app/(main)/stock/_lib/types';

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
  /**  */
  const [selectStatus, setSelectStatus] = useState('入力中');
  /** 受注ヘッダーアコーディオン制御 */
  const [juchuExpanded, setJuchuExpanded] = useState(false);
  /** 受注車両ヘッダーアコーディオン制御 */
  const [sharyoExpanded, setSharyoExpanded] = useState(true);

  const selectStatusChange = (event: SelectChangeEvent) => {
    setSelectStatus(event.target.value);
  };

  /** 動的フォーム準備 */

  // React hook formの設定
  const { control, handleSubmit } = useForm<{ vehicles: { id: string }[] }>({
    mode: 'onTouched',
    defaultValues: {
      vehicles: [],
    },
  });
  // useFieldArrayの設定と関数呼び出し
  const { fields, append, remove } = useFieldArray({
    control: control,
    name: 'vehicles',
  });
  // フォーム送信処理
  const onSubmit = async (data: { vehicles: { id: string }[] }) => {
    console.log(data);
  };

  function setError(newError: string | null): void {
    throw new Error('Function not implemented.');
  }

  return (
    <Container disableGutters sx={{ minWidth: '100%' }} maxWidth={'xl'}>
      <Box justifySelf={'end'} mb={0.5}>
        <BackButton label={'戻る'} />
      </Box>
      {/* 受注ヘッダ ---------------------------------------------------------------------------------- */}
      <Accordion
        expanded={juchuExpanded}
        onChange={() => setJuchuExpanded(!juchuExpanded)}
        sx={{
          borderRadius: 1,
          overflow: 'hidden',
          marginTop: 1,
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
                    <TextField value={juchuHeadData.juchuHeadId} disabled></TextField>
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
                <TestDate date={juchuHeadData.juchuDat} onChange={() => {}} disabled />
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
          marginTop: 1,
        }}
        variant="outlined"
      >
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Box alignItems={'center'} width={'100%'}>
            受注車両ヘッダー
          </Box>
        </AccordionSummary>
        <AccordionDetails sx={{ padding: 0, pb: 1 }}>
          <Divider />
          <Grid2 container direction={'column'} spacing={1} px={2} py={1}>
            <Grid2 container sx={styles.baselineContainer} spacing={3}>
              <Grid2 size={'auto'} sx={styles.baselineContainer}>
                <Typography mr={1}>車両明細名</Typography>
                <TextField sx={{ width: 300 }} />
              </Grid2>
              <Grid2 size={'grow'} sx={styles.baselineContainer}>
                <Typography mr={1}>メモ</Typography>
                <TextField multiline sx={{ width: 1, mr: 1 }} />
              </Grid2>
            </Grid2>
            <Grid2 sx={styles.baselineContainer}>
              <Typography mr={1}>入出庫区分</Typography>
              <Select sx={{ width: 200 }} />
            </Grid2>
            <Grid2 container sx={styles.baselineContainer} spacing={5}>
              <Grid2 sx={styles.baselineContainer}>
                <Typography mr={7}>日時</Typography>
                <Select sx={{ width: 200 }} />
              </Grid2>
              <Grid2 sx={styles.baselineContainer}>
                <Typography mr={3}>作業場</Typography>
                <Select sx={{ width: 200 }}>
                  <ListItem value={1}>YARD</ListItem>
                  <ListItem value={2}>KICS</ListItem>
                </Select>
              </Grid2>
            </Grid2>
          </Grid2>
        </AccordionDetails>
      </Accordion>

      {/* ---------------- 車両入力 ------------------ */}
      <Paper variant="outlined" sx={{ mt: 2 }}>
        <Box display={'flex'} px={2} py={1} alignItems={'center'}>
          <Grid2 container direction="column" spacing={1}>
            <Typography>受注明細(車両)</Typography>
            <Typography fontSize={'small'}>車両入力</Typography>
          </Grid2>
        </Box>
        <Divider />

        <Box sx={{ width: '100%' }}>
          <Stack mt={1}>
            <Box width={100}></Box>
            {/* フォーム追加ボタン */}
            <Button onClick={() => append({ id: '' })}>
              <AddIcon fontSize="small" />
              車両追加
            </Button>
          </Stack>
          <Stack spacing={1} m={2} alignItems={'baseline'}>
            <Box width={80}>
              <Typography whiteSpace="nowrap">車両サイズ</Typography>
            </Box>
            {/* --動的フォーム-- */}
            <Box component="form" noValidate onSubmit={handleSubmit(onSubmit)}>
              {/* 動的に追加される入力フォーム */}
              {fields.map((field, index) => {
                return (
                  <Stack key={field.id} direction={'row'} spacing={1} my={1}>
                    <Controller
                      name={`vehicles.${index}.id`}
                      control={control}
                      render={({ field }) => (
                        <Select {...field} sx={{ minWidth: '20vw', bgcolor: 'white' }}>
                          <MenuItem value={'11t'}>11t</MenuItem>
                          <MenuItem value={'2t'}>2t</MenuItem>
                          <MenuItem value={'4t'}>4t</MenuItem>
                          <MenuItem value={'ハイエース'}>ハイエース</MenuItem>
                        </Select>
                      )}
                    />
                    <Button color="error" onClick={() => remove(index)}>
                      削除
                    </Button>
                  </Stack>
                );
              })}
            </Box>
          </Stack>
        </Box>
      </Paper>
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
