'use client';
import Delete from '@mui/icons-material/Delete';
import { IconButton, Table, TableBody, TableCell, TableContainer, TableHead, TableRow } from '@mui/material';
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
            <TableCell align="left">機材名</TableCell>
            <TableCell align="left">在庫場所</TableCell>
            <TableCell align="right">Y在庫数</TableCell>
            <TableCell align="right">K在庫数</TableCell>
            <TableCell align="right">移動予定数</TableCell>
            <TableCell align="right">最低数</TableCell>
            <TableCell align="right">読取数</TableCell>
            <TableCell align="right">補正数</TableCell>
            <TableCell align="right">差異</TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </TableContainer>
  );
};

export const ShukoIdoDenManualTable = () => {
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
            <TableCell padding="checkbox">
              <IconButton /*onClick={() => handleDelete(row.kizaiId)}*/ sx={{ color: 'red' }}>
                <Delete fontSize="small" />
              </IconButton>
            </TableCell>
            <TableCell padding="checkbox">{1}</TableCell>
            <TableCell align="left">機材名</TableCell>
            <TableCell align="left">在庫場所</TableCell>
            <TableCell align="right">Y在庫数</TableCell>
            <TableCell align="right">K在庫数</TableCell>
            <TableCell align="right">移動予定数</TableCell>
            <TableCell align="right">読取数</TableCell>
            <TableCell align="right">補正数</TableCell>
            <TableCell align="right">差異</TableCell>
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
            <TableCell align="left">機材名</TableCell>
            <TableCell align="right">入庫予定数</TableCell>
            <TableCell align="right">読取数</TableCell>
            <TableCell align="right">補正数</TableCell>
            <TableCell align="right">差異</TableCell>
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
};
