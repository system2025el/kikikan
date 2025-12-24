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

/**
 *
 * @returns サイドバー以外の上にローディングを表示するコンポーネント
 */
export const LoadingOverlay = () => {
  return (
    <Box
      sx={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        backgroundColor: 'rgba(255,255,255,0.6)',
        zIndex: 1200, // drawer以上appbar未満
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <CircularProgress size={'100px'} />
    </Box>
  );
};
