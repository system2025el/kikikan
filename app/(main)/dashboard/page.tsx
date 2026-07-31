import { Container } from '@mui/material';
import { grey } from '@mui/material/colors';
import { Metadata } from 'next';
import { redirect } from 'next/navigation';

import { getCurrentUser } from '../_lib/funcs';
import { Dashboard } from './_ui/dashboard';

export const metadata: Metadata = {
  title: 'ダッシュボード',
  description: 'ダッシュボードページです',
};

const Page = async () => {
  const user = await getCurrentUser();
  if (!user) {
    await redirect('/login');
    return;
  }
  return (
    <>
      <Container sx={{ minHeight: '100vh', minWidth: '100%' }} maxWidth={'xl'}>
        <Dashboard />
      </Container>
    </>
  );
};

export default Page;
