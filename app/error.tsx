'use client';

import { Box, Button, Paper, Typography } from '@mui/material';
import { useRouter } from 'next/navigation';
import { startTransition, useEffect } from 'react';

const Error = ({ error, reset }: { error: Error; reset: () => void }) => {
  const router = useRouter();

  const handleReset = () => {
    startTransition(() => {
      router.refresh();
      reset();
    });
  };

  useEffect(() => {
    console.error('Error:', error);
  }, [error]);

  return (
    <Box
      display="flex"
      flexDirection="column"
      alignItems="center"
      justifyContent="center"
      minHeight="100vh"
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
        <Typography variant="h5" component="h2" fontWeight="bold" gutterBottom>
          問題が発生しました
        </Typography>

        <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
          管理者にお問い合わせください。
        </Typography>

        <Button
          variant="contained"
          onClick={handleReset}
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
