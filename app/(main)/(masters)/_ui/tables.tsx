'use client';

import { Button, styled, Tooltip, tooltipClasses, TooltipProps, Typography } from '@mui/material';
import { grey } from '@mui/material/colors';
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
  [key: string]: string | number | boolean | undefined | null;
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

  /* 表示するリスト */
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
                  bgcolor: isHidden || isDeleted ? grey[300] : undefined,
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
                  sx={{ bgcolor: isHidden || isDeleted ? grey[300] : undefined, whiteSpace: 'nowrap' }}
                >
                  {header.key === 'name' ? (
                    <Button
                      variant="text"
                      size="medium"
                      onClick={() => handleOpenDialog(row.id)}
                      sx={{ p: 0, m: 0, minWidth: 0 }}
                    >
                      <LightTooltipWithText variant={'button'} maxWidth={300}>
                        {row[header.key]}
                      </LightTooltipWithText>
                    </Button>
                  ) : header.key === 'address' ? (
                    <LightTooltipWithText variant={'body2'} maxWidth={300}>
                      {row[header.key]}
                    </LightTooltipWithText>
                  ) : header.key === 'mem' ? (
                    <LightTooltipWithText variant={'body2'} maxWidth={300}>
                      {row[header.key]}
                    </LightTooltipWithText>
                  ) : header.key === 'hidden' ? (
                    <>{isHidden && <>非表示</>}</>
                  ) : header.key === 'deleted' ? (
                    <>{isDeleted && <>無効</>}</>
                  ) : (
                    <>{row[header.key]}</>
                  )}
                </TableCell>
              ))}
              {/* <TableCell sx={{ bgcolor: isHidden || isDeleted ? grey[300] : undefined, width: 100 }} align="center">
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
                  bgcolor: isHidden || isDeleted ? grey[300] : undefined,
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
                  sx={{ bgcolor: isHidden || isDeleted ? grey[300] : undefined, whiteSpace: 'nowrap' }}
                >
                  {header.key === 'name' ? (
                    <Button
                      variant="text"
                      size="medium"
                      onClick={() => handleOpenDialog(row.id)}
                      sx={{ p: 0, m: 0, minWidth: 0 }}
                    >
                      <LightTooltipWithText variant={'button'} maxWidth={300}>
                        {row[header.key]}
                      </LightTooltipWithText>
                    </Button>
                  ) : header.key === 'mem' ? (
                    <LightTooltipWithText variant={'body2'} maxWidth={300}>
                      {row[header.key]}
                    </LightTooltipWithText>
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

/**
 * 背景が白いToolTip
 */
const LightTooltip = styled(({ className, ...props }: TooltipProps) => (
  <Tooltip {...props} classes={{ popper: className }} />
))(({ theme }) => ({
  [`& .${tooltipClasses.tooltip}`]: {
    backgroundColor: theme.palette.common.white,
    color: 'rgba(0, 0, 0, 0.68)',
    boxShadow: theme.shadows[1],
    fontSize: 11,
  },
  [`&.${tooltipClasses.popper}[data-popper-placement*="bottom"] .${tooltipClasses.tooltip}`]: {
    marginTop: '0px',
  },
  [`&.${tooltipClasses.popper}[data-popper-placement*="top"] .${tooltipClasses.tooltip}`]: {
    marginBottom: '0px',
  },
  [`&.${tooltipClasses.popper}[data-popper-placement*="left"] .${tooltipClasses.tooltip}`]: {
    marginRight: '0px',
  },
  [`&.${tooltipClasses.popper}[data-popper-placement*="right"] .${tooltipClasses.tooltip}`]: {
    marginLeft: '0px',
  },
}));

/**
 * テキストがはみ出たらtooltipを表示するコンポーネント
 * @param param0 param
 * @returns テキストがはみ出たらtooltipを表示するコンポーネント
 */
export const LightTooltipWithText = ({
  children,
  variant,
  maxWidth,
}: {
  children: React.ReactNode;
  variant: 'body2' | 'button';
  maxWidth: number;
}) => {
  const textRef = React.useRef<HTMLSpanElement>(null);
  const [isOverflowed, setIsOverflowed] = useState(false);

  React.useEffect(() => {
    const el = textRef.current;
    if (el) {
      setIsOverflowed(el.scrollWidth > el.clientWidth);
    }
  }, [children]);

  return isOverflowed ? (
    <LightTooltip
      title={children}
      slotProps={{
        transition: { timeout: 1500 },
      }}
    >
      <Typography
        ref={textRef}
        noWrap
        maxWidth={maxWidth}
        variant={variant}
        textTransform={'none'}
        sx={{
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          display: 'inline-block',
          verticalAlign: 'middle',
        }}
      >
        {children}
      </Typography>
    </LightTooltip>
  ) : (
    <Typography
      ref={textRef}
      noWrap
      maxWidth={maxWidth}
      variant={variant}
      textTransform={'none'}
      sx={{
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        display: 'inline-block',
        verticalAlign: 'middle',
      }}
    >
      {children}
    </Typography>
  );
};
