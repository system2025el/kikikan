'use client';
import Delete from '@mui/icons-material/Delete';
import { IconButton, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TextField } from '@mui/material';
import { purple } from '@mui/material/colors';
import { usePathname, useRouter } from 'next/navigation';

export const ShukoIdoDenTable = () => {
  const router = useRouter();
  const path = usePathname();

  const handleClick = () => {
    router.push(`${path}/ido-eqpt-detail/1`);
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
          <TableRow onClick={handleClick} style={{ cursor: 'pointer' }} hover sx={{ whiteSpace: 'nowrap' }}>
            <TableCell padding="checkbox"></TableCell>
            <TableCell padding="checkbox">{1}</TableCell>
            <TableCell align="left">X001</TableCell>
            <TableCell align="left">Y</TableCell>
            <TableCell align="right">10</TableCell>
            <TableCell align="right">5</TableCell>
            <TableCell align="right">8</TableCell>
            <TableCell align="right">3</TableCell>
            <TableCell align="right" size="small">
              <TextField
                onClick={(e) => {
                  e.stopPropagation();
                }}
                type="number"
                defaultValue={0}
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
            <TableCell align="right">0</TableCell>
            <TableCell align="right">0</TableCell>
            <TableCell align="right">0</TableCell>
          </TableRow>
          <TableRow onClick={handleClick} style={{ cursor: 'pointer' }} hover sx={{ whiteSpace: 'nowrap' }}>
            <TableCell padding="checkbox"></TableCell>
            <TableCell padding="checkbox">{2}</TableCell>
            <TableCell align="left">X002</TableCell>
            <TableCell align="left">Y</TableCell>
            <TableCell align="right">12</TableCell>
            <TableCell align="right">5</TableCell>
            <TableCell align="right">5</TableCell>
            <TableCell align="right">0</TableCell>
            <TableCell align="right" size="small">
              <TextField
                onClick={(e) => {
                  e.stopPropagation();
                }}
                type="number"
                value={0}
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
            <TableCell align="right">0</TableCell>
            <TableCell align="right">0</TableCell>
            <TableCell align="right">0</TableCell>
          </TableRow>
          <TableRow onClick={handleClick} style={{ cursor: 'pointer' }} hover sx={{ whiteSpace: 'nowrap' }}>
            <TableCell padding="checkbox">
              <IconButton /*onClick={() => handleDelete(row.kizaiId)}*/ sx={{ color: 'red' }}>
                <Delete fontSize="small" />
              </IconButton>
            </TableCell>
            <TableCell padding="checkbox">{3}</TableCell>
            <TableCell align="left">X011</TableCell>
            <TableCell align="left">Y</TableCell>
            <TableCell align="right">7</TableCell>
            <TableCell align="right">0</TableCell>
            <TableCell align="right">0</TableCell>
            <TableCell align="right">0</TableCell>
            <TableCell align="right" size="small">
              <TextField
                onClick={(e) => {
                  e.stopPropagation();
                }}
                type="number"
                value={0}
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
            <TableCell align="right">0</TableCell>
            <TableCell align="right">0</TableCell>
            <TableCell align="right">0</TableCell>
          </TableRow>
          <TableRow onClick={handleClick} style={{ cursor: 'pointer' }} hover sx={{ whiteSpace: 'nowrap' }}>
            <TableCell padding="checkbox">
              <IconButton /*onClick={() => handleDelete(row.kizaiId)}*/ sx={{ color: 'red' }}>
                <Delete fontSize="small" />
              </IconButton>
            </TableCell>
            <TableCell padding="checkbox">{4}</TableCell>
            <TableCell align="left">X012</TableCell>
            <TableCell align="left">Y</TableCell>
            <TableCell align="right">8</TableCell>
            <TableCell align="right">3</TableCell>
            <TableCell align="right">0</TableCell>
            <TableCell align="right">0</TableCell>
            <TableCell align="right" size="small">
              <TextField
                onClick={(e) => {
                  e.stopPropagation();
                }}
                type="number"
                value={0}
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
            <TableCell align="right">0</TableCell>
            <TableCell align="right">0</TableCell>
            <TableCell align="right">0</TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </TableContainer>
  );
};

export const NyukoIdoDenTable = () => {
  const router = useRouter();
  const path = usePathname();

  const handleClick = () => {
    router.push(`${path}/ido-eqpt-detail/1`);
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
          <TableRow onClick={handleClick} style={{ cursor: 'pointer' }} hover sx={{ whiteSpace: 'nowrap' }}>
            <TableCell padding="checkbox">{1}</TableCell>
            <TableCell align="left">X001</TableCell>
            <TableCell align="right">3</TableCell>
            <TableCell align="right">2</TableCell>
            <TableCell align="right">1</TableCell>
            <TableCell align="right">0</TableCell>
          </TableRow>
          <TableRow onClick={handleClick} style={{ cursor: 'pointer' }} hover sx={{ whiteSpace: 'nowrap' }}>
            <TableCell padding="checkbox">{2}</TableCell>
            <TableCell align="left">X002</TableCell>
            <TableCell align="right">0</TableCell>
            <TableCell align="right">0</TableCell>
            <TableCell align="right">0</TableCell>
            <TableCell align="right">0</TableCell>
          </TableRow>
          <TableRow onClick={handleClick} style={{ cursor: 'pointer' }} hover sx={{ whiteSpace: 'nowrap' }}>
            <TableCell padding="checkbox">{3}</TableCell>
            <TableCell align="left">X011</TableCell>
            <TableCell align="right">3</TableCell>
            <TableCell align="right">2</TableCell>
            <TableCell align="right">1</TableCell>
            <TableCell align="right">0</TableCell>
          </TableRow>
          <TableRow onClick={handleClick} style={{ cursor: 'pointer' }} hover sx={{ whiteSpace: 'nowrap' }}>
            <TableCell padding="checkbox">{4}</TableCell>
            <TableCell align="left">X012</TableCell>
            <TableCell align="right">0</TableCell>
            <TableCell align="right">0</TableCell>
            <TableCell align="right">0</TableCell>
            <TableCell align="right">0</TableCell>
          </TableRow>
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
