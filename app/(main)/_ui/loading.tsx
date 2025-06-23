import { Box, CircularProgress, Container } from '@mui/material';

export const Loading = () => {
  return (
    <Box width={'100%'} height={'100%'} justifyItems={'center'} alignContent={'center'}>
      <Box>
        <CircularProgress size={'100px'} />
      </Box>
    </Box>
  );
};
