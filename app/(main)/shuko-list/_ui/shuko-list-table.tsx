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
import { grey } from '@mui/material/colors';
import { useRouter } from 'next/navigation';
import { Dispatch, SetStateAction, use, useState } from 'react';

import { dispColors } from '../../_lib/colors';
import { toJapanTimeString } from '../../_lib/date-conversion';
import { ShukoTableValues } from '../_lib/types';

export const ShukoListTable = (props: {
  datas: ShukoTableValues[];
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

  const handleClickRow = (row: ShukoTableValues, sagyoKbnId: number) => {
    if (isProcessing) return;

    setIsProcessing(true);
    router.push(
      // `shuko-list/shuko-detail/${row.juchuHeadId}/${row.juchuKizaiHeadKbn}/${row.nyushukoBashoId}/${new Date(row.nyushukoDat).toISOString()}/${sagyoKbnId}`
      `shuko-list/shuko-detail/${row.juchuHeadId}/${row.juchuKizaiHeadKbn}/${row.nyushukoBashoId}/${new Date(row.nyushukoDat).toISOString()}/${sagyoKbnId}`
    );
  };

  return (
    <TableContainer sx={{ overflow: 'auto', maxHeight: '80vh' }}>
      <Table stickyHeader size="small" /*padding="none"*/>
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
            <TableCell align="left">出庫場所</TableCell>
            <TableCell align="left">出庫日時</TableCell>
            <TableCell align="center">スタンバイ</TableCell>
            <TableCell align="center">チェック</TableCell>
            <TableCell align="left">公演名</TableCell>
            <TableCell align="left">公演場所</TableCell>
            <TableCell align="left">機材明細名</TableCell>
            <TableCell align="left">顧客名</TableCell>
            <TableCell align="left">課</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {datas.map((row, index) => (
            <TableRow
              key={index}
              sx={{
                whiteSpace: 'nowrap',
                backgroundColor: row.shukoFixFlg
                  ? '#808080'
                  : row.sstbSagyoStsId === 11 && row.schkSagyoStsId === 0
                    ? '#fff0f5' // スタンバイ△・チェック未 lavenderblush
                    : row.sstbSagyoStsId === 12 && row.schkSagyoStsId === 0
                      ? '#f0ffff' // スタンバイ〇・チェック未 azure
                      : row.sstbSagyoStsId === 12 && row.schkSagyoStsId === 21
                        ? '#87cefa' // スタンバイ〇・チェック△ lightskyblue
                        : row.sstbSagyoStsId === 12 && row.schkSagyoStsId === 22
                          ? '#66cdaa' // スタンバイ〇・チェック〇 mediumaquamarine
                          : row.sstbSagyoStsId < 12 && row.schkSagyoStsId > 20
                            ? '#ffff00' // スタンバイが未or△の時に、チェックが△or〇 黄色
                            : 'white',
              }}
            >
              <TableCell padding="checkbox">
                <Checkbox checked={selected.includes(index)} onChange={() => handleSelect(index)} />
              </TableCell>
              <TableCell align="center">{row.juchuHeadId}</TableCell>
              <TableCell align="left">{row.nyushukoBashoId === 1 ? 'K' : 'Y'}</TableCell>
              <TableCell align="left">{toJapanTimeString(row.nyushukoDat)}</TableCell>
              <TableCell align="center">
                <Button variant="text" size="small" onClick={() => handleClickRow(row, 10)} sx={{ py: 0, px: 1 }}>
                  {row.sstbSagyoStsNamShort}
                </Button>
              </TableCell>
              <TableCell align="center">
                <Button variant="text" size="small" onClick={() => handleClickRow(row, 20)} sx={{ py: 0, px: 1 }}>
                  {row.schkSagyoStsNamShort}
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
