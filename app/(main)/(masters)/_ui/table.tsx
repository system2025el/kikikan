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
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import * as React from 'react';
import { useState } from 'react';

/* マスタ系用テーブル ----------------------------------------------- */
type MasterHeader = {
  key: string;
  label: string;
};

type MasterRow = {
  id: number;
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

  const emptyRows = page > 1 ? Math.max(0, page * rowsPerPage - datas!.length) : 0;

  return (
    <Table sx={{ minWidth: 1200 }} aria-labelledby="tableTitle" padding="none" stickyHeader>
      <TableHead sx={{ bgcolor: 'primary.light' }}>
        <TableRow sx={{ whiteSpace: 'nowrap' }}>
          <TableCell />
          {headers.map((header) => (
            <TableCell key={header.key} align={typeof rows[0][header.key] === 'number' ? 'right' : 'left'}>
              {header.label}
            </TableCell>
          ))}
          <TableCell>非表示</TableCell>
          {/* <TableCell /> */}
        </TableRow>
      </TableHead>
      <TableBody>
        {rows.map((row, index) => {
          const isHidden = row.dspFlg === 0 || row.dspFlg === false;
          return (
            <TableRow hover key={row.id}>
              <TableCell sx={{ bgcolor: isHidden ? grey[300] : '' }}>
                <Box width={10} px={1}>
                  {index + 1}
                </Box>
              </TableCell>
              {headers.map((header) => (
                <TableCell
                  key={header.key}
                  align={typeof row[header.key] === 'number' ? 'right' : 'left'}
                  sx={{ bgcolor: isHidden ? grey[300] : '' }}
                >
                  {header.key === 'name' ? (
                    <>
                      <Button
                        variant="text"
                        size="medium"
                        onClick={() => handleOpenDialog(row.id)}
                        sx={{ p: 0, m: 0, minWidth: 0, textTransform: 'none' }}
                      >
                        {row[header.key]}
                      </Button>
                    </>
                  ) : header.key === 'mem' ? (
                    <Typography noWrap maxWidth={50}>
                      {row[header.key]}
                    </Typography>
                  ) : (
                    <>{row[header.key]}</>
                  )}
                </TableCell>
              ))}
              <TableCell sx={{ bgcolor: isHidden ? grey[300] : '' }}>{isHidden && <>非表示</>}</TableCell>
              {/* <TableCell sx={{ bgcolor: isHidden ? grey[300] : '', width: 100 }} align="center">
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
          <TableRow style={{ height: 30 * emptyRows }}>
            <TableCell colSpan={headers.length + 2} />
          </TableRow>
        )}
      </TableBody>
    </Table>
  );
};

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
  const emptyRows = page > 1 ? Math.max(0, page * rowsPerPage - datas!.length) : 0;

  return (
    <Table sx={{ minWidth: 1200 }} aria-labelledby="tableTitle" padding="none" stickyHeader>
      <TableHead sx={{ bgcolor: 'primary.light' }}>
        <TableRow sx={{ whiteSpace: 'nowrap' }}>
          <TableCell></TableCell>
          {headers.map((header) => (
            <TableCell key={header.key} align={typeof datas[0][header.key] === 'number' ? 'right' : 'left'}>
              {header.label}
            </TableCell>
          ))}
          <TableCell>非表示</TableCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {datas.map((row, index) => {
          const isHidden = row.dspFlg === 0 || row.dspFlg === false;
          return (
            <TableRow hover key={row.id}>
              <TableCell sx={{ bgcolor: isHidden ? grey[300] : '' }}>
                <Box width={10} px={1}>
                  {index + 1}
                </Box>
              </TableCell>
              {headers.map((header) => (
                <TableCell
                  key={header.key}
                  align={typeof row[header.key] === 'number' ? 'right' : 'left'}
                  sx={{ bgcolor: isHidden ? grey[300] : '' }}
                >
                  {header.key === 'name' ? (
                    <>
                      <Button
                        variant="text"
                        size="medium"
                        onClick={() => handleOpenDialog(row.id)}
                        sx={{ p: 0, m: 0, minWidth: 0, textTransform: 'none' }}
                      >
                        {row[header.key]}
                      </Button>
                    </>
                  ) : header.key === 'mem' ? (
                    <Typography noWrap maxWidth={50}>
                      {row[header.key]}
                    </Typography>
                  ) : (
                    <>{row[header.key]}</>
                  )}
                </TableCell>
              ))}
              <TableCell sx={{ bgcolor: isHidden ? grey[300] : '' }}>{isHidden && <>非表示</>}</TableCell>
            </TableRow>
          );
        })}
        {emptyRows > 0 && (
          <TableRow style={{ height: 30 * emptyRows }}>
            <TableCell colSpan={headers.length + 2} />
          </TableRow>
        )}
      </TableBody>
    </Table>
  );
};
