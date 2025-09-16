import {
  Box,
  Button,
  Card,
  Checkbox,
  DialogActions,
  DialogTitle,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Snackbar,
  Stack,
  Typography,
} from '@mui/material';
import { useEffect, useRef, useState } from 'react';
import { UseFieldArrayReturn } from 'react-hook-form-mui';

import { CloseMasterDialogButton } from '@/app/(main)/_ui/buttons';
import { Loading } from '@/app/(main)/_ui/loading';

import { getJuchuKizaiHeadNamList, getJuchuKizaiMeisaiList, getJuchuMeisaiSum } from '../_lib/func';
import { QuotHeadValues } from '../_lib/types';

/**
 * 明細を機材明細から作成するか確認するダイアログ
 * @param param0
 * @returns  {JSX.Element} 明細を機材明細から作成するか確認するダイアログコンポーネント
 */
export const FirstDialogPage = ({
  handleClose,
  addKizaiTbl,
  toSecondPage,
}: {
  handleClose: () => void;
  addKizaiTbl: () => void;
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
            addKizaiTbl();
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
  juchuId,
  field,
  handleClose,
  setSnackBarOpen,
  setSnackBarMessage,
}: {
  juchuId: number | null | undefined;
  field: UseFieldArrayReturn<QuotHeadValues>;
  handleClose: () => void;
  setSnackBarOpen: () => void;
  setSnackBarMessage: React.Dispatch<React.SetStateAction<string>>;
}) => {
  /* debug用、レンダリング回数取得に使用 */
  const hasRun = useRef(false);
  const [checked, setChecked] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  /* 表示する明細ヘッド名リスト */
  const [meisaiHeadNamList, setMeisaiHeadNamList] = useState<
    { juchuHeadId: number; juchuKizaiHeadId: number; headNam: string }[]
  >([]);

  /* methods ------------------------------------------------ */
  /* ヘッダが選ばれたときの処理 */
  const handleClickHeadNam = async (juchuId: number, kizaiHeadId: number, headNam: string, checked: boolean) => {
    console.log(kizaiHeadId, checked);
    if (checked) {
      const data = await getJuchuMeisaiSum(juchuId, kizaiHeadId);
      field.append({
        mituMeisaiHeadNam: null,
        headNamDspFlg: false,
        mituMeisaiKbn: 0,
        meisai: [{ nam: headNam, tankaAmt: data[0].tankaAmt, qty: null, honbanbiQty: null, shokeiAmt: null }],
      });
    } else {
      /* ここでDB処理 */
      const data = await getJuchuKizaiMeisaiList(juchuId, kizaiHeadId);
      console.log(data);
      // 取得した内容をテーブル内の明細に入れる
      field.append({ mituMeisaiHeadNam: null, headNamDspFlg: false, mituMeisaiKbn: 0, meisai: data });
    }
    handleClose();
  };

  /* eslint-disable react-hooks/exhaustive-deps */
  /* useEffect ---------------------------------------------- */
  useEffect(() => {
    if (!hasRun.current) {
      hasRun.current = true;
      if (!juchuId) {
        // 受注機材Idが選ばれてない時にダイアログ閉じて何もしない
        setSnackBarMessage(`受注番号が選ばれていません`);
        setSnackBarOpen();
        handleClose();
        return;
      }
      /* 受注ヘッダIDから表示する受注機材ヘッダを取得する */
      const getList = async () => {
        const list = await getJuchuKizaiHeadNamList(juchuId);
        setMeisaiHeadNamList(list);
        setIsLoading(false);
      };
      getList();
      console.log(meisaiHeadNamList);
    }
  }, []);
  /* eslint-enable react-hooks/exhaustive-deps */

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
        <Stack>
          <Checkbox value={checked} onChange={() => setChecked(!checked)} />
          機材をまとめて表示する
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
