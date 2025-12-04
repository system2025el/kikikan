'use client';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import SaveAsIcon from '@mui/icons-material/SaveAs';
import WarningIcon from '@mui/icons-material/Warning';
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContentText,
  DialogTitle,
  Divider,
  Fab,
  Grid2,
  Paper,
  Snackbar,
  TextField,
  Typography,
} from '@mui/material';
import { useEffect, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { TextFieldElement } from 'react-hook-form-mui';

import { useUserStore } from '@/app/_lib/stores/usestore';
import { useUnsavedChangesWarning } from '@/app/(main)/_lib/hook';
import { BackButton } from '@/app/(main)/_ui/buttons';
import { useDirty } from '@/app/(main)/_ui/dirty-context';
import { Loading } from '@/app/(main)/_ui/loading';

import { delNyukoResult, updNyukoResultAdjQty } from '../_lib/funcs';
import { NyukoEqptDetailTableValues, NyukoEqptDetailValues } from '../_lib/types';
import { NyukoEqptDetailTable } from './nyuko-eqpt-detail-table';

export const NyukoEqptDetail = (props: {
  nyukoEqptDetailData: NyukoEqptDetailValues;
  nyukoEqptDetailTableData: NyukoEqptDetailTableValues[];
  fixFlag: boolean;
}) => {
  const { nyukoEqptDetailData, fixFlag } = props;

  // user情報
  const user = useUserStore((state) => state.user);
  // ローディング
  const [isLoading, setIsLoading] = useState(false);

  // 選択タグ
  const [selected, setSelected] = useState<number[]>([]);

  // 入庫タグリスト
  const [nyukoEqptDetailList, setNyukoEqptDetailList] = useState<NyukoEqptDetailTableValues[]>(
    props.nyukoEqptDetailTableData
  );

  // 実績クリアダイアログ制御
  const [deleteOpen, setDeleteOpen] = useState(false);
  // スナックバー制御
  const [snackBarOpen, setSnackBarOpen] = useState(false);
  // スナックバーメッセージ
  const [snackBarMessage, setSnackBarMessage] = useState('');

  const {
    control,
    handleSubmit,
    reset,
    formState: { isDirty, defaultValues },
  } = useForm({
    mode: 'onChange',
    reValidateMode: 'onChange',
    defaultValues: {
      resultAdjQty: nyukoEqptDetailData.resultAdjQty,
    },
  });

  // context
  const { setIsDirty } = useDirty();
  // ブラウザバック、F5、×ボタンでページを離れた際のhook
  useUnsavedChangesWarning(isDirty);

  useEffect(() => {
    setIsDirty(isDirty);
  }, [isDirty, setIsDirty]);

  /**
   * 保存ボタン押下
   * @param data 補正数
   */
  const onSubmit = async (data: { resultAdjQty: number }) => {
    if (isDirty && user) {
      const updateResult = await updNyukoResultAdjQty(nyukoEqptDetailData, data.resultAdjQty, user.name);
      if (updateResult) {
        setSnackBarMessage('保存しました');
        setSnackBarOpen(true);
        reset(data);
      } else {
        setSnackBarMessage('保存に失敗しました');
        setSnackBarOpen(true);
      }
    }
  };

  /**
   * 実績クリアボタン押下
   */
  const handleDelete = async () => {
    if (selected.length > 0) {
      setDeleteOpen(true);
    }
  };

  /**
   * 実績クリアダイアログボタン押下
   * @param result ボタン結果(クリア:true, 戻る:false)
   * @returns
   */
  const handleResult = async (result: boolean) => {
    setDeleteOpen(false);

    if (result) {
      if (!user) return;

      setIsLoading(true);
      const deleteData = nyukoEqptDetailList.filter((_, index) => selected.includes(index));
      const deleteResult = await delNyukoResult(nyukoEqptDetailData, deleteData, user.name);
      if (deleteResult) {
        const newList = nyukoEqptDetailList.filter((_, index) => !selected.includes(index));
        setNyukoEqptDetailList(newList);
        setSelected([]);
        setSnackBarMessage('実績をクリアしました');
        setSnackBarOpen(true);
      } else {
        setSnackBarMessage('実績のクリアに失敗しました');
        setSnackBarOpen(true);
      }
      setIsLoading(false);
    }
  };

  /**
   * チェックボックス選択時
   * @param selected 選択index
   */
  const handleSelect = (selected: number[]) => {
    setSelected(selected);
  };

  return (
    <Box>
      <Grid2 container justifyContent={'end'} alignItems={'center'} spacing={2} mb={1}>
        {fixFlag && <Typography>到着済</Typography>}
        <BackButton label={'戻る'} />
      </Grid2>
      <Paper variant="outlined">
        <form onSubmit={handleSubmit(onSubmit)}>
          <Box display={'flex'} justifyContent={'space-between'} alignItems="center" p={2}>
            <Typography fontSize={'large'}>機材詳細</Typography>
            {/* <Button type="submit">保存</Button> */}
          </Box>
          <Divider />
          <Grid2 container spacing={5} p={2}>
            <Box display={'flex'} alignItems={'center'}>
              <Typography mr={2}>機材名</Typography>
              <TextField
                value={'*'.repeat(nyukoEqptDetailData.indentNum) + (nyukoEqptDetailData.kizaiNam ?? '')}
                disabled
              />
            </Box>
            <Box display={'flex'} alignItems={'center'}>
              <Typography mr={2}>機材メモ</Typography>
              <TextField value={nyukoEqptDetailData.kizaiMem ?? ''} disabled />
            </Box>
          </Grid2>
          <Grid2 container spacing={2} p={2}>
            <Typography>入庫予定数</Typography>
            <Typography>{nyukoEqptDetailData.planQty}</Typography>
          </Grid2>
          <Grid2 container alignItems={'center'} spacing={5} p={1}>
            <Typography>全{nyukoEqptDetailList.length}件</Typography>
            <Button color="error" onClick={handleDelete} disabled={fixFlag}>
              実績クリア
            </Button>
            <Box display={'flex'} alignItems={'center'}>
              <Typography mr={2}>入庫補正数</Typography>
              <Controller
                name="resultAdjQty"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    type="number"
                    onChange={(e) => {
                      if (/^\d*$/.test(e.target.value)) {
                        field.onChange(Number(e.target.value));
                      }
                    }}
                    sx={{
                      width: 150,
                      '& .MuiInputBase-input': {
                        textAlign: 'right',
                      },
                      '& input[type=number]::-webkit-inner-spin-button': {
                        WebkitAppearance: 'none',
                        margin: 0,
                      },
                    }}
                    disabled={fixFlag}
                  />
                )}
              />
            </Box>
          </Grid2>
          {/** 固定ボタン 保存＆ページトップ */}
          <Box position={'fixed'} zIndex={1050} bottom={25} right={25} alignItems={'center'}>
            <Fab variant="extended" color="primary" type="submit" sx={{ mr: 2 }} disabled={fixFlag}>
              <SaveAsIcon sx={{ mr: 1 }} />
              保存
            </Fab>
            <Fab color="primary" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
              <ArrowUpwardIcon />
            </Fab>
          </Box>
        </form>
        {isLoading ? (
          <Loading />
        ) : (
          <NyukoEqptDetailTable datas={nyukoEqptDetailList} selected={selected} handleSelect={handleSelect} />
        )}
      </Paper>
      <Dialog open={deleteOpen}>
        <DialogTitle alignContent={'center'} display={'flex'} alignItems={'center'}>
          <WarningIcon color="error" />
          <Box>実績をクリアします</Box>
        </DialogTitle>
        <DialogContentText m={2} p={2}>
          実績をクリアしてよろしいでしょうか？
        </DialogContentText>
        <DialogActions>
          <Button onClick={() => handleResult(true)}>クリア</Button>
          <Button onClick={() => handleResult(false)}>戻る</Button>
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
    </Box>
  );
};
