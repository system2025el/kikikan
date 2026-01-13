import { zodResolver } from '@hookform/resolvers/zod';
import { Grid2 } from '@mui/material';
import { JSX, useEffect, useState } from 'react';
import { CheckboxElement, TextareaAutosizeElement, TextFieldElement, useForm } from 'react-hook-form-mui';

import { User, useUserStore } from '@/app/_lib/stores/usestore';

import { FormBox } from '../../../_ui/form-box';
import { Loading } from '../../../_ui/loading';
import { FAKE_NEW_ID } from '../../_lib/constants';
import { MasterDialogTitle } from '../../_ui/dialog-title';
import { IsDirtyAlertDialog, WillDeleteAlertDialog } from '../../_ui/dialogs';
import { emptyVeh, formItems } from '../_lib/datas';
import { addNewVeh, getChosenVeh, updateVeh } from '../_lib/funcs';
import { VehsMasterDialogSchema, VehsMasterDialogValues } from '../_lib/types';
/**
 * 車両マスタの詳細ダイアログ
 * @param
 * @returns {JSX.Element} 車両マスタの詳細ダイアログのコンポーネント
 */
export const VehiclesMasterDialog = ({
  user,
  vehicleId,
  handleClose,
  refetchVehs,
}: {
  user: User | null;
  vehicleId: number;
  handleClose: () => void;
  refetchVehs: () => Promise<void>;
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
  /* 削除フラグ確認ダイアログ出すかどうか */
  const [deleteOpen, setDeleteOpen] = useState(false);
  /* submit時のactions (save, delete) */
  const [action, setAction] = useState<'save' | 'delete' | 'restore' | undefined>(undefined);

  /* useForm ------------------------ */
  const {
    control,
    formState: { isDirty },
    watch,
    handleSubmit,
    reset,
    getValues,
  } = useForm({
    mode: 'onChange',
    reValidateMode: 'onChange',
    resolver: zodResolver(VehsMasterDialogSchema),
    defaultValues: {},
  });

  const isDeleted = watch('delFlg');
  const name = watch('sharyoNam');

  /* methods ---------------------- */
  /* フォームを送信 */
  const onSubmit = async (data: VehsMasterDialogValues) => {
    setIsLoading(true);
    console.log('isDarty : ', isDirty);
    console.log(data);
    if (vehicleId === FAKE_NEW_ID) {
      await addNewVeh(data, user?.name ?? '');
      handleCloseDialog();
      setIsLoading(false);
      refetchVehs();
    } else {
      if (action === 'save') {
        await updateVeh(data, vehicleId, user?.name ?? '');
        handleCloseDialog();
        setIsLoading(false);
        refetchVehs();
      } else if (action === 'delete') {
        setIsLoading(false);
        setDeleteOpen(true);
        return;
      } else if (action === 'restore') {
        // 有効化ボタン
        const values = await getValues();
        await updateVeh({ ...values, delFlg: false }, vehicleId, user?.name ?? '');
        handleCloseDialog();
        setIsLoading(false);
        refetchVehs();
      }
    }
  };

  /* 詳細ダイアログを閉じる */
  const handleCloseDialog = () => {
    setEditable(false);
    setIsNew(false);
    handleClose();
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

  /* 削除確認ダイアログで削除選択時 */
  const handleConfirmDelete = async () => {
    setIsLoading(true);
    const values = await getValues();
    await updateVeh({ ...values, delFlg: true }, vehicleId, user?.name ?? '');
    setDeleteOpen(false);
    handleCloseDialog();
    setIsLoading(false);
    await refetchVehs();
  };

  /* useEffect --------------------------------------- */
  useEffect(() => {
    console.log('★★★★★★★★★★★★★★★★★★★★★');
    const getThatOneVeh = async () => {
      if (vehicleId === FAKE_NEW_ID) {
        // 新規追加モード
        reset(emptyVeh); // フォーム初期化
        setEditable(true); // 編集モードにする
        setIsLoading(false);
        setIsNew(true);
      } else {
        const Veh1 = await getChosenVeh(vehicleId);
        if (Veh1) {
          reset(Veh1); // 取得したデータでフォーム初期化
        }
        setIsLoading(false);
      }
    };
    getThatOneVeh();
  }, [vehicleId, reset]);

  return (
    <>
      <form onSubmit={handleSubmit(onSubmit)}>
        <MasterDialogTitle
          user={user}
          editable={editable}
          handleEditable={() => setEditable(true)}
          handleClose={handleClickClose}
          dialogTitle={'車両マスタ登録'}
          isNew={isNew}
          isDirty={isDirty}
          isDeleted={isDeleted!}
          push={isLoading}
          setAction={setAction}
        />
        {isLoading ? ( //DB
          <Loading />
        ) : (
          <>
            <Grid2 container spacing={1} p={5} direction={'column'} justifyContent={'center'} width={'100%'}>
              <FormBox formItem={formItems[0]} required>
                <TextFieldElement
                  name="sharyoNam"
                  control={control}
                  label={editable ? formItems[0].exsample : ''}
                  fullWidth
                  sx={{ maxWidth: '90%' }}
                  disabled={editable ? false : true}
                />
              </FormBox>
              <FormBox formItem={formItems[2]}>
                <TextFieldElement
                  multiline
                  name="mem"
                  control={control}
                  label={editable ? formItems[2].exsample : ''}
                  fullWidth
                  minRows={3}
                  maxRows={3}
                  sx={{ maxWidth: '90%' }}
                  disabled={editable ? false : true}
                />
              </FormBox>
              <FormBox formItem={formItems[3]}>
                <CheckboxElement name="dspFlg" control={control} size="medium" disabled={editable ? false : true} />
              </FormBox>
            </Grid2>
            <IsDirtyAlertDialog
              open={dirtyOpen}
              handleCloseDirty={() => setDirtyOpen(false)}
              handleCloseAll={handleCloseDialog}
            />
            <WillDeleteAlertDialog
              open={deleteOpen}
              data={name}
              push={isLoading}
              handleCloseDelete={() => setDeleteOpen(false)}
              handleConfirmDelete={handleConfirmDelete}
            />
          </>
        )}
      </form>
    </>
  );
};
