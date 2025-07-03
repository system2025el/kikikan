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
import { JSX, useEffect, useState } from 'react';
import { CheckboxElement, TextareaAutosizeElement, TextFieldElement, useForm } from 'react-hook-form-mui';

// import { addNewVehicle, getOneVehicle } from '@/app/_lib/supabase/supabaseFuncs';
import { FormBox, FormItemsType } from '../../../_ui/form-box';
import { Loading } from '../../../_ui/loading';
import { MasterDialogTitle } from '../../_ui/dialog-title';
import { VehMasterDialogSchema, VehMasterDialogValues } from '../_lib/datas';
/**
 * 車両マスタの詳細ダイアログ
 * @param
 * @returns {JSX.Element} 車両マスタの詳細ダイアログのコンポーネント
 */
export const VehiclesMasterDialog = ({
  vehicleId,
  handleClose,
  editable,
  setEditable,
}: {
  vehicleId: number;
  handleClose: () => void;
  editable: boolean;
  setEditable: React.Dispatch<React.SetStateAction<boolean>>;
}) => {
  const [veh, setVeh] = useState<VehMasterDialogValues>();
  const [isLoading, setIsLoading] = useState(true);
  const handleEditable = () => {
    setEditable(true);
  };
  const handleCloseDialog = () => {
    setEditable(false);
    handleClose();
  };

  const onSubmit = async (data: VehMasterDialogValues) => {
    console.log('★★★★★★★★★ ', data);
    handleCloseDialog();
    // await addNewVehicle(data!);
  };
  const { control, handleSubmit, reset } = useForm({
    mode: 'onBlur',
    reValidateMode: 'onBlur',
    resolver: zodResolver(VehMasterDialogSchema),
    defaultValues: {
      sharyoNam: '',
      delFlg: false,
      dspFlg: true,
      mem: '',
    },
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
          editable={editable}
          handleEditable={handleEditable}
          handleCloseDialog={handleCloseDialog}
          dialogTitle={'車両マスタ'}
        />
        {/* {isLoading ? ( //DB
          <Loading />
        ) : ( */}
        <>
          <Grid2 container spacing={1} p={5} direction={'column'} justifyContent={'center'} width={'100%'}>
            <Grid2>
              <FormBox formItem={formItems[0]} required={true}>
                <TextFieldElement
                  name="sharyoNam"
                  control={control}
                  label={formItems[0].exsample}
                  fullWidth
                  sx={{ maxWidth: '90%' }}
                  disabled={editable ? false : true}
                />
              </FormBox>
            </Grid2>
            <Grid2>
              <FormBox formItem={formItems[1]}>
                <CheckboxElement name="delFlg" control={control} size="medium" disabled={editable ? false : true} />
              </FormBox>
            </Grid2>
            <Grid2>
              <FormBox formItem={formItems[2]}>
                <TextareaAutosizeElement ////////////// 200文字までの設定をしなければならない
                  name="mem"
                  control={control}
                  label={formItems[2].exsample}
                  fullWidth
                  sx={{ maxWidth: '90%' }}
                  disabled={editable ? false : true}
                />
              </FormBox>
            </Grid2>
            <Grid2>
              <FormBox formItem={formItems[3]}>
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

const formItems: FormItemsType[] = [
  {
    label: '車両名',
    exsample: '例）ハイエース',
    constraints: '100文字まで',
  },
  {
    label: '削除フラグ',
    exsample: '',
    constraints: '論理削除（データは物理削除されません）',
  },
  {
    label: 'メモ',
    exsample: '',
    constraints: '200文字まで',
  },
  {
    label: '表示フラグ',
    exsample: '',
    constraints: '選択リストへの表示',
  },
];
