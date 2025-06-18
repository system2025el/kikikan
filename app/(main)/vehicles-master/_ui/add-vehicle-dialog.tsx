import { CheckBox } from '@mui/icons-material';
import {
  alpha,
  Box,
  Button,
  Container,
  DialogTitle,
  Grid2,
  Paper,
  Stack,
  TextField,
  Typography,
  useTheme,
} from '@mui/material';
import { TextFieldElement } from 'react-hook-form-mui';

import { FormBox } from '../../_ui/form-box';

export const AddVehicleDialog = (props: {
  vehicleId: string | number;
  handleClose: () => void;
  editable: boolean;
  setEditable: React.Dispatch<React.SetStateAction<boolean>>;
}) => {
  const { vehicleId, handleClose, editable, setEditable } = props;
  const theme = useTheme();
  const colorOfThis = alpha(theme.palette.primary.main, 0.5);

  const handleEditable = () => {
    setEditable(true);
  };
  return (
    <>
      <DialogTitle display={'flex'} justifyContent={'space-between'} alignItems={'center'} bgcolor={colorOfThis}>
        新規車両
        {editable && <Typography>編集モード</Typography>}
        <Stack>
          <Button /*type="submit"*/ onClick={() => handleClose()}>保存</Button>
          <Button
            onClick={() => {
              handleEditable();
              console.log('pushpushpush');
            }}
          >
            編集
          </Button>
        </Stack>
      </DialogTitle>

      <Grid2 container spacing={1} p={5} direction={'column'} justifyContent={'center'} width={'100%'}>
        <Grid2>
          <FormBox label="車両名" description="100文字まで" required={true}>
            {/* <TextFieldElement
              name=""
              control={control}
              label='100文字まで' 
              fullWidth
              sx={{ maxWidth: '80%' }}
              disabled={editable ? false : true}
            /> */}
            <TextField fullWidth label="100文字まで" sx={{ maxWidth: '80%' }} disabled={editable ? false : true} />
          </FormBox>
        </Grid2>
        <Grid2>
          <FormBox label="削除フラグ" description="論理削除（データは物理削除されません）">
            <CheckBox fontSize="medium" color="primary" />
            {/* <CheckboxElement name="delFlg" control={control} size="medium" disabled={editable ? false : true} /> */}
          </FormBox>
        </Grid2>
        <Grid2>
          <FormBox label="メモ" description="200文字まで">
            {/* <TextFieldElement ////////////// 200文字までの設定をしなければならない
                        name="mem"
                        control={control}
                        label={formItems[13].description}
                        fullWidth
                        sx={{ maxWidth: '80%' }}
                        disabled={editable ? false : true}
                      /> */}
            <TextField fullWidth label="200文字まで" sx={{ maxWidth: '80%' }} disabled={editable ? false : true} />
          </FormBox>
        </Grid2>
        <Grid2>
          <FormBox label="表示フラグ" description="選択リストへの表示">
            <CheckBox fontSize="medium" color="primary" />
            {/* <CheckboxElement name="delFlg" control={control} size="medium" disabled={editable ? false : true} /> */}
          </FormBox>
        </Grid2>
      </Grid2>
    </>
  );
};
