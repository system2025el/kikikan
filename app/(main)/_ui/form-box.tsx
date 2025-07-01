import { Grid2, Typography } from '@mui/material';

/**
 * フォームなどをきれいに配置したいときの共通コンポーネント
 * @param
 * @returns
 */
export const FormBox = ({
  children,
  formItem,
  required,
}: {
  children: React.ReactNode;
  formItem: FormItemsType;
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
        <Typography ml={3}>{formItem.label}</Typography>
      </Grid2>
      <Grid2 size={5} alignItems={'center'} display={'flex'}>
        {children}
      </Grid2>
      <Grid2 size={4}>
        <Typography variant="body2">{formItem.constraints}</Typography>
      </Grid2>
    </Grid2>
  );
};

export type FormItemsType = { label: string; constraints: string; exsample: string; other?: string };
