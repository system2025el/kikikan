import { Grid2, Typography } from '@mui/material';

export const FormBox = ({
  children,
  label,
  required,
}: {
  children: React.ReactNode;
  label: string;
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
      <Grid2 size={6}>{children}</Grid2>
      {/* <Grid2 size={4}></Grid2> */}
    </Grid2>
  );
};

export type FormItemsType = { label: string; description: string };
