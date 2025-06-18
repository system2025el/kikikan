import { Grid2, Typography } from '@mui/material';

export const FormBox = ({
  children,
  label,
  description,
  required,
}: {
  children: React.ReactNode;
  label: string;
  description: string;
  required?: boolean;
}) => {
  return (
    <Grid2 container spacing={1} direction={'row'} width={'100%'} alignItems={'center'}>
      <Grid2 size={1}>
        {required && (
          <Typography color="error" align="right">
            *必須
          </Typography>
        )}
      </Grid2>
      <Grid2 size={2}>
        <Typography>{label}</Typography>
      </Grid2>
      <Grid2 size={5}>{children}</Grid2>
      <Grid2 size={4}>
        <Typography>{description}</Typography>
      </Grid2>
    </Grid2>
  );
};
