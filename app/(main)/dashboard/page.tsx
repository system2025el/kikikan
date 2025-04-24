import { Container } from '@mui/material';
import { grey } from '@mui/material/colors';

import { Dashboard } from './_ui/dashboard';

const Page = () => {
  return (
    <>
      <Container sx={{ minHeight: '100vh', minWidth: '100%', bgcolor: grey[300] }} maxWidth={'xl'}>
        <Dashboard />
      </Container>
    </>
  );
};

export default Page;
