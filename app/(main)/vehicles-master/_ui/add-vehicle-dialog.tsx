import { Box, Button, DialogTitle, Stack, TextField, Typography } from '@mui/material';
import { grey } from '@mui/material/colors';
import { Container } from 'rsuite';

export const AddVehicleDialog = (props: { handleClose: () => void }) => {
  return (
    <>
      <Container>
        <DialogTitle bgcolor={grey[300]}>
          新規車両
          <Button sx={{ ml: '50%' }} onClick={() => props.handleClose()}>
            戻る
          </Button>
        </DialogTitle>
        <Box p={10} bgcolor={grey[200]} height={'100vh'}>
          <Stack>
            <Typography>車両名</Typography>
            <TextField />
          </Stack>
          <Box height={'10%'}></Box>
          <Stack>
            <Typography>車両メモ</Typography>
            <TextField />
          </Stack>
        </Box>
      </Container>
    </>
  );
};
