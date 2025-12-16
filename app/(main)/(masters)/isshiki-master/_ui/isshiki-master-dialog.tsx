import { zodResolver } from '@hookform/resolvers/zod';
import DeleteIcon from '@mui/icons-material/Delete';
import { Box, Button, Grid2, Stack, Typography } from '@mui/material';
import { useEffect, useState } from 'react';
import { useFieldArray, useForm } from 'react-hook-form';
import { TextFieldElement } from 'react-hook-form-mui';

import { checkExIsshiki } from '@/app/_lib/db/tables/m-kizai';
import { useUserStore } from '@/app/_lib/stores/usestore';
import { FormBox, SelectTypes } from '@/app/(main)/_ui/form-box';
import { Loading } from '@/app/(main)/_ui/loading';

import { FAKE_NEW_ID } from '../../_lib/constants';
import { MasterDialogTitle } from '../../_ui/dialog-title';
import { IsDirtyAlertDialog, WillDeleteAlertDialog } from '../../_ui/dialogs';
import { emptyIsshiki, formItems } from '../_lib/datas';
import { addNewIsshiki, getChosenIsshiki, updateIsshiki, updIsshikiDelFlg } from '../_lib/funcs';
import { IsshikisMasterDialogSchema, IsshikisMasterDialogValues } from '../_lib/types';
import { EqptIsshikiSelectionDialog } from './eqtp-selection-dialog';

/**
 * 一式マスタ詳細ダイアログ
 * @param
 * @returns {JSX.Element} 一式マスタ詳細ダイアログコンポーネント
 */
export const IsshikisMasterDialog = ({
  isshikiId,
  handleClose,
  refetchIsshikis,
}: {
  isshikiId: number;
  handleClose: () => void;
  refetchIsshikis: () => void;
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
  /** 元の一式機材詳細 */
  const [currentIsshikiList, setCurrentIsshikiList] = useState<IsshikisMasterDialogValues>();

  /** 機材選択ダイアログ開閉 */
  const [eqSelectOpen, setEqSelectOpen] = useState<boolean>(false);

  /* useForm ----------------------------------------- */
  const isshikiForm = useForm({
    mode: 'onChange',
    reValidateMode: 'onChange',
    resolver: zodResolver(IsshikisMasterDialogSchema),
    defaultValues: emptyIsshiki,
  });

  const {
    control,
    formState: { isDirty },
    watch,
    handleSubmit,
    reset,
    setValue,
  } = isshikiForm;

  const kizaisField = useFieldArray({ control, name: 'kizaiList' });

  const kizaiList = watch('kizaiList');

  const isDeleted = watch('delFlg');
  const name = watch('isshikiNam');

  /* methods ---------------------------------------- */
  /* フォームを送信 */
  const onSubmit = async (data: IsshikisMasterDialogValues) => {
    if (isshikiId === FAKE_NEW_ID) {
      await addNewIsshiki(data, user?.name ?? '');
      handleCloseDialog();
      refetchIsshikis();
    } else {
      if (action === 'save') {
        await updateIsshiki(data, currentIsshikiList ?? emptyIsshiki, isshikiId, user?.name ?? '');
        handleCloseDialog();
        refetchIsshikis();
      } else if (action === 'delete') {
        setDeleteOpen(true);
        return;
      } else if (action === 'restore') {
        // 有効化ボタン
        await updIsshikiDelFlg(isshikiId, false, user?.name ?? '');
        handleCloseDialog();
        refetchIsshikis();
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
    await updIsshikiDelFlg(isshikiId, true, user?.name ?? '');
    setDeleteOpen(false);
    handleCloseDialog();
    await refetchIsshikis();
  };

  /* useEffect --------------------------------------- */
  useEffect(() => {
    console.log('★★★★★★★★★★★★★★★★★★★★★');
    const getThatOneIsshiki = async () => {
      if (isshikiId === FAKE_NEW_ID) {
        // 新規追加モード
        reset(emptyIsshiki); // フォーム初期化
        setEditable(true); // 編集モードにする
        setIsLoading(false);
        setIsNew(true);
      } else {
        const isshiki1 = await getChosenIsshiki(isshikiId);
        if (isshiki1) {
          reset(isshiki1); // 取得したデータでフォーム初期化
          setCurrentIsshikiList(isshiki1);
          setIsLoading(false);
        }
      }
    };
    getThatOneIsshiki();
  }, [isshikiId, reset]);

  return (
    <>
      <form onSubmit={handleSubmit(onSubmit)}>
        <MasterDialogTitle
          editable={editable}
          handleEditable={() => setEditable(true)}
          handleClose={handleClickClose}
          dialogTitle="一式マスタ登録"
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
                <TextFieldElement
                  name="isshikiNam"
                  control={control}
                  label={editable ? formItems[0].exsample : ''}
                  fullWidth
                  sx={{ maxWidth: '90%' }}
                  disabled={editable ? false : true}
                />
              </FormBox>
              <FormBox formItem={formItems[1]} required>
                <TextFieldElement
                  name="regAmt"
                  control={control}
                  label={editable ? formItems[1].exsample : ''}
                  fullWidth
                  sx={{
                    width: 150,
                    '& .MuiInputBase-input': {
                      textAlign: 'right',
                    },
                    '& input[type=number]::-webkit-inner-spin-button': {
                      WebkitAppearance: 'none',
                      margin: 0,
                    },
                  }}
                  type="number"
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
              <FormBox formItem={formItems[3]} align="baseline">
                <Box width={'100%'} border={1} borderColor={'divider'} p={1}>
                  <Button onClick={() => setEqSelectOpen(true)} disabled={editable ? false : true}>
                    機材選択
                  </Button>
                  <EqptIsshikiSelectionDialog
                    open={eqSelectOpen}
                    isshikiId={isshikiId}
                    currentEqptList={kizaiList}
                    setOpen={setEqSelectOpen}
                    setValue={setValue}
                  />

                  {kizaisField.fields.map((d, index) => (
                    <Stack key={d.id} sx={{ width: '100%', my: 0.5 }}>
                      <Button
                        color="error"
                        sx={{ paddingX: 1, paddingY: 0, minWidth: 0 }}
                        onClick={() => {
                          kizaisField.remove(index);
                        }}
                        disabled={editable ? false : true}
                      >
                        <DeleteIcon fontSize="small" />
                      </Button>
                      <Typography
                        whiteSpace={'nowrap'}
                        sx={{ overflow: 'hidden', textOverflow: 'ellipsis', width: '65%' }}
                      >
                        {kizaiList[index].nam}
                      </Typography>
                      <TextFieldElement
                        name={`kizaiList.${index}.mem`}
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
            <WillDeleteAlertDialog
              open={deleteOpen}
              data={name}
              handleCloseDelete={() => setDeleteOpen(false)}
              handleConfirmDelete={handleConfirmDelete}
            />
          </>
        )}
      </form>
    </>
  );
};
