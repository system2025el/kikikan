'use client';

import { BorderColor } from '@mui/icons-material';
import Delete from '@mui/icons-material/Delete';
import EditNoteIcon from '@mui/icons-material/EditNote';
import {
  Button,
  colors,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  IconButton,
  MenuItem,
  Paper,
  Select,
  SelectChangeEvent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Tooltip,
} from '@mui/material';
import { Dayjs } from 'dayjs';
import React, { useRef, useState } from 'react';

import { EquipmentData } from './equipment-order-detail';

type TableProps = {
  header: string[];
  rows: Array<{
    id: number;
    data: number[];
  }>;
  dateRange: string[];
  startKICSDate: Date;
  endKICSDate: Date;
  preparation: EquipmentData[];
  RH: EquipmentData[];
  GP: EquipmentData[];
  actual: EquipmentData[];
  keep: EquipmentData[];
  editableColumns?: number[] | null;
  cellWidths?: Array<string | number>;
  getHeaderBackgroundColor: (date: string, dateRange: string[]) => string;
  rowColorSelect: boolean;
  getRowBackgroundColor: (
    dateHeader: string,
    startKICSDate: Date,
    endKICSDate: Date,
    preparation: EquipmentData[],
    RH: EquipmentData[],
    GP: EquipmentData[],
    actual: EquipmentData[],
    keep: EquipmentData[]
  ) => string;
};

const GridTable: React.FC<TableProps> = ({
  header,
  rows,
  dateRange,
  startKICSDate,
  endKICSDate,
  preparation,
  RH,
  GP,
  actual,
  keep,
  cellWidths = [],
  getHeaderBackgroundColor,
  rowColorSelect,
  getRowBackgroundColor,
}) => {
  const getWidth = (index: number) => cellWidths[index] ?? cellWidths[1];

  return (
    <TableContainer component={Paper} style={{ overflowX: 'auto' }}>
      <Table>
        <TableHead>
          <TableRow>
            {header?.map((date, index) => (
              <TableCell
                key={index}
                align={typeof rows[0].data[index] === 'number' ? 'right' : 'left'}
                size="small"
                sx={{
                  border: getHeaderBackgroundColor(date, dateRange) === 'black' ? '1px solid grey' : '1px solid black',
                  whiteSpace: 'nowrap',
                  color: 'white',
                  bgcolor: getHeaderBackgroundColor(date, dateRange),
                  padding: 0,
                }}
              >
                {date}
              </TableCell>
            ))}
          </TableRow>
        </TableHead>
        <TableBody>
          {rows.map((row, rowIndex) => (
            <GridTableRow
              key={rowIndex}
              header={header}
              row={row}
              startKICSDate={startKICSDate}
              endKICSDate={endKICSDate}
              preparation={preparation}
              RH={RH}
              GP={GP}
              actual={actual}
              keep={keep}
              getRowBackgroundColor={getRowBackgroundColor}
            />
            // <TableRow key={rowIndex}>
            //   {row.data.map((cell, colIndex) => {
            //     const width = getWidth(colIndex);

            //     return (
            //       <TableCell
            //         key={colIndex}
            //         align={typeof cell === 'number' ? 'right' : 'left'}
            //         sx={{
            //           border: '1px solid black',
            //           whiteSpace: 'nowrap',
            //           width,
            //           height: 25,
            //           bgcolor: getRowBackgroundColor(
            //             header[colIndex],
            //             startKICSDate,
            //             endKICSDate,
            //             preparation,
            //             RH,
            //             GP,
            //             actual,
            //             keep
            //           ),
            //           py: 0,
            //           px: 1,
            //           color: typeof cell === 'number' && cell < 0 ? 'red' : 'black',
            //         }}
            //         size="small"
            //       >
            //         {cell}
            //       </TableCell>
            //     );
            //   })}
            // </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

export default GridTable;

export type Stock = {
  id: number;
  data: number[];
};

export type GridTableRowProps = {
  header: string[];
  row: Stock;
  startKICSDate: Date;
  endKICSDate: Date;
  preparation: EquipmentData[];
  RH: EquipmentData[];
  GP: EquipmentData[];
  actual: EquipmentData[];
  keep: EquipmentData[];
  getRowBackgroundColor: (
    dateHeader: string,
    startKICSDate: Date,
    endKICSDate: Date,
    preparation: EquipmentData[],
    RH: EquipmentData[],
    GP: EquipmentData[],
    actual: EquipmentData[],
    keep: EquipmentData[]
  ) => string;
};

const GridTableRow = React.memo(
  ({
    header,
    row,
    startKICSDate,
    endKICSDate,
    preparation,
    RH,
    GP,
    actual,
    keep,
    getRowBackgroundColor,
  }: GridTableRowProps) => {
    console.log('date側描画', row.id);
    return (
      <TableRow>
        {row.data.map((cell, colIndex) => {
          return (
            <TableCell
              key={colIndex}
              align={typeof cell === 'number' ? 'right' : 'left'}
              sx={{
                border: '1px solid black',
                whiteSpace: 'nowrap',
                height: 25,
                bgcolor: getRowBackgroundColor(
                  header[colIndex],
                  startKICSDate,
                  endKICSDate,
                  preparation,
                  RH,
                  GP,
                  actual,
                  keep
                ),
                py: 0,
                px: 1,
                color: typeof cell === 'number' && cell < 0 ? 'red' : 'black',
              }}
              size="small"
            >
              {cell}
            </TableCell>
          );
        })}
      </TableRow>
    );
  },
  (prevProps, nextProps) => {
    return (
      prevProps.header === nextProps.header &&
      prevProps.row === nextProps.row &&
      prevProps.startKICSDate === nextProps.startKICSDate &&
      prevProps.endKICSDate === nextProps.endKICSDate &&
      prevProps.preparation === nextProps.preparation &&
      prevProps.RH === nextProps.RH &&
      prevProps.GP === nextProps.GP &&
      prevProps.actual === nextProps.actual &&
      prevProps.keep === nextProps.keep
    );
  }
);

GridTableRow.displayName = 'GridTableRow';

export type Equipment = {
  id: number;
  name: string;
  memo: string;
  place: string;
  all: number;
  order: number;
  spare: number;
  total: number;
};

type GridSelectBoxTableProps = {
  rows: Equipment[];
  onChange: (rowIndex: number, orderValue: number, spareValue: number, totalValue: number) => void;
  handleMemoChange: (rowIndex: number, memo: string) => void;
};

export const GridSelectBoxTable: React.FC<GridSelectBoxTableProps> = ({ rows, onChange, handleMemoChange }) => {
  const handleCellChange = (rowIndex: number, colIndex: number, newValue: number) => {
    const updatedRows = [...rows];
    if (colIndex === 4) {
      updatedRows[rowIndex].order = newValue;
    } else if (colIndex === 5) {
      updatedRows[rowIndex].spare = newValue;
    }
    updatedRows[rowIndex].total = updatedRows[rowIndex].order + updatedRows[rowIndex].spare;
    onChange(rowIndex, updatedRows[rowIndex].order, updatedRows[rowIndex].spare, updatedRows[rowIndex].total);
  };

  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  // let currentIndex = 0;

  const handleKeyDown = (e: React.KeyboardEvent, rowIndex: number, colIndex: number) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (colIndex === 4) {
        inputRefs.current[rowIndex * 2 + 1]?.focus();
      } else {
        inputRefs.current[rowIndex * 2 + 2]?.focus();
      }
    }
  };

  const handleOrderRef = (rowIndex: number) => (el: HTMLInputElement | null) => {
    inputRefs.current[rowIndex * 2] = el;
  };

  const handleSpareRef = (rowIndex: number) => (el: HTMLInputElement | null) => {
    inputRefs.current[rowIndex * 2 + 1] = el;
  };

  return (
    <TableContainer component={Paper} style={{ overflowX: 'auto' }}>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell size="small" style={styles.header} />
            <TableCell size="small" style={styles.header} />
            <TableCell align="left" size="small" style={styles.header}>
              機材名
            </TableCell>
            <TableCell align="left" size="small" style={styles.header}>
              メモ
            </TableCell>
            <TableCell align="left" size="small" style={styles.header}>
              在庫場所
            </TableCell>
            <TableCell align="right" size="small" style={styles.header}>
              全数
            </TableCell>
            <TableCell align="right" size="small" style={styles.header}>
              受注数
            </TableCell>
            <TableCell align="right" size="small" style={styles.header}>
              予備数
            </TableCell>
            <TableCell align="right" size="small" style={styles.header}>
              合計数
            </TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {rows.map((row, rowIndex) => (
            <GridSelectBoxRow
              key={rowIndex}
              row={row}
              rowIndex={rowIndex}
              handleOrderRef={handleOrderRef(rowIndex)}
              handleSpareRef={handleSpareRef(rowIndex)}
              handleMemoChange={handleMemoChange}
              handleKeyDown={handleKeyDown}
              handleCellChange={handleCellChange}
            />
            // <TableRow key={row.id}>
            //   <TableCell sx={{ padding: 0, border: '1px solid black' }}>
            //     <IconButton sx={{ padding: 0, color: 'red' }}>
            //       <Delete fontSize="small" />
            //     </IconButton>
            //   </TableCell>
            //   <TableCell
            //     align="right"
            //     size="small"
            //     sx={{ bgcolor: 'lightgrey', py: 0, px: 1, border: '1px solid black' }}
            //   >
            //     {rowIndex + 1}
            //   </TableCell>
            //   <TableCell style={styles.row} align="left" size="small" sx={{ bgcolor: 'lightgrey' }}>
            //     {row.name}
            //   </TableCell>
            //   <TableCell style={styles.row} align="center" size="small">
            //     <MemoTooltip name={row.name} memo={row.memo} handleMemoChange={handleMemoChange} rowIndex={rowIndex} />
            //   </TableCell>
            //   <TableCell style={styles.row} align="left" size="small" sx={{ bgcolor: 'lightgrey' }}>
            //     {row.place}
            //   </TableCell>
            //   <TableCell style={styles.row} align="right" size="small" sx={{ bgcolor: 'lightgrey' }}>
            //     {row.all}
            //   </TableCell>
            //   <TableCell style={styles.row} align="right" size="small">
            //     <TextField
            //       variant="standard"
            //       value={row.order}
            //       type="text"
            //       onChange={(e) => {
            //         if (/^\d*$/.test(e.target.value)) {
            //           handleCellChange(rowIndex, 4, Number(e.target.value));
            //         }
            //       }}
            //       sx={{
            //         '& .MuiInputBase-input': {
            //           textAlign: 'right',
            //           padding: 0,
            //           fontSize: 'small',
            //         },
            //         '& input[type=number]': {
            //           MozAppearance: 'textfield',
            //         },
            //         '& input[type=number]::-webkit-outer-spin-button': {
            //           WebkitAppearance: 'none',
            //           margin: 0,
            //         },
            //         '& input[type=number]::-webkit-inner-spin-button': {
            //           WebkitAppearance: 'none',
            //           margin: 0,
            //         },
            //       }}
            //       slotProps={{
            //         input: {
            //           style: { textAlign: 'right' },
            //           disableUnderline: true,
            //           inputMode: 'numeric',
            //         },
            //       }}
            //       inputRef={(el) => {
            //         inputRefs.current[currentIndex++] = el;
            //       }}
            //       onKeyDown={(e) => {
            //         handleKeyDown(e, rowIndex, 4);
            //       }}
            //       onFocus={() => handleSelect(rowIndex, 4)}
            //     />
            //   </TableCell>
            //   <TableCell style={styles.row} align="right" size="small">
            //     <TextField
            //       variant="standard"
            //       value={row.spare}
            //       type="text"
            //       onChange={(e) => {
            //         if (/^\d*$/.test(e.target.value)) {
            //           handleCellChange(rowIndex, 5, Number(e.target.value));
            //         }
            //       }}
            //       sx={{
            //         '& .MuiInputBase-input': {
            //           textAlign: 'right',
            //           padding: 0,
            //           fontSize: 'small',
            //         },
            //         '& input[type=number]': {
            //           MozAppearance: 'textfield',
            //         },
            //         '& input[type=number]::-webkit-outer-spin-button': {
            //           WebkitAppearance: 'none',
            //           margin: 0,
            //         },
            //         '& input[type=number]::-webkit-inner-spin-button': {
            //           WebkitAppearance: 'none',
            //           margin: 0,
            //         },
            //       }}
            //       slotProps={{
            //         input: {
            //           style: { textAlign: 'right' },
            //           disableUnderline: true,
            //           inputMode: 'numeric',
            //         },
            //       }}
            //       inputRef={(el) => {
            //         inputRefs.current[currentIndex++] = el;
            //       }}
            //       onKeyDown={(e) => {
            //         handleKeyDown(e, rowIndex, 5);
            //       }}
            //       onFocus={() => handleSelect(rowIndex, 5)}
            //     />
            //   </TableCell>
            //   <TableCell style={styles.row} align="right" size="small" sx={{ bgcolor: 'lightgrey' }}>
            //     {row.total}
            //   </TableCell>
            // </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

type RowProps = {
  row: Equipment;
  rowIndex: number;
  handleOrderRef: (el: HTMLInputElement | null) => void;
  handleSpareRef: (el: HTMLInputElement | null) => void;
  handleMemoChange: (rowIndex: number, memo: string) => void;
  handleCellChange: (rowIndex: number, colIndex: number, newValue: number) => void;
  handleKeyDown: (e: React.KeyboardEvent, rowIndex: number, colIndex: number) => void;
};

const GridSelectBoxRow = React.memo(
  ({ row, rowIndex, handleOrderRef, handleSpareRef, handleMemoChange, handleCellChange, handleKeyDown }: RowProps) => {
    console.log('描画', rowIndex);
    return (
      <TableRow>
        <TableCell sx={{ padding: 0, border: '1px solid black' }}>
          <IconButton sx={{ padding: 0, color: 'red' }}>
            <Delete fontSize="small" />
          </IconButton>
        </TableCell>
        <TableCell align="right" size="small" sx={{ bgcolor: 'lightgrey', py: 0, px: 1, border: '1px solid black' }}>
          {rowIndex + 1}
        </TableCell>
        <TableCell style={styles.row} align="left" size="small" sx={{ bgcolor: 'lightgrey' }}>
          {row.name}
        </TableCell>
        <TableCell style={styles.row} align="center" size="small">
          <MemoTooltip name={row.name} memo={row.memo} handleMemoChange={handleMemoChange} rowIndex={rowIndex} />
        </TableCell>
        <TableCell style={styles.row} align="left" size="small" sx={{ bgcolor: 'lightgrey' }}>
          {row.place}
        </TableCell>
        <TableCell style={styles.row} align="right" size="small" sx={{ bgcolor: 'lightgrey' }}>
          {row.all}
        </TableCell>
        <TableCell style={styles.row} align="right" size="small">
          <TextField
            variant="standard"
            value={row.order}
            type="text"
            onChange={(e) => {
              if (/^\d*$/.test(e.target.value)) {
                handleCellChange(rowIndex, 4, Number(e.target.value));
              }
            }}
            sx={{
              '& .MuiInputBase-input': {
                textAlign: 'right',
                padding: 0,
                fontSize: 'small',
              },
              '& input[type=number]': {
                MozAppearance: 'textfield',
              },
              '& input[type=number]::-webkit-outer-spin-button': {
                WebkitAppearance: 'none',
                margin: 0,
              },
              '& input[type=number]::-webkit-inner-spin-button': {
                WebkitAppearance: 'none',
                margin: 0,
              },
            }}
            slotProps={{
              input: {
                style: { textAlign: 'right' },
                disableUnderline: true,
                inputMode: 'numeric',
              },
            }}
            inputRef={handleOrderRef}
            onKeyDown={(e) => {
              handleKeyDown(e, rowIndex, 4);
            }}
            onFocus={(e) => e.target.select()}
          />
        </TableCell>
        <TableCell style={styles.row} align="right" size="small">
          <TextField
            variant="standard"
            value={row.spare}
            type="text"
            onChange={(e) => {
              if (/^\d*$/.test(e.target.value)) {
                handleCellChange(rowIndex, 5, Number(e.target.value));
              }
            }}
            sx={{
              '& .MuiInputBase-input': {
                textAlign: 'right',
                padding: 0,
                fontSize: 'small',
              },
              '& input[type=number]': {
                MozAppearance: 'textfield',
              },
              '& input[type=number]::-webkit-outer-spin-button': {
                WebkitAppearance: 'none',
                margin: 0,
              },
              '& input[type=number]::-webkit-inner-spin-button': {
                WebkitAppearance: 'none',
                margin: 0,
              },
            }}
            slotProps={{
              input: {
                style: { textAlign: 'right' },
                disableUnderline: true,
                inputMode: 'numeric',
              },
            }}
            inputRef={handleSpareRef}
            onKeyDown={(e) => {
              handleKeyDown(e, rowIndex, 5);
            }}
            onFocus={(e) => e.target.select()}
          />
        </TableCell>
        <TableCell style={styles.row} align="right" size="small" sx={{ bgcolor: 'lightgrey' }}>
          {row.total}
        </TableCell>
      </TableRow>
    );
  },
  (prevProps, nextProps) => {
    return prevProps.row === nextProps.row;
  }
);

GridSelectBoxRow.displayName = 'GridSelectBoxRow';

type Props = {
  name: string;
  memo: string;
  rowIndex: number;
  handleMemoChange: (rowIndex: number, memo: string) => void;
};

export const MemoTooltip = (props: Props) => {
  const [open, setOpen] = useState(false);
  const [equipmentMemo, setEquipmentMemo] = useState(props.memo);

  const handleOpen = () => setOpen(true);
  const handleClose = () => setOpen(false);

  const handleSave = () => {
    props.handleMemoChange(props.rowIndex, equipmentMemo);
    handleClose();
  };

  return (
    <>
      <Tooltip title={equipmentMemo} arrow sx={{ p: 0 }}>
        <IconButton onClick={handleOpen} sx={{ padding: 0 }} color={equipmentMemo ? 'primary' : 'default'}>
          <EditNoteIcon fontSize="small" />
        </IconButton>
      </Tooltip>

      <Dialog open={open} onClose={handleClose}>
        <DialogTitle fontSize="medium">{props.name}</DialogTitle>
        <DialogContent>
          <TextField
            value={equipmentMemo}
            onChange={(e) => setEquipmentMemo(e.target.value)}
            fullWidth
            multiline
            minRows={3}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>キャンセル</Button>
          <Button onClick={handleSave} variant="contained">
            保存
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

/* style
---------------------------------------------------------------------------------------------------- */
/** @type {{ [key: string]: React.CSSProperties }} style */
const styles: { [key: string]: React.CSSProperties } = {
  // ヘッダー
  header: {
    border: '1px solid grey',
    whiteSpace: 'nowrap',
    padding: 0,
  },
  // 行
  row: {
    border: '1px solid black',
    whiteSpace: 'nowrap',
    height: 25,
    paddingTop: 0,
    paddingBottom: 0,
    paddingLeft: 1,
    paddingRight: 1,
  },
};
