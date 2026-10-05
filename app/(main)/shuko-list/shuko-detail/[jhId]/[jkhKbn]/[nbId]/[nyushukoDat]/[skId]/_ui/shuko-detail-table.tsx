'use client';

import DeleteIcon from '@mui/icons-material/Delete';
import {
  Box,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from '@mui/material';
import { grey, lightBlue } from '@mui/material/colors';
import { usePathname, useRouter } from 'next/navigation';
import { Dispatch, SetStateAction, useState } from 'react';

import { JUCHU_KIZAI_HEAD_KBN, SAGYO_KBN_ID } from '@/app/_lib/constants';
import { dispColors, sagyoKbnColors, statusColors } from '@/app/(main)/_lib/colors';
import { User } from '@/app/(main)/_lib/types';

import { ShukoDetailTableValues } from '../_lib/types';

/** コンテナのメモの最大文字数（K と Y のメモを改行でつないでも受注コンテナ明細の表示列 200 文字に収まるように） */
export const CTN_MEMO_MAX_LENGTH = 99;

/** 出庫予定数の入力欄の、枠から中の数値までの幅（枠線 1px + 入力の余白 4px） */
const PLAN_QTY_INPUT_INSET = 5;

/**
 * 出庫明細の行キー（未保存のコンテナは明細idが0なので、受注機材ヘッダー・機材と合わせて一意にする）
 * @param row 出庫明細の行
 * @returns
 */
export const toShukoRowKey = (row: ShukoDetailTableValues) =>
  `${row.juchuKizaiHeadId}-${row.juchuKizaiMeisaiId}-${row.kizaiId}`;

export const ShukoDetailTable = (props: {
  datas: ShukoDetailTableValues[];
  fixFlag: boolean;
  user: User | null;
  setAdjustOpen: Dispatch<SetStateAction<boolean>>;
  sagyoKbnId: number;
  /** コンテナを編集できるか（最終確認・キープ以外・更新権限あり） */
  ctnEditable: boolean;
  /** 出発済みの受注機材ヘッダーid（その行のコンテナは予定数・削除を変更できない。メモは変更できる） */
  fixedJuchuKizaiHeadIds: number[];
  onPlanQtyChange: (row: ShukoDetailTableValues, planQty: number | null) => void;
  onMemChange: (row: ShukoDetailTableValues, mem: string) => void;
  onDelete: (row: ShukoDetailTableValues) => void;
}) => {
  const { datas, sagyoKbnId, ctnEditable, fixedJuchuKizaiHeadIds, onPlanQtyChange, onMemChange, onDelete } = props;

  const router = useRouter();
  const path = usePathname();

  // 処理中制御
  const [isProcessing, setIsProcessing] = useState(false);

  const handleClick = (row: ShukoDetailTableValues) => {
    // 未保存のコンテナには読取の詳細が無い
    if (!row.saveFlag) return;
    if (row.juchuKizaiHeadId && row.juchuKizaiMeisaiId && row.kizaiId && !isProcessing) {
      setIsProcessing(true);
      router.push(`${path}/shuko-eqpt-detail/${row.juchuKizaiHeadId}/${row.juchuKizaiMeisaiId}/${row.kizaiId}`);
    }
  };

  return (
    <TableContainer sx={{ overflow: 'auto', maxHeight: '80vh', maxWidth: '70vw' }}>
      <Table stickyHeader size="small">
        <TableHead
          sx={{
            '& .MuiTableCell-stickyHeader': {
              backgroundColor:
                sagyoKbnId === SAGYO_KBN_ID.shukoConfirmation
                  ? sagyoKbnColors.shukoConfirmation
                  : sagyoKbnColors.shukoPicking,
              color: sagyoKbnId === SAGYO_KBN_ID.shukoConfirmation ? 'black' : 'white',
            },
          }}
        >
          <TableRow sx={{ whiteSpace: 'nowrap' }}>
            {ctnEditable && <TableCell align="center" padding="checkbox" />}
            <TableCell align="center" />
            <TableCell align="left">機材名</TableCell>
            <TableCell
              align="right"
              sx={{
                borderLeft: '1px solid',
                borderLeftColor: grey[500],
              }}
            >
              出庫予定数
            </TableCell>
            {datas[0].juchuKizaiHeadKbn !== JUCHU_KIZAI_HEAD_KBN.keep && (
              <>
                <TableCell align="right">受注数</TableCell>
                <TableCell align="right">予備数</TableCell>
              </>
            )}
            <TableCell
              align="right"
              sx={{
                borderLeft: '1px solid',
                borderLeftColor: grey[500],
              }}
            >
              読取数
            </TableCell>
            <TableCell align="right">補正数</TableCell>
            <TableCell align="right" sx={{ pr: 1, borderLeft: '1px solid', borderLeftColor: grey[500] }}>
              差異
            </TableCell>
            <TableCell
              align="left"
              sx={{
                borderLeft: '1px solid',
                borderLeftColor: grey[500],
              }}
            >
              連絡メモ
            </TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {datas.map((row, index) => {
            const isCtn = row.ctnFlg === 1;
            // コンテナの予定数・削除は、未出発のヘッダーの行だけ
            const ctnQtyEditable = ctnEditable && isCtn && !fixedJuchuKizaiHeadIds.includes(row.juchuKizaiHeadId);
            // コンテナのメモは出発後も編集できる
            const ctnMemEditable = ctnEditable && isCtn;
            return (
              <TableRow
                key={toShukoRowKey(row)}
                sx={{
                  whiteSpace: 'nowrap',
                  // 未保存を最優先（予定数0・読取0だと差異0で「済」になってしまうため。移動明細と同じ順番）
                  // 次に受注から削除された行を、通常の過剰と区別して強調する
                  backgroundColor: !row.saveFlag
                    ? statusColors.unsaved
                    : row.juchuMeisaiDelFlg === 1
                      ? statusColors.deleted
                      : row.diff === 0 /*&& row.planQty !== 0 && row.ctnFlg !== 1*/
                        ? statusColors.completed
                        : isCtn
                          ? statusColors.ctn
                          : 'white',
                }}
              >
                {ctnEditable && (
                  <TableCell align="center" padding="checkbox">
                    {ctnQtyEditable && (
                      <IconButton size="small" color="error" onClick={() => onDelete(row)}>
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    )}
                  </TableCell>
                )}
                <TableCell padding="checkbox">{index + 1}</TableCell>
                <TableCell
                  align="left"
                  onClick={() => handleClick(row)}
                  sx={{
                    cursor: row.saveFlag ? 'pointer' : 'default',
                    '&:hover': { backgroundColor: dispColors.hover },
                  }}
                >
                  {row.kizaiNam}
                  {row.juchuMeisaiDelFlg === 1 && (
                    <Typography
                      component="span"
                      sx={{ ml: 1, color: dispColors.return, fontWeight: 'bold', fontSize: 'inherit' }}
                    >
                      受注削除
                    </Typography>
                  )}
                </TableCell>
                <TableCell
                  align="right"
                  sx={{
                    // 未保存の行は差異の色を付けない（未保存の色とほぼ同じ水色で見分けがつかないため）
                    backgroundColor: row.diff !== 0 && row.saveFlag ? lightBlue[100] : 'inherit',
                    borderLeft: '1px solid',
                    borderLeftColor: grey[500],
                  }}
                >
                  {ctnQtyEditable ? (
                    // 移動明細の移動数の入力欄と同じ形
                    <TextField
                      type="text"
                      value={row.planQty ?? ''}
                      onChange={(e) => {
                        // 0以上の整数だけ（空欄は保存時に弾く）
                        if (/^\d*$/.test(e.target.value)) {
                          onPlanQtyChange(row, e.target.value === '' ? null : Number(e.target.value));
                        }
                      }}
                      onFocus={(e) => e.target.select()}
                      error={row.planQty === null}
                      sx={{
                        width: 50,
                        '& .MuiInputBase-input': {
                          textAlign: 'right',
                          p: 0.5,
                        },
                      }}
                      slotProps={{
                        input: {
                          style: { textAlign: 'right' },
                          inputMode: 'numeric',
                        },
                      }}
                    />
                  ) : ctnEditable ? (
                    // 入力欄がある画面では、入力欄の無い行の数値を入力欄の中の数値と同じ位置にそろえる
                    // （セルの余白はテーマで決まるので上書きせず、数値の右に入力欄の内側の幅だけ足す）
                    <Box component="span" sx={{ pr: `${PLAN_QTY_INPUT_INSET}px` }}>
                      {row.planQty}
                    </Box>
                  ) : (
                    row.planQty
                  )}
                </TableCell>
                {datas[0].juchuKizaiHeadKbn !== JUCHU_KIZAI_HEAD_KBN.keep && (
                  <>
                    <TableCell align="right">{row.planKizaiQty}</TableCell>
                    <TableCell align="right">{row.planYobiQty}</TableCell>
                  </>
                )}
                <TableCell
                  align="right"
                  sx={{
                    borderLeft: '1px solid',
                    borderLeftColor: grey[500],
                  }}
                >
                  {row.resultQty}
                </TableCell>
                <TableCell align="right">{row.resultAdjQty}</TableCell>
                <TableCell
                  align="right"
                  sx={{
                    pr: 1,
                    backgroundColor:
                      row.diff === 0 /*&& row.planQty !== 0*/
                        ? statusColors.completed
                        : row.diff > 0
                          ? statusColors.excess
                          : row.diff < 0
                            ? statusColors.lack
                            : isCtn
                              ? statusColors.ctn
                              : undefined,
                    borderLeft: '1px solid',
                    borderLeftColor: grey[500],
                  }}
                >
                  {row.diff}
                </TableCell>
                <TableCell
                  align="left"
                  sx={{ whiteSpace: 'pre-wrap', borderLeft: '1px solid', borderLeftColor: grey[500] }}
                >
                  {ctnMemEditable ? (
                    <TextField
                      variant="standard"
                      fullWidth
                      multiline
                      value={row.mem2 ?? ''}
                      onChange={(e) => onMemChange(row, e.target.value)}
                      slotProps={{ htmlInput: { maxLength: CTN_MEMO_MAX_LENGTH } }}
                      sx={{ minWidth: 200 }}
                    />
                  ) : (
                    row.mem2
                  )}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </TableContainer>
  );
};
