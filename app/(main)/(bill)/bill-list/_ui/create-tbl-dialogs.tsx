import {
  Box,
  Button,
  Card,
  Checkbox,
  DialogActions,
  DialogTitle,
  FormControlLabel,
  FormGroup,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Snackbar,
  Stack,
  Typography,
} from '@mui/material';
import { useEffect, useRef, useState } from 'react';
import {
  Controller,
  TextFieldElement,
  useFieldArray,
  UseFieldArrayReturn,
  useForm,
  useFormContext,
} from 'react-hook-form-mui';

import { selectJuchuKizaiMeisaiHeadForBill } from '@/app/_lib/db/tables/v-seikyu-date-lst';
import { CloseMasterDialogButton } from '@/app/(main)/_ui/buttons';
import { FormDateX } from '@/app/(main)/_ui/date';
import { Loading } from '@/app/(main)/_ui/loading';
import { getJuchuIsshikiMeisai, getJuchuKizaiMeisaiList } from '@/app/(main)/quotation-list/_lib/funcs';

import { getJuchuKizaiHeadNamListForBill, getJuchuKizaiMeisaiHeadForBill } from '../_lib/funcs';
import { BillHeadValues } from '../_lib/types';

/**
 * 明細を機材明細から作成するか確認するダイアログ
 * @param param0
 * @returns  {JSX.Element} 明細を機材明細から作成するか確認するダイアログコンポーネント
 */
export const FirstDialogPage = ({
  handleClose,
  addTbl,
  toSecondPage,
}: {
  handleClose: () => void;
  addTbl: () => void;
  toSecondPage: React.Dispatch<React.SetStateAction<boolean>>;
}) => {
  return (
    <>
      <DialogTitle display={'flex'} justifyContent={'flex-end'}>
        <CloseMasterDialogButton handleCloseDialog={() => handleClose()} />
      </DialogTitle>
      <Stack p={4}> 機材明細から自動生成しますか？</Stack>
      <DialogActions>
        <Button onClick={() => toSecondPage(true)}>はい</Button>
        <Button
          onClick={() => {
            addTbl();
            handleClose();
          }}
        >
          いいえ
        </Button>
      </DialogActions>
    </>
  );
};

/**
 * 明細作成する受注機材ヘッダを選択するダイアログ
 * @param param0
 * @returns  {JSX.Element}
 */
export const SecondDialogPage = ({
  kokyakuId,
  kokyakuNam,
  headsField,
  handleClose,
  setSnackBarOpen,
  setSnackBarMessage,
}: {
  kokyakuId: number;
  kokyakuNam: string;
  headsField: UseFieldArrayReturn<BillHeadValues>;
  handleClose: () => void;
  setSnackBarOpen: () => void;
  setSnackBarMessage: React.Dispatch<React.SetStateAction<string>>;
}) => {
  /* debug用、レンダリング回数取得に使用 */
  const [checked, setChecked] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  /* 表示する明細ヘッド名リスト */
  const [meisaiHeadNamList, setMeisaiHeadNamList] = useState<
    { juchuHeadId: number; juchuKizaiHeadId: number; headNam: string; dat: Date }[]
  >([]);

  /* useForm -------------------------------------- */
  const { control, handleSubmit, setValue } = useForm({
    mode: 'onSubmit',
    reValidateMode: 'onSubmit',
    defaultValues: {
      kokyaku: { id: kokyakuId, nam: kokyakuNam },
      juchuId: null,
      dat: new Date(),
    },
  });

  /* methods ------------------------------------------------ */
  /* 機材明細ヘッダリスト検索ボタン押下時 */
  const handleSearch = async (data: { kokyaku: { id: number; nam: string }; juchuId: number | null; dat: Date }) => {
    setIsLoading(true);
    console.log(data);
    const meisaiNamList = await getJuchuKizaiHeadNamListForBill(data);
    setMeisaiHeadNamList(meisaiNamList.map((d) => ({ ...d, dat: data.dat })));
    setIsLoading(false);
  };

  /* ヘッダが選ばれたときの処理 */
  const handleClickHeadNam = async (juchuId: number, kizaiHeadId: number, checked: boolean, dat: Date) => {
    console.log(kizaiHeadId, checked);
    if (checked) {
      // 詳細表示処理
      // const data = await getJuchuIsshikiMeisai(juchuId, kizaiHeadId);
      // headsField.append({
      //   seikyuMeisaiHeadNam: null,
      //   zeiFlg: false,
      //   seikyuRange: { strt: null, end: null }, // あとでnullじゃなくする
      //   meisai: data,
      // });
    } else {
      // まとめて表示処理
      const data = await getJuchuKizaiMeisaiHeadForBill(juchuId, kizaiHeadId, dat);
      console.log(data);
      // 取得した内容をテーブル内の明細に入れる
      headsField.append(data);
    }
    handleClose();
  };

  /* useEffect ---------------------------------------------- */
  // useEffect(() => {}, []);

  return (
    <>
      <DialogTitle display={'flex'} justifyContent={'flex-end'}>
        <CloseMasterDialogButton
          handleCloseDialog={() => {
            handleClose();
          }}
        />
      </DialogTitle>
      <Box p={4}>
        <Box sx={styles.container}>
          <Typography mr={7}>相手</Typography>
          <TextFieldElement
            name="kokyaku.nam"
            control={control}
            sx={{
              pointerEvents: 'none', // クリック不可にする
              backgroundColor: '#f5f5f5', // グレー背景で無効っぽく
              color: '#888',
              width: 400,
            }}
            slotProps={{ input: { readOnly: true, onFocus: (e) => e.target.blur() } }}
          />
        </Box>
        <Box sx={styles.container}>
          <Typography mr={3}>受注番号</Typography>
          <TextFieldElement name="juchuId" control={control} sx={{ width: 120 }} />
        </Box>
        <Box sx={styles.container}>
          <Typography mr={5}>年月日</Typography>
          <Typography mr={1}>～</Typography>
          <Controller
            control={control}
            name="dat"
            rules={{ required: '選択してください' }}
            render={({ field, fieldState }) => (
              <FormDateX
                value={field.value}
                onChange={field.onChange}
                sx={{
                  mr: 1,
                }}
                error={!!fieldState.error}
                helperText={fieldState.error?.message}
              />
            )}
          />
        </Box>
        <Box sx={styles.container} justifyContent={'end'}>
          <Button onClick={handleSubmit(handleSearch)}>検索</Button>
        </Box>

        <Stack>
          <FormGroup>
            <FormControlLabel
              control={<Checkbox value={checked} onChange={() => setChecked(!checked)} />}
              label=" 詳細表示"
            />
          </FormGroup>
        </Stack>
        <Card variant="outlined">
          {isLoading ? (
            <Loading />
          ) : (
            <List>
              {meisaiHeadNamList.length > 0 ? (
                meisaiHeadNamList.map((l) => (
                  <ListItem key={l.juchuKizaiHeadId} disablePadding>
                    <ListItemButton
                      onClick={() => handleClickHeadNam(l.juchuHeadId, l.juchuKizaiHeadId, checked, l.dat)}
                      dense
                    >
                      <ListItemText primary={l.headNam} />
                    </ListItemButton>
                  </ListItem>
                ))
              ) : (
                <Typography>明細がありません</Typography>
              )}
            </List>
          )}
        </Card>
      </Box>
      <DialogActions>
        <Button
          onClick={() => {
            handleClose();
          }}
        >
          キャンセル
        </Button>
      </DialogActions>
    </>
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
    marginTop: 0.5,
  },
};
