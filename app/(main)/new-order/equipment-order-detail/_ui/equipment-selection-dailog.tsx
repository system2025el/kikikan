import {
  Box,
  Button,
  Checkbox,
  Dialog,
  DialogContent,
  DialogTitle,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from '@mui/material';
import { grey } from '@mui/material/colors';
import { useState } from 'react';

import { bundleData } from '../_lib/eqdata';
import { EquipmentCategoriesTable } from './equipment-category-table';
import { EquipmentTable } from './equipments-table';

export const EquipmentSelectionDialog = (props: { handleCloseDialog: () => void }) => {
  const { handleCloseDialog } = props;
  const [eqSelected, setSelectedEq] = useState<readonly number[]>([]);

  const [bundleDialogOpen, setBundleDialogOpen] = useState(false);
  const handleClickEqSelected = () => {
    if (eqSelected.length !== 0) {
      setBundleDialogOpen(true);
    }
  };
  const handleCloseBundle = () => {
    setBundleDialogOpen(false);
    handleCloseDialog();
  };

  const handleClick = (event: React.MouseEvent<unknown>, id: number) => {
    const selectedIndex = eqSelected.indexOf(id);
    let newSelected: readonly number[] = [];

    if (selectedIndex === -1) {
      newSelected = newSelected.concat(eqSelected, id);
    } else if (selectedIndex === 0) {
      newSelected = newSelected.concat(eqSelected.slice(1));
    } else if (selectedIndex === eqSelected.length - 1) {
      newSelected = newSelected.concat(eqSelected.slice(0, -1));
    } else if (selectedIndex > 0) {
      newSelected = newSelected.concat(eqSelected.slice(0, selectedIndex), eqSelected.slice(selectedIndex + 1));
    }
    setSelectedEq(newSelected);
  };

  const [selectedCategory, setSelectedCategory] = useState(-100);

  const handleClickCategory = (id: number) => {
    setSelectedCategory(id);
  };
  return (
    <>
      <DialogTitle
        display={'flex'}
        marginTop={2}
        p={1}
        sx={{ bgcolor: grey[400] }}
        alignItems={'center'}
        justifyContent={'space-between'}
      >
        <Typography whiteSpace="nowrap" textAlign={'center'}>
          機材選択
        </Typography>
        <Button onClick={() => handleCloseDialog()}>戻る</Button>
      </DialogTitle>
      <Box p={1} sx={{ bgcolor: grey[200] }}>
        <Stack justifyContent="space-between" mx={1}>
          <Typography ml={1}>検索</Typography>
          <Button>検索</Button>
        </Stack>
        <Stack mx={1}>
          <Typography>キーワード</Typography>
          <TextField name="eqsearch" />
        </Stack>
      </Box>
      <Box display={'flex'} mt={2} p={2} sx={{ bgcolor: grey[200] }} justifyContent={'space-between'}>
        <Box></Box>
        <TextField sx={{ width: '2%' }} />
        <Button onClick={() => handleClickEqSelected()}>確定</Button>
        <Dialog open={bundleDialogOpen} onClose={() => setBundleDialogOpen(false)}>
          <BundleDialog handleClose={handleCloseBundle} />
        </Dialog>
      </Box>
      <Box display={'flex'} px={2} pb={2} sx={{ bgcolor: grey[200] }} justifyContent={'space-between'}>
        <EquipmentCategoriesTable selected={selectedCategory} handleClick={handleClickCategory} />
        <EquipmentTable eqSelected={eqSelected} handleSelect={handleClick} categoryID={selectedCategory} />
      </Box>
    </>
  );
};

const BundleDialog = (props: { handleClose: () => void }) => {
  const { handleClose } = props;
  const [selected, setSelected] = useState<readonly number[]>([]);
  const handleClick = (event: React.MouseEvent<unknown>, id: number) => {
    const selectedIndex = selected.indexOf(id);
    let newSelected: readonly number[] = [];

    if (selectedIndex === -1) {
      newSelected = newSelected.concat(selected, id);
    } else if (selectedIndex === 0) {
      newSelected = newSelected.concat(selected.slice(1));
    } else if (selectedIndex === selected.length - 1) {
      newSelected = newSelected.concat(selected.slice(0, -1));
    } else if (selectedIndex > 0) {
      newSelected = newSelected.concat(selected.slice(0, selectedIndex), selected.slice(selectedIndex + 1));
    }
    setSelected(newSelected);
  };

  return (
    <>
      <DialogTitle justifyContent={'space-between'} display={'flex'}>
        セットオプション
        <Box>
          <Button onClick={() => handleClose()}>確定</Button>
        </Box>
      </DialogTitle>
      <DialogContent>
        <TableContainer component={Paper} sx={{ width: 500 }}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell padding="checkbox"></TableCell>
                <TableCell>機材名</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {bundleData.map((row, index) => {
                const isItemSelected = selected.includes(row.id);
                const labelId = `enhanced-table-checkbox-${index}`;

                return (
                  <TableRow
                    hover
                    onClick={(event) => handleClick(event, row.id)}
                    role="checkbox"
                    aria-checked={isItemSelected}
                    tabIndex={-1}
                    key={row.id}
                    selected={isItemSelected}
                    sx={{ cursor: 'pointer' }}
                  >
                    <TableCell padding="checkbox">
                      <Checkbox color="primary" checked={isItemSelected} />
                    </TableCell>
                    <TableCell component="th" id={labelId} scope="row" padding="none">
                      {row.name}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      </DialogContent>
    </>
  );
};
