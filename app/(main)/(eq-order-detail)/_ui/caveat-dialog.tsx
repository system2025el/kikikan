'use client';

import WarningIcon from '@mui/icons-material/Warning';
import { Box, Button, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle } from '@mui/material';
import { Fragment, useEffect, useState } from 'react';

export const AlertDialog = ({
  open,
  title,
  message,
  onClick,
}: {
  open: boolean;
  title: string;
  message: string;
  onClick: () => void;
}) => {
  return (
    <Dialog open={open}>
      <DialogTitle alignContent={'center'} display={'flex'} alignItems={'center'}>
        <WarningIcon color="error" />
        <Box>{title}</Box>
      </DialogTitle>
      {/* 複数のエラーを改行で区切って渡せるよう、改行をそのまま表示する。
          件数が多くても見出しと確認ボタンが隠れないよう、メッセージの部分だけをスクロールさせる */}
      <DialogContent sx={{ p: 0 }}>
        <DialogContentText m={2} p={2} sx={{ whiteSpace: 'pre-line' }}>
          {message}
        </DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClick}>確認</Button>
      </DialogActions>
    </Dialog>
  );
};

export const MoveAlertDialog = ({ open, onClick }: { open: boolean; onClick: (result: boolean) => void }) => {
  const [isLoading, setIsLoading] = useState(false);

  const handleClick = (result: boolean) => {
    setIsLoading(true);
    onClick(result);
  };

  useEffect(() => {
    if (open) {
      setIsLoading(false);
    }
  }, [open]);

  return (
    <Dialog open={open}>
      <DialogTitle alignContent={'center'} display={'flex'} alignItems={'center'}>
        <WarningIcon color="error" />
        <Box>出庫日時が更新されました</Box>
      </DialogTitle>
      <DialogContentText m={2} p={2}>
        移動日を更新しますか？
      </DialogContentText>
      <DialogActions>
        <Button onClick={() => handleClick(true)} loading={isLoading}>
          更新
        </Button>
        <Button onClick={() => onClick(false)}>戻る</Button>
      </DialogActions>
    </Dialog>
  );
};

export const DeleteAlertDialog = ({
  selectedLength,
  shukoResultCount = 0,
  open,
  onClick,
}: {
  selectedLength: number;
  /** 削除対象のうち出庫実績・補正数がある機材の件数（ピッキング・最終確認の両方を含む） */
  shukoResultCount?: number;
  open: boolean;
  onClick: (result: boolean) => void;
}) => {
  const [isLoading, setIsLoading] = useState(false);

  const handleClick = (result: boolean) => {
    setIsLoading(true);
    onClick(result);
  };

  useEffect(() => {
    if (open) {
      setIsLoading(false);
    }
  }, [open]);
  return (
    <Dialog open={open} maxWidth="md">
      <DialogTitle alignContent={'center'} display={'flex'} alignItems={'center'}>
        <WarningIcon color="error" />
        <Box>削除</Box>
      </DialogTitle>
      <DialogContentText m={2} p={2}>
        {selectedLength}件の機材を削除してもよろしいでしょうか？
        {shukoResultCount > 0 && (
          <Box component="span" display="block" mt={2} color="error.main">
            うち{shukoResultCount}件は出庫準備中です。
            <br />
            出庫明細に「受注削除」として残りますが、入出庫担当に連絡をしてください。
          </Box>
        )}
      </DialogContentText>
      <DialogActions>
        <Button onClick={() => handleClick(true)} loading={isLoading} color="error">
          削除
        </Button>
        <Button onClick={() => onClick(false)}>戻る</Button>
      </DialogActions>
    </Dialog>
  );
};

/** 出庫作業中に日時を変えたとき、削除される実績の説明（キープ明細） */
const WORKING_DELETE_ITEMS_DEFAULT = ['入庫実績', 'コンテナ実績', '出庫場所が変更された実績'];

/**
 * 出庫作業中に日時を変えたとき、削除される実績の説明（メイン受注機材明細）
 * コンテナの出庫実績は出庫日時を変えても日時だけ更新し、出庫場所をなくした場合だけその場所の分を削除する
 * 出庫場所が変わった機材の出庫実績は削除せず、元の場所に受注削除として残すので含めない
 */
export const WORKING_DELETE_ITEMS_MAIN = ['入庫実績', '出庫場所をなくした場合の、その場所のコンテナ実績'];

/**
 * 保存前の作業中の確認
 * 日時・場所の変更で実績が消える場合（isWorking）と、実績のある明細の数量を変えた場合（planChangedCount）の
 * どちらか、または両方を1つのダイアログで出す
 */
export const WorkingConfirmDialog = ({
  open,
  onClose,
  deleteItems = WORKING_DELETE_ITEMS_DEFAULT,
  isWorking = true,
  planChangedCount = 0,
}: {
  open: boolean;
  onClose: (isConfirmed: boolean) => void;
  /** 削除される実績の説明（画面によって違うため） */
  deleteItems?: string[];
  /** 日時・場所の変更で実績が削除されるか（false なら数量変更の警告だけを出す） */
  isWorking?: boolean;
  /** 数量を変えた明細のうち出庫の実績・補正数がある機材の件数 */
  planChangedCount?: number;
}) => {
  return (
    <Dialog open={open} onClose={() => onClose(false)}>
      <DialogTitle alignContent={'center'} display={'flex'} alignItems={'center'}>
        <WarningIcon color="error" />
        <Box>作業中</Box>
      </DialogTitle>
      <DialogContent>
        <DialogContentText>
          出庫作業が開始されています。
          {isWorking && (
            <>
              <br />
              {deleteItems.map((item) => (
                <Fragment key={item}>
                  ・{item}
                  <br />
                </Fragment>
              ))}
              日時を変更するとこれらの実績は削除されますがよろしいですか？
            </>
          )}
          {planChangedCount > 0 && (
            <Box component="span" display="block" mt={isWorking ? 2 : 0} color="error.main">
              数量を変更した機材のうち{planChangedCount}件は出庫準備中です。
              <br />
              出庫明細の数量が変わりますので、入出庫担当に連絡をしてください。
            </Box>
          )}
        </DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button onClick={() => onClose(true)} color="error" variant="contained" autoFocus>
          {isWorking ? '実績を削除して保存' : '保存'}
        </Button>
        <Button onClick={() => onClose(false)}>戻る</Button>
      </DialogActions>
    </Dialog>
  );
};

/**
 * 分離の前の確認（分離する明細に出庫の実績・補正数があるとき）
 * 一部の分離は元の明細の予定数が減り（出庫明細に数量変更として出る）、全数の分離は元の明細の伝票・実績が削除される
 */
export const SeparationConfirmDialog = ({
  open,
  partialCount,
  allCount,
  onClose,
}: {
  open: boolean;
  /** 一部を分離する明細のうち、実績・補正数がある機材の件数 */
  partialCount: number;
  /** 全数を分離する明細のうち、実績・補正数がある機材の件数 */
  allCount: number;
  onClose: (isConfirmed: boolean) => void;
}) => {
  return (
    <Dialog open={open} onClose={() => onClose(false)}>
      <DialogTitle alignContent={'center'} display={'flex'} alignItems={'center'}>
        <WarningIcon color="error" />
        <Box>作業中</Box>
      </DialogTitle>
      <DialogContent>
        <DialogContentText>
          分離する機材のうち{partialCount + allCount}件は出庫準備中です。
          {partialCount > 0 && (
            <Box component="span" display="block" mt={2} color="error.main">
              一部を分離する{partialCount}件は、分離元の出庫明細の数量が変わります。
            </Box>
          )}
          {allCount > 0 && (
            <Box component="span" display="block" mt={2} color="error.main">
              全数を分離する{allCount}件は、分離元の読取の実績が削除されます。
            </Box>
          )}
          <Box component="span" display="block" mt={2}>
            分離してよろしいですか？入出庫担当に連絡をしてください。
          </Box>
        </DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button onClick={() => onClose(true)} color="error" variant="contained" autoFocus>
          分離
        </Button>
        <Button onClick={() => onClose(false)}>戻る</Button>
      </DialogActions>
    </Dialog>
  );
};
