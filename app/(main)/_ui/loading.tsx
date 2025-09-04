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

export const LoadingOverlay = () => {
  return (
    <Box
      sx={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        backgroundColor: 'rgba(255,255,255,0.6)',
        zIndex: 10,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <CircularProgress size={'100px'} />
    </Box>
  );
};
