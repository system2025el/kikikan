'use client';
import Delete from '@mui/icons-material/Delete';
import {
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

import { IdoDetailTableValues } from '../_lib/types';

export const ShukoIdoDenTable = (props: {
  datas: IdoDetailTableValues[];
  handleCellChange: (kizaiId: number, planQty: number) => void;
  handleIdoDenDelete: (kizaiId: number) => void;
  fixFlag: boolean;
}) => {
  const { datas, handleCellChange, handleIdoDenDelete, fixFlag } = props;

  const router = useRouter();
  const path = usePathname();

  /**
   * 機材名押下時
   * @param kizaiId 機材id
   */
  const handleClick = (kizaiId: number) => {
    router.push(`${path}/ido-eqpt-detail/${kizaiId}`);
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
                    row.planQty === 0 && !row.ctnFlg
                      ? 'white'
                      : row.diffQty === 0 && !row.ctnFlg
                        ? 'rgba(158, 158, 158, 1)'
                        : row.ctnFlg
                          ? 'rgba(68, 138, 255, 1)'
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
                    disabled={fixFlag}
                  >
                    <Delete fontSize="small" />
                  </IconButton>
                </TableCell>
                <TableCell padding="checkbox">{index + 1}</TableCell>
                <TableCell
                  align="left"
                  onClick={row.saveFlag ? () => handleClick(row.kizaiId) : undefined}
                  sx={{ cursor: 'pointer', '&:hover': { backgroundColor: 'rgba(0,0,0,0.04)' } }}
                >
                  {row.kizaiNam}
                </TableCell>
                <TableCell align="left">{row.shozokuId === 1 ? 'K' : 'Y'}</TableCell>
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
                    disabled={fixFlag}
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
                  />
                </TableCell>
                <TableCell align="right">{row.resultQty}</TableCell>
                <TableCell align="right">{row.resultAdjQty}</TableCell>
                <TableCell
                  align="right"
                  sx={{
                    backgroundColor:
                      row.planQty === 0 && !row.ctnFlg
                        ? 'white'
                        : row.diffQty > 0
                          ? 'rgba(255, 255, 0, 1)'
                          : row.diffQty < 0
                            ? 'rgba(255, 171, 64, 1)'
                            : row.diffQty === 0 && row.ctnFlg
                              ? 'rgba(68, 138, 255, 1)'
                              : 'rgba(158, 158, 158, 1)',
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
                  row.planQty === 0 && !row.ctnFlg
                    ? 'white'
                    : row.diffQty === 0 && !row.ctnFlg
                      ? 'rgba(158, 158, 158, 1)'
                      : row.ctnFlg
                        ? 'rgba(68, 138, 255, 1)'
                        : 'white',
              }}
            >
              <TableCell padding="checkbox">{index + 1}</TableCell>
              <TableCell
                align="left"
                onClick={row.saveFlag ? () => handleClick(row.kizaiId) : undefined}
                sx={{ cursor: 'pointer', '&:hover': { backgroundColor: 'rgba(0,0,0,0.04)' } }}
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
                    row.planQty === 0 && !row.ctnFlg
                      ? 'white'
                      : row.diffQty > 0
                        ? 'rgba(255, 255, 0, 1)'
                        : row.diffQty < 0
                          ? 'rgba(255, 171, 64, 1)'
                          : row.diffQty === 0 && row.ctnFlg
                            ? 'rgba(68, 138, 255, 1)'
                            : 'rgba(158, 158, 158, 1)',
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
