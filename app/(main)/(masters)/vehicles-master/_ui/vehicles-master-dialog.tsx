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
import { IsDirtyDialog } from '../../_ui/isdirty-dialog';
import { emptyVeh, formItems } from '../_lib/datas';
import { VehsMasterDialogSchema, VehsMasterDialogValues } from '../_lib/types';
/**
 * 車両マスタの詳細ダイアログ
 * @param
 * @returns {JSX.Element} 車両マスタの詳細ダイアログのコンポーネント
 */
export const VehiclesMasterDialog = ({
  vehicleId,
  handleClose,
  refetchVehs,
}: {
  vehicleId: number;
  handleClose: () => void;
  refetchVehs: () => void;
}) => {
  /* useState --------------------- */
  /** DBのローディング状態 */
  const [isLoading, setIsLoading] = useState(true);
  /* ダイアログでの編集モードかどうか */
  const [editable, setEditable] = useState(false);
  /* 新規作成かどうか */
  const [isNew, setIsNew] = useState(false);
  /* 未保存ダイアログ出すかどうか */
  const [dirtyOpen, setDirtyOpen] = useState(false);
  /* submit時のactions (save,) */
  const [action, setAction] = useState<'save' | 'delete' | undefined>(undefined);

  /* useForm ------------------------ */
  const {
    control,
    handleSubmit,
    reset,
    formState: { isDirty },
  } = useForm({
    mode: 'onBlur',
    reValidateMode: 'onBlur',
    resolver: zodResolver(VehsMasterDialogSchema),
    defaultValues: {
      sharyoNam: '',
      delFlg: false,
      dspFlg: true,
      mem: '',
    },
  });

  /* methods ---------------------- */
  /* フォームを送信 */
  const onSubmit = async (data: VehsMasterDialogValues) => {
    console.log('isDarty : ', isDirty);
    console.log(data);
    // if (VehicleId === -100) {
    //   await addNewVeh(data);
    // } else {
    // if (action === 'save') {
    //   await updateVeh(data, vehicleId);
    // } else if (action === 'delete') {
    //   await updateVeh({ ...data, delFlg: true }, vehicleId);
    // }
    // }
    handleCloseDialog();
    refetchVehs();
  };

  /* 詳細ダイアログを閉じる */
  const handleCloseDialog = () => {
    setEditable(false);
    setIsNew(false);
    handleClose();
  };

  /* 未保存ダイアログを閉じる */
  const handleCloseDirty = () => {
    setDirtyOpen(false);
  };

  /* ×ぼたんを押したとき */
  const handleClickClose = () => {
    console.log('isDirty : ', isDirty);
    if (isDirty) {
      setDirtyOpen(true);
    } else {
      handleCloseDialog();
    }
  };

  /* useEffect --------------------------------------- */
  /* eslint-disable react-hooks/exhaustive-deps */
  useEffect(() => {
    console.log('★★★★★★★★★★★★★★★★★★★★★');
    const getThatOneVeh = async () => {
      if (vehicleId === -100) {
        // 新規追加モード
        reset(emptyVeh); // フォーム初期化
        setEditable(true); // 編集モードにする
        setIsLoading(false);
        setIsNew(true);
      } else {
        // const Veh1 = await getOneVeh(VehicleId);
        // if (Veh1) {
        //   setVehicle(Veh1);
        //   reset(Veh1); // 取得したデータでフォーム初期化
        // }
        setIsLoading(false);
      }
    };
    getThatOneVeh();
  }, [vehicleId]);
  /* eslint-enable react-hooks/exhaustive-deps */

  return (
    <>
      <form onSubmit={handleSubmit(onSubmit)}>
        <MasterDialogTitle
          editable={editable}
          handleEditable={() => setEditable(true)}
          handleClose={handleClickClose}
          dialogTitle={'車両マスタ登録'}
          isNew={isNew}
          isDirty={isDirty}
          setAction={setAction}
        />
        {isLoading ? ( //DB
          <Loading />
        ) : (
          <>
            <Grid2 container spacing={1} p={5} direction={'column'} justifyContent={'center'} width={'100%'}>
              <Grid2>
                <FormBox formItem={formItems[0]} required>
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
            <IsDirtyDialog open={dirtyOpen} handleCloseDirty={handleCloseDirty} handleCloseAll={handleCloseDialog} />
          </>
        )}
      </form>
    </>
  );
};
