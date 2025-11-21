import { zodResolver } from '@hookform/resolvers/zod';
import DeleteIcon from '@mui/icons-material/Delete';
import { Autocomplete, Box, Button, Grid2, Stack, TextField, Typography } from '@mui/material';
import { useEffect, useState } from 'react';
import { Controller, useFieldArray, useForm } from 'react-hook-form';
import { TextFieldElement } from 'react-hook-form-mui';

import { useUserStore } from '@/app/_lib/stores/usestore';
import { FormBox, SelectTypes } from '@/app/(main)/_ui/form-box';
import { Loading } from '@/app/(main)/_ui/loading';

import { FAKE_NEW_ID } from '../../_lib/constants';
import { MasterDialogTitle } from '../../_ui/dialog-title';
import { IsDirtyAlertDialog, WillDeleteAlertDialog } from '../../_ui/dialogs';
import { getEqptNam } from '../../rfid-master/[kizaiId]/_lib/funcs';
import { emptyEqptSet, formItems } from '../_lib/datas';
import { addNewEqptSet, getChosenEqptSet, getEqptsForEqptSelection, updateEqptSet } from '../_lib/funcs';
import { EqptSetsMasterDialogSchema, EqptSetsMasterDialogValues } from '../_lib/types';

/**
 * 機材セットマスタ詳細ダイアログ
 * @param
 * @returns {JSX.Element} 機材セットマスタ詳細ダイアログコンポーネント
 */
export const EqptSetsMasterDialog = ({
  oyaId,
  handleClose,
  refetchEqptSets,
}: {
  oyaId: number;
  handleClose: () => void;
  refetchEqptSets: () => void;
}) => {
  // ログインユーザ
  const user = useUserStore((state) => state.user);

  /* useState -------------------------------------- */
  /* DBのローディング状態 */
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
  /** 機材選択肢 */
  const [options, setOptions] = useState<SelectTypes[]>([]);
  /** 機材名 */
  const [kizaiNam, setKizaiNam] = useState<string>('');

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
    resolver: zodResolver(EqptSetsMasterDialogSchema),
    defaultValues: emptyEqptSet,
  });

  const isDeleted = watch('delFlg');
  const setList = watch('setEqptList');

  const setField = useFieldArray({ control, name: 'setEqptList' });

  /* methods ---------------------------------------- */
  /* フォームを送信 */
  const onSubmit = async (data: EqptSetsMasterDialogValues) => {
    console.log('isDarty : ', isDirty);
    console.log(data);
    if (oyaId === FAKE_NEW_ID) {
      await addNewEqptSet(data, user?.name ?? '');
      handleCloseDialog();
      refetchEqptSets();
    } else {
      if (action === 'save') {
        await updateEqptSet(data, oyaId, user?.name ?? '');
        handleCloseDialog();
        refetchEqptSets();
      } else if (action === 'delete') {
        setDeleteOpen(true);
        return;
      } else if (action === 'restore') {
        // 有効化ボタン
        const values = await getValues();
        await updateEqptSet({ ...values, delFlg: false }, oyaId, user?.name ?? '');
        handleCloseDialog();
        refetchEqptSets();
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
    const values = await getValues();
    await updateEqptSet({ ...values, delFlg: true }, oyaId, user?.name ?? '');
    setDeleteOpen(false);
    handleCloseDialog();
    await refetchEqptSets();
  };

  /* useEffect --------------------------------------- */
  useEffect(() => {
    console.log('★★★★★★★★★★★★★★★★★★★★★');
    const getThatOneEqptSet = async () => {
      if (oyaId === FAKE_NEW_ID) {
        // 新規追加モード
        const op = await getEqptsForEqptSelection();
        if (!op) {
          setOptions([]);
        } else {
          setOptions(op);
        }
        reset(emptyEqptSet); // フォーム初期化
        setEditable(true); // 編集モードにする
        setIsLoading(false);
        setIsNew(true);
      } else {
        const oyaEqptNam = await getEqptNam(oyaId);
        setKizaiNam(oyaEqptNam);
        const eqptSet1 = await getChosenEqptSet(oyaId);
        if (eqptSet1) {
          reset(eqptSet1); // 取得したデータでフォーム初期化
          // }
          setIsLoading(false);
        }
      }
    };
    getThatOneEqptSet();
  }, [oyaId, reset]);

  return (
    <>
      <form onSubmit={handleSubmit(onSubmit)}>
        <MasterDialogTitle
          editable={editable}
          handleEditable={() => setEditable(true)}
          handleClose={handleClickClose}
          dialogTitle="機材セットマスタ登録"
          isNew={isNew}
          isDirty={isDirty}
          setAction={setAction}
          isDeleted={isDeleted!}
        />
        {isLoading ? (
          <Loading />
        ) : (
          <>
            <Grid2 container spacing={1} p={5} direction={'column'} justifyContent={'center'} width={'100%'}>
              <FormBox formItem={formItems[0]} required>
                {isNew ? (
                  <Controller
                    name="eqptId"
                    control={control}
                    disabled={editable ? false : true}
                    render={({ field }) => (
                      <Autocomplete
                        {...field}
                        options={options.sort((a, b) => a.grpId! - b.grpId!)}
                        groupBy={(option) => option.grpNam!}
                        getOptionLabel={(option) => option.label ?? ''}
                        getOptionKey={(option) => option.id ?? FAKE_NEW_ID}
                        isOptionEqualToValue={(option, value) => option.id === value.id}
                        value={options.find((opt) => opt.id === field.value) || null}
                        onChange={(_, newValue) => {
                          field.onChange(newValue ? newValue.id : null);
                        }}
                        fullWidth
                        sx={{ maxWidth: '90%' }}
                        renderInput={(params) => (
                          <TextField {...params} label={editable ? formItems[0].exsample : ''} />
                        )}
                      />
                    )}
                  />
                ) : (
                  <TextField value={kizaiNam} disabled />
                )}
              </FormBox>
              <FormBox formItem={formItems[2]}>
                <TextFieldElement
                  multiline
                  name="mem"
                  control={control}
                  label={editable ? formItems[2].exsample : ''}
                  fullWidth
                  sx={{ maxWidth: '90%' }}
                  disabled={editable ? false : true}
                />
              </FormBox>
              <FormBox formItem={formItems[2]}>
                <TextFieldElement
                  multiline
                  name="setEqptList"
                  control={control}
                  label={editable ? formItems[2].exsample : ''}
                  fullWidth
                  sx={{ maxWidth: '90%' }}
                  disabled={editable ? false : true}
                />
              </FormBox>
              <FormBox formItem={formItems[3]} align="baseline">
                <Box width={'100%'} border={1} borderColor={'divider'} p={1}>
                  <Button onClick={() => {} /*setEqSelectOpen(true)*/} disabled={editable ? false : true}>
                    機材選択
                  </Button>
                  {/* <EqptIsshikiSelectionDialog
                    open={eqSelectOpen}
                    isshikiId={isshikiId}
                    currentEqptList={kizaiList.map((d) => d.id)}
                    setOpen={setEqSelectOpen}
                    setValue={setValue}
                  /> */}

                  {setField.fields.map((d, index) => (
                    <Stack key={d.id} sx={{ width: '100%', my: 0.5 }}>
                      <Button
                        color="error"
                        sx={{ paddingX: 1, paddingY: 0, minWidth: 0 }}
                        onClick={() => {
                          setField.remove(index);
                        }}
                        disabled={editable ? false : true}
                      >
                        <DeleteIcon fontSize="small" />
                      </Button>
                      {/* <TextFieldElement name={`kizaiList.${index}.nam`} control={control} /> */}
                      <Typography whiteSpace={'nowrap'} sx={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {setList[index].nam}
                      </Typography>
                    </Stack>
                  ))}
                </Box>
              </FormBox>
            </Grid2>
            <IsDirtyAlertDialog
              open={dirtyOpen}
              handleCloseDirty={() => setDirtyOpen(false)}
              handleCloseAll={handleCloseDialog}
            />
            <WillDeleteAlertDialog
              open={deleteOpen}
              data={'name'}
              handleCloseDelete={() => setDeleteOpen(false)}
              handleCloseAll={handleConfirmDelete}
            />
          </>
        )}
      </form>
    </>
  );
};
