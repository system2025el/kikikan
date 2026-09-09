'use client';
import Delete from '@mui/icons-material/Delete';
import EventNoteIcon from '@mui/icons-material/EventNote';
import {
  Box,
  Button,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
} from '@mui/material';
import { purple } from '@mui/material/colors';
import { usePathname, useRouter } from 'next/navigation';
import { memo, useState } from 'react';

import { BASHO_ID } from '@/app/_lib/constants';
import { dispColors, statusColors } from '@/app/(main)/_lib/colors';
import { permission } from '@/app/(main)/_lib/permission';
import { openOrFocusTab } from '@/app/(main)/_lib/tab-focus';
import { User } from '@/app/(main)/_lib/types';
import { useDirty } from '@/app/(main)/_ui/dirty-context';
import { LightTooltipWithText } from '@/app/(main)/(masters)/_ui/tables';

import { IdoDetailTableValues } from '../_lib/types';

/**
 * 移動出庫の明細テーブル
 *
 * 最大130行 × 1行あたり18個のMUIコンポーネントを持つため、親（移動メモの入力など）の
 * 再レンダリングを拾うと目に見えて重くなる。memo で包んでいるので、
 * 呼び出し側は handleCellChange / handleIdoDenDelete を useCallback で固定すること。
 */
export const ShukoIdoDenTable = memo(function ShukoIdoDenTable(props: {
  user: User;
  datas: IdoDetailTableValues[];
  handleCellChange: (kizaiId: number, planQty: number) => void;
  handleIdoDenDelete: (kizaiId: number) => void;
  fixFlag: boolean;
  /** 保存などの通信中。ローディングで覆っていてもフォーカス中の入力欄はキー入力を拾うため disabled にする */
  isSaving: boolean;
}) {
  const { user, datas, handleCellChange, handleIdoDenDelete, fixFlag, isSaving } = props;

  // 移動数の入力・行削除の可否
  const inputDisabled = fixFlag || isSaving || user.permission.nyushuko === permission.nyushuko_ref;

  const router = useRouter();
  const path = usePathname();

  // 処理中制御
  const [isProcessing, setIsProcessing] = useState(false);

  // context
  const { requestNavigation } = useDirty();

  /**
   * 機材名押下時
   * @param kizaiId 機材id
   */
  const handleClick = (kizaiId: number) => {
    if (isProcessing) return;

    setIsProcessing(true);
    requestNavigation(`${path}/ido-eqpt-detail/${kizaiId}`);
  };

  return (
    <TableContainer sx={{ overflow: 'auto', maxHeight: '80vh' }}>
      <Table stickyHeader size="small">
        <TableHead>
          <TableRow sx={{ whiteSpace: 'nowrap' }}>
            <TableCell align="center" style={styles.header} />
            <TableCell align="center" style={styles.header} />
            <TableCell align="left" style={styles.header}>
              機材名
            </TableCell>
            <TableCell align="left" style={styles.header}>
              公演名
            </TableCell>
            <TableCell align="left" style={styles.header}>
              明細名
            </TableCell>
            <TableCell align="right" style={styles.header}>
              予定内訳
            </TableCell>
            <TableCell align="center" style={styles.header}>
              貸出状況
            </TableCell>
            <TableCell align="left" style={styles.header}>
              在庫場所
            </TableCell>
            <TableCell align="right" style={styles.header}>
              Y在庫数
            </TableCell>
            <TableCell align="right" style={styles.header}>
              K在庫数
            </TableCell>
            <TableCell align="right" style={styles.header}>
              移動予定数
            </TableCell>
            <TableCell align="right" style={styles.header}>
              最低数
            </TableCell>
            <TableCell align="right" style={styles.header}>
              移動数
            </TableCell>
            <TableCell align="right" style={styles.header}>
              読取数
            </TableCell>
            <TableCell align="right" style={styles.header}>
              補正数
            </TableCell>
            <TableCell align="right" style={styles.header}>
              差異
            </TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {datas
            .filter((d) => !d.delFlag)
            .map((row, index) => (
              <TableRow
                key={index}
                sx={{
                  whiteSpace: 'nowrap',
                  backgroundColor:
                    row.diffQty === 0 /*&& row.planQty !== 0*/
                      ? statusColors.completed
                      : row.ctnFlg
                        ? statusColors.ctn
                        : 'white',
                }}
              >
                <TableCell padding="checkbox">
                  <IconButton
                    onClick={(e) => {
                      handleIdoDenDelete(row.kizaiId);
                    }}
                    sx={{
                      display: row.juchuFlg === 0 ? 'inline-block' : 'none',
                      color: 'red',
                    }}
                    disabled={inputDisabled}
                  >
                    <Delete fontSize="small" />
                  </IconButton>
                </TableCell>
                <TableCell padding="checkbox">{index + 1}</TableCell>
                <TableCell
                  align="left"
                  onClick={row.saveFlag ? () => handleClick(row.kizaiId) : undefined}
                  sx={{
                    cursor: row.saveFlag ? 'pointer' : 'text',
                    '&:hover': { backgroundColor: row.saveFlag ? dispColors.hover : dispColors.main },
                  }}
                >
                  {row.kizaiNam}
                </TableCell>
                {/* 受注内訳。1機材に複数の受注明細が紐づく場合は縦に積む。
                    公演名・明細名・予定内訳の3列は1行ずつ対応するので、行の高さを揃えて横に読めるようにしている。
                    並びは移動予定数の降順（ビュー側でソート済み）。予定内訳の合計は移動予定数と一致する */}
                <TableCell align="left">
                  {row.juchuMeisai.map((meisai) => (
                    <Box key={`${meisai.juchuHeadId}-${meisai.juchuKizaiHeadId}`} sx={styles.meisaiLine}>
                      <LightTooltipWithText variant="body2" maxWidth={220}>
                        {meisai.koenNam}
                      </LightTooltipWithText>
                    </Box>
                  ))}
                </TableCell>
                <TableCell align="left">
                  {row.juchuMeisai.map((meisai) => (
                    <Box key={`${meisai.juchuHeadId}-${meisai.juchuKizaiHeadId}`} sx={styles.meisaiLine}>
                      <LightTooltipWithText variant="body2" maxWidth={220}>
                        {meisai.headNam}
                      </LightTooltipWithText>
                    </Box>
                  ))}
                </TableCell>
                <TableCell align="right">
                  {row.juchuMeisai.map((meisai) => (
                    <Box key={`${meisai.juchuHeadId}-${meisai.juchuKizaiHeadId}`} sx={styles.meisaiLine}>
                      {meisai.planQty}
                    </Box>
                  ))}
                </TableCell>
                <TableCell padding="checkbox" align="center">
                  <IconButton
                    onClick={() =>
                      openOrFocusTab(`/loan-situation/${row.kizaiId}?date=${row.nyushukoDat ? row.nyushukoDat : ''}`)
                    }
                  >
                    <EventNoteIcon />
                  </IconButton>
                </TableCell>
                <TableCell align="left">{row.shozokuId === BASHO_ID.kics ? 'K' : 'Y'}</TableCell>
                <TableCell align="right">{row.rfidYardQty}</TableCell>
                <TableCell align="right">{row.rfidKicsQty}</TableCell>
                <TableCell align="right">{row.planJuchuQty}</TableCell>
                <TableCell align="right">{row.planLowQty}</TableCell>
                <TableCell align="right" size="small">
                  <TextField
                    type="text"
                    value={row.planQty}
                    onChange={(e) => {
                      if (/^\d*$/.test(e.target.value)) {
                        handleCellChange(row.kizaiId, Number(e.target.value));
                      }
                    }}
                    disabled={inputDisabled}
                    sx={{
                      width: 50,
                      '& .MuiInputBase-input': {
                        textAlign: 'right',
                        p: 0.5,
                      },
                      '& input[type=number]::-webkit-inner-spin-button': {
                        WebkitAppearance: 'none',
                        margin: 0,
                      },
                    }}
                    slotProps={{
                      input: {
                        style: { textAlign: 'right' },
                        inputMode: 'numeric',
                      },
                    }}
                    onFocus={(e) => e.target.select()}
                  />
                </TableCell>
                <TableCell align="right">{row.resultQty}</TableCell>
                <TableCell align="right">{row.resultAdjQty}</TableCell>
                <TableCell
                  align="right"
                  sx={{
                    backgroundColor:
                      row.diffQty === 0 /*&& row.planQty !== 0*/
                        ? statusColors.completed
                        : row.diffQty > 0
                          ? statusColors.excess
                          : row.diffQty < 0
                            ? statusColors.lack
                            : row.ctnFlg
                              ? statusColors.ctn
                              : undefined,
                  }}
                >
                  {row.diffQty}
                </TableCell>
              </TableRow>
            ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
});

export const NyukoIdoDenTable = (props: { datas: IdoDetailTableValues[] }) => {
  const { datas } = props;

  const router = useRouter();
  const path = usePathname();

  const handleClick = (kizaiId: number) => {
    router.push(`${path}/ido-eqpt-detail/${kizaiId}`);
  };
  return (
    <TableContainer sx={{ overflow: 'auto', maxHeight: '80vh', maxWidth: '60vw' }}>
      <Table stickyHeader size="small">
        <TableHead>
          <TableRow sx={{ whiteSpace: 'nowrap' }}>
            <TableCell align="center" style={styles.header} />
            <TableCell align="left" style={styles.header}>
              機材名
            </TableCell>
            <TableCell align="right" style={styles.header}>
              入庫予定数
            </TableCell>
            <TableCell align="right" style={styles.header}>
              読取数
            </TableCell>
            <TableCell align="right" style={styles.header}>
              補正数
            </TableCell>
            <TableCell align="right" style={styles.header}>
              差異
            </TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {datas.map((row, index) => (
            <TableRow
              key={index}
              sx={{
                whiteSpace: 'nowrap',
                backgroundColor:
                  row.diffQty === 0 && row.planQty !== 0 //&& row.ctnFlg !== 1
                    ? statusColors.completed
                    : row.diffQty === 1
                      ? statusColors.ctn
                      : 'white',
              }}
            >
              <TableCell padding="checkbox">{index + 1}</TableCell>
              <TableCell
                align="left"
                onClick={row.saveFlag ? () => handleClick(row.kizaiId) : undefined}
                sx={{
                  cursor: row.saveFlag ? 'pointer' : 'text',
                  '&:hover': { backgroundColor: row.saveFlag ? dispColors.hover : dispColors.main },
                }}
              >
                {row.kizaiNam}
              </TableCell>
              <TableCell align="right">{row.planQty}</TableCell>
              <TableCell align="right">{row.resultQty}</TableCell>
              <TableCell align="right">{row.resultAdjQty}</TableCell>
              <TableCell
                align="right"
                sx={{
                  backgroundColor:
                    row.diffQty === 0 && row.planQty !== 0
                      ? statusColors.completed
                      : row.diffQty > 0
                        ? statusColors.excess
                        : row.diffQty < 0
                          ? statusColors.lack
                          : row.ctnFlg
                            ? statusColors.ctn
                            : undefined,
                }}
              >
                {row.diffQty}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

/* style
---------------------------------------------------------------------------------------------------- */
/** @type {{ [key: string]: React.CSSProperties }} style */
const styles: { [key: string]: React.CSSProperties } = {
  // ヘッダー
  header: {
    backgroundColor: purple[400],
  },
  // 受注内訳の1行。公演名・明細名・予定内訳の3列で高さを揃えて横に読めるようにする
  meisaiLine: {
    height: '20px',
    lineHeight: '20px',
    fontSize: '0.875rem',
  },
  // 行
  row: {
    border: '1px solid black',
    whiteSpace: 'nowrap',
    height: '26px',
    paddingTop: 0,
    paddingBottom: 0,
    paddingLeft: 1,
    paddingRight: 1,
  },
};
