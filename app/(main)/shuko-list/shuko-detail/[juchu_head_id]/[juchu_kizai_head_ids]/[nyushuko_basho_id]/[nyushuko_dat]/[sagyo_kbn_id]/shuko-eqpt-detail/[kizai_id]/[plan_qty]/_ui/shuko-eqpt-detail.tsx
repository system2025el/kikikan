'use client';

import WarningIcon from '@mui/icons-material/Warning';
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContentText,
  DialogTitle,
  Divider,
  Grid2,
  Paper,
  Snackbar,
  TextField,
  Typography,
} from '@mui/material';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { TextFieldElement } from 'react-hook-form-mui';

import { useUserStore } from '@/app/_lib/stores/usestore';
import { BackButton } from '@/app/(main)/_ui/buttons';
import { Loading } from '@/app/(main)/_ui/loading';

import { delshukoResult, updShukoResultAdjQty } from '../_lib/funcs';
import { KizaiDetailHeadValues, ShukoEqptDetailTableValues, ShukoEqptValues } from '../_lib/types';
import { ShukoEqptDetailTable } from './shuko-eqpt-detail-table';

export const ShukoEqptDetail = (props: {
  params: {
    juchu_head_id: string;
    juchu_kizai_head_ids: string;
    nyushuko_basho_id: string;
    nyushuko_dat: string;
    sagyo_kbn_id: string;
    kizai_id: string;
    plan_qty: string;
  };
  shukoEqptDetailData: ShukoEqptDetailTableValues[];
  kizaiData: ShukoEqptValues;
  kizaiDetailHead: KizaiDetailHeadValues[];
}) => {
  const { params, kizaiData } = props;

  // user情報
  const user = useUserStore((state) => state.user);
  // ローディング
  const [isLoading, setIsLoading] = useState(false);

  // 選択タグ
  const [selected, setSelected] = useState<number[]>([]);

  // 出庫タグリスト
  const [shukoEqptDetailList, setShukoEqptDetailList] = useState<ShukoEqptDetailTableValues[]>(
    props.shukoEqptDetailData
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
      resultAdjQty: props.shukoEqptDetailData.length > 0 ? (props.shukoEqptDetailData[0].resultAdjQty ?? 0) : 0,
    },
  });

  /**
   * 棚番作成
   * @param a bldCod
   * @param b tanaCod
   * @param c edaCod
   * @returns
   */
  const joinStrings = (a: string | null, b: string | null, c: string | null) => {
    const parts = [a, b, c];
    const result = parts.filter(Boolean).join('-');

    return result;
  };

  /**
   * 保存ボタン押下
   * @param data 補正数
   */
  const onSubmit = async (data: { resultAdjQty: number }) => {
    if (isDirty && user) {
      console.log(data);
      const juchuKizaiHeadIds = params.juchu_kizai_head_ids.split(',').map(Number);
      const updateResult = await updShukoResultAdjQty(
        Number(params.juchu_head_id),
        juchuKizaiHeadIds[juchuKizaiHeadIds.length - 1],
        Number(params.sagyo_kbn_id),
        decodeURIComponent(params.nyushuko_dat),
        Number(params.nyushuko_basho_id),
        Number(params.kizai_id),
        data.resultAdjQty,
        user.name
      );
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
      const deleteData = shukoEqptDetailList.filter((_, index) => selected.includes(index));
      const deleteResult = await delshukoResult(deleteData, user.name);
      if (deleteResult) {
        const newList = shukoEqptDetailList.filter((_, index) => !selected.includes(index));
        setShukoEqptDetailList(newList);
        setSelected([]);
      } else {
        console.log('削除に失敗しました');
      }
      setIsLoading(false);
    }
  };

  return (
    <Box>
      <Box display={'flex'} justifyContent={'end'} mb={1}>
        <BackButton label={'戻る'} />
      </Box>
      <Paper variant="outlined">
        <form onSubmit={handleSubmit(onSubmit)}>
          <Box display={'flex'} justifyContent={'space-between'} alignItems="center" p={2}>
            <Typography fontSize={'large'}>機材詳細</Typography>
            <Button type="submit">保存</Button>
          </Box>
          <Divider />
          <Grid2 container spacing={5} p={2}>
            <Box display={'flex'} alignItems={'center'}>
              <Typography mr={2}>機材名</Typography>
              <TextField value={kizaiData.kizaiNam ?? ''} disabled />
            </Box>
            <Box display={'flex'} alignItems={'center'}>
              <Typography mr={2}>棚番</Typography>
              <TextField value={joinStrings(kizaiData.bldCod, kizaiData.tanaCod, kizaiData.edaCod)} disabled />
            </Box>
            <Box display={'flex'} alignItems={'center'}>
              <Typography mr={2}>機材メモ</Typography>
              <TextField value={kizaiData.mem ?? ''} disabled />
            </Box>
          </Grid2>
          <Grid2 container spacing={2} p={2}>
            <Typography>出庫予定数</Typography>
            <Typography>{params.plan_qty}</Typography>
          </Grid2>
          <Grid2 container alignItems={'center'} spacing={5} p={1}>
            <Typography>全{shukoEqptDetailList.length}件</Typography>
            <Button color="error" onClick={handleDelete}>
              実績クリア
            </Button>
            <Box display={'flex'} alignItems={'center'}>
              <Typography mr={2}>出庫補正数</Typography>
              <Controller
                name="resultAdjQty"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    type="number"
                    onChange={(e) => {
                      if (/^-?\d*$/.test(e.target.value)) {
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
                  />
                )}
              />
            </Box>
          </Grid2>
        </form>
        {isLoading ? (
          <Loading />
        ) : (
          <ShukoEqptDetailTable datas={shukoEqptDetailList} selected={selected} setSelected={setSelected} />
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
