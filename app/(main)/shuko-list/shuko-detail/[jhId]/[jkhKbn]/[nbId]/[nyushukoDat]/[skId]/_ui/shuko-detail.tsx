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
import { grey } from '@mui/material/colors';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { set } from 'zod';

import { BASHO_ID, FIX_STS, FixSts, JUCHU_KIZAI_HEAD_KBN, SAGYO_KBN_ID } from '@/app/_lib/constants';
import { dispColors, fixStsColors, sagyoKbnColors, statusColors } from '@/app/(main)/_lib/colors';
import { useUnsavedChangesWarning } from '@/app/(main)/_lib/hook';
import {
  getNyushukoFixErrorMessage,
  NyushukoFixAction,
  NyushukoFixErrorReason,
} from '@/app/(main)/_lib/nyushuko-fix-error';
import { notifyNyushukoFixChanged } from '@/app/(main)/_lib/nyushuko-fix-notify';
import { permission } from '@/app/(main)/_lib/permission';
import { User } from '@/app/(main)/_lib/types';
import { BackButton } from '@/app/(main)/_ui/buttons';
import { DateTime, FormDateX } from '@/app/(main)/_ui/date';
import { useDirty } from '@/app/(main)/_ui/dirty-context';
import { LoadingOverlay } from '@/app/(main)/_ui/loading';

import {
  confirmChildJuchuKizaiHead,
  delShukoFix,
  getShukoDetail,
  getShukoDetailTable,
  saveShukoCtn,
  updShukoAdjust,
  updShukoDetail,
} from '../_lib/funcs';
import { calcShukoDiff, hasShukoDiff } from '../_lib/shuko-diff';
import { ShukoCtnSelectionValues, ShukoDetailTableValues, ShukoDetailValues } from '../_lib/types';
import { ShukoCtnSelectionDialog } from './shuko-ctn-selection-dialog';
import { ShukoDetailTable, toShukoRowKey } from './shuko-detail-table';

/**
 * コンテナの編集内容の比較用（追加・削除・予定数・メモ）
 * @param list 出庫明細の行
 * @returns
 */
const toCtnSignature = (list: ShukoDetailTableValues[]) =>
  list
    .filter((d) => d.ctnFlg === 1)
    .map((d) => `${toShukoRowKey(d)}:${d.saveFlag}:${d.delFlag}:${d.planQty}:${d.mem2 ?? ''}`)
    .join('|');

export const ShukoDetail = (props: {
  user: User;
  shukoDetailData: ShukoDetailValues;
  shukoDetailTableData: ShukoDetailTableValues[];
  /** 合体している受注機材ヘッダーの出発状況（なし／一部／全部） */
  fixSts: FixSts;
  /** 出発済みの受注機材ヘッダーid */
  fixedJuchuKizaiHeadIds: number[];
}) => {
  const { shukoDetailData, fixedJuchuKizaiHeadIds } = props;

  // user情報
  const user = props.user;

  const router = useRouter();

  // 出発状況
  const [fixSts, setFixSts] = useState<FixSts>(props.fixSts);
  // 全部出発済み（一部出発済みのときは、未出発の明細を操作できる）
  const fixFlag = fixSts === FIX_STS.all;
  // ローディング
  const [isLoading, setIsLoading] = useState(false);
  // 処理中制御
  const [isProcessing, setIsProcessing] = useState(false);
  // 一覧はブラウザ側で描画する（サーバー描画で出すと、コンテナのメモ欄（複数行の自動高さ調整）が
  // 表示後に高さを測り直して、行が一瞬伸び縮みするため。ブラウザ側の描画なら測り直しは表示前に終わる）
  const [isMounted, setIsMounted] = useState(false);
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // 出庫データ（保存済みの状態）
  const [originShukoDetailList, setOriginShukoDetailList] = useState<ShukoDetailTableValues[]>(
    props.shukoDetailTableData
  );
  // 出庫データ（画面で編集中の状態。コンテナの追加・削除・予定数・メモ）
  const [shukoDetailList, setShukoDetailList] = useState<ShukoDetailTableValues[]>(props.shukoDetailTableData);
  // 表示する行（削除したコンテナは出さない）
  const visibleShukoDetailList = useMemo(() => shukoDetailList.filter((d) => !d.delFlag), [shukoDetailList]);

  // コンテナを編集できるか（最終確認・キープ以外・入出庫の更新権限あり）
  const ctnEditable =
    shukoDetailData.sagyoKbnId === SAGYO_KBN_ID.shukoConfirmation &&
    shukoDetailData.juchuKizaiHeadKbn !== JUCHU_KIZAI_HEAD_KBN.keep &&
    !!(user.permission.nyushuko & permission.nyushuko_upd);
  // コンテナを追加できる受注機材ヘッダー（未出発のもの）
  const addableHeads = useMemo(
    () =>
      shukoDetailData.juchuKizaiHeadIds
        .filter((id) => !fixedJuchuKizaiHeadIds.includes(id))
        .map((id) => ({
          juchuKizaiHeadId: id,
          headNam: originShukoDetailList.find((d) => d.juchuKizaiHeadId === id)?.headNamv ?? `受注明細 ${id}`,
        })),
    [shukoDetailData.juchuKizaiHeadIds, fixedJuchuKizaiHeadIds, originShukoDetailList]
  );
  // コンテナ追加ダイアログ制御
  const [ctnDialogOpen, setCtnDialogOpen] = useState(false);
  // コンテナ削除確認（読取実績があるとき）
  const [ctnDeleteTarget, setCtnDeleteTarget] = useState<ShukoDetailTableValues | null>(null);

  // 未保存の変更
  const { setIsDirty } = useDirty();
  const editFlag = useMemo(
    () => toCtnSignature(originShukoDetailList) !== toCtnSignature(shukoDetailList),
    [originShukoDetailList, shukoDetailList]
  );
  useUnsavedChangesWarning(editFlag);
  useEffect(() => {
    setIsDirty(editFlag);
  }, [editFlag, setIsDirty]);

  // 警告ダイアログ制御
  const [alertOpen, setAlertOpen] = useState(false);
  // 警告ダイアログタイトル
  const [alertTitle, setAlertTitle] = useState('');
  // 警告ダイアログ用メッセージ
  const [alertMessage, setAlertMessage] = useState('');
  // 出発確認ダイアログ制御
  const [departureOpen, setDepartureOpen] = useState(false);
  // 出発解除確認ダイアログ制御
  const [releaseOpen, setReleaseOpen] = useState(false);
  // 一括補正確認ダイアログ制御
  const [adjustOpen, setAdjustOpen] = useState(false);
  // スナックバー制御
  const [snackBarOpen, setSnackBarOpen] = useState(false);
  // スナックバーメッセージ
  const [snackBarMessage, setSnackBarMessage] = useState('');

  /**
   * 出発処理
   * @returns
   */
  const executeDeparture = async () => {
    if (!user || isProcessing) return;

    setIsProcessing(true);

    if (shukoDetailList.length === 0) {
      setIsProcessing(false);
      return;
    }

    // 出発するのは未出発のヘッダーだけなので、不足・過剰の確認も未出発のヘッダーの行だけで行う
    // ※サーバー（updShukoDetail）でも DB から取り直して同じ確認をする。ここはすぐに知らせるための確認
    const diffCheck = shukoDetailList.find(
      (data) => !fixedJuchuKizaiHeadIds.includes(data.juchuKizaiHeadId) && hasShukoDiff(data)
    );

    if (diffCheck) {
      setAlertTitle('不足・過剰があります');
      setAlertMessage('不足・過剰があるため、出発できません');
      setDepartureOpen(false);
      setAlertOpen(true);
      setIsProcessing(false);
      return;
    }

    const updateResult = await updShukoDetail(shukoDetailData, shukoDetailList, user.name);

    if (updateResult.ok) {
      setFixSts(FIX_STS.all);
      setDepartureOpen(false);
      setSnackBarMessage('出発しました');
      setSnackBarOpen(true);
      setIsProcessing(false);
      // このタブは閉じるため、同じ受注機材ヘッダーを開いている他のタブに出発フラグの変化を伝える
      notifyNyushukoFixChanged(shukoDetailData.juchuHeadId, [
        ...new Set(shukoDetailList.map((d) => d.juchuKizaiHeadId).filter((id) => id !== null)),
      ]);
      window.close();
    } else {
      setDepartureOpen(false);
      showFailure('departure', updateResult.reason, '出発に失敗しました');
      setIsProcessing(false);
    }
  };

  /**
   * 失敗の表示（理由があるときは警告ダイアログ、それ以外はスナックバー）
   * @param action 操作
   * @param reason 理由
   * @param defaultMessage 理由がないときの文言
   */
  const showFailure = (action: NyushukoFixAction, reason: NyushukoFixErrorReason, defaultMessage: string) => {
    const message = getNyushukoFixErrorMessage(action, reason);
    if (message) {
      setAlertTitle(message.title);
      setAlertMessage(message.message);
      setAlertOpen(true);
    } else {
      setSnackBarMessage(defaultMessage);
      setSnackBarOpen(true);
    }
  };

  /**
   * 出発解除処理
   * @returns
   */
  const executeRelease = async () => {
    if (!user || isProcessing) return;

    setIsProcessing(true);

    if (shukoDetailList.length === 0) {
      setIsProcessing(false);
      return;
    }

    const juchuKizaiHeadIds = [...new Set(shukoDetailList.map((d) => d.juchuKizaiHeadId).filter((id) => id !== null))];
    try {
      const childJuchuKizaiHeadCount = await confirmChildJuchuKizaiHead(shukoDetailData.juchuHeadId, juchuKizaiHeadIds);

      if (childJuchuKizaiHeadCount && childJuchuKizaiHeadCount > 0) {
        setAlertTitle('子伝票が存在します');
        setAlertMessage('子伝票があるため、出発解除できません');
        setReleaseOpen(false);
        setAlertOpen(true);
        setIsProcessing(false);
        return;
      }
    } catch (e) {
      // 子の確認に失敗したときは解除しない（子があるかどうか分からないため）
      setReleaseOpen(false);
      setSnackBarMessage('出発解除に失敗しました');
      setSnackBarOpen(true);
      setIsProcessing(false);
      return;
    }

    const updateResult = await delShukoFix(shukoDetailData, shukoDetailList);

    if (updateResult.ok) {
      setFixSts(FIX_STS.none);
      setReleaseOpen(false);
      setSnackBarMessage('出発解除しました');
      setSnackBarOpen(true);
      setIsProcessing(false);
      // このタブは閉じるため、同じ受注機材ヘッダーを開いている他のタブに出発フラグの変化を伝える
      notifyNyushukoFixChanged(shukoDetailData.juchuHeadId, juchuKizaiHeadIds);
      window.close();
    } else {
      setReleaseOpen(false);
      showFailure('departureRelease', updateResult.reason, '出発解除に失敗しました');
      setIsProcessing(false);
    }
  };

  /**
   * 一括補正処理
   * @returns
   */
  const executeAdjust = async () => {
    if (!user || isProcessing) return;

    setIsProcessing(true);

    const adjustData = shukoDetailList.filter((data) => data.diff !== 0 && data.diff < 0);

    if (adjustData.length === 0) {
      setIsProcessing(false);
      return;
    }

    setIsLoading(true);
    try {
      await updShukoAdjust(adjustData, user.name);
      const updatedShukoDetailTableData = await getShukoDetailTable(
        shukoDetailData.juchuHeadId,
        shukoDetailData.juchuKizaiHeadKbn,
        shukoDetailData.nyushukoBashoId,
        shukoDetailData.nyushukoDat,
        shukoDetailData.sagyoKbnId
      );
      setShukoDetailList(updatedShukoDetailTableData);
      setOriginShukoDetailList(updatedShukoDetailTableData);
      setAdjustOpen(false);
      setSnackBarMessage('一括補正しました');
      setSnackBarOpen(true);
    } catch (e) {
      setSnackBarMessage('一括補正に失敗しました');
      setSnackBarOpen(true);
    }
    setIsLoading(false);
    setIsProcessing(false);
  };

  /**
   * コンテナ追加（選んだ受注機材ヘッダーの末尾に、未保存の行として追加する）
   * @param juchuKizaiHeadId 追加先の受注機材ヘッダーid
   * @param selected 追加するコンテナ
   */
  const handleAddCtn = (juchuKizaiHeadId: number, selected: ShukoCtnSelectionValues[]) => {
    setCtnDialogOpen(false);
    if (selected.length === 0) return;

    const headNam = addableHeads.find((h) => h.juchuKizaiHeadId === juchuKizaiHeadId)?.headNam ?? null;
    setShukoDetailList((prev) => {
      // 同じヘッダーにすでにあるコンテナは追加しない（削除して保存前のものは、削除を取り消して戻す）
      const restored = prev.map((d) =>
        d.delFlag &&
        d.ctnFlg === 1 &&
        d.juchuKizaiHeadId === juchuKizaiHeadId &&
        selected.some((s) => s.kizaiId === d.kizaiId)
          ? { ...d, delFlag: false }
          : d
      );
      const existing = restored.filter((d) => d.juchuKizaiHeadId === juchuKizaiHeadId && !d.delFlag);
      const newRows: ShukoDetailTableValues[] = selected
        .filter((s) => !existing.some((d) => d.kizaiId === s.kizaiId))
        .map((s) => ({
          juchuHeadId: shukoDetailData.juchuHeadId,
          juchuKizaiHeadId: juchuKizaiHeadId,
          juchuKizaiMeisaiId: 0,
          juchuKizaiHeadKbn: shukoDetailData.juchuKizaiHeadKbn,
          headNamv: headNam,
          kizaiId: s.kizaiId,
          kizaiNam: s.kizaiNam,
          koenNam: shukoDetailData.koenNam,
          koenbashoNam: shukoDetailData.koenbashoNam,
          kokyakuNam: shukoDetailData.kokyakuNam,
          nyushukoBashoId: shukoDetailData.nyushukoBashoId,
          nyushukoDat: shukoDetailData.nyushukoDat,
          nyushukoShubetuId: shukoDetailData.nyushukoShubetuId,
          planQty: 0,
          planKizaiQty: null,
          planYobiQty: null,
          resultAdjQty: 0,
          resultQty: 0,
          sagyoKbnId: shukoDetailData.sagyoKbnId,
          diff: calcShukoDiff(0, 0, 0),
          ctnFlg: 1,
          dspOrdNumMeisai: null,
          indentNum: 0,
          mem2: '',
          juchuMeisaiDelFlg: 0,
          saveFlag: false,
          delFlag: false,
        }));

      // 一覧はヘッダー → 表示順の順に並んでいるので、選んだヘッダーの最後の行の後ろに入れる
      const lastIndex = restored.map((d) => d.juchuKizaiHeadId).lastIndexOf(juchuKizaiHeadId);
      return lastIndex < 0
        ? [...restored, ...newRows]
        : [...restored.slice(0, lastIndex + 1), ...newRows, ...restored.slice(lastIndex + 1)];
    });
  };

  /**
   * コンテナの予定数入力
   * @param row 対象の行
   * @param planQty 予定数（空欄は null）
   */
  const handlePlanQtyChange = (row: ShukoDetailTableValues, planQty: number | null) => {
    const key = toShukoRowKey(row);
    setShukoDetailList((prev) =>
      prev.map((d) =>
        toShukoRowKey(d) === key
          ? { ...d, planQty: planQty, diff: calcShukoDiff(planQty ?? 0, d.resultQty, d.resultAdjQty) }
          : d
      )
    );
  };

  /**
   * コンテナのメモ入力
   * @param row 対象の行
   * @param mem メモ
   */
  const handleMemChange = (row: ShukoDetailTableValues, mem: string) => {
    const key = toShukoRowKey(row);
    setShukoDetailList((prev) => prev.map((d) => (toShukoRowKey(d) === key ? { ...d, mem2: mem } : d)));
  };

  /**
   * コンテナ削除（読取実績があるときは確認してから）
   * @param row 対象の行
   */
  const handleDeleteCtn = (row: ShukoDetailTableValues) => {
    if ((row.resultQty ?? 0) !== 0 || (row.resultAdjQty ?? 0) !== 0) {
      setCtnDeleteTarget(row);
      return;
    }
    executeDeleteCtn(row);
  };

  /**
   * コンテナ削除の実行（保存済みの行は保存時に削除する。未保存の行はそのまま取り除く）
   * @param row 対象の行
   */
  const executeDeleteCtn = (row: ShukoDetailTableValues) => {
    const key = toShukoRowKey(row);
    setShukoDetailList((prev) =>
      row.saveFlag
        ? prev.map((d) => (toShukoRowKey(d) === key ? { ...d, delFlag: true } : d))
        : prev.filter((d) => toShukoRowKey(d) !== key)
    );
    setCtnDeleteTarget(null);
  };

  /**
   * コンテナの保存
   * @returns
   */
  const handleSaveCtn = async () => {
    if (!user || isProcessing || !editFlag) return;

    if (shukoDetailList.some((d) => d.ctnFlg === 1 && !d.delFlag && d.planQty === null)) {
      setAlertTitle('予定数が入力されていません');
      setAlertMessage('コンテナの予定数を入力してください');
      setAlertOpen(true);
      return;
    }

    // 追加・削除・変更があった行だけを送る
    const originMap = new Map(originShukoDetailList.map((d) => [toShukoRowKey(d), d]));
    const changedRows = shukoDetailList.filter((d) => {
      if (d.ctnFlg !== 1) return false;
      if (!d.saveFlag) return !d.delFlag;
      if (d.delFlag) return true;
      const origin = originMap.get(toShukoRowKey(d));
      return !origin || origin.planQty !== d.planQty || (origin.mem2 ?? '') !== (d.mem2 ?? '');
    });

    setIsProcessing(true);
    setIsLoading(true);
    try {
      const result = await saveShukoCtn(shukoDetailData, changedRows, user.name);
      if (result.ok) {
        setShukoDetailList(result.data);
        setOriginShukoDetailList(result.data);
        setSnackBarMessage('保存しました');
        setSnackBarOpen(true);
      } else {
        setAlertTitle('保存できませんでした');
        setAlertMessage(result.message);
        setAlertOpen(true);
      }
    } catch (e) {
      setSnackBarMessage('保存に失敗しました');
      setSnackBarOpen(true);
    }
    setIsLoading(false);
    setIsProcessing(false);
  };

  return (
    <Box>
      {isLoading && <LoadingOverlay />}
      <Box display={'flex'} justifyContent={'end'} mb={1}>
        <Button
          onClick={() => {
            window.close();
          }}
        >
          閉じる
        </Button>
      </Box>
      <Paper variant="outlined">
        <Box display={'flex'} justifyContent={'space-between'} alignItems="center" px={2}>
          <Typography
            fontSize={'large'}
            px={1}
            sx={{
              backgroundColor:
                shukoDetailData.sagyoKbnId === SAGYO_KBN_ID.shukoConfirmation
                  ? sagyoKbnColors.shukoConfirmation
                  : sagyoKbnColors.shukoPicking,
              color: shukoDetailData.sagyoKbnId === SAGYO_KBN_ID.shukoConfirmation ? 'black' : 'white',
            }}
          >
            出庫明細({shukoDetailData.sagyoKbnId === SAGYO_KBN_ID.shukoConfirmation ? '最終確認' : 'ピッキング'})
          </Typography>
          <Grid2 container alignItems={'center'} spacing={2}>
            {fixSts === FIX_STS.all && (
              <Typography px={1} sx={{ backgroundColor: fixStsColors.all }}>
                出発済
              </Typography>
            )}
            {fixSts === FIX_STS.partial && (
              <Typography px={1} sx={{ backgroundColor: fixStsColors.partial }}>
                一部出発済
              </Typography>
            )}
            <Button
              onClick={() => setDepartureOpen(true)}
              // 未保存のコンテナの変更があるあいだは出発できない
              disabled={
                fixFlag ||
                user?.permission.nyushuko === permission.nyushuko_ref ||
                shukoDetailList.length === 0 ||
                editFlag
              }
              sx={{ display: shukoDetailData.sagyoKbnId === SAGYO_KBN_ID.shukoConfirmation ? 'block' : 'none' }}
            >
              出発
            </Button>
            <Button
              color="error"
              onClick={() => setReleaseOpen(true)}
              disabled={fixSts === FIX_STS.none || user?.permission.nyushuko === permission.nyushuko_ref}
              sx={{ display: shukoDetailData.sagyoKbnId === SAGYO_KBN_ID.shukoConfirmation ? 'block' : 'none' }}
            >
              出発解除
            </Button>
          </Grid2>
        </Box>
        <Divider />
        <Grid2 container spacing={1} p={1}>
          <Grid2 container size={{ xs: 12, sm: 12, md: 6 }} direction={'column'} p={{ sx: 1, sm: 1, md: 1 }}>
            <Box display={'flex'} alignItems={'center'}>
              <Typography mr={4}>受注番号</Typography>
              <TextField value={shukoDetailData.juchuHeadId} sx={{ width: 100 }} disabled />
            </Box>
            <Box display={'flex'} alignItems={'center'}>
              <Typography mr={6}>受注日</Typography>
              <FormDateX
                sx={{ width: 160 }}
                value={shukoDetailData.juchuDat ? new Date(shukoDetailData.juchuDat) : null}
                disabled
                notClearable
              />
            </Box>
            <Box display={'flex'} alignItems={'center'}>
              <Typography mr={4}>出庫日時</Typography>
              <DateTime value={shukoDetailData.nyushukoDat ? new Date(shukoDetailData.nyushukoDat) : null} disabled />
            </Box>
            <Box display={'flex'} alignItems={'center'}>
              <Typography mr={4}>出庫場所</Typography>
              <TextField
                value={shukoDetailData.nyushukoBashoId === BASHO_ID.kics ? 'KICS' : 'YARD'}
                disabled
                sx={{ width: 100 }}
              />
            </Box>
          </Grid2>
          <Grid2 container size={{ xs: 12, sm: 12, md: 6 }} direction={'column'} p={{ sx: 1, sm: 1, md: 1 }}>
            <Box display={'flex'} alignItems={'center'}>
              <Typography mr={6}>公演名</Typography>
              <TextField value={shukoDetailData.koenNam ?? ''} fullWidth disabled />
            </Box>
            <Box display={'flex'} alignItems={'center'}>
              <Typography mr={4}>公演場所</Typography>
              <TextField value={shukoDetailData.koenbashoNam ?? ''} fullWidth disabled />
            </Box>
            <Box display={'flex'} alignItems={'center'}>
              <Typography mr={6}>顧客名</Typography>
              <TextField value={shukoDetailData.kokyakuNam ?? ''} fullWidth disabled />
            </Box>
            <Box display={'flex'} alignItems={'center'}>
              <Typography mr={2}>受注担当者</Typography>
              <TextField value={shukoDetailData.nyuryokuUser ?? ''} disabled sx={{ width: 160 }} />
            </Box>
          </Grid2>
        </Grid2>
        <Box display={'flex'} alignItems={'center'} px={2} pb={2}>
          <Typography mr={2}>受注明細名</Typography>
          <TextField
            value={shukoDetailData.headNamv ?? ''}
            fullWidth
            disabled
            sx={{
              '.MuiOutlinedInput-input.Mui-disabled': {
                WebkitTextFillColor:
                  shukoDetailData.juchuKizaiHeadKbn === JUCHU_KIZAI_HEAD_KBN.keep ? dispColors.keep : 'inherit',
              },
            }}
          />
        </Box>
        <Box display={'flex'} alignItems="center" px={2} pb={1}>
          <Typography mr={4}>明細メモ</Typography>
          <TextField multiline rows={3} fullWidth disabled value={shukoDetailData.memv ?? ''} />
        </Box>
        <Divider />
        <Box width={'100%'}>
          <Box display={'flex'} justifyContent={'space-between'} alignItems={'center'} width={'70vw'} p={1}>
            <Box display={'flex'} alignItems={'center'}>
              <Typography>全{visibleShukoDetailList.length}件</Typography>
              {ctnEditable && (
                <Button
                  onClick={() => setCtnDialogOpen(true)}
                  disabled={addableHeads.length === 0 || isProcessing}
                  sx={{ ml: 2 }}
                >
                  <AddIcon fontSize="small" />
                  コンテナ追加
                </Button>
              )}
            </Box>
            <Box display={'flex'} alignItems={'center'}>
              <Typography minWidth={50} textAlign={'center'} sx={{ backgroundColor: statusColors.completed }}>
                済
              </Typography>
              <Typography minWidth={50} textAlign={'center'} sx={{ backgroundColor: statusColors.lack }}>
                不足
              </Typography>
              <Typography minWidth={50} textAlign={'center'} sx={{ backgroundColor: statusColors.excess }}>
                過剰
              </Typography>
              <Typography minWidth={50} textAlign={'center'} sx={{ backgroundColor: statusColors.ctn }}>
                コンテナ
              </Typography>
              {ctnEditable && (
                <Typography minWidth={50} textAlign={'center'} sx={{ backgroundColor: statusColors.unsaved }}>
                  未保存
                </Typography>
              )}
              <Button
                onClick={() => setAdjustOpen(true)}
                disabled={
                  !shukoDetailList.find((data) => data.diff !== 0) ||
                  fixFlag ||
                  user?.permission.nyushuko === permission.nyushuko_ref ||
                  editFlag
                }
                sx={{ ml: 2 }}
              >
                一括補正
              </Button>
            </Box>
          </Box>
        </Box>
        {isMounted && visibleShukoDetailList.length > 0 && (
          <ShukoDetailTable
            datas={visibleShukoDetailList}
            fixFlag={fixFlag}
            user={user}
            setAdjustOpen={setAdjustOpen}
            sagyoKbnId={shukoDetailData.sagyoKbnId}
            ctnEditable={ctnEditable}
            fixedJuchuKizaiHeadIds={fixedJuchuKizaiHeadIds}
            onPlanQtyChange={handlePlanQtyChange}
            onMemChange={handleMemChange}
            onDelete={handleDeleteCtn}
          />
        )}
      </Paper>
      {/** 固定ボタン 保存＆ページトップ（コンテナを編集できるときだけ保存を出す） */}
      <Box position={'fixed'} zIndex={1050} bottom={25} right={25} alignItems={'center'}>
        {ctnEditable && (
          <Fab
            variant="extended"
            color="primary"
            onClick={handleSaveCtn}
            disabled={isProcessing || !editFlag}
            sx={{ mr: 2 }}
          >
            <SaveAsIcon sx={{ mr: 1 }} />
            保存
          </Fab>
        )}
        <Fab color="primary" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
          <ArrowUpwardIcon />
        </Fab>
      </Box>
      <Dialog open={ctnDialogOpen} onClose={() => setCtnDialogOpen(false)}>
        {ctnDialogOpen && (
          <ShukoCtnSelectionDialog
            heads={addableHeads}
            existingKizaiIds={
              new Map(
                addableHeads.map((h) => [
                  h.juchuKizaiHeadId,
                  visibleShukoDetailList
                    .filter((d) => d.juchuKizaiHeadId === h.juchuKizaiHeadId && d.ctnFlg === 1)
                    .map((d) => d.kizaiId),
                ])
              )
            }
            onConfirm={handleAddCtn}
            onClose={() => setCtnDialogOpen(false)}
          />
        )}
      </Dialog>
      <Dialog open={ctnDeleteTarget !== null}>
        <DialogTitle alignContent={'center'} display={'flex'} alignItems={'center'}>
          <WarningIcon color="warning" />
          <Box>コンテナ削除</Box>
        </DialogTitle>
        <DialogContentText m={2} p={2} sx={{ whiteSpace: 'pre-line' }}>
          {`${ctnDeleteTarget?.kizaiNam ?? ''} には読取実績があります。\n保存すると読取実績も削除されます。削除してよろしいですか？`}
        </DialogContentText>
        <DialogActions>
          <Button color="error" onClick={() => ctnDeleteTarget && executeDeleteCtn(ctnDeleteTarget)}>
            削除
          </Button>
          <Button onClick={() => setCtnDeleteTarget(null)}>戻る</Button>
        </DialogActions>
      </Dialog>
      <Dialog open={alertOpen}>
        <DialogTitle alignContent={'center'} display={'flex'} alignItems={'center'}>
          <WarningIcon color="error" />
          <Box>{alertTitle}</Box>
        </DialogTitle>
        <DialogContentText m={2} p={2}>
          {alertMessage}
        </DialogContentText>
        <DialogActions>
          <Button onClick={() => setAlertOpen(false)}>確認</Button>
        </DialogActions>
      </Dialog>
      <Dialog open={departureOpen}>
        <DialogTitle alignContent={'center'} display={'flex'} alignItems={'center'}>
          <WarningIcon color="warning" />
          <Box>出発確認</Box>
        </DialogTitle>
        <DialogContentText m={2} p={2} sx={{ whiteSpace: 'pre-line' }}>
          {fixSts === FIX_STS.partial
            ? '出発済みの明細があります。未出発の明細を出発にします。\n出発済みにしてよろしいですか？'
            : '出発済みにしてよろしいですか？'}
        </DialogContentText>
        <DialogActions>
          <Button onClick={executeDeparture} loading={isProcessing}>
            出発
          </Button>
          <Button onClick={() => setDepartureOpen(false)} loading={isProcessing}>
            戻る
          </Button>
        </DialogActions>
      </Dialog>
      <Dialog open={releaseOpen}>
        <DialogTitle alignContent={'center'} display={'flex'} alignItems={'center'}>
          <WarningIcon color="warning" />
          <Box>出発解除確認</Box>
        </DialogTitle>
        <DialogContentText m={2} p={2}>
          出発解除してよろしいですか？
        </DialogContentText>
        <DialogActions>
          <Button onClick={executeRelease} loading={isProcessing} color="error">
            出発解除
          </Button>
          <Button onClick={() => setReleaseOpen(false)} loading={isProcessing}>
            戻る
          </Button>
        </DialogActions>
      </Dialog>
      <Dialog open={adjustOpen}>
        <DialogTitle alignContent={'center'} display={'flex'} alignItems={'center'}>
          <WarningIcon color="error" />
          <Box>一括補正</Box>
        </DialogTitle>
        <DialogContentText m={2} p={2}>
          一括補正してよろしいでしょうか？
        </DialogContentText>
        <DialogActions>
          <Button onClick={executeAdjust} loading={isProcessing}>
            一括補正
          </Button>
          <Button onClick={() => setAdjustOpen(false)} loading={isProcessing}>
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
