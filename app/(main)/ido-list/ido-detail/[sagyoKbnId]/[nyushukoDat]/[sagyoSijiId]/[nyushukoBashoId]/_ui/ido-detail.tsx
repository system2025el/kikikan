'use client';

import AddIcon from '@mui/icons-material/Add';
import ArrowLeftIcon from '@mui/icons-material/ArrowLeft';
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
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { BASHO_ID, SAGYO_KBN_ID, SAGYO_SIJI_ID } from '@/app/_lib/constants';
import { statusColors } from '@/app/(main)/_lib/colors';
import { toJapanYMDString } from '@/app/(main)/_lib/date-conversion';
import { useUnsavedChangesWarning } from '@/app/(main)/_lib/hook';
import { permission } from '@/app/(main)/_lib/permission';
import { User } from '@/app/(main)/_lib/types';
import { validationMessages } from '@/app/(main)/_lib/validation-messages';
import { BackButton } from '@/app/(main)/_ui/buttons';
import { FormDateX } from '@/app/(main)/_ui/date';
import { useDirty } from '@/app/(main)/_ui/dirty-context';
import { LoadingOverlay } from '@/app/(main)/_ui/loading';

import { addIdoFix, delIdoFix, getIdoDenMaxId, saveIdoDen, saveIdoMem } from '../_lib/funcs';
import { IdoDetailTableValues, IdoDetailValues, SelectedIdoEqptsValues } from '../_lib/types';
import { NyukoIdoDenTable, ShukoIdoDenTable } from './ido-detail-table';
import { IdoEqptSelectionDialog } from './ido-equipment-selection-dialog';

/** 移動メモの最大文字数。t_ido_mem.mem が varchar(200) なのに合わせている */
const IDO_MEM_MAX_LENGTH = 200;

/**
 * 明細リストの変更検知用の署名を作る
 *
 * 削除済みを除いた行の「機材id・移動数・保存済みかどうか」だけを並べる。
 * 機材の追加・削除は行数が変わるので、これで検知できる。
 * @param list 明細リスト
 * @returns 署名文字列
 */
const toListSignature = (list: IdoDetailTableValues[]): string =>
  list
    .filter((d) => !d.delFlag)
    .map((d) => `${d.kizaiId}:${d.planQty}:${d.saveFlag ? 1 : 0}`)
    .join(',');

export const IdoDetail = (props: {
  user: User;
  idoDetailData: IdoDetailValues;
  idoDetailTableData: IdoDetailTableValues[];
  idoMem: string;
  fixFlag: boolean;
}) => {
  const { idoDetailData } = props;

  // user情報
  const user = props.user;

  const router = useRouter();

  // 出発、到着フラグ
  const [fixFlag, setFixFlag] = useState(props.fixFlag);
  // 編集中フラグ
  const [editFlag, setEditFlag] = useState(false);
  // 保存フラグ
  const [saveFlag, setSaveFlag] = useState(true);
  // 処理中制御
  const [isProcessing, setIsProcessing] = useState(false);

  // 移動明細リスト
  const [originIdoDetailList, setOriginIdoDetailList] = useState<IdoDetailTableValues[]>(props.idoDetailTableData);
  // 移動明細リスト
  const [idoDetailList, setIdoDetailList] = useState<IdoDetailTableValues[]>(props.idoDetailTableData);
  // 削除対象ID
  const [deleteId, setDeleteId] = useState<number | null>(null);

  // 移動メモ（キーは移動予定日と移動指示のみなので、移動出庫と移動入庫で同じメモを共有する）
  const [originIdoMem, setOriginIdoMem] = useState(props.idoMem);
  const [idoMem, setIdoMem] = useState(props.idoMem);

  // 機材追加ダイアログ制御
  const [idoEqSelectionDialogOpen, setIdoEqSelectionDialogOpen] = useState(false);
  // 削除ダイアログ制御
  const [deleteOpen, setDeleteOpen] = useState(false);
  // 保存ダイアログ制御
  const [saveOpen, setSaveOpen] = useState(false);
  // 出発ダイアログ制御
  const [departureOpen, setDepartureOpen] = useState(false);
  // 到着確認ダイアログ制御
  const [arrivalOpen, setArrivalOpen] = useState(false);
  // スナックバー制御
  const [snackBarOpen, setSnackBarOpen] = useState(false);
  // スナックバーメッセージ
  const [snackBarMessage, setSnackBarMessage] = useState('');

  // context
  const { setIsDirty, requestNavigation, isPending } = useDirty();
  // ブラウザバック、F5、×ボタンでページを離れた際のhook
  useUnsavedChangesWarning(editFlag);

  /**
   * 出発、到着ボタン押下
   * @returns
   */
  const handleFix = async () => {
    if (!user || isProcessing) return;

    setIsProcessing(true);

    if (editFlag || !saveFlag) {
      setSaveOpen(true);
      setIsProcessing(false);
      return;
    }

    // 到着確認ダイアログ表示
    if (idoDetailData.sagyoKbnId === SAGYO_KBN_ID.idoNyuko) {
      setIsProcessing(false);
      setArrivalOpen(true);
      return;
    }

    const diffCheck = idoDetailList.find((data) => data.diffQty !== 0);

    if (diffCheck) {
      setDepartureOpen(true);
      setIsProcessing(false);
      return;
    }

    const result = await addIdoFix(
      SAGYO_KBN_ID.shukoConfirmed,
      idoDetailData.sagyoSijiId,
      idoDetailData.nyushukoDat,
      idoDetailData.nyushukoBashoId,
      user.name
    );

    if (result) {
      setFixFlag(true);
      setSnackBarMessage('出発しました');
      setSnackBarOpen(true);
      setIsProcessing(false);
      router.push('/ido-list');
    } else {
      setSnackBarMessage('出発に失敗しました');
      setSnackBarOpen(true);
      setIsProcessing(false);
    }
  };

  // 到着処理
  const executeArrival = async () => {
    if (!user || isProcessing) return;
    setIsProcessing(true);

    const result = await addIdoFix(
      SAGYO_KBN_ID.nyukoConfirmed,
      idoDetailData.sagyoSijiId,
      idoDetailData.nyushukoDat,
      idoDetailData.nyushukoBashoId,
      user.name
    );

    if (result) {
      setArrivalOpen(false);
      setFixFlag(true);
      setSnackBarMessage('到着しました');
      setSnackBarOpen(true);
      setIsProcessing(false);
      router.push('/ido-list');
    } else {
      setArrivalOpen(false);
      setSnackBarMessage('到着に失敗しました');
      setSnackBarOpen(true);
      setIsProcessing(false);
    }
  };

  /**
   * 出発解除ボタン押下時
   */
  const handleRelease = async () => {
    if (isProcessing) return;

    setIsProcessing(true);

    const result = await delIdoFix(
      SAGYO_KBN_ID.shukoConfirmed,
      idoDetailData.sagyoSijiId,
      idoDetailData.nyushukoDat,
      idoDetailData.nyushukoBashoId
    );

    if (result) {
      setFixFlag(false);
      setSnackBarMessage('出発解除しました');
      setSnackBarOpen(true);
      setIsProcessing(false);
      router.push('/ido-list');
    } else {
      setSnackBarMessage('出発解除に失敗しました');
      setSnackBarOpen(true);
      setIsProcessing(false);
    }
  };

  /**
   * 保存ボタン押下時
   * @returns
   */
  const handleSave = async () => {
    // 機材が0件でもメモだけ保存することがあるので、リストの件数では抜けない
    if (!user) return;

    setIsProcessing(true);

    // 保存されるのは前後の空白・改行を落とした値なので、画面の表示もそれに合わせる
    const memToSave = idoMem.trim();

    // 出発後は移動明細を編集できないので、メモだけを保存する
    if (fixFlag) {
      const result = await saveIdoMem(idoDetailData.nyushukoDat, idoDetailData.sagyoSijiId, memToSave, user.name);

      if (result) {
        setIdoMem(memToSave);
        setOriginIdoMem(memToSave);
        setSnackBarMessage('保存しました');
      } else {
        setSnackBarMessage('保存に失敗しました');
      }
      setSnackBarOpen(true);
      setIsProcessing(false);
      return;
    }

    const updateData = await saveIdoDen(
      idoDetailList,
      memToSave,
      idoDetailData.nyushukoDat,
      idoDetailData.sagyoSijiId,
      user.name
    );

    if (updateData) {
      setOriginIdoDetailList(updateData);
      setIdoDetailList(updateData);
      setIdoMem(memToSave);
      setOriginIdoMem(memToSave);
      setEditFlag(false);
      setIsDirty(false);
      setSaveFlag(true);
      setSnackBarMessage('保存しました');
      setSnackBarOpen(true);
      setIsProcessing(false);
    } else {
      setSnackBarMessage('保存に失敗しました');
      setSnackBarOpen(true);
      setIsProcessing(false);
    }
  };

  /**
   * 移動数変更時
   *
   * ShukoIdoDenTable は memo 化しているので、参照が変わらないよう useCallback で固定する。
   * setState は関数形式なので依存配列は空でよい。
   * @param kizaiId 機材id
   * @param planQty 移動数
   */
  const handleCellChange = useCallback((kizaiId: number, planQty: number) => {
    setIdoDetailList((prev) =>
      prev.map((d) =>
        d.kizaiId === kizaiId ? { ...d, planQty: planQty, diffQty: d.resultQty + d.resultAdjQty - planQty } : d
      )
    );
  }, []);

  // 移動明細削除ボタン押下時
  const handleIdoDenDelete = useCallback((kizaiId: number) => {
    setDeleteOpen(true);
    setDeleteId(kizaiId);
  }, []);

  // 移動明細削除ダイアログの押下ボタンによる処理
  const handleDeleteResult = (result: boolean) => {
    if (!deleteId) return;

    if (result) {
      setIdoDetailList((prev) =>
        prev.map((data) => (data.kizaiId === deleteId && !data.delFlag ? { ...data, delFlag: true } : data))
      );
      setDeleteOpen(false);
      setDeleteId(null);
    } else {
      setDeleteOpen(false);
      setDeleteId(null);
    }
  };

  /**
   * 機材追加時
   * @param data 選択された機材データ
   */
  const setEqpts = async (data: SelectedIdoEqptsValues[]) => {
    const kizaiIds = new Set(idoDetailList.filter((data) => !data.delFlag).map((data) => data.kizaiId));
    const filterKizaiData = data.filter((d) => !kizaiIds.has(d.kizaiId));
    const selectIdoEqpt: IdoDetailTableValues[] = filterKizaiData.map((d) => ({
      idoDenId: 0,
      sagyoKbnId: idoDetailData.sagyoKbnId,
      nyushukoDat: idoDetailData.nyushukoDat,
      sagyosijiId: idoDetailData.sagyoSijiId,
      nyushukoBashoId: idoDetailData.nyushukoBashoId,
      juchuFlg: 0,
      juchuMeisai: [],
      kizaiId: d.kizaiId,
      kizaiNam: d.kizaiNam,
      shozokuId: d.shozokuId,
      rfidYardQty: d.rfidYardQty,
      rfidKicsQty: d.rfidKicsQty,
      planJuchuQty: 0,
      planLowQty: 0,
      planQty: 0,
      resultAdjQty: 0,
      resultQty: 0,
      diffQty: 0,
      ctnFlg: d.ctnFlg,
      delFlag: false,
      saveFlag: false,
    }));

    setIdoDetailList((prev) => [...prev, ...selectIdoEqpt]);
  };

  // 移動メモの編集可否。保存ボタンがあるのは移動出庫の画面だけなので、移動入庫では表示専用にする。
  // 移動明細と違い、出発後（fixFlag）でも編集できる。
  // 保存中はローディングで覆うが、フォーカスが残っているとキー入力だけは通ってしまうので disabled にもする
  const memDisabled =
    idoDetailData.sagyoKbnId !== SAGYO_KBN_ID.idoShuko ||
    isProcessing ||
    user?.permission.nyushuko === permission.nyushuko_ref;

  // 移動メモの文字数超過。超えた分を切り捨てず、入力欄をエラー表示にして保存を止める。
  // 保存時に前後の空白・改行は落とされるので、判定も落とした後の文字数で行う
  const memError = idoMem.trim().length > IDO_MEM_MAX_LENGTH;

  // 移動検索ボタン押下
  const handleBack = () => {
    if (isPending) return;
    const path = '/ido-list';
    requestNavigation(path);
  };

  useEffect(() => {
    const unsavedData = originIdoDetailList.filter((d) => !d.saveFlag);
    if (unsavedData.length > 0) {
      setSaveFlag(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 明細リストの変更検知用の署名。画面上で変化し得るのは行の増減・移動数・削除だけなので、
  // その3点に絞る。リスト全体を JSON.stringify すると、絶対に変化しない juchuMeisai まで
  // 毎回文字列化することになり、メモ入力のたびに無駄なコストがかかる
  const originListSignature = useMemo(() => toListSignature(originIdoDetailList), [originIdoDetailList]);
  const currentListSignature = useMemo(() => toListSignature(idoDetailList), [idoDetailList]);

  useEffect(() => {
    if (originListSignature !== currentListSignature || originIdoMem !== idoMem) {
      setEditFlag(true);
      setIsDirty(true);
    } else {
      setEditFlag(false);
      setIsDirty(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [originListSignature, currentListSignature, originIdoMem, idoMem]);

  return (
    <Box>
      {/* 保存・出発・到着などの通信中は画面全体を覆って操作させない */}
      {isProcessing && <LoadingOverlay />}
      <Box display={'flex'} justifyContent={'end'} mb={1}>
        <Button onClick={handleBack} disabled={isPending}>
          <Box display={'flex'} alignItems={'center'}>
            <ArrowLeftIcon fontSize="small" />
            移動検索
          </Box>
        </Button>
      </Box>
      <Paper variant="outlined">
        <Box display={'flex'} justifyContent={'space-between'} alignItems="center" px={2}>
          <Typography fontSize={'large'}>
            移動明細({idoDetailData.sagyoKbnId === SAGYO_KBN_ID.idoShuko ? '移動出庫' : '移動入庫'})
          </Typography>
          <Grid2 container alignItems={'center'} spacing={2}>
            {fixFlag && (
              <Typography>{idoDetailData.sagyoKbnId === SAGYO_KBN_ID.idoShuko ? '出発済' : '到着済'}</Typography>
            )}
            <Button
              onClick={handleFix}
              disabled={fixFlag || idoDetailList.length === 0 || user?.permission.nyushuko === permission.nyushuko_ref}
              sx={{
                backgroundColor: idoDetailData.sagyoKbnId === SAGYO_KBN_ID.idoShuko ? 'primary' : 'yellow',
                color: idoDetailData.sagyoKbnId === SAGYO_KBN_ID.idoShuko ? 'white' : 'black',
              }}
            >
              {idoDetailData.sagyoKbnId === SAGYO_KBN_ID.idoShuko ? '出発' : '到着'}
            </Button>
            <Button
              color="error"
              onClick={handleRelease}
              disabled={!fixFlag || user?.permission.nyushuko === permission.nyushuko_ref}
              sx={{ display: idoDetailData.sagyoKbnId === SAGYO_KBN_ID.idoShuko ? 'inline-flex' : 'none' }}
            >
              出発解除
            </Button>
          </Grid2>
        </Box>
        <Divider />
        <Grid2 container size={{ xs: 12, sm: 12, md: 6 }} direction={'column'} p={{ sx: 1, sm: 1, md: 2 }} spacing={1}>
          <Box display={'flex'} alignItems={'center'}>
            <Typography mr={3}>移動予定日</Typography>
            <FormDateX sx={{ width: 160 }} value={new Date(idoDetailData.nyushukoDat)} disabled notClearable />
          </Box>
          <Box display={'flex'} alignItems={'center'}>
            <Typography mr={5}>移動指示</Typography>
            <TextField value={idoDetailData.sagyoSijiId === SAGYO_SIJI_ID.ky ? 'KICS→YARD' : 'YARD→KICS'} disabled />
          </Box>
          <Box display={'flex'} alignItems={'center'}>
            <Typography mr={5}>作業場所</Typography>
            <TextField value={idoDetailData.nyushukoBashoId === BASHO_ID.kics ? 'KICS' : 'YARD'} disabled />
          </Box>
        </Grid2>
        {/* 移動メモ。移動出庫の画面でのみ編集でき、移動入庫の画面は表示専用（保存ボタンが無いため）。
            メモは移動予定日と移動指示で一意なので、どちらの画面でも同じ内容が出る */}
        <Box display={'flex'} alignItems={'center'} px={2} pb={2}>
          <Typography mr={5}>移動メモ</Typography>
          <TextField
            multiline
            rows={3}
            fullWidth
            value={idoMem}
            onChange={(e) => setIdoMem(e.target.value)}
            disabled={memDisabled}
            error={memError}
            helperText={memError ? validationMessages.maxStringLength(IDO_MEM_MAX_LENGTH) : undefined}
          />
        </Box>
        <Divider />
        {idoDetailData.sagyoKbnId === SAGYO_KBN_ID.idoShuko ? (
          <Box width={'100%'}>
            <Box display={'flex'} justifyContent={'space-between'} alignItems={'center'} px={2}>
              <Box alignItems={'center'}>
                <Typography>手動指示</Typography>
                <Box py={1}>
                  <Button
                    onClick={() => setIdoEqSelectionDialogOpen(true)}
                    disabled={fixFlag || user?.permission.nyushuko === permission.nyushuko_ref}
                  >
                    <AddIcon fontSize="small" />
                    機材追加
                  </Button>
                </Box>
              </Box>
              <Box display={'flex'} alignItems={'center'}>
                <Typography minWidth={50} textAlign={'center'} sx={{ backgroundColor: statusColors.completed }}>
                  済
                </Typography>
                <Typography minWidth={50} textAlign={'center'} sx={{ backgroundColor: statusColors.lack }}>
                  不足
                </Typography>
                <Typography minWidth={50} textAlign={'center'} sx={{ backgroundColor: statusColors.ctn }}>
                  コンテナ
                </Typography>
              </Box>
            </Box>
            {idoDetailList.filter((d) => !d.delFlag).length > 0 && (
              <ShukoIdoDenTable
                user={user}
                datas={idoDetailList}
                handleCellChange={handleCellChange}
                handleIdoDenDelete={handleIdoDenDelete}
                fixFlag={fixFlag}
                isSaving={isProcessing}
              />
            )}
          </Box>
        ) : (
          <Box width={'100%'} pb={3}>
            <Box display={'flex'} justifyContent={'end'} alignItems={'center'} width={'60vw'} p={2}>
              <Box display={'flex'} alignItems={'center'}>
                <Typography minWidth={50} textAlign={'center'} sx={{ backgroundColor: statusColors.completed }}>
                  済
                </Typography>
                <Typography minWidth={50} textAlign={'center'} sx={{ backgroundColor: statusColors.lack }}>
                  不足
                </Typography>
                <Typography minWidth={50} textAlign={'center'} sx={{ backgroundColor: statusColors.ctn }}>
                  コンテナ
                </Typography>
              </Box>
            </Box>
            {idoDetailList.filter((d) => !d.delFlag).length > 0 && <NyukoIdoDenTable datas={idoDetailList} />}
          </Box>
        )}
      </Paper>
      {/** 固定ボタン 保存＆ページトップ */}
      <Box position={'fixed'} zIndex={1050} bottom={25} right={25} alignItems={'center'}>
        <Fab
          variant="extended"
          color="primary"
          onClick={handleSave}
          // 出発後はメモだけ保存できるので、メモに変更があるときだけ押せるようにする
          disabled={
            isProcessing ||
            memError ||
            user?.permission.nyushuko === permission.nyushuko_ref ||
            (fixFlag && originIdoMem === idoMem.trim())
          }
          sx={{ display: idoDetailData.sagyoKbnId === SAGYO_KBN_ID.idoShuko ? 'inline-flex' : 'none', mr: 2 }}
        >
          <SaveAsIcon sx={{ mr: 1 }} />
          保存
        </Fab>
        <Fab color="primary" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
          <ArrowUpwardIcon />
        </Fab>
      </Box>
      <Dialog open={idoEqSelectionDialogOpen} fullScreen>
        <IdoEqptSelectionDialog setEqpts={setEqpts} handleCloseDialog={() => setIdoEqSelectionDialogOpen(false)} />
      </Dialog>
      <Dialog open={deleteOpen}>
        <DialogTitle alignContent={'center'} display={'flex'} alignItems={'center'}>
          <WarningIcon color="error" />
          <Box>削除</Box>
        </DialogTitle>
        <DialogContentText m={2} p={2}>
          削除してもよろしいでしょうか？
        </DialogContentText>
        <DialogActions>
          <Button onClick={() => handleDeleteResult(true)} color="error">
            削除
          </Button>
          <Button onClick={() => handleDeleteResult(false)}>戻る</Button>
        </DialogActions>
      </Dialog>
      <Dialog open={departureOpen}>
        <DialogTitle alignContent={'center'} display={'flex'} alignItems={'center'}>
          <WarningIcon color="error" />
          <Box>不足があります</Box>
        </DialogTitle>
        <DialogContentText m={2} p={2}>
          不足があるため、出発できません
        </DialogContentText>
        <DialogActions>
          <Button onClick={() => setDepartureOpen(false)}>確認</Button>
        </DialogActions>
      </Dialog>
      <Dialog open={saveOpen}>
        <DialogTitle alignContent={'center'} display={'flex'} alignItems={'center'}>
          <WarningIcon color="error" />
          <Box>出発できません</Box>
        </DialogTitle>
        <DialogContentText m={2} p={2}>
          未保存のデータがあるため、出発できません
        </DialogContentText>
        <DialogActions>
          <Button onClick={() => setSaveOpen(false)}>確認</Button>
        </DialogActions>
      </Dialog>
      <Dialog open={arrivalOpen}>
        <DialogTitle alignContent={'center'} display={'flex'} alignItems={'center'}>
          <WarningIcon color="warning" />
          <Box>到着確認</Box>
        </DialogTitle>
        <DialogContentText m={2} p={2}>
          到着は戻せません。
          <br />
          到着済みにしてよろしいですか？
        </DialogContentText>
        <DialogActions>
          <Button onClick={executeArrival} loading={isProcessing} sx={{ backgroundColor: 'yellow', color: 'black' }}>
            到着
          </Button>
          <Button onClick={() => setArrivalOpen(false)} loading={isProcessing}>
            戻る
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
    </Box>
  );
};
