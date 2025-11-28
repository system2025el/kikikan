'use client';

import { Button, Checkbox, Table, TableBody, TableCell, TableContainer, TableHead, TableRow } from '@mui/material';

import { toJapanTimeString } from '../../_lib/date-conversion';
import { NyukoTableValues } from '../_lib/types';

export const NyukoListTable = (props: { datas: NyukoTableValues[] }) => {
  const { datas } = props;

  return (
    <TableContainer sx={{ overflow: 'auto', maxHeight: '80vh' }}>
      <Table stickyHeader size="small">
        <TableHead>
          <TableRow sx={{ whiteSpace: 'nowrap' }}>
            <TableCell align="center">受注番号</TableCell>
            <TableCell align="left">入庫場所</TableCell>
            <TableCell align="left">入庫日時</TableCell>
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
            <TableRow key={index} sx={{ whiteSpace: 'nowrap' }}>
              <TableCell align="center">{row.juchuHeadId}</TableCell>
              <TableCell align="left">{row.nyushukoBashoId === 1 ? 'K' : 'Y'}</TableCell>
              <TableCell align="left">{toJapanTimeString(row.nyushukoDat)}</TableCell>
              <TableCell align="center">
                <Button
                  variant="text"
                  size="small"
                  href={`nyuko-list/nyuko-detail/${row.juchuHeadId}/${row.juchuKizaiHeadKbn}/${row.nyushukoBashoId}/${toJapanTimeString(row.nyushukoDat, '-')}/30`}
                  sx={{ py: 0, px: 1 }}
                >
                  {row.nchkSagyoStsNamShort}
                </Button>
              </TableCell>
              <TableCell align="left">{row.koenNam}</TableCell>
              <TableCell align="left">{row.koenbashoNam}</TableCell>
              <TableCell align="left">{row.headNamv}</TableCell>
              <TableCell align="left">{row.kokyakuNam}</TableCell>
              <TableCell align="left">{row.sectionNamv}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
};
