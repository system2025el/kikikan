'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import AddIcon from '@mui/icons-material/Add';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Autocomplete,
  Box,
  Button,
  Container,
  Dialog,
  Divider,
  Grid2,
  Paper,
  Snackbar,
  TextField,
  Typography,
} from '@mui/material';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Controller, FormProvider, useFieldArray, useForm } from 'react-hook-form';
import { SelectElement, TextFieldElement } from 'react-hook-form-mui';

import { useUserStore } from '@/app/_lib/stores/usestore';
import { validationMessages } from '@/app/(main)/_lib/validation-messages';
import { FormDateX } from '@/app/(main)/_ui/date';
import { SelectTypes } from '@/app/(main)/_ui/form-box';
import { LoadingOverlay } from '@/app/(main)/_ui/loading';
import { FirstDialogPage, SecondDialogPage } from '@/app/(main)/quotation-list/_ui/dialogs';
import { ReadOnlyYenNumberElement } from '@/app/(main)/quotation-list/_ui/quotation';

import { BillHeadSchema, BillHeadValues } from '../_lib/types';
import { MeisaiLines } from './meisai';
import { MeisaiTblHeader } from './meisai-tbl-header';

export const Bill = ({
  isNew,
  bill,
  options,
}: {
  isNew: boolean;
  bill: BillHeadValues;
  options: { users: SelectTypes[]; sts: SelectTypes[] };
}) => {
  /* ログイン中のユーザー */
  const user = useUserStore((state) => state.user);
  console.log('ログインユーザー: ', user);
  const router = useRouter();
  /* useState ----------------------------------------------------------------- */
  /* ローディング中かどうか */
  const [isLoading, setIsLoading] = useState(false);
  // 請求ヘッダアコーディオン制御
  const [seikyuExpanded, setSeikyuExpanded] = useState(true);

  // ダイアログ開閉
  const [kizaiMeisaiaddDialogOpen, setKizaimeisaiaddDialogOpen] = useState(false);
  const [showSecond, setShowSecond] = useState(false);
  const [createOpen, setCreateOpen] = useState(true);

  /* スナックバーの表示するかしないか */
  const [snackBarOpen, setSnackBarOpen] = useState(false);
  /* スナックバーのメッセージ */
  const [snackBarMessage, setSnackBarMessage] = useState('');

  const [isEditing, setIsEditing] = useState(false);
  /* useForm -------------------------------------------------------------- */
  const billForm = useForm<BillHeadValues>({
    mode: 'onChange',
    reValidateMode: 'onChange',
    resolver: zodResolver(BillHeadSchema),
    defaultValues: bill,
  });
  const {
    control,
    handleSubmit,
    reset,
    getValues,
    setValue,
    formState: { errors, isDirty },
  } = billForm;

  const meisaiHeadFields = useFieldArray({ control, name: 'meisaiHeads' });

  /* methods ------------------------------------------------------ */
  /* 保存ボタン押下 */
  const onSubmit = async (/*data: billHeadValues*/) => {
    console.log('新規？', isNew, 'isDirty', isDirty);
    //   if (isNew) {
    //     await addbill(data, user?.name ?? '');
    //   } else {
    //     const result = await updatebill(data, user?.name ?? '');
    //     console.log('更新したのは', result, '番の請求');
    //   }
    setSnackBarMessage('保存しました');
    setSnackBarOpen(true);
  };

  /* useEffect ------------------------------------------------------------ */
  /* eslint-disable react-hooks/exhaustive-deps */
  //   useEffect(() => {
  //     console.log('請求画面開いた', bill, 'isNew?', isNew, user?.name);
  //     if (isNew) {
  //       // 新規なら入力者をログインアカウントから取得する
  //       if (user?.name) {
  //         console.log({ ...bill, nyuryokuUser: user.name });
  //         reset({ ...bill, nyuryokuUser: user.name });
  //       }
  //     } else {
  //       reset(bill);
  //     }
  //   }, []);

  useEffect(() => {
    console.log('請求画面開いた', bill, 'isNew?', isNew, user?.name);
    if (isNew) {
      // 新規なら入力者をログインアカウントから取得する
      if (user?.name) {
        console.log({ ...bill, nyuryokuUser: user.name });
        reset({ ...bill, nyuryokuUser: user.name });
      }
    } else {
      reset(bill);
    }
  }, [user]);
  /* eslint-enable react-hooks/exhaustive-deps */

  return (
    <>
      <Container disableGutters sx={{ minWidth: '100%' }} maxWidth={'xl'}>
        <Box justifySelf={'end'} mb={0.5}>
          <Button onClick={() => router.push('/bill-list')}>戻る</Button>
        </Box>
        <FormProvider {...billForm}>
          <form onSubmit={handleSubmit(onSubmit)}>
            <Paper variant="outlined">
              <Grid2 container display="flex" alignItems="center" justifyContent="space-between" p={1}>
                <Typography margin={1}>請求書</Typography>
                <Box>
                  <Button sx={{ margin: 1 }}>請求書印刷</Button>
                  <Button sx={{ margin: 1 }} type="submit">
                    保存
                  </Button>
                </Box>
              </Grid2>
            </Paper>

            {isLoading && <LoadingOverlay />}

            {/* 請求ヘッダー ----------------------------------------------------------------------------------*/}
            <Accordion
              expanded={seikyuExpanded}
              onChange={() => setSeikyuExpanded(!seikyuExpanded)}
              sx={{
                borderRadius: 1,
                overflow: 'hidden',
                marginTop: 1,
              }}
              variant="outlined"
            >
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography component="span">請求ヘッダー</Typography>
              </AccordionSummary>
              <AccordionDetails sx={{ padding: 0, pb: 1 }}>
                <Divider />
                <Grid2 container direction={'column'} spacing={1} my={1}>
                  <Grid2 container spacing={1}>
                    <Grid2 sx={styles.container}>
                      <Typography marginRight={3}>請求番号</Typography>
                      <TextFieldElement
                        name="seikyuHeadId"
                        control={control}
                        sx={{
                          width: 120,
                          pointerEvents: 'none', // クリック不可にする
                          backgroundColor: '#f5f5f5', // グレー背景で無効っぽく
                          color: '#888',
                        }}
                        slotProps={{ input: { readOnly: true, onFocus: (e) => e.target.blur() } }}
                      />
                    </Grid2>
                    <Grid2 sx={styles.container}>
                      <Typography marginRight={1}>相手</Typography>
                      <TextFieldElement
                        name="aite"
                        control={control}
                        sx={{
                          width: 400,
                          pointerEvents: 'none', // クリック不可にする
                          backgroundColor: '#f5f5f5', // グレー背景で無効っぽく
                          color: '#888',
                        }}
                        slotProps={{ input: { readOnly: true, onFocus: (e) => e.target.blur() } }}
                      />
                    </Grid2>
                    <Grid2 sx={styles.container}>
                      <Typography marginRight={1}>請求書名</Typography>
                      <TextFieldElement name="seikyuHeadNam" control={control} sx={{ width: 400 }} />
                    </Grid2>
                    <Grid2 sx={styles.container}>
                      <Typography marginRight={1}>請求ステータス</Typography>
                      <SelectElement name="seikyuSts" control={control} sx={{ width: 180 }} options={options.sts} />
                    </Grid2>
                  </Grid2>
                  <Grid2 sx={styles.container}>
                    <Typography marginRight={5}>発行日</Typography>
                    <Controller
                      name="seikyuDat"
                      control={control}
                      render={({ field }) => (
                        <FormDateX value={field.value} onChange={field.onChange} sx={{ width: 200 }} />
                      )}
                    />
                  </Grid2>
                  <Grid2 sx={styles.container}>
                    <Typography marginRight={5}>作成者</Typography>
                    <Controller
                      name="nyuryokuUser"
                      control={control}
                      render={({ field }) => (
                        <Autocomplete
                          {...field}
                          options={options.users}
                          getOptionLabel={(option) => option.label}
                          value={options.users.find((opt: SelectTypes) => opt.label === field.value) || null}
                          onChange={(_, value) => field.onChange(value?.label ?? '')}
                          renderInput={(params) => <TextField {...params} />}
                          sx={{ width: 242.5 }}
                        />
                      )}
                    />
                  </Grid2>
                  <Grid2 sx={styles.container}>
                    <Typography marginRight={1}>請求先住所</Typography>
                    <TextFieldElement name="adr1" control={control} sx={{ width: 100, mr: 2 }} />
                    <Controller
                      name="adr2"
                      control={control}
                      rules={{
                        validate: (value) => {
                          const totalLength =
                            (value!.shozai ?? '').length +
                            (value!.tatemono ?? '').length +
                            (value!.sonota ?? '').length;
                          return totalLength <= 80 || validationMessages.maxStringLength(80);
                        },
                      }}
                      render={({ field, fieldState }) => (
                        <TextField
                          value={`${field.value!.shozai ?? ''} ${field.value!.tatemono ?? ''} ${field.value!.sonota ?? ''}`}
                          onChange={(e) => {
                            const [adrA, adrB] = e.target.value.split(' ');
                            field.onChange({ adrA, adrB });
                          }}
                          error={!!fieldState.error}
                          helperText={fieldState.error?.message}
                          sx={{ width: 500 }}
                        />
                      )}
                    />
                  </Grid2>
                  <Grid2 sx={styles.container}>
                    <Typography marginRight={3}>請求先名</Typography>
                    <TextFieldElement name="kokyaku" control={control} sx={{ width: 400 }} />
                  </Grid2>
                </Grid2>
              </AccordionDetails>
            </Accordion>

            {/* 請求明細 ----------------------------------------------------------------------------------*/}
            <Paper sx={{ marginTop: 1 }} variant="outlined">
              <Box p={1}>
                <Typography margin={1}>請求明細</Typography>
              </Box>
              <Box sx={{ padding: 0, pb: 1 }}>
                <Divider />
                <Box margin={0.5} padding={0.8}>
                  {meisaiHeadFields.fields.map((field, index) => (
                    <Box key={field.id} p={1}>
                      <MeisaiTblHeader index={index} fields={meisaiHeadFields}>
                        <MeisaiLines index={index} />
                      </MeisaiTblHeader>
                    </Box>
                  ))}
                  <Box m={1}>
                    <Button size="small" onClick={() => setKizaimeisaiaddDialogOpen(true)}>
                      <AddIcon fontSize="small" />
                      テーブル
                    </Button>
                  </Box>
                  <Dialog
                    open={kizaiMeisaiaddDialogOpen}
                    onClose={() => {
                      setKizaimeisaiaddDialogOpen(false);
                      setShowSecond(false);
                    }}
                    slotProps={{
                      transition: {
                        onExited: () => {
                          setShowSecond(false);
                        },
                      },
                    }}
                    fullWidth
                  >
                    {/* {showSecond && (
                      <SecondDialogPage
                        field={meisaiHeadFields}
                        handleClose={() => setKizaimeisaiaddDialogOpen(false)}
                        setSnackBarOpen={() => setSnackBarOpen(true)}
                        setSnackBarMessage={setSnackBarMessage}
                      />
                    )} */}
                  </Dialog>
                </Box>
              </Box>
            </Paper>

            {/* まとめ ------------------------------------------------------------------------------------ */}
            <Paper sx={{ marginTop: 2 }} variant="outlined">
              <Box margin={0.5} padding={0.8}>
                <Grid2 container display={'flex'} alignItems={'center'} spacing={1} my={0.5}>
                  <Grid2 size={0.5} justifyItems={'end'}>
                    <Typography>中計</Typography>
                  </Grid2>
                  <Grid2 size={2}>
                    <ReadOnlyYenNumberElement name="chukeiAmt" />
                  </Grid2>
                  <Grid2 size={1} justifyItems={'end'}>
                    <Typography>消費税対象合計</Typography>
                  </Grid2>
                  <Grid2 size={2}>
                    <ReadOnlyYenNumberElement name="preTaxGokeiAmt" />
                  </Grid2>
                </Grid2>
                <Grid2 container display={'flex'} alignItems={'center'} spacing={1} my={0.5}>
                  <Grid2 size={2.5} />
                  <Grid2 size={1} justifyItems={'end'}>
                    <Typography>消費税</Typography>
                  </Grid2>
                  <Grid2 size={2}>
                    <ReadOnlyYenNumberElement name="zeiAmt" />
                  </Grid2>
                  <Grid2 size={1} display={'flex'}>
                    <TextFieldElement
                      name="zeiRat"
                      control={control}
                      sx={{
                        '& .MuiInputBase-input': {
                          textAlign: 'right',
                        },
                        '& input[type=number]::-webkit-inner-spin-button': {
                          WebkitAppearance: 'none',
                          margin: 0,
                        },
                      }}
                      type="number"
                    />
                    <Typography alignSelf={'center'}>%</Typography>
                  </Grid2>
                </Grid2>
                <Grid2 container display={'flex'} alignItems={'center'} spacing={1} my={0.5}>
                  <Grid2 size={'grow'} />
                  <Grid2 size={1.5} justifyItems={'end'}>
                    <Typography>請求金額</Typography>
                  </Grid2>
                  <Grid2 size={2}>
                    <ReadOnlyYenNumberElement name="gokeiAmt" />
                  </Grid2>
                  <Grid2 size={1} />
                </Grid2>
              </Box>
            </Paper>
          </form>
        </FormProvider>
        <Snackbar
          open={snackBarOpen}
          autoHideDuration={6000}
          onClose={() => setSnackBarOpen(false)}
          message={snackBarMessage}
          anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
          sx={{ marginTop: '65px' }}
        />
      </Container>
    </>
  );
};

// export const ReadOnlyYenNumberElement = <TFieldName extends FieldPath<billHeadValues>>({
//   name,
// }: {
//   name: TFieldName;
// }) => {
//   const { control } = useFormContext<billHeadValues>();
//   return (
//     <Controller
//       name={name}
//       control={control}
//       render={({ field, fieldState }) => (
//         <TextField
//           {...field}
//           value={
//             typeof field.value === 'number' && !isNaN(field.value)
//               ? field.value >= 0
//                 ? `¥${Math.abs(field.value).toLocaleString()}`
//                 : `-¥${Math.abs(field.value).toLocaleString()}`
//               : `¥0`
//           }
//           type="text"
//           onFocus={(e) => {
//             const rawValue = String(field.value ?? '');
//             setTimeout(() => {
//               e.target.value = rawValue;
//             }, 1);
//           }}
//           onBlur={(e) => {
//             const rawValue = e.target.value.replace(/[¥,]/g, '');
//             const numericValue = Number(rawValue);
//             field.onChange(numericValue);
//           }}
//           onChange={(e) => {
//             const raw = e.target.value.replace(/[^\d]/g, '');
//             if (/^\d*$/.test(raw)) {
//               field.onChange(Number(raw));
//               e.target.value = raw;
//             }
//           }}
//           sx={(theme) => ({
// '.MuiOutlinedInput-notchedOutline': {
//     borderColor: fieldState.error?.message && theme.palette.error.main,
//   },
//   '.Mui-focused .MuiOutlinedInput-notchedOutline': {
//     borderColor: fieldState.error?.message && theme.palette.error.main,
//   },
//   '&:hover .MuiOutlinedInput-notchedOutline': {
//     borderColor: fieldState.error?.message && theme.palette.error.main,
//   },
//   '& .MuiInputBase-input': {
//     textAlign: 'right',
//   },
//   '.MuiFormHelperText-root': {
//     color: theme.palette.error.main,
//   },
//   '& input[type=number]::-webkit-inner-spin-button': {
//     WebkitAppearance: 'none',
//     margin: 0,
//   },
// }
//             pointerEvents: 'none', // クリック不可にする
//             backgroundColor: '#f5f5f5', // グレー背景で無効っぽく
//             color: '#888',
//           })}
//           slotProps={{ input: { readOnly: true, onFocus: (e) => e.target.blur() } }}
//           helperText={fieldState.error?.message}
//         />
//       )}
//     />
//   );
// };

/* style
---------------------------------------------------------------------------------------------------- */
/** @type {{ [key: string]: React.CSSProperties }} style */
const styles: { [key: string]: React.CSSProperties } = {
  // コンテナ
  container: {
    display: 'flex',
    alignItems: 'center',
    marginLeft: 2,
    marginRight: 2,
  },
};
