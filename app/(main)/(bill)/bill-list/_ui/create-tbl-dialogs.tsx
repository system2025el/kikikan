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

import { CloseMasterDialogButton } from '@/app/(main)/_ui/buttons';
import { FormDateX } from '@/app/(main)/_ui/date';
import { Loading } from '@/app/(main)/_ui/loading';
import {
  getJuchuIsshikiMeisai,
  getJuchuKizaiHeadNamList,
  getJuchuKizaiMeisaiList,
} from '@/app/(main)/quotation-list/_lib/funcs';

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
  const [isLoading, setIsLoading] = useState(true);

  /* 表示する明細ヘッド名リスト */
  const [meisaiHeadNamList, setMeisaiHeadNamList] = useState<
    { juchuHeadId: number; juchuKizaiHeadId: number; headNam: string }[]
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
  /* ヘッダが選ばれたときの処理 */
  const handleClickHeadNam = async (juchuId: number, kizaiHeadId: number, headNam: string, checked: boolean) => {
    console.log(kizaiHeadId, checked);
    if (checked) {
      const data = await getJuchuIsshikiMeisai(juchuId, kizaiHeadId);
      headsField.append({
        seikyuMeisaiHeadNam: null,
        zeiFlg: false,
        meisai: data,
      });
    } else {
      const data = await getJuchuKizaiMeisaiList(juchuId, kizaiHeadId);
      console.log(data);
      // 取得した内容をテーブル内の明細に入れる
      headsField.append({
        seikyuMeisaiHeadNam: null,
        zeiFlg: false,
        meisai: data,
      });
    }
    handleClose();
  };

  /* useEffect ---------------------------------------------- */
  useEffect(() => {}, []);

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
        <form>
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
            <Button type="submit">検索</Button>
          </Box>
        </form>
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
                      onClick={() => handleClickHeadNam(l.juchuHeadId, l.juchuKizaiHeadId, l.headNam, checked)}
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
