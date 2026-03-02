import { Container } from '@mui/material';
import { grey } from '@mui/material/colors';
import { Metadata } from 'next';

import { Dashboard } from './_ui/dashboard';

export const metadata: Metadata = {
  title: 'ダッシュボード',
  description: 'ダッシュボードページです',
};

const Page = () => {
  return (
    <>
      <Container sx={{ minHeight: '100vh', minWidth: '100%' }} maxWidth={'xl'}>
        <Dashboard />
      </Container>
    </>
  );
};

export default Page;
