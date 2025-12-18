import { zodResolver } from '@hookform/resolvers/zod';
import DeleteIcon from '@mui/icons-material/Delete';
import WarningIcon from '@mui/icons-material/Warning';
import {
  Autocomplete,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContentText,
  DialogTitle,
  Grid2,
  lighten,
  Stack,
  TextField,
  Toolbar,
  Typography,
  useTheme,
} from '@mui/material';
import { useEffect, useState } from 'react';
import { Controller, useFieldArray, useForm } from 'react-hook-form';
import { TextFieldElement } from 'react-hook-form-mui';

import { deleteEqptSets } from '@/app/_lib/db/tables/m-kizai-set';
import { useUserStore } from '@/app/_lib/stores/usestore';
import { CloseMasterDialogButton, DeleteButton, MakeEditModeButton, SubmitButton } from '@/app/(main)/_ui/buttons';
import { FormBox, SelectTypes } from '@/app/(main)/_ui/form-box';
import { Loading } from '@/app/(main)/_ui/loading';

import { FAKE_NEW_ID } from '../../_lib/constants';
import { IsDirtyAlertDialog, WillDeleteAlertDialog } from '../../_ui/dialogs';
import { getEqptNam } from '../../rfid-master/[kizaiId]/_lib/funcs';
import { emptyEqptSet, formItems } from '../_lib/datas';
import { addNewEqptSet, getChosenEqptSet, getEqptsForOyaEqptSelection, updateEqptSet } from '../_lib/funcs';
import { EqptSetsMasterDialogSchema, EqptSetsMasterDialogValues } from '../_lib/types';
import { EqptSetSelectionDialog } from './eqtp-selection-dialog';

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
  /* useTheme */
  const theme = useTheme();
  const colorOfThis = lighten(theme.palette.primary.main, 0.5);

  /* useState -------------------------------------- */
  /* DBのローディング状態 */
  const [isLoading, setIsLoading] = useState(true);
  /* ダイアログでの編集モードかどうか */
  const [editable, setEditable] = useState(false);
  /* 新規作成かどうか */
  const [isNew, setIsNew] = useState(false);
  /* 未保存ダイアログ出すかどうか */
  const [dirtyOpen, setDirtyOpen] = useState(false);
  /* セット無ダイアログ開閉 */
  const [deleteOpen, setDeleteOpen] = useState(false);
  /* submit時のactions (save, delete) */
  const [action, setAction] = useState<'save' | 'delete' | 'restore' | undefined>(undefined);
  /** 機材選択肢 */
  const [options, setOptions] = useState<SelectTypes[]>([]);
  /** 機材名 */
  const [kizaiNam, setKizaiNam] = useState<string>('');
  /** 元のセット機材のID配列 */
  const [currentSetList, setCurrentSetList] = useState<number[]>([]);

  /** 機材選択ダイアログ開閉 */
  const [eqSelectOpen, setEqSelectOpen] = useState<boolean>(false);

  /* useForm ----------------------------------------- */
  const {
    control,
    formState: { isDirty },
    watch,
    handleSubmit,
    reset,
    setValue,
  } = useForm({
    mode: 'onChange',
    reValidateMode: 'onChange',
    resolver: zodResolver(EqptSetsMasterDialogSchema),
    defaultValues: emptyEqptSet,
  });

  /** セット機材リストの監視 */
  const setList = watch('setEqptList');

  const setField = useFieldArray({ control, name: 'setEqptList' });

  /* methods ---------------------------------------- */
  /* フォームを送信 */
  const onSubmit = async (data: EqptSetsMasterDialogValues) => {
    if (setList.length === 0) {
      setDeleteOpen(true);
    } else {
      console.log(data);
      if (isNew) {
        setIsLoading(true);
        await addNewEqptSet(data, user?.name ?? '');
        handleCloseDialog();
        refetchEqptSets();
        setIsLoading(false);
      } else {
        if (action === 'save') {
          setIsLoading(true);
          await updateEqptSet(data, currentSetList, user?.name ?? '');
          handleCloseDialog();
          refetchEqptSets();
          setIsLoading(false);
        }
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

  /* セット機材無ダイアログではいを押したときの処理 */
  const handleConfirmDelete = async () => {
    setIsLoading(true);
    if (isNew) {
      // 新規の時はダイアログを閉じるだけ
      setDeleteOpen(false);
      setIsLoading(false);
      handleCloseDialog();
    } else {
      // 編集時はセットマスタを削除する
      deleteEqptSets(oyaId);
      setDeleteOpen(false);
      setIsLoading(false);
      handleCloseDialog();
      await refetchEqptSets();
    }
  };

  /* useEffect --------------------------------------- */
  useEffect(() => {
    console.log('★★★★★★★★★★★★★★★★★★★★★');
    const getThatOneEqptSet = async () => {
      if (oyaId === FAKE_NEW_ID) {
        // 新規追加モード
        const op = await getEqptsForOyaEqptSelection();
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
          setCurrentSetList(eqptSet1.setEqptList.map((d) => d.id)); // 初期のセットリストをセット
          setIsLoading(false);
        }
      }
    };
    getThatOneEqptSet();
  }, [oyaId, reset]);

  return (
    <>
      <form onSubmit={handleSubmit(onSubmit)}>
        <DialogTitle
          display={'flex'}
          justifyContent={'space-between'}
          alignItems={'center'}
          bgcolor={colorOfThis}
          position={'fixed'}
          top={0}
          width={'100%'}
          zIndex={1200}
        >
          機材セットマスタ登録
          {editable && !isNew && <Typography>編集モード</Typography>}
          {isNew && <Typography>新規登録</Typography>}
          <Stack>
            <SubmitButton
              type="submit"
              disabled={!isNew && !isDirty}
              onClick={() => setAction('save')}
              push={isLoading}
            />
            {!isNew && (
              <>
                <MakeEditModeButton handleEditable={() => setEditable(true)} disabled={editable ? true : false} />
              </>
            )}
            {isDirty}
            <CloseMasterDialogButton handleCloseDialog={handleClickClose} />
          </Stack>
        </DialogTitle>
        <Toolbar sx={{ bgcolor: 'white', zIndex: 1150 }} />
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
                  <TextField value={kizaiNam} disabled fullWidth sx={{ maxWidth: '90%' }} />
                )}
              </FormBox>
              <FormBox formItem={formItems[1]} align="baseline">
                <Box width={'100%'} border={1} borderColor={'divider'} p={1}>
                  <Button onClick={() => setEqSelectOpen(true)} disabled={editable ? false : true}>
                    機材選択
                  </Button>
                  <EqptSetSelectionDialog
                    open={eqSelectOpen}
                    oyaEqptId={oyaId}
                    currentEqptList={setList}
                    setOpen={setEqSelectOpen}
                    setValue={setValue}
                  />

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
                      <Typography
                        whiteSpace={'nowrap'}
                        sx={{ overflow: 'hidden', textOverflow: 'ellipsis', width: '65%' }}
                      >
                        {setList[index].nam}
                      </Typography>
                      <TextFieldElement
                        name={`setEqptList.${index}.mem`}
                        control={control}
                        disabled={editable ? false : true}
                      />
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
            <Dialog open={deleteOpen}>
              <DialogTitle alignContent={'center'} display={'flex'} alignItems={'center'}>
                <WarningIcon color="error" />
                <Box>セット機材が選ばれていません</Box>
              </DialogTitle>
              <DialogContentText m={2}>
                {isNew ? `機材セットマスタは登録されません` : `機材セットマスタが一覧から削除されます`}
              </DialogContentText>
              <DialogActions>
                <Button color="error" onClick={() => handleConfirmDelete()} loading={isLoading}>
                  OK
                </Button>
                <Button onClick={() => setDeleteOpen(false)}>戻る</Button>
              </DialogActions>
            </Dialog>
          </>
        )}
      </form>
    </>
  );
};
