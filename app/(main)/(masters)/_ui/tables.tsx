'use client';

import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { Box, Button, Collapse, IconButton, Typography } from '@mui/material';
import Checkbox from '@mui/material/Checkbox';
import { grey } from '@mui/material/colors';
import Paper from '@mui/material/Paper';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import * as React from 'react';
import { useMemo, useState } from 'react';

/* マスタ系用テーブル ----------------------------------------------- */
type MasterHeader = {
  key: string;
  label: string;
};

type MasterRow = {
  id: number;
  tblDspId: number;
  [key: string]: string | number | boolean | undefined;
};

export const MasterTable = ({
  headers,
  datas,
  page,
  rowsPerPage,
  handleOpenDialog,
}: {
  headers: MasterHeader[];
  datas: MasterRow[];
  page: number;
  rowsPerPage: number;
  handleOpenDialog: (id: number) => void;
}) => {
  const [rows, setRows] = useState(datas);

  // const moveRow = (index: number, direction: number) => {
  //   console.log(index);
  //   const newIndex = index + direction;
  //   if (newIndex < 0 || newIndex >= rows.length) return;

  //   const updatedRows = [...rows];
  //   [updatedRows[index], updatedRows[newIndex]] = [updatedRows[newIndex], updatedRows[index]];
  //   setRows(updatedRows);
  // };

  /* 表示する担当者リスト */
  const list = useMemo(
    () => (rows && rowsPerPage > 0 ? rows.slice((page - 1) * rowsPerPage, page * rowsPerPage) : rows),
    [page, rowsPerPage, rows]
  );
  const emptyRows = page > 1 ? Math.max(0, page * rowsPerPage - rows!.length) : 0;

  return (
    <Table sx={{ minWidth: '100%' }} aria-labelledby="tableTitle" padding="none" stickyHeader>
      <TableHead sx={{ bgcolor: 'primary.light' }}>
        <TableRow sx={{ whiteSpace: 'nowrap' }}>
          <TableCell width={50} />
          {headers.map((header) => (
            <TableCell key={header.key} align={typeof rows[0][header.key] === 'number' ? 'right' : 'left'}>
              {header.label}
            </TableCell>
          ))}
          {/* <TableCell /> */}
        </TableRow>
      </TableHead>
      <TableBody>
        {list.map((row) => {
          const isHidden = row.dspFlg === false;
          const isDeleted = row.delFlg === true;
          return (
            <TableRow hover key={row.tblDspId}>
              <TableCell
                width={50}
                sx={{
                  bgcolor: isHidden || isDeleted ? grey[300] : '',
                  paddingLeft: 1,
                  paddingRight: 1,
                  textAlign: 'end',
                }}
              >
                {row.tblDspId}
              </TableCell>
              {headers.map((header) => (
                <TableCell
                  key={header.key}
                  align={typeof row[header.key] === 'number' ? 'right' : 'left'}
                  sx={{ bgcolor: isHidden || isDeleted ? grey[300] : '', whiteSpace: 'nowrap' }}
                >
                  {header.key === 'name' ? (
                    <Button
                      variant="text"
                      size="medium"
                      onClick={() => handleOpenDialog(row.id)}
                      sx={{ p: 0, m: 0, minWidth: 0, textTransform: 'none' }}
                    >
                      <Typography noWrap maxWidth={300} variant="body2" fontWeight={'medium'}>
                        {row[header.key]}
                      </Typography>
                    </Button>
                  ) : header.key === 'address' ? (
                    <Typography noWrap maxWidth={300}>
                      {row[header.key]}
                    </Typography>
                  ) : header.key === 'mem' ? (
                    <Typography noWrap maxWidth={300}>
                      {row[header.key]}
                    </Typography>
                  ) : header.key === 'hidden' ? (
                    <>{isHidden && <>非表示</>}</>
                  ) : header.key === 'deleted' ? (
                    <>{isDeleted && <>無効</>}</>
                  ) : (
                    <>{row[header.key]}</>
                  )}
                </TableCell>
              ))}
              {/* <TableCell sx={{ bgcolor: isHidden || isDeleted ? grey[300] : '', width: 100 }} align="center">
                <IconButton
                  sx={{ bgcolor: 'primary.main', color: 'white' }}
                  size="small"
                  onClick={() => moveRow(index, -1)}
                  disabled={index === 0}
                >
                  <ArrowUpwardIcon fontSize="small" />
                </IconButton>
                <IconButton
                  sx={{ bgcolor: 'primary.main', color: 'white' }}
                  size="small"
                  onClick={() => moveRow(index, 1)}
                  disabled={index === rows.length - 1}
                >
                  <ArrowDownwardIcon fontSize="small" />
                </IconButton>
              </TableCell> */}
            </TableRow>
          );
        })}
        {emptyRows > 0 && (
          <TableRow style={{ height: 25 * emptyRows }}>
            <TableCell colSpan={headers.length + 2} />
          </TableRow>
        )}
      </TableBody>
    </Table>
  );
};

/**
 * 機材マスタ専用テーブルコンポーネント
 * @param param0
 * @returns 機材マスタ専用テーブルコンポーネント
 */
export const MasterTableOfEqpt = ({
  headers,
  datas,
  page,
  rowsPerPage,
  handleOpenDialog,
}: {
  headers: MasterHeader[];
  datas: MasterRow[];
  page: number;
  rowsPerPage: number;
  handleOpenDialog: (id: number) => void;
}) => {
  // 表示するデータ
  const list = React.useMemo(
    () => (datas && rowsPerPage > 0 ? datas.slice((page - 1) * rowsPerPage, page * rowsPerPage) : datas),
    [page, rowsPerPage, datas]
  );
  const emptyRows = page > 1 ? Math.max(0, page * rowsPerPage - datas!.length) : 0;

  return (
    <Table sx={{ minWidth: '100%' }} aria-labelledby="tableTitle" padding="none" stickyHeader>
      <TableHead sx={{ bgcolor: 'primary.light' }}>
        <TableRow sx={{ whiteSpace: 'nowrap' }}>
          <TableCell width={50} />
          {headers.map((header) => (
            <TableCell key={header.key} align={typeof datas[0][header.key] === 'number' ? 'right' : 'left'}>
              {header.label}
            </TableCell>
          ))}
        </TableRow>
      </TableHead>
      <TableBody>
        {list.map((row) => {
          const isHidden = row.dspFlg === false;
          const isDeleted = row.delFlg === true;
          return (
            <TableRow hover key={row.tblDspId}>
              <TableCell
                width={50}
                sx={{
                  bgcolor: isHidden || isDeleted ? grey[300] : '',
                  paddingLeft: 1,
                  paddingRight: 1,
                  textAlign: 'end',
                }}
              >
                {row.tblDspId}
              </TableCell>
              {headers.map((header) => (
                <TableCell
                  key={header.key}
                  align={typeof row[header.key] === 'number' ? 'right' : 'left'}
                  sx={{ bgcolor: isHidden || isDeleted ? grey[300] : '', whiteSpace: 'nowrap' }}
                >
                  {header.key === 'name' ? (
                    <Button
                      variant="text"
                      size="medium"
                      onClick={() => handleOpenDialog(row.id)}
                      sx={{ p: 0, m: 0, minWidth: 0, textTransform: 'none' }}
                    >
                      <Typography noWrap maxWidth={300} variant="body2" fontWeight={'medium'}>
                        {row[header.key]}
                      </Typography>
                    </Button>
                  ) : header.key === 'mem' ? (
                    <Typography noWrap maxWidth={300}>
                      {row[header.key]}
                    </Typography>
                  ) : header.key === 'hidden' ? (
                    <>{isHidden && <>非表示</>}</>
                  ) : header.key === 'deleted' ? (
                    <>{isDeleted && <>無効</>}</>
                  ) : (
                    <>{row[header.key]}</>
                  )}
                </TableCell>
              ))}
            </TableRow>
          );
        })}
        {emptyRows > 0 && (
          <TableRow style={{ height: 25 * emptyRows }}>
            <TableCell colSpan={headers.length + 2} />
          </TableRow>
        )}
      </TableBody>
    </Table>
  );
};
