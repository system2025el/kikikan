import { zodResolver } from '@hookform/resolvers/zod';
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
import { useEffect, useState } from 'react';
import { CheckboxElement, TextFieldElement, useForm } from 'react-hook-form-mui';

import { FormBox } from '../../../_ui/form-box';
import { Loading } from '../../../_ui/loading';
import { MasterDialogTitle } from '../../_ui/dialog-title';
import { EqptMasterDialogSchema, EqptMasterDialogValues } from '../_lib/types';

export const EqMasterDialog = (props: {
  eqptId: number;
  handleClose: () => void;
  editable: boolean;
  setEditable: React.Dispatch<React.SetStateAction<boolean>>;
}) => {
  const { eqptId, handleClose, editable, setEditable } = props;
  const theme = useTheme();
  const colorOfThis = alpha(theme.palette.primary.main, 0.5);
  const [veh, setVeh] = useState<EqptMasterDialogValues>();
  const [isLoading, setIsLoading] = useState(true);
  const handleEditable = () => {
    setEditable(true);
  };
  const handleCloseDialog = () => {
    setEditable(false);
    handleClose();
  };

  const onSubmit = async (data: EqptMasterDialogValues) => {
    console.log('★★★★★★★★★ ', data);
    handleCloseDialog();
    // await addNewVehicle(data!);
  };
  const { control, handleSubmit, reset } = useForm({
    mode: 'onSubmit',
    reValidateMode: 'onSubmit',
    resolver: zodResolver(EqptMasterDialogSchema),
    defaultValues: {},
  });

  //DB
  // useEffect(() => {
  // if (vehicleId === -100) {
  //   setIsLoading(false);
  //   return;
  // } else {
  //   const getThatOneCustomer = async () => {
  //     const veh1 = await getOneVehicle(vehicleId);
  //     reset(veh1);
  //     console.log('vehId : ', vehicleId, ' sharyoId : ', veh1?.sharyoNam);
  //     setVeh(veh1!);
  //     setIsLoading(false);
  //   };
  //   getThatOneCustomer();
  // }
  // }, [vehicleId, reset]);
  return (
    <>
      <form onSubmit={handleSubmit(onSubmit)}>
        <MasterDialogTitle
          colorOfThis={colorOfThis}
          editable={editable}
          handleEditable={handleEditable}
          handleCloseDialog={handleCloseDialog}
          dialogTitle={'機材マスタ登録'}
        />
        {/* {isLoading ? ( //DB
          <Loading />
        ) : ( */}
        <>
          <Grid2 container spacing={1} p={5} direction={'column'} justifyContent={'center'} width={'100%'}>
            <Grid2>
              <FormBox label="車両名" description="100文字まで" required={true}>
                <TextFieldElement
                  name="kizaiNam"
                  control={control}
                  label="100文字まで"
                  fullWidth
                  sx={{ maxWidth: '80%' }}
                  disabled={editable ? false : true}
                />
                {/* <TextField fullWidth label="100文字まで" sx={{ maxWidth: '80%' }} disabled={editable ? false : true} /> */}
              </FormBox>
            </Grid2>
            <Grid2>
              <FormBox label="削除フラグ" description="論理削除（データは物理削除されません）">
                {/* <CheckBox fontSize="medium" color="primary" /> */}
                <CheckboxElement name="delFlg" control={control} size="medium" disabled={editable ? false : true} />
              </FormBox>
            </Grid2>
            <Grid2>
              <FormBox label="メモ" description="200文字まで">
                <TextFieldElement ////////////// 200文字までの設定をしなければならない
                  name="mem"
                  control={control}
                  label="200文字まで"
                  fullWidth
                  sx={{ maxWidth: '80%' }}
                  disabled={editable ? false : true}
                />
                {/* <TextField fullWidth label="200文字まで" sx={{ maxWidth: '80%' }} disabled={editable ? false : true} /> */}
              </FormBox>
            </Grid2>
            <Grid2>
              <FormBox label="表示フラグ" description="選択リストへの表示">
                {/* <CheckBox fontSize="medium" color="primary" /> */}
                <CheckboxElement name="dspFlg" control={control} size="medium" disabled={editable ? false : true} />
              </FormBox>
            </Grid2>
          </Grid2>
        </>
        {/* )} */}
      </form>
    </>
  );
};
