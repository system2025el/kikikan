import { Box, Button, DialogTitle, TextField, Typography } from '@mui/material';
import { grey } from '@mui/material/colors';

import { EquipmentCategoriesTable } from './equipment-category-table';
import { EquipmentTable } from './equipments-table';

export const EquipmentSelectionDialog = (props: { handleCloseDialog: VoidFunction }) => {
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
        <Button>確定</Button>
      </Box>
      <Box display={'flex'} p={1} sx={{ bgcolor: grey[300] }} justifyContent={'space-between'}>
        <EquipmentCategoriesTable />
        <EquipmentTable />
      </Box>
    </>
  );
};
