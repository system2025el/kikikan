import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { Box, Collapse, IconButton } from '@mui/material';
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

type Header = {
  key: string;
  label: string;
};

type Row = {
  id: string | number;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any;
};

type TableProps = {
  headers: Header[];
  datas: Row[];
  onSelectionChange?: (selectedIds: (string | number)[]) => void;
};

export const SelectTable: React.FC<TableProps> = ({ headers, datas, onSelectionChange }) => {
  const [rows, setRows] = useState(datas);
  const [selected, setSelected] = useState<(string | number)[]>([]);

  const handleSelect = (id: string | number) => {
    const newSelected = selected.includes(id) ? selected.filter((item) => item !== id) : [...selected, id];

    setSelected(newSelected);
    onSelectionChange?.(newSelected);
  };

  const moveRow = (index: number, direction: number) => {
    console.log(index);
    const newIndex = index + direction;
    if (newIndex < 0 || newIndex >= rows.length) return;

    const updatedRows = [...rows];
    [updatedRows[index], updatedRows[newIndex]] = [updatedRows[newIndex], updatedRows[index]];
    setRows(updatedRows);
  };

  const [isExpanded, setIsExpanded] = useState(false);

  const handleClick = () => {
    setIsExpanded(!isExpanded);
  };

  return (
    <Paper sx={{ width: '100%', mb: 2 }}>
      <TableContainer sx={{ overflow: 'auto', bgcolor: grey[200] }}>
        <Table sx={{ minWidth: 750 }} aria-labelledby="tableTitle" size="small">
          <TableHead sx={{ bgcolor: grey[400] }}>
            <TableRow sx={{ whiteSpace: 'nowrap' }}>
              <TableCell padding="checkbox">
                <Checkbox
                  indeterminate={selected.length > 0 && selected.length < rows.length}
                  checked={rows.length > 0 && selected.length === rows.length}
                  onChange={(e) => {
                    const newSelected = e.target.checked ? rows.map((row) => row.id) : [];
                    setSelected(newSelected);
                    onSelectionChange?.(newSelected);
                  }}
                />
              </TableCell>
              <TableCell />
              {headers.map((header) => (
                <TableCell key={header.key}>{header.label}</TableCell>
              ))}
              <TableCell />
              <TableCell />
            </TableRow>
          </TableHead>
          <TableBody>
            {rows.map((row, index) => {
              if (row.id === 1 || row.id === 3) {
                return (
                  <React.Fragment key={row.id}>
                    {/* 親行 */}
                    <TableRow hover>
                      <TableCell padding="checkbox">
                        <Checkbox checked={selected.includes(row.id)} onChange={() => handleSelect(row.id)} />
                      </TableCell>
                      <TableCell>
                        <IconButton onClick={handleClick}>
                          {isExpanded ? <ExpandMoreIcon /> : <ExpandLessIcon />}
                        </IconButton>
                      </TableCell>
                      {headers.map((header) => (
                        <TableCell key={header.key}>{row[header.key]}</TableCell>
                      ))}
                      <TableCell>
                        <IconButton onClick={() => moveRow(index, -1)} disabled={index === 0}>
                          ↑
                        </IconButton>
                      </TableCell>
                      <TableCell>
                        <IconButton onClick={() => moveRow(index, 1)} disabled={index === rows.length - 1}>
                          ↓
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  </React.Fragment>
                );
              } else {
                return (
                  <React.Fragment key={row.id}>
                    <TableRow>
                      <TableCell padding="checkbox" sx={isExpanded ? styles.cell : styles.closeCell}>
                        <Collapse in={isExpanded} timeout="auto" unmountOnExit></Collapse>
                      </TableCell>
                      <TableCell sx={isExpanded ? styles.cell : styles.closeCell}>
                        <Collapse in={isExpanded} timeout="auto" unmountOnExit></Collapse>
                      </TableCell>
                      {headers.map((header) => (
                        <TableCell key={header.key} sx={isExpanded ? styles.cell : styles.closeCell}>
                          <Collapse in={isExpanded} timeout="auto" unmountOnExit>
                            {row[header.key]}
                          </Collapse>
                        </TableCell>
                      ))}
                      <TableCell sx={isExpanded ? styles.cell : styles.closeCell}>
                        <Collapse in={isExpanded} timeout="auto" unmountOnExit></Collapse>
                      </TableCell>
                      <TableCell sx={isExpanded ? styles.cell : styles.closeCell}>
                        <Collapse in={isExpanded} timeout="auto" unmountOnExit></Collapse>
                      </TableCell>
                    </TableRow>
                  </React.Fragment>
                );
              }
            })}
          </TableBody>
        </Table>
      </TableContainer>
    </Paper>
  );
};

/* style
---------------------------------------------------------------------------------------------------- */
/** @type {{ [key: string]: React.CSSProperties }} style */
const styles: { [key: string]: React.CSSProperties } = {
  cell: {},
  closeCell: {
    border: 'none',
    paddingTop: 0,
    paddingBottom: 0,
  },
};
