import { CheckBox } from '@mui/icons-material';
import {
  Box,
  Button,
  Checkbox,
  Dialog,
  DialogContent,
  DialogTitle,
  Paper,
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

export const EquipmentSelectionDialog = (props: { handleCloseDialog: VoidFunction }) => {
  const [eqSelected, setSelectedEq] = useState<readonly number[]>([]);

  const [bundleDialogOpen, setBundleDialogOpen] = useState(false);
  const handleClickEqSelected = () => {
    if (eqSelected.length !== 0) {
      setBundleDialogOpen(true);
    }
  };
  const handleCloseBundle = () => {
    setBundleDialogOpen(false);
    props.handleCloseDialog();
  };
  return (
    <>
      <DialogTitle display={'flex'} marginTop={2} p={1} sx={{ bgcolor: grey[400] }} alignItems={'center'}>
        <Typography whiteSpace="nowrap" textAlign={'center'}>
          機材入力
        </Typography>
        <Button onClick={() => props.handleCloseDialog()}>戻る</Button>
      </DialogTitle>
      <Box display={'flex'} p={1} sx={{ bgcolor: grey[300] }} justifyContent={'space-between'}>
        <Box></Box>
        <TextField />
        <Button onClick={() => handleClickEqSelected()}>確定</Button>
        <Dialog open={bundleDialogOpen} onClose={() => setBundleDialogOpen(false)}>
          <BundleDialog handleClose={handleCloseBundle} />
        </Dialog>
      </Box>
      <Box display={'flex'} p={1} sx={{ bgcolor: grey[300] }} justifyContent={'space-between'}>
        <EquipmentCategoriesTable />
        <EquipmentTable eqSelected={eqSelected} setSelectedEq={setSelectedEq} />
      </Box>
    </>
  );
};

const BundleDialog = (props: { handleClose: VoidFunction }) => {
  return (
    <>
      <DialogTitle justifyContent={'space-between'} display={'flex'}>
        セットオプション
        <Box>
          <Button onClick={() => props.handleClose()}>確定</Button>
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
                return (
                  <TableRow hover role="checkbox" tabIndex={-1} key={row.name} sx={{ cursor: 'pointer' }}>
                    <TableCell padding="checkbox">
                      <Checkbox color="primary" />
                    </TableCell>
                    <TableCell component="th" scope="row" padding="none">
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
