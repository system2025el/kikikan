'use client';

import {
  Button,
  Checkbox,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';
import { useRouter } from 'next/navigation';
import { Dispatch, SetStateAction, useState } from 'react';

import { dispColors } from '../../_lib/colors';
import { toJapanTimeString } from '../../_lib/date-conversion';
import { NyukoTableValues } from '../_lib/types';

export const NyukoListTable = (props: {
  datas: NyukoTableValues[];
  onSelectionChange: Dispatch<SetStateAction<number[]>>;
}) => {
  const { datas, onSelectionChange } = props;

  const router = useRouter();

  // 処理中制御
  const [isProcessing, setIsProcessing] = useState(false);

  const [selected, setSelected] = useState<number[]>([]);

  const handleSelect = (index: number) => {
    const newSelected = selected.includes(index) ? selected.filter((item) => item !== index) : [...selected, index];

    setSelected(newSelected);
    onSelectionChange(newSelected);
  };

  const handleClickRow = (row: NyukoTableValues) => {
    if (isProcessing) return;

    setIsProcessing(true);
    router.push(
      `nyuko-list/nyuko-detail/${row.juchuHeadId}/${row.juchuKizaiHeadKbn}/${row.nyushukoBashoId}/${new Date(row.nyushukoDat).toISOString()}/30`
    );
  };

  return (
    <TableContainer sx={{ overflow: 'auto', maxHeight: '80vh' }}>
      <Table stickyHeader size="small">
        <TableHead>
          <TableRow sx={{ whiteSpace: 'nowrap' }}>
            <TableCell padding="checkbox">
              <Checkbox
                color="primary"
                onChange={(e) => {
                  const newSelected = e.target.checked && datas ? datas.map((_, index) => index) : [];
                  setSelected(newSelected);
                  onSelectionChange(newSelected);
                }}
                indeterminate={datas && selected.length > 0 && selected.length < datas.length}
                checked={datas && datas.length > 0 && selected.length === datas.length}
                sx={{
                  '& .MuiSvgIcon-root': {
                    backgroundColor: '#fff',
                    borderRadius: '4px',
                    transition: 'background-color 0.3s',
                  },
                }}
              />
            </TableCell>
            <TableCell align="center">受注番号</TableCell>
            <TableCell align="left">入庫場所</TableCell>
            <TableCell align="left">入庫日時</TableCell>
            <TableCell align="center">チェック</TableCell>
            <TableCell align="left">公演名</TableCell>
            <TableCell align="left">公演場所</TableCell>
            <TableCell align="left">受注明細名</TableCell>
            <TableCell align="left">顧客名</TableCell>
            <TableCell align="left">課</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {datas.map((row, index) => (
            <TableRow key={index} sx={{ whiteSpace: 'nowrap', backgroundColor: row.nyukoFixFlg ? '#808080' : 'white' }}>
              <TableCell padding="checkbox">
                <Checkbox checked={selected.includes(index)} onChange={() => handleSelect(index)} />
              </TableCell>
              <TableCell align="center">
                <Button
                  variant="text"
                  size="small"
                  onClick={() => window.open(`/order/${row.juchuHeadId}/view`)}
                  sx={{ py: 0, px: 1 }}
                >
                  {row.juchuHeadId}
                </Button>
              </TableCell>
              <TableCell align="left">{row.nyushukoBashoId === 1 ? 'K' : 'Y'}</TableCell>
              <TableCell align="left">{toJapanTimeString(row.nyushukoDat)}</TableCell>
              <TableCell align="center">
                <Button variant="text" size="small" onClick={() => handleClickRow(row)} sx={{ py: 0, px: 1 }}>
                  {row.nchkSagyoStsNamShort}
                </Button>
              </TableCell>
              <TableCell align="left">{row.koenNam}</TableCell>
              <TableCell align="left">{row.koenbashoNam}</TableCell>
              <TableCell align="left">
                <Typography
                  variant="body2"
                  color={
                    row.juchuKizaiHeadKbn === 1
                      ? dispColors.main
                      : row.juchuKizaiHeadKbn === 2
                        ? dispColors.return
                        : row.juchuKizaiHeadKbn === 3
                          ? dispColors.keep
                          : dispColors.main
                  }
                >
                  {row.headNamv}
                </Typography>
              </TableCell>
              <TableCell align="left">{row.kokyakuNam}</TableCell>
              <TableCell align="left">{row.sectionNamv}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
};
