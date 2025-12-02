'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { DialerSip } from '@mui/icons-material';
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
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  Fab,
  FormControl,
  FormHelperText,
  Grid2,
  ListItem,
  MenuItem,
  Paper,
  Select,
  SelectChangeEvent,
  Snackbar,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { grey } from '@mui/material/colors';
import { Dayjs } from 'dayjs';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Controller, useFieldArray, useForm } from 'react-hook-form';
import { SelectElement, TextFieldElement } from 'react-hook-form-mui';

import { useUserStore } from '@/app/_lib/stores/usestore';
import { toJapanYMDString } from '@/app/(main)/_lib/date-conversion';
import { BackButton, CloseMasterDialogButton } from '@/app/(main)/_ui/buttons';
import { DateTime, TestDate } from '@/app/(main)/_ui/date';
import { selectNone, SelectTypes } from '@/app/(main)/_ui/form-box';
import { LoadingOverlay } from '@/app/(main)/_ui/loading';
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
import {
  JuchuSharyoHeadSchema,
  JuchuSharyoHeadValues,
} from '@/app/(main)/vehicle-order-detail/[jhid]/[jshid]/[mode]/_lib/types';

import {
  addNewJuchuSharyoHead,
  getChosenJuchuSharyoMeisais,
  getVehsSelections,
  updateJuchuSharyoHead,
} from '../_lib/funcs';

const VehicleOrderDetail = ({
  juchuHeadData,
  sharyoHeadId,
  edit,
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
  /** ログインユーザ */
  const user = useUserStore((state) => state.user);
  /** ルーター */
  const router = useRouter();
  /** クエリパラメータ */
  const searchParams = useSearchParams();

  /* useState ----------------------------------------------------- */
  /** 選択肢 */
  const [options, setOptions] = useState<{ kbn: SelectTypes[]; basho: SelectTypes[]; vehs: SelectTypes[] }>({
    kbn: [],
    basho: [],
    vehs: [],
  });
  /** 受注ヘッダーアコーディオン制御 */
  const [juchuExpanded, setJuchuExpanded] = useState<boolean>(false);
  /** 受注車両ヘッダーアコーディオン制御 */
  const [sharyoExpanded, setSharyoExpanded] = useState<boolean>(true);
  /** ローディング */
  const [isLoading, setIsLoading] = useState<boolean>(true);
  /** 変更前の車両明細 */
  const [currentMeisai, setCurrentMeisai] = useState<JuchuSharyoHeadValues>();
  // 編集モード(true:編集、false:閲覧)
  const [editable, setEditable] = useState(edit);

  /* スナックバーの表示するかしないか */
  const [snackBarOpen, setSnackBarOpen] = useState(false);
  /* スナックバーのメッセージ */
  const [snackBarMessage, setSnackBarMessage] = useState('');
  /** メモ削除確認ダイアログ */
  const [memOpen, setMemOpen] = useState<boolean>(false);

  /* useForm ------------------------------------------------------- */
  const {
    control,
    handleSubmit,
    setValue,
    getValues,
    reset,
    trigger,
    formState: { isDirty, errors: sharyoError },
  } = useForm<JuchuSharyoHeadValues>({
    mode: 'onChange',
    reValidateMode: 'onBlur',
    resolver: zodResolver(JuchuSharyoHeadSchema),
    defaultValues: {
      juchuHeadId: juchuHeadData.juchuHeadId,
      juchuShryoHeadId: Number(sharyoHeadId),
      headNam: '',
      headMem: null,
      nyushukoKbn: FAKE_NEW_ID,
      nyushukoDat: null,
      nyushukoBashoId: FAKE_NEW_ID,
      meisai: [
        { sharyoId: FAKE_NEW_ID, sharyoQty: null, sharyoMem: null },
        { sharyoId: FAKE_NEW_ID, sharyoQty: null, sharyoMem: null },
      ],
    },
  });

  /** 車両明細の配列 */
  const sharyoMeisai = useFieldArray({ control, name: 'meisai' });

  /* methods -------------------------------------------------------- */
  /** 選択肢の取得 */
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

  /** 保存ボタン押下時処理 */
  const onSubmit = (data: JuchuSharyoHeadValues) => {
    /** メモだけ書かれた明細がないか */
    const memOnly = data.meisai.some(
      (item) => item.sharyoMem !== null && (item.sharyoId === null || item.sharyoQty === null)
    );
    if (memOnly) {
      // あればダイアログ開いて確認
      setMemOpen(true);
    } else {
      // 無ければ保存
      handleSave(data);
    }
  };

  /** フォーム送信処理 */
  const handleSave = async (data: JuchuSharyoHeadValues) => {
    setIsLoading(true);
    if (sharyoHeadId <= 0) {
      // 新規登録
      const newId = await addNewJuchuSharyoHead(data, user?.name ?? '');
      setSnackBarMessage('保存しました');
      setSnackBarOpen(true);
      router.replace(`/vehicle-order-detail/${data.juchuHeadId}/${Number(newId)}/edit`);
    } else {
      // 更新処理
      if (!currentMeisai) return;
      updateJuchuSharyoHead(data, currentMeisai!, user?.name ?? '');
      const newData = getValues();
      reset(newData);
      setCurrentMeisai(newData);
      await getOptions();
      /** 車両明細取得 */
      const meisais = await getChosenJuchuSharyoMeisais(juchuHeadData.juchuHeadId, sharyoHeadId);
      reset(meisais);
      setCurrentMeisai(meisais);
      setIsLoading(false);
      setSnackBarMessage('保存しました');
      setSnackBarOpen(true);
    }
  };

  /* useEffect ------------------------------------------------------- */
  useEffect(() => {
    /** 車両明細取得 */
    const getMeisais = async () => {
      const meisais = await getChosenJuchuSharyoMeisais(juchuHeadData.juchuHeadId, sharyoHeadId);
      reset(meisais);
      setCurrentMeisai(meisais);
      setIsLoading(false);
    };
    // データ取得実行
    getOptions();
    // 新規以外はデータ取得してフォームにresetする
    if (sharyoHeadId > 0) {
      getMeisais();
      // setTimeout(() => {
      //   setIsLoading(false);
      // }, 10000);
    } else {
      // 受注機材から自動生成対応
      /** 入出庫種別ID */
      const kbn = searchParams.get('kbn');
      /** 入出庫日時（ISOString想定） */
      const date = searchParams.get('date');
      /** 入出庫場所ID */
      const basho = searchParams.get('basho');
      // それぞれあればセット
      if (kbn && kbn.trim() !== '') {
        setValue('nyushukoKbn', Number(kbn), { shouldDirty: false });
      }
      if (date && date.trim() !== '') {
        setValue('nyushukoDat', new Date(date), { shouldDirty: false });
      }
      if (basho && basho.trim() !== '') {
        setValue('nyushukoBashoId', Number(basho), { shouldDirty: false });
      }
      setIsLoading(false);
    }
  }, [sharyoHeadId, juchuHeadData.juchuHeadId, searchParams, reset, setValue]);

  useEffect(() => {
    console.log(sharyoError);
  }, [sharyoError]);

  return (
    <Container disableGutters sx={{ minWidth: '100%' }} maxWidth={'xl'}>
      {isLoading && <LoadingOverlay />}
      <form onSubmit={handleSubmit(onSubmit)}>
        <Box display={'flex'} justifySelf={'end'}>
          <Grid2 container spacing={4}>
            <Grid2 container alignItems={'center'} spacing={1}>
              {!editable /*|| (lockData !== null && lockData?.addUser !== user?.name) || fixFlag*/ ? (
                <Typography>閲覧モード</Typography>
              ) : (
                <Typography>編集モード</Typography>
              )}
              <Button
                // disabled={(lockData && lockData?.addUser !== user?.name ? true : false) || fixFlag}
                onClick={() => setEditable(!editable)}
              >
                変更
              </Button>
            </Grid2>
            <BackButton label={'戻る'} />
          </Grid2>
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
          <AccordionSummary
            expandIcon={<ExpandMoreIcon />}
            sx={{
              minHeight: '30px',
              maxHeight: '30px',
              '&.Mui-expanded': {
                minHeight: '30px',
                maxHeight: '30px',
              },
            }}
          >
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
                      <TextField value={juchuHeadData.juchuHeadId} disabled sx={{ width: 120 }} />
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
                  <TextField value={juchuHeadData.nyuryokuUser} disabled />
                </Box>
              </Grid2>
              <Grid2>
                <Box sx={{ display: 'flex', alignItems: 'center', ml: 2, mt: { xs: 0, sm: 0, md: 2 } }}>
                  <Typography marginRight={5} whiteSpace="nowrap">
                    公演名
                  </Typography>
                  <TextField value={juchuHeadData.koenNam} disabled />
                </Box>
                <Box sx={styles.container}>
                  <Typography marginRight={3} whiteSpace="nowrap">
                    公演場所
                  </Typography>
                  <TextField value={juchuHeadData.koenbashoNam ? juchuHeadData.koenbashoNam : ''} disabled />
                </Box>
                <Box sx={styles.container}>
                  <Typography marginRight={7} whiteSpace="nowrap">
                    相手
                  </Typography>
                  <TextField value={juchuHeadData.kokyaku.kokyakuNam} disabled />
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
          <AccordionSummary
            expandIcon={<ExpandMoreIcon />}
            sx={{
              minHeight: '30px',
              maxHeight: '30px',
              '&.Mui-expanded': {
                minHeight: '30px',
                maxHeight: '30px',
              },
            }}
          >
            受注車両ヘッダー
          </AccordionSummary>
          <AccordionDetails sx={{ padding: 0, pb: 1 }}>
            <Divider />
            <Grid2 container direction={'column'} spacing={1} px={2} py={1}>
              <Grid2 container sx={styles.baselineContainer} spacing={{ sm: 1, md: 5 }}>
                <Grid2 size={{ sm: 12, md: 6 }} sx={styles.baselineContainer}>
                  <Typography mr={1}>車両明細名</Typography>
                  <TextFieldElement
                    name="headNam"
                    control={control}
                    fullWidth
                    sx={{ maxWidth: 400 }}
                    disabled={!editable}
                  />
                </Grid2>
                <Grid2 sx={styles.baselineContainer}>
                  <Typography mr={1}>入出庫区分</Typography>
                  <SelectElement
                    name="nyushukoKbn"
                    control={control}
                    sx={{ width: 120 }}
                    options={[
                      { id: 2, label: '入庫' },
                      { id: 1, label: '出庫' },
                    ]}
                    disabled={!editable}
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
                        onChange={(newDate: Dayjs | null) => {
                          if (newDate === null) return;
                          setValue('nyushukoDat', newDate.toDate(), { shouldDirty: true, shouldValidate: true });
                        }}
                        onAccept={(newDate: Dayjs | null) => {
                          if (newDate === null) return;
                          setValue('nyushukoDat', newDate.toDate(), { shouldDirty: true, shouldValidate: true });
                        }}
                        fieldstate={fieldState}
                        disabled={!editable}
                        disableClearable
                      />
                    )}
                  />
                </Grid2>
                <Grid2 sx={styles.baselineContainer}>
                  <Typography mr={3}>作業場所</Typography>
                  <SelectElement
                    name="nyushukoBashoId"
                    control={control}
                    sx={{ width: 120 }}
                    options={options.basho}
                    disabled={!editable}
                  />
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
                    disabled={!editable}
                  />
                </Grid2>
              </Grid2>
            </Grid2>
          </AccordionDetails>
        </Accordion>

        {/* --------------------------------------- 車両入力 --------------------------------------- */}
        <Paper variant="outlined" sx={{ mt: 0.5 }}>
          <Box px={2} alignItems={'center'}>
            <Typography>受注明細(車両)</Typography>
            <Typography fontSize={'small'}>車両入力</Typography>
          </Box>
          <Divider />

          <Box width={'100%'} px={2}>
            {sharyoMeisai.fields.map((_, index) => (
              <Grid2
                key={index}
                container
                spacing={{ sm: 1, md: 3 }}
                my={1}
                ml={{ sm: 6, md: 11 }}
                sx={styles.baselineContainer}
              >
                <Grid2 size={'auto'}>
                  <Controller
                    name={`meisai.${index}.sharyoId`}
                    control={control}
                    disabled={!editable}
                    render={({ field, fieldState: { error } }) => (
                      <FormControl error={!!error} sx={{ minWidth: { sm: '60vw', md: '30vw' }, ml: { sm: 5, md: 0 } }}>
                        <Select {...field} value={field.value ?? ''}>
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
                        {error && <FormHelperText>{error.message}</FormHelperText>}
                      </FormControl>
                    )}
                  />
                </Grid2>
                <Grid2 sx={styles.baselineContainer} size={'auto'}>
                  <Typography mr={1}>台数</Typography>
                  <TextFieldElement
                    name={`meisai.${index}.sharyoQty`}
                    control={control}
                    sx={{
                      width: 50,
                      '& .MuiInputBase-input': {
                        textAlign: 'right',
                      },
                      '& input[type=number]::-webkit-inner-spin-button': {
                        WebkitAppearance: 'none',
                        margin: 0,
                      },
                    }}
                    type="number"
                    disabled={!editable}
                  />
                </Grid2>
                <Grid2 sx={styles.baselineContainer} size={'auto'}>
                  <Typography mr={1}>メモ</Typography>
                  <TextFieldElement name={`meisai.${index}.sharyoMem`} control={control} disabled={!editable} />
                </Grid2>
              </Grid2>
            ))}
            {sharyoError.meisai?.root?.message && (
              <Typography variant="caption" color={'error.main'} ml={{ sm: 6, md: 11 }}>
                {sharyoError.meisai?.root?.message}
              </Typography>
            )}
          </Box>
        </Paper>
        {/** 固定ボタン 保存＆ページトップ */}
        <Box position={'fixed'} zIndex={1050} bottom={25} right={25} alignItems={'center'}>
          <Fab variant="extended" color="primary" type="submit" sx={{ mr: 2 }} disabled={!isDirty || !editable}>
            <SaveAsIcon sx={{ mr: 1 }} />
            保存
          </Fab>
          <Fab color="primary" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
            <ArrowUpwardIcon />
          </Fab>
        </Box>
      </form>
      <Dialog open={memOpen} onClose={() => setMemOpen(false)}>
        <DialogTitle display={'flex'} justifyContent={'end'}>
          <CloseMasterDialogButton
            handleCloseDialog={() => {
              setMemOpen(false);
            }}
          />
        </DialogTitle>
        <DialogContent>車両がないメモは保存されません</DialogContent>
        <DialogActions>
          <Button onClick={() => setMemOpen(false)}>戻る</Button>
          <Button
            onClick={() => {
              handleSave(getValues());
              setMemOpen(false);
            }}
          >
            はい
          </Button>
        </DialogActions>
      </Dialog>
      <Snackbar
        open={snackBarOpen}
        autoHideDuration={6000}
        onClose={() => setSnackBarOpen(false)}
        message={snackBarMessage}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
        sx={{ marginTop: '65px' }}
      />
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
