'use client';

import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import { Box, Button, Paper, Typography } from '@mui/material';
import { useEffect } from 'react';

const Error = ({ error, reset }: { error: Error; reset: () => void }) => {
  useEffect(() => {
    console.error('Error:', error);
  }, [error]);

  return (
    <Box
      display="flex"
      flexDirection="column"
      alignItems="center"
      justifyContent="center"
      minHeight="400px"
      p={3}
      textAlign="center"
    >
      <Paper
        elevation={0}
        sx={{
          p: 4,
          backgroundColor: 'transparent',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        {/* <ErrorOutlineIcon color="error" sx={{ fontSize: 64, mb: 2 }} /> */}

        <Typography variant="h5" component="h2" fontWeight="bold" gutterBottom>
          問題が発生しました
        </Typography>

        <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
          管理者にお問い合わせください。
        </Typography>

        {/* {error.message && (
          <Typography
            variant="caption"
            sx={{
              display: 'block',
              mb: 4,
              fontFamily: 'monospace',
              color: 'text.disabled',
              backgroundColor: '#f5f5f5',
              p: 1,
              borderRadius: 1,
            }}
          >
            Error ID: {error.message}
          </Typography>
        )} */}

        <Button
          variant="contained"
          size="large"
          onClick={() => reset()}
          sx={{
            px: 4,
            py: 1.5,
            textTransform: 'none',
            fontWeight: 'bold',
          }}
        >
          再表示
        </Button>
      </Paper>
    </Box>
  );
};
export default Error;
