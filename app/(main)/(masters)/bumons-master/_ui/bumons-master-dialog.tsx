import { zodResolver } from '@hookform/resolvers/zod';
import { Grid2, MenuItem, Select, Snackbar } from '@mui/material';
import { grey } from '@mui/material/colors';
import { useEffect, useState } from 'react';
import { Controller, TextareaAutosizeElement, TextFieldElement, useForm } from 'react-hook-form-mui';

import { User, useUserStore } from '@/app/_lib/stores/usestore';
import { Loading } from '@/app/(main)/_ui/loading';

import { FormBox, selectNone, SelectTypes } from '../../../_ui/form-box';
import { FAKE_NEW_ID } from '../../_lib/constants';
import { getAllBumonDSSelections } from '../../_lib/funcs';
import { MasterDialogTitle } from '../../_ui/dialog-title';
import { IsDirtyAlertDialog, WillDeleteAlertDialog } from '../../_ui/dialogs';
import { emptyBumon, formItems } from '../_lib/datas';
import { addNewBumon, getChosenbumon, updateBumon } from '../_lib/funcs';
import { BumonsMasterDialogSchema, BumonsMasterDialogValues } from '../_lib/types';

/**
 * 部門マスタ詳細ダイアログ
 * @param
 * @returns {JSX.Element} 部門マスタ詳細ダイアログコンポーネント
 */
export const BumonsMasterDialog = ({
  user,
  bumonId,
  handleClose,
  refetchBumons,
}: {
  user: User | null;
  bumonId: number;
  handleClose: () => void;
  refetchBumons: () => void;
}) => {
  /* useState -------------------------------------- */
  /* 部門 */
  /* DBのローディング状態 */
  const [isLoading, setIsLoading] = useState(true);
  // エラーハンドリング
  const [error, setError] = useState<Error | null>(null);
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
  /* フォーム内のセレクトoptions */
  const [selectOptions, setSelectOptions] = useState<{
    d: SelectTypes[];
    s: SelectTypes[];
  }>({ d: [], s: [] });
  // スナックバー制御
  const [snackBarOpen, setSnackBarOpen] = useState(false);
  // スナックバーメッセージ
  const [snackBarMessage, setSnackBarMessage] = useState('');

  /* useForm ----------------------------------------- */
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
    resolver: zodResolver(BumonsMasterDialogSchema),
    defaultValues: emptyBumon,
  });

  const isDeleted = watch('delFlg');
  const name = watch('bumonNam');

  /* methods ---------------------------------------- */
  /* フォームを送信 */
  const onSubmit = async (data: BumonsMasterDialogValues) => {
    setIsLoading(true);
    console.log('isDarty : ', isDirty);
    console.log(data);
    if (bumonId === FAKE_NEW_ID) {
      // 新規の時
      try {
        await addNewBumon(data, user?.name ?? '');
      } catch (e) {
        setSnackBarMessage('保存に失敗しました');
        setSnackBarOpen(true);
        return;
      } finally {
        setIsLoading(false);
      }
      handleCloseDialog();
      refetchBumons();
    } else {
      // 更新の時
      if (action === 'save') {
        // 保存終了ボタン押したとき
        try {
          await updateBumon(data, bumonId, user?.name ?? '');
        } catch (e) {
          setSnackBarMessage('保存に失敗しました');
          setSnackBarOpen(true);
          return;
        } finally {
          setIsLoading(false);
        }
        handleCloseDialog();
        refetchBumons();
      } else if (action === 'delete') {
        setIsLoading(false);
        // 削除ボタン押したとき
        setDeleteOpen(true);
        return;
      } else if (action === 'restore') {
        // 有効化ボタン
        const values = await getValues();
        try {
          await updateBumon({ ...values, delFlg: false }, bumonId, user?.name ?? '');
        } catch (e) {
          setSnackBarMessage('有効化に失敗しました');
          setSnackBarOpen(true);
          return;
        } finally {
          setIsLoading(false);
        }
        handleCloseDialog();
        refetchBumons();
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
    try {
      await updateBumon({ ...values, delFlg: true }, bumonId, user?.name ?? '');
    } catch (e) {
      setSnackBarMessage('無効化に失敗しました');
      setSnackBarOpen(true);
      return;
    } finally {
      setDeleteOpen(false);
      setIsLoading(false);
    }
    handleCloseDialog();
    await refetchBumons();
  };

  /* useEffect --------------------------------------- */
  useEffect(() => {
    console.log('★★★★★★★★★★★★★★★★★★★★★');
    const getThatOnebumon = async () => {
      try {
        const a = await getAllBumonDSSelections();
        setSelectOptions(a!);
        if (bumonId === FAKE_NEW_ID) {
          // 新規追加モード
          reset(emptyBumon); // フォーム初期化
          setEditable(true); // 編集モードにする
          setIsLoading(false);
          setIsNew(true);
        } else {
          const bumon1 = await getChosenbumon(bumonId);
          if (bumon1) {
            reset(bumon1); // 取得したデータでフォーム初期化
          }
          setIsLoading(false);
        }
      } catch (e) {
        setError(e instanceof Error ? e : new Error(String(e)));
      }
    };
    getThatOnebumon();
  }, [bumonId, reset]);

  if (error) throw error;

  return (
    <>
      <form onSubmit={handleSubmit(onSubmit)}>
        <MasterDialogTitle
          user={user}
          editable={editable}
          handleEditable={() => setEditable(true)}
          handleClose={handleClickClose}
          dialogTitle="部門マスタ登録"
          isNew={isNew}
          isDirty={isDirty}
          push={isLoading}
          setAction={setAction}
          isDeleted={isDeleted!}
        />
        {isLoading ? (
          <Loading />
        ) : (
          <>
            <Grid2 container spacing={1} p={5} direction={'column'} justifyContent={'center'} width={'100%'}>
              <FormBox formItem={formItems[0]} required>
                <TextFieldElement
                  name="bumonNam"
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
                <Controller
                  name="daibumonId"
                  control={control}
                  defaultValue={0}
                  disabled={editable ? false : true}
                  render={({ field }) => (
                    <Select {...field} sx={{ width: 250 }}>
                      {[selectNone, ...selectOptions!.d].map((opt) => (
                        <MenuItem
                          key={opt.id}
                          value={opt.id}
                          sx={opt.id === FAKE_NEW_ID ? { color: grey[600] } : undefined}
                        >
                          {opt.label}
                        </MenuItem>
                      ))}
                    </Select>
                  )}
                />
              </FormBox>
              <FormBox formItem={formItems[4]}>
                <Controller
                  name="shukeibumonId"
                  control={control}
                  defaultValue={0}
                  disabled={editable ? false : true}
                  render={({ field }) => (
                    <Select {...field} sx={{ width: 250 }}>
                      {[selectNone, ...selectOptions!.s].map((opt) => (
                        <MenuItem
                          key={opt.id}
                          value={opt.id}
                          sx={opt.id === FAKE_NEW_ID ? { color: grey[600] } : undefined}
                        >
                          {opt.label}
                        </MenuItem>
                      ))}
                    </Select>
                  )}
                />
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
      <Snackbar
        open={snackBarOpen}
        autoHideDuration={6000}
        onClose={() => setSnackBarOpen(false)}
        message={snackBarMessage}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
        sx={{ marginTop: '65px' }}
      />
    </>
  );
};
