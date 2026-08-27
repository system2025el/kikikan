'use client';
import DeleteIcon from '@mui/icons-material/Delete';
import DownloadIcon from '@mui/icons-material/Download';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Snackbar,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';
import { useCallback, useEffect, useState } from 'react';

import { JUCHU_TEMPU } from '@/app/_lib/constants';
import { createClient } from '@/app/_lib/db/supabase-client';
import { toJapanTimeString } from '@/app/(main)/_lib/date-conversion';
import { WillDeleteAlertDialog } from '@/app/(main)/(masters)/_ui/dialogs';
import { LightTooltipWithText } from '@/app/(main)/(masters)/_ui/tables';

import {
  addJuchuTempu,
  delJuchuTempu,
  getJuchuTempuList,
  getJuchuTempuUploadTicket,
  getJuchuTempuViewUrl,
} from '../_lib/tempu-funcs';
import { TempuValues } from '../_lib/types';

/** ファイル選択inputのid */
const FILE_INPUT_ID = 'juchu-tempu-file';

/** バイト数を表示用に整形する */
const formatSize = (size: number) => {
  if (size >= 1024 * 1024) return `${(size / 1024 / 1024).toFixed(1)} MB`;
  if (size >= 1024) return `${Math.ceil(size / 1024)} KB`;
  return `${size} B`;
};

/** PDFの実体かどうかを先頭4バイトで確かめる（拡張子とMIMEは詐称できるため） */
const isPdfContent = async (file: File) => {
  try {
    const head = new Uint8Array(await file.slice(0, 4).arrayBuffer());
    return String.fromCharCode(...head) === '%PDF';
  } catch {
    return false;
  }
};

/**
 * 受注添付ファイルダイアログ
 * @param param0
 * @returns 受注添付ファイルダイアログコンポーネント
 */
export const TempuDialog = ({
  open,
  juchuHeadId,
  canUpdate,
  tempuList,
  onChange,
  onClose,
}: {
  open: boolean;
  juchuHeadId: number;
  canUpdate: boolean;
  tempuList: TempuValues[];
  onChange: (list: TempuValues[]) => void;
  onClose: () => void;
}) => {
  /** 処理中 */
  const [push, setPush] = useState(false);
  /** アップロードの進捗文言 */
  const [progress, setProgress] = useState('');
  /** 削除確認ダイアログ */
  const [deleteTarget, setDeleteTarget] = useState<TempuValues | null>(null);
  /** スナックバー */
  const [snackBarOpen, setSnackBarOpen] = useState(false);
  const [snackBarMessage, setSnackBarMessage] = useState('');

  const showMessage = useCallback((message: string) => {
    setSnackBarMessage(message);
    setSnackBarOpen(true);
  }, []);

  // 排他ロックを取らないため、他のユーザーの追加・削除を拾えるよう開くたびに取り直す
  useEffect(() => {
    if (!open || !juchuHeadId) return;

    const reload = async () => {
      try {
        onChange(await getJuchuTempuList(juchuHeadId));
      } catch {
        showMessage('添付ファイルの取得に失敗しました。');
      }
    };
    reload();
    // onChange は親のsetStateなので依存に入れない
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, juchuHeadId, showMessage]);

  /**
   * ファイル選択
   * 選んだファイルを1件ずつ順にアップロードする。
   * 途中で失敗しても成功した分は残す（部分成功を許容する）。
   */
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? []);
    // 同じファイルを選び直せるようにリセットする
    event.target.value = '';

    // キャンセルは正常な操作なので何も出さない
    if (!files.length) return;

    // 選択した時点で全ファイルをまとめて検証する（途中で上限に達するのを避ける）
    if (tempuList.length + files.length > JUCHU_TEMPU.maxCount) {
      showMessage(`添付できるのは${JUCHU_TEMPU.maxCount}件までです。`);
      return;
    }
    const invalid = files.filter((f) => !f.name.toLowerCase().endsWith('.pdf'));
    if (invalid.length) {
      showMessage(`PDFファイルを選択してください。（${invalid.map((f) => f.name).join(', ')}）`);
      return;
    }
    const tooLarge = files.filter((f) => f.size > JUCHU_TEMPU.maxSize);
    if (tooLarge.length) {
      showMessage(
        `ファイルサイズが${JUCHU_TEMPU.maxSize / 1024 / 1024}MBを超えています。（${tooLarge
          .map((f) => f.name)
          .join(', ')}）`
      );
      return;
    }
    const empty = files.filter((f) => !f.size);
    if (empty.length) {
      showMessage(`空のファイルはアップロードできません。（${empty.map((f) => f.name).join(', ')}）`);
      return;
    }
    for (const file of files) {
      if (!(await isPdfContent(file))) {
        showMessage(`PDFファイルではありません。（${file.name}）`);
        return;
      }
    }

    setPush(true);
    const supabase = createClient();
    const failed: string[] = [];

    try {
      for (const [index, file] of files.entries()) {
        setProgress(files.length > 1 ? `${files.length}件中${index + 1}件` : '');

        const ticket = await getJuchuTempuUploadTicket(juchuHeadId, file.name, file.size);
        if ('error' in ticket) {
          showMessage(ticket.error);
          failed.push(file.name);
          continue;
        }

        // Vercelを経由せずSupabaseへ直接送る（Server Actionsのボディ上限を受けない）
        const { error } = await supabase.storage
          .from(JUCHU_TEMPU.bucket)
          .uploadToSignedUrl(ticket.objectPat, ticket.token, file, { contentType: 'application/pdf' });
        if (error) {
          failed.push(file.name);
          continue;
        }

        onChange(await addJuchuTempu(juchuHeadId, ticket.objectPat, file.name, file.size));
      }

      if (failed.length) {
        showMessage(`${failed.length}件のアップロードに失敗しました。（${failed.join(', ')}）`);
      } else {
        showMessage(`${files.length}件アップロードしました。`);
      }
    } catch {
      showMessage('アップロードに失敗しました。');
    } finally {
      setProgress('');
      setPush(false);
    }
  };

  /** 開けなかったときの後始末。他のユーザーが削除している可能性があるので一覧を取り直す */
  const handleOpenFailure = async () => {
    showMessage('ファイルを開けませんでした。削除された可能性があります。');
    try {
      onChange(await getJuchuTempuList(juchuHeadId));
    } catch {
      // 一覧の取り直しに失敗しても、開けなかったことは既に通知済み
    }
  };

  /**
   * 別タブで開く
   * @param row 添付ファイル
   */
  const handleOpen = async (row: TempuValues) => {
    // awaitのあとにwindow.openを呼ぶとポップアップブロックの対象になるため、先に空タブを確保する
    const target = window.open('', '_blank');
    try {
      const url = await getJuchuTempuViewUrl(row.juchuTempuId);
      if (!url) {
        throw new Error('URLの取得に失敗しました');
      }

      if (target) {
        target.location.href = url;
      } else {
        window.open(url, '_blank', 'noopener');
      }
    } catch {
      target?.close();
      await handleOpenFailure();
    }
  };

  /**
   * ダウンロードする
   *
   * 署名付きURLに download を付けるとStorage側がファイル名を二重にURLエンコードし、
   * 日本語名が壊れる。そのため一度blobとして取得し、原本のファイル名で保存させる。
   * @param row 添付ファイル
   */
  const handleDownload = async (row: TempuValues) => {
    let objectUrl = '';
    try {
      const url = await getJuchuTempuViewUrl(row.juchuTempuId);
      if (!url) {
        throw new Error('URLの取得に失敗しました');
      }

      const res = await fetch(url);
      if (!res.ok) {
        throw new Error(`ダウンロードに失敗しました（${res.status}）`);
      }

      objectUrl = URL.createObjectURL(await res.blob());
      const anchor = document.createElement('a');
      anchor.href = objectUrl;
      anchor.download = row.fileNam;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
    } catch {
      await handleOpenFailure();
    } finally {
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    }
  };

  /** 削除確定 */
  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;

    setPush(true);
    try {
      onChange(await delJuchuTempu(deleteTarget.juchuTempuId));
      setDeleteTarget(null);
      showMessage('削除しました。');
    } catch {
      showMessage('削除に失敗しました。');
    } finally {
      setPush(false);
    }
  };

  return (
    <>
      <Dialog open={open} maxWidth="md" fullWidth>
        <DialogTitle>添付ファイル</DialogTitle>
        <DialogContent>
          <Box display={'flex'} alignItems={'center'} gap={2} mb={1}>
            <input
              accept="application/pdf,.pdf"
              id={FILE_INPUT_ID}
              type="file"
              multiple
              style={{ display: 'none' }}
              disabled={!canUpdate || push}
              onChange={handleFileUpload}
            />
            <label htmlFor={FILE_INPUT_ID}>
              <Button component="span" disabled={!canUpdate || push} loading={push}>
                PDFファイルを選択
              </Button>
            </label>
            <Typography variant="body2">
              {progress ? `${progress}アップロード中…` : `${tempuList.length} / ${JUCHU_TEMPU.maxCount}件`}
            </Typography>
          </Box>
          <TableContainer sx={{ maxHeight: '50vh' }}>
            <Table stickyHeader size="small" padding="none">
              <TableHead>
                <TableRow>
                  <TableCell>ファイル名</TableCell>
                  <TableCell align="right">サイズ</TableCell>
                  <TableCell>登録日時</TableCell>
                  <TableCell>登録者</TableCell>
                  <TableCell align="center">操作</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {tempuList.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5}>
                      <Typography variant="body2" p={1}>
                        添付ファイルはありません。
                      </Typography>
                    </TableCell>
                  </TableRow>
                )}
                {tempuList.map((row) => (
                  <TableRow key={row.juchuTempuId} hover>
                    <TableCell>
                      <LightTooltipWithText variant="body2" maxWidth={360}>
                        {row.fileNam}
                      </LightTooltipWithText>
                    </TableCell>
                    <TableCell align="right">{formatSize(row.fileSiz)}</TableCell>
                    <TableCell>{row.addDat ? toJapanTimeString(row.addDat) : ''}</TableCell>
                    <TableCell>{row.addUser}</TableCell>
                    <TableCell align="center">
                      <IconButton size="small" title="別タブで開く" onClick={() => handleOpen(row)}>
                        <OpenInNewIcon fontSize="small" />
                      </IconButton>
                      <IconButton size="small" title="ダウンロード" onClick={() => handleDownload(row)}>
                        <DownloadIcon fontSize="small" />
                      </IconButton>
                      <IconButton
                        size="small"
                        color="error"
                        title="削除"
                        disabled={!canUpdate || push}
                        onClick={() => setDeleteTarget(row)}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose} disabled={push}>
            閉じる
          </Button>
        </DialogActions>
      </Dialog>
      <WillDeleteAlertDialog
        open={!!deleteTarget}
        data={deleteTarget?.fileNam ?? ''}
        title="削除"
        push={push}
        handleCloseDelete={() => setDeleteTarget(null)}
        handleConfirmDelete={handleConfirmDelete}
      />
      <Snackbar
        open={snackBarOpen}
        autoHideDuration={6000}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
        sx={{ marginTop: '65px', zIndex: (theme) => theme.zIndex.modal + 1 }}
        message={snackBarMessage}
        onClose={() => setSnackBarOpen(false)}
      />
    </>
  );
};
